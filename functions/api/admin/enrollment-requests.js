import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{requireAdmin,validAdminStatus}from"../../_lib/admin.js";
import{assertSameOrigin}from"../../_lib/auth.js";
import{clearRetention,privacyPolicy,scheduleRetention}from"../../_lib/privacy.js";
import{createRegistrationInvite}from"../../_lib/invites.js";
import{sendAcademyInviteEmail}from"../../_lib/mail.js";
import{ensureLeadScoringSchema}from"../../_lib/lead-scoring-schema.js";

const load=async db=>{
 await ensureLeadScoringSchema(db,"enrollment_requests");
 const result=await db.prepare("SELECT r.id,r.name,r.email,r.company,r.note,r.status,r.score,r.route,r.n8n_execution_id,r.created_at,c.title AS course_title,c.slug AS course_slug FROM enrollment_requests r JOIN courses c ON c.id=r.course_id ORDER BY r.created_at DESC LIMIT 200").all();
 return result.results||[];
};

async function ensureRun(db,courseId,courseSlug,courseTitle,now){
 let run=await db.prepare("SELECT id FROM course_runs WHERE course_id=? AND status IN('open','planned') ORDER BY created_at ASC LIMIT 1")
  .bind(courseId).first();
 if(run)return run.id;
 const runId="run-"+courseSlug+"-"+crypto.randomUUID();
 await db.prepare("INSERT INTO course_runs(id,course_id,title,status,created_at) VALUES(?,?,?,?,?)")
  .bind(runId,courseId,courseTitle+" · Self-paced","open",now).run();
 return runId;
}

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await requireAdmin(db,request);
  return json({ok:true,requests:await load(db),requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPatch=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env),
   admin=await requireAdmin(db,request),
   body=await readJson(request,4096),
   id=cleanText(body.id,80),
   status=cleanText(body.status,40);

  if(!id||!validAdminStatus("request",status))
   throw new ApiError(422,"validation_failed","Gültige Anfrage und Status sind erforderlich.");

  const entry=await db.prepare(
   "SELECT r.id,r.name,r.email,r.status AS previous_status,r.course_id,c.slug AS course_slug,c.title AS course_title FROM enrollment_requests r JOIN courses c ON c.id=r.course_id WHERE r.id=? LIMIT 1"
  ).bind(id).first();
  if(!entry)throw new ApiError(404,"request_not_found","Academy-Anfrage wurde nicht gefunden.");

  const now=new Date().toISOString();
  let accessGranted=false,userId=null,runId=null,registrationInvite=null,inviteId=null,emailSent=false;
  const statements=[db.prepare("UPDATE enrollment_requests SET status=? WHERE id=?").bind(status,id)];
  if(status!=="approved")statements.push(db.prepare("UPDATE academy_registration_invites SET used_at=COALESCE(used_at,?) WHERE enrollment_request_id=? AND used_at IS NULL").bind(now,id));

  if(status==="approved"){
   const user=await db.prepare("SELECT id FROM users WHERE lower(email)=lower(?) AND status='active' LIMIT 1").bind(entry.email).first();
   if(user){
    userId=user.id;
    runId=await ensureRun(db,entry.course_id,entry.course_slug,entry.course_title,now);
    statements.push(
     db.prepare("INSERT OR IGNORE INTO enrollments(id,user_id,course_run_id,status,enrolled_at) VALUES(?,?,?,?,?)")
      .bind(crypto.randomUUID(),user.id,runId,"active",now),
     db.prepare("INSERT OR IGNORE INTO course_progress(user_id,course_id,progress_percent,status,updated_at) VALUES(?,?,?,?,?)")
      .bind(user.id,entry.course_id,0,"not_started",now)
    );
    accessGranted=true;
   }else{
    const invite=await createRegistrationInvite(db,{enrollmentRequestId:id,email:entry.email,courseId:entry.course_id,createdBy:admin.user_id,env,now});
    inviteId=invite.id;
    registrationInvite={url:"/academy/konto/#invite="+encodeURIComponent(invite.token),expiresAt:invite.expiresAt};
   }
  }

  statements.push(
   db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),admin.user_id,"admin.enrollment_request.status","enrollment_request",id,JSON.stringify({status,accessGranted,userId,runId,inviteId,courseSlug:entry.course_slug}),now)
  );

  await db.batch(statements);
  if(status==="approved"&&registrationInvite){
   try{
    const invitePath=registrationInvite.url;
    await sendAcademyInviteEmail({env,to:entry.email,name:entry.name,courseTitle:entry.course_title,inviteUrl:invitePath,expiresAt:registrationInvite.expiresAt,idempotencyKey:"academy-invite/"+inviteId});
    emailSent=true;
    await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)")
     .bind(crypto.randomUUID(),admin.user_id,"academy.invite.email_sent","enrollment_request",id,JSON.stringify({inviteId,courseSlug:entry.course_slug}),now).run();
   }catch(error){
    await db.batch([
     db.prepare("UPDATE enrollment_requests SET status=? WHERE id=?").bind(entry.previous_status,id),
     db.prepare("UPDATE academy_registration_invites SET used_at=COALESCE(used_at,?) WHERE id=?").bind(now,inviteId),
     db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(),admin.user_id,"academy.invite.email_failed","enrollment_request",id,JSON.stringify({inviteId,courseSlug:entry.course_slug}),now)
    ]);
    throw error;
   }
  }
  if(status==="approved")await clearRetention(db,"enrollment_request",id,now);
  else{
   const policy=privacyPolicy(env);
   await scheduleRetention(db,{entityType:"enrollment_request",entityId:id,days:["closed","rejected"].includes(status)?policy.closedLeadDays:policy.openLeadDays,reason:["closed","rejected"].includes(status)?"closed_enrollment_retention":"active_enrollment_retention",now});
  }
  return json({ok:true,accessGranted,emailSent,inviteExpiresAt:registrationInvite?.expiresAt||null,requests:await load(db),requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, PATCH"});