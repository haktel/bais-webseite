import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{coursePath}from"../../_lib/academy.js";
import{assertSameOrigin,requireSession}from"../../_lib/auth.js";
const list=async(db,userId)=>{
 const result=await db.prepare("SELECT c.slug,c.title,e.status AS enrollment_status,COALESCE(p.progress_percent,0) AS progress_percent,COALESCE(p.status,'not_started') AS progress_status,p.updated_at FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id LEFT JOIN course_progress p ON p.user_id=e.user_id AND p.course_id=c.id WHERE e.user_id=? ORDER BY e.enrolled_at DESC").bind(userId).all();
 return(result.results||[]).map(course=>({...course,path:coursePath(course.slug)}));
};
export const onRequestGet=async({request,env})=>{const traceId=requestId(request);try{const db=assertDatabase(env),user=await requireSession(db,request);return json({ok:true,courses:await list(db,user.user_id),requestId:traceId});}catch(error){return handleError(error,traceId);}};
export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);const db=assertDatabase(env),user=await requireSession(db,request),body=await readJson(request),slug=cleanText(body.courseSlug,120),percent=Number(body.progressPercent);
  if(!slug||!Number.isInteger(percent)||percent<0||percent>100)throw new ApiError(422,"validation_failed","Programm und Lernfortschritt zwischen 0 und 100 sind erforderlich.");
  const course=await db.prepare("SELECT c.id FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug=? LIMIT 1").bind(user.user_id,slug).first();
  if(!course)throw new ApiError(404,"enrollment_not_found","Für dieses Programm besteht keine aktive Anmeldung.");
  const status=percent===100?"completed":percent>0?"in_progress":"not_started",now=new Date().toISOString();
  await db.batch([
   db.prepare("INSERT INTO course_progress(user_id,course_id,progress_percent,status,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET progress_percent=excluded.progress_percent,status=excluded.status,updated_at=excluded.updated_at").bind(user.user_id,course.id,percent,status,now),
   db.prepare("UPDATE enrollments SET status=?,completed_at=? WHERE user_id=? AND course_run_id IN(SELECT id FROM course_runs WHERE course_id=?)").bind(percent===100?"completed":"active",percent===100?now:null,user.user_id,course.id),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.progress.updated","course",course.id,JSON.stringify({progressPercent:percent,status}),now)
  ]);
  return json({ok:true,courses:await list(db,user.user_id),requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
