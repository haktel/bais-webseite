import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../../_lib/api.js";
import{academyProgram}from"../../../_lib/academy.js";
import{assertSameOrigin,ensureAuthSchema,consumeRateLimit,hashPassword,normalizeEmail,randomToken,sessionCookie,sha256,validPassword}from"../../../_lib/auth.js";

async function ensureCourseAndRun(db,slug,title,now){
 let course=await db.prepare("SELECT id FROM courses WHERE slug=? LIMIT 1").bind(slug).first();
 if(!course){
  const id="course-"+crypto.randomUUID();
  await db.prepare("INSERT INTO courses(id,slug,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)")
   .bind(id,slug,title,"BAIS Academy Programm","published",now,now).run();
  course={id};
 }

 let run=await db.prepare("SELECT id FROM course_runs WHERE course_id=? AND status IN('open','planned') ORDER BY created_at ASC LIMIT 1")
  .bind(course.id).first();
 if(!run){
  const id="run-"+slug+"-"+crypto.randomUUID();
  await db.prepare("INSERT INTO course_runs(id,course_id,title,status,created_at) VALUES(?,?,?,?,?)")
   .bind(id,course.id,title+" · Self-paced","open",now).run();
  run={id};
 }
 return{courseId:course.id,runId:run.id};
}

async function buildSession(userId,request,now){
 const token=randomToken(),tokenHash=await sha256(token),expires=new Date(Date.parse(now)+7*24*60*60*1000).toISOString();
 return{
  token,
  statement:{
   id:crypto.randomUUID(),
   userId,
   tokenHash,
   createdAt:now,
   lastSeenAt:now,
   expiresAt:expires,
   userAgentHash:await sha256(request.headers.get("user-agent")||"unknown")
  }
 };
}

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 let stage="start";
 try{
  stage="origin";
  assertSameOrigin(request);

  stage="database";
  const db=assertDatabase(env);

  stage="auth_schema";
  await ensureAuthSchema(db);

  stage="input";
  const body=await readJson(request),
   displayName=cleanText(body.displayName,120),
   email=normalizeEmail(body.email),
   password=body.password,
   slug=cleanText(body.courseSlug,120),
   title=academyProgram(slug);

  if(displayName.length<2||!validEmail(email)||!validPassword(password)||!title)
   throw new ApiError(422,"validation_failed","Name, gültige E-Mail, mindestens 12 Zeichen Passwort und ein Academy-Programm sind erforderlich.");

  stage="turnstile";
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);

  stage="rate_limit";
  const rateKey=await consumeRateLimit(db,request,"register",email,5);

  stage="existing_account";
  const existing=await db.prepare("SELECT id FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(existing)throw new ApiError(409,"account_exists","Für diese E-Mail besteht bereits ein Konto.");

  stage="password_hash";
  const now=new Date().toISOString(),userId=crypto.randomUUID(),credential=await hashPassword(password);

  stage="course_lookup";
  const{courseId,runId}=await ensureCourseAndRun(db,slug,title,now);

  stage="approval_lookup";
  const preApproved=await db.prepare(
   "SELECT id FROM enrollment_requests WHERE lower(email)=lower(?) AND course_id=? AND status='approved' ORDER BY created_at DESC LIMIT 1"
  ).bind(email,courseId).first();

  stage="session_prepare";
  const session=await buildSession(userId,request,now);

  stage="user_insert";
  await db.prepare("INSERT INTO users(id,display_name,email,role,status,created_at) VALUES(?,?,?,?,?,?)")
   .bind(userId,displayName,email,"student","active",now).run();

  let accessStatus="pending",requestEntryId=preApproved?.id||null;
  const childStatements=[
   db.prepare("INSERT INTO user_credentials(user_id,password_hash,password_salt,password_algorithm,password_iterations,updated_at) VALUES(?,?,?,?,?,?)")
    .bind(userId,credential.hash,credential.salt,"PBKDF2-SHA-256",credential.iterations,now),
   db.prepare("INSERT INTO user_sessions(id,user_id,token_hash,created_at,last_seen_at,expires_at,user_agent_hash) VALUES(?,?,?,?,?,?,?)")
    .bind(session.statement.id,userId,session.statement.tokenHash,session.statement.createdAt,session.statement.lastSeenAt,session.statement.expiresAt,session.statement.userAgentHash)
  ];

  if(preApproved){
   childStatements.push(
    db.prepare("INSERT OR IGNORE INTO enrollments(id,user_id,course_run_id,status,enrolled_at) VALUES(?,?,?,?,?)")
     .bind(crypto.randomUUID(),userId,runId,"active",now),
    db.prepare("INSERT OR IGNORE INTO course_progress(user_id,course_id,progress_percent,status,updated_at) VALUES(?,?,?,?,?)")
     .bind(userId,courseId,0,"not_started",now)
   );
   accessStatus="active";
  }else{
   requestEntryId=crypto.randomUUID();
   childStatements.push(
    db.prepare("INSERT INTO enrollment_requests(id,course_id,name,email,company,note,status,created_at) VALUES(?,?,?,?,?,?,?,?)")
     .bind(requestEntryId,courseId,displayName,email,null,"Academy-Konto erstellt · Kurszugang ausstehend","new",now)
   );
  }

  childStatements.push(
   db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),userId,"academy.account.created","user",userId,JSON.stringify({courseSlug:slug,courseId,runId,access:accessStatus,enrollmentRequestId:requestEntryId}),now)
  );

  try{
   stage="account_children";
   await db.batch(childStatements);
  }catch(error){
   try{await db.prepare("DELETE FROM users WHERE id=?").bind(userId).run();}catch{}
   throw error;
  }

  stage="rate_limit_cleanup";
  await db.prepare("DELETE FROM auth_rate_limits WHERE id=?").bind(rateKey).run();

  stage="complete";
  return json({
   ok:true,
   user:{displayName,email,role:"student"},
   access:{courseSlug:slug,status:accessStatus},
   message:accessStatus==="active"
    ?"Ihr Academy-Konto wurde erstellt. Der freigegebene Kurszugang ist aktiv."
    :"Ihr Academy-Konto wurde erstellt. Der Kurszugang wird nach Freigabe aktiviert.",
   requestId:traceId
  },201,{"set-cookie":sessionCookie(session.token)});
 }catch(error){
  if(error instanceof ApiError)return handleError(error,traceId);
  console.error(JSON.stringify({
   level:"error",
   area:"academy.register",
   stage,
   requestId:traceId,
   message:error instanceof Error?error.message:"unknown"
  }));
  return json({
   ok:false,
   error:{
    code:"registration_internal_error",
    message:"Die Registrierung ist in der Stufe '"+stage+"' fehlgeschlagen. Referenz: "+traceId
   },
   requestId:traceId
  },500);
 }
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});