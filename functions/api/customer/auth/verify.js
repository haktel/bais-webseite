import{ApiError,assertDatabase,handleError,json,readJson,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,createSession,ensureAuthSchema,findCustomerEmailVerification,sha256}from"../../../_lib/auth.js";
import{enqueueErpProspectSync,syncPendingErpJobs}from"../../../_lib/erp-sync.js";

export const onRequestPost=async context=>{
 const{request,env}=context,traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);
  const body=await readJson(request,4096),verification=await findCustomerEmailVerification(db,body.token);
  if(!verification||verification.role!=="customer")throw new ApiError(400,"invalid_verification","Bestätigungslink ist ungültig oder nicht mehr verfügbar.");
  const now=new Date().toISOString();
  if(verification.expires_at<=now)throw new ApiError(410,"verification_expired","Bestätigungslink ist abgelaufen. Bitte fordern Sie eine neue E-Mail an.");
  if(verification.verified_at||verification.status!=="invited")throw new ApiError(400,"verification_used","Bestätigungslink wurde bereits verwendet oder ist nicht mehr gültig.");
  const invalidatedHash=await sha256("used:"+verification.tokenHash+":"+now);
  await db.batch([
   db.prepare("UPDATE users SET status='active' WHERE id=? AND role='customer' AND status='invited'").bind(verification.user_id),
   db.prepare("UPDATE customer_email_verifications SET verified_at=?,token_hash=? WHERE user_id=? AND token_hash=? AND verified_at IS NULL").bind(now,invalidatedHash,verification.user_id,verification.tokenHash),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),verification.user_id,verification.organization_id,"customer.email.verified","user",verification.user_id,JSON.stringify({source:"email_verification"}),now)
  ]);
  try{
   await enqueueErpProspectSync(db,{organizationId:verification.organization_id,now});
   const task=syncPendingErpJobs(db,env,{limit:5}).catch(error=>console.error(JSON.stringify({level:"error",area:"erp.sync",requestId:traceId,message:error instanceof Error?error.message:"unknown"})));
   if(typeof context.waitUntil==="function")context.waitUntil(task);else void task;
  }catch(error){
   console.error(JSON.stringify({level:"error",area:"erp.enqueue",requestId:traceId,message:error instanceof Error?error.message:"unknown"}));
  }
  const customer=await db.prepare("SELECT customer_number FROM customer_accounts WHERE organization_id=? LIMIT 1").bind(verification.organization_id).first();
  const session=await createSession(db,verification.user_id,request);
  return json({ok:true,user:{displayName:verification.display_name,email:verification.email,role:"customer"},commercial:{customerNumber:customer?.customer_number||null},message:"E-Mail-Adresse bestätigt. Ihr Kundenkonto ist jetzt aktiv.",requestId:traceId},200,{"set-cookie":session.cookie});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
