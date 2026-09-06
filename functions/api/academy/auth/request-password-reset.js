import{assertDatabase,handleError,json,readJson,requestId,validEmail}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,ensureAuthSchema,issuePasswordReset,normalizeEmail}from"../../../_lib/auth.js";
import{sendPasswordResetEmail}from"../../../_lib/mail.js";

const genericMessage="Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine E-Mail zum Zurücksetzen des Passworts versendet.";
const logDeliveryFailure=traceId=>console.error(JSON.stringify({level:"error",area:"auth.password_reset.delivery",requestId:traceId,code:"mail_delivery_failed"}));

export const onRequestPost=async context=>{
 const{request,env}=context,traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);
  const body=await readJson(request,4096),email=normalizeEmail(body.email);
  if(!validEmail(email))return json({ok:true,message:genericMessage,requestId:traceId});
  await consumeRateLimit(db,request,"password-reset-request",email,3);
  const user=await db.prepare("SELECT id,display_name,email FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(user){
   try{
    const reset=await issuePasswordReset(db,user.id);
    const delivery=sendPasswordResetEmail({env,to:user.email,name:user.display_name,resetToken:reset.token,expiresAt:reset.expiresAt,idempotencyKey:"password-reset:"+user.id+":"+reset.expiresAt}).catch(()=>logDeliveryFailure(traceId));
    if(typeof context.waitUntil==="function")context.waitUntil(delivery);else await delivery;
   }catch{logDeliveryFailure(traceId);}
  }
  return json({ok:true,message:genericMessage,requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
