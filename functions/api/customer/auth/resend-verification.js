import{assertDatabase,handleError,json,readJson,requestId,validEmail}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,ensureAuthSchema,issueCustomerEmailVerification,normalizeEmail}from"../../../_lib/auth.js";
import{sendCustomerVerificationEmail}from"../../../_lib/mail.js";

const genericMessage="Falls ein noch nicht bestätigtes Kundenkonto existiert, wurde eine neue Bestätigungs-E-Mail versendet.";
const logDeliveryFailure=traceId=>console.error(JSON.stringify({level:"error",area:"auth.customer_verification_resend.delivery",requestId:traceId,code:"mail_delivery_failed"}));

export const onRequestPost=async context=>{
 const{request,env}=context,traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);
  const body=await readJson(request,4096),email=normalizeEmail(body.email);
  if(!validEmail(email))return json({ok:true,message:genericMessage,requestId:traceId});
  await consumeRateLimit(db,request,"customer-verification-resend",email,3);
  const user=await db.prepare("SELECT id,display_name,email,role,status FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(user?.role==="customer"&&user.status==="invited"){
   try{
    const verification=await issueCustomerEmailVerification(db,user.id);
    const delivery=sendCustomerVerificationEmail({env,to:user.email,name:user.display_name,verificationToken:verification.token,expiresAt:verification.expiresAt,idempotencyKey:"customer-verify-resend:"+user.id+":"+verification.expiresAt}).catch(()=>logDeliveryFailure(traceId));
    if(typeof context.waitUntil==="function")context.waitUntil(delivery);else await delivery;
   }catch{logDeliveryFailure(traceId);}
  }
  return json({ok:true,message:genericMessage,requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
