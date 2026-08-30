import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await ensureAuthSchema(db);
  const user=await requireSession(db,request);
  const result=await db.prepare(
   "SELECT r.id,r.status,r.created_at,c.slug AS course_slug,c.title AS course_title FROM enrollment_requests r JOIN courses c ON c.id=r.course_id WHERE lower(r.email)=lower(?) ORDER BY r.created_at DESC LIMIT 50"
  ).bind(user.email).all();
  return json({ok:true,requests:result.results||[],requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});