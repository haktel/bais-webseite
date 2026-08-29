import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../../_lib/api.js";
import{academyProgram}from"../../../_lib/academy.js";
import{assertSameOrigin,ensureAuthSchema,consumeRateLimit,createSession,hashPassword,normalizeEmail,validPassword}from"../../../_lib/auth.js";
export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);const db=assertDatabase(env);await ensureAuthSchema(db);const body=await readJson(request),displayName=cleanText(body.displayName,120),email=normalizeEmail(body.email),password=body.password,slug=cleanText(body.courseSlug,120),title=academyProgram(slug);
  if(displayName.length<2||!validEmail(email)||!validPassword(password)||!title)throw new ApiError(422,"validation_failed","Name, gültige E-Mail, mindestens 12 Zeichen Passwort und ein Academy-Programm sind erforderlich.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  const rateKey=await consumeRateLimit(db,request,"register",email,5),existing=await db.prepare("SELECT id FROM users WHERE email=? LIMIT 1").bind(email).first();
  if(existing)throw new ApiError(409,"account_exists","Für diese E-Mail besteht bereits ein Konto.");
  const now=new Date().toISOString(),userId=crypto.randomUUID(),runId="run-"+slug+"-self-paced",courseId="course-"+slug,enrollmentId=crypto.randomUUID(),credential=await hashPassword(password);
  await db.batch([
   db.prepare("INSERT OR IGNORE INTO courses(id,slug,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(courseId,slug,title,"BAIS Academy Programm","published",now,now),
   db.prepare("INSERT OR IGNORE INTO course_runs(id,course_id,title,status,created_at) VALUES(?,?,?,?,?)").bind(runId,courseId,title+" · Self-paced", "open",now),
   db.prepare("INSERT INTO users(id,display_name,email,role,status,created_at) VALUES(?,?,?,?,?,?)").bind(userId,displayName,email,"student","active",now),
   db.prepare("INSERT INTO user_credentials(user_id,password_hash,password_salt,password_algorithm,password_iterations,updated_at) VALUES(?,?,?,?,?,?)").bind(userId,credential.hash,credential.salt,"PBKDF2-SHA-256",credential.iterations,now),
   db.prepare("INSERT INTO enrollments(id,user_id,course_run_id,status,enrolled_at) VALUES(?,?,?,?,?)").bind(enrollmentId,userId,runId,"active",now),
   db.prepare("INSERT INTO course_progress(user_id,course_id,progress_percent,status,updated_at) VALUES(?,?,?,?,?)").bind(userId,courseId,0,"not_started",now),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),userId,"academy.account.created","user",userId,JSON.stringify({courseSlug:slug}),now)
  ]);
  const session=await createSession(db,userId,request);await db.prepare("DELETE FROM auth_rate_limits WHERE id=?").bind(rateKey).run();
  return json({ok:true,user:{displayName,email,role:"student"},message:"Ihr Academy-Konto wurde erstellt.",requestId:traceId},201,{"set-cookie":session.cookie});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
