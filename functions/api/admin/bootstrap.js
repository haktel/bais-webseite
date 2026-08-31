import{ApiError,assertDatabase,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";

async function ensureRun(db,courseId,courseSlug,courseTitle,now){
 let run=await db.prepare(
  "SELECT id FROM course_runs WHERE course_id=? AND status IN('open','planned') ORDER BY created_at ASC LIMIT 1"
 ).bind(courseId).first();
 if(run)return run.id;

 const runId="run-"+courseSlug+"-"+crypto.randomUUID();
 await db.prepare(
  "INSERT INTO course_runs(id,course_id,title,status,created_at) VALUES(?,?,?,?,?)"
 ).bind(runId,courseId,courseTitle+" · Self-paced","open",now).run();
 return runId;
}

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  if(!env.ADMIN_BOOTSTRAP_SECRET)throw new ApiError(404,"not_found","Nicht verfügbar.");
  const body=await readJson(request,2048),provided=typeof body.bootstrapSecret==="string"?body.bootstrapSecret:"";
  const expectedBytes=new TextEncoder().encode(env.ADMIN_BOOTSTRAP_SECRET),providedBytes=new TextEncoder().encode(provided);
  if(expectedBytes.length!==providedBytes.length)throw new ApiError(403,"bootstrap_not_allowed","Initialisierung ist nicht zulässig.");
  let diff=0;for(let i=0;i<expectedBytes.length;i++)diff|=expectedBytes[i]^providedBytes[i];
  if(diff!==0)throw new ApiError(403,"bootstrap_not_allowed","Initialisierung ist nicht zulässig.");
  const db=assertDatabase(env);
  await ensureAuthSchema(db);
  const user=await requireSession(db,request);

  const [admins,users,alreadyBootstrapped]=await Promise.all([
   db.prepare("SELECT COUNT(*) AS count FROM users WHERE role='admin' AND status='active'").first(),
   db.prepare("SELECT COUNT(*) AS count FROM users WHERE status='active'").first(),
   db.prepare("SELECT id FROM audit_events WHERE event_type='platform.admin_bootstrap' LIMIT 1").first()
  ]);

  if(Number(admins?.count||0)>0||alreadyBootstrapped){
   return json({ok:true,bootstrapped:false,reason:"already_initialized",requestId:traceId});
  }

  if(Number(users?.count||0)!==1){
   return json({ok:true,bootstrapped:false,reason:"not_single_active_user",requestId:traceId});
  }

  const sole=await db.prepare(
   "SELECT id,email,role,status FROM users WHERE status='active' LIMIT 1"
  ).first();

  if(!sole||sole.id!==user.user_id){
   throw new ApiError(403,"bootstrap_not_allowed","Initialisierung ist für diese Sitzung nicht zulässig.");
  }

  const now=new Date().toISOString();
  await db.prepare("UPDATE users SET role='admin' WHERE id=?").bind(user.user_id).run();

  const pending=await db.prepare(
   "SELECT r.id,r.course_id,c.slug AS course_slug,c.title AS course_title FROM enrollment_requests r JOIN courses c ON c.id=r.course_id WHERE lower(r.email)=lower(?) AND r.status IN('new','contacted','qualified') ORDER BY r.created_at ASC"
  ).bind(user.email).all();

  const granted=[];
  for(const entry of pending.results||[]){
   const runId=await ensureRun(db,entry.course_id,entry.course_slug,entry.course_title,now);
   await db.batch([
    db.prepare("UPDATE enrollment_requests SET status='approved' WHERE id=?").bind(entry.id),
    db.prepare("INSERT OR IGNORE INTO enrollments(id,user_id,course_run_id,status,enrolled_at) VALUES(?,?,?,?,?)")
     .bind(crypto.randomUUID(),user.user_id,runId,"active",now),
    db.prepare("INSERT OR IGNORE INTO course_progress(user_id,course_id,progress_percent,status,updated_at) VALUES(?,?,?,?,?)")
     .bind(user.user_id,entry.course_id,0,"not_started",now)
   ]);
   granted.push(entry.course_slug);
  }

  await db.prepare(
   "INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)"
  ).bind(
   crypto.randomUUID(),
   user.user_id,
   "platform.admin_bootstrap",
   "user",
   user.user_id,
   JSON.stringify({grantedCourses:granted}),
   now
  ).run();

  return json({
   ok:true,
   bootstrapped:true,
   role:"admin",
   grantedCourses:granted,
   requestId:traceId
  });
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({
 ok:false,
 error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}
},405,{allow:"POST"});