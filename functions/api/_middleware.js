import{assertDatabase,json}from"../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../_lib/auth.js";
import{requireAdmin}from"../_lib/admin.js";
import{classifyApiPath}from"../_lib/api-access-policy.js";
import{requireCustomerContentAccess}from"../_lib/customer-access.js";

const courseAccess=async(db,userId,slug)=>{
 const row=await db.prepare("SELECT 1 AS ok FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug=? AND e.status IN('active','completed') LIMIT 1").bind(userId,slug).first();
 return Boolean(row);
};

export const onRequest=async context=>{
 const path=new URL(context.request.url).pathname,policy=classifyApiPath(path);
 if(policy.mode==="public")return context.next();
 if(policy.mode==="deny")return json({ok:false,error:{code:"api_route_denied",message:"API-Route ist nicht freigegeben."}},403);
 try{
  const db=assertDatabase(context.env);await ensureAuthSchema(db);
  if(policy.mode==="admin_mfa"){await requireAdmin(db,context.request);return context.next();}
  const user=await requireSession(db,context.request);
  if(policy.mode==="admin_session"){
   if(user.role!=="admin")return json({ok:false,error:{code:"admin_required",message:"Administrator-Berechtigung erforderlich."}},403);
   return context.next();
  }
  if(policy.mode==="customer_content"){
   const access=await requireCustomerContentAccess(context.request,context.env,policy.contentKey);
   if(!access.ok)return access.response;
   return context.next();
  }
  if(policy.mode==="course"){
   if(!await courseAccess(db,user.user_id,policy.courseSlug))return json({ok:false,error:{code:"enrollment_required",message:"Für dieses Lab ist eine aktive Programmeinschreibung erforderlich."}},403);
   return context.next();
  }
  return context.next();
 }catch(error){
  const status=Number(error?.status)||401,code=error?.code||"authentication_required",message=error?.message||"Bitte melden Sie sich an.";
  return json({ok:false,error:{code,message}},status);
 }
};
