import{assertDatabase,handleError,json,readJson,requestId,validEmail}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,ensureAuthSchema,issueCustomerEmailVerification,normalizeEmail}from"../../../_lib/auth.js";
import{sendCustomerVerificationEmail}from"../../../_lib/mail.js";

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);
  const body=await readJson(request,4096),email=normalizeEmail(body.email);
  if(!validEmail(email))return json({ok:true,message:"Falls ein noch nicht bestätigtes Kundenkonto existiert, wurde eine neue Bestätigungs-E-Mail versendet.",requestId:traceId});
  await consumeRateLimit(db,request,"customer-verification-resend",email,3);
  const user=await db.prepare("SELECT id,display_name,email,role,status FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(user?.role==="customer"&&user.status==="invited"){
   const verification=await issueCustomerEmailVerification(db,user.id);
   await sendCustomerVerificationEmail({env,to:user.email,name:user.display_name,verificationToken:verification.token,expiresAt:verification.expiresAt,idempotencyKey:"customer-verify-resend:"+user.id+":"+verification.expiresAt});
  }
  return json({ok:true,message:"Falls ein noch nicht bestätigtes Kundenkonto existiert, wurde eine neue Bestätigungs-E-Mail versendet.",requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
