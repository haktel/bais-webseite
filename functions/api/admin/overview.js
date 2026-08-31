import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";import{requireAdmin}from"../../_lib/admin.js";import{runPrivacyCleanup}from"../../_lib/privacy.js";
export const onRequestGet=async({request,env})=>{const traceId=requestId(request);try{const db=assertDatabase(env);await requireAdmin(db,request);await runPrivacyCleanup(db,{limit:100});const results=await db.batch([
 db.prepare("SELECT COUNT(*) AS value FROM users WHERE role='student'"),
 db.prepare("SELECT COUNT(*) AS value FROM enrollment_requests WHERE status='new'"),
 db.prepare("SELECT COUNT(*) AS value FROM enrollments WHERE status='active'"),
 db.prepare("SELECT COUNT(*) AS value FROM contacts WHERE status='new'"),
 db.prepare("SELECT COUNT(*) AS value FROM courses WHERE status='published'"),
 db.prepare("SELECT COUNT(*) AS value FROM course_progress WHERE status='completed'")
]);return json({ok:true,metrics:{students:results[0].results?.[0]?.value||0,newRequests:results[1].results?.[0]?.value||0,activeEnrollments:results[2].results?.[0]?.value||0,newContacts:results[3].results?.[0]?.value||0,publishedCourses:results[4].results?.[0]?.value||0,completedCourses:results[5].results?.[0]?.value||0},requestId:traceId});}catch(error){return handleError(error,traceId);}};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});