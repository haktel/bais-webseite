import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,createSession,ensureAuthSchema,hashPassword,normalizeEmail,validPassword}from"../../../_lib/auth.js";
import{ensureCommercialIdentityForLead,ensureCommercialSchema}from"../../../_lib/commercial.js";
import{enqueueErpProspectSync,syncPendingErpJobs}from"../../../_lib/erp-sync.js";

const withRegistrationVersion=response=>{const headers=new Headers(response.headers);headers.set("x-bais-customer-register","identity-only-v4-pbkdf2-100k");return new Response(response.body,{status:response.status,statusText:response.statusText,headers});};

const customerSlug=(company,organizationId)=>{
 const base=String(company||"kunde").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"kunde";
 return base+"-"+organizationId.slice(0,8);
};

export const onRequestPost=async context=>{
 const{request,env}=context;
 const traceId=requestId(request);
 let stage="start",userId=null,organizationId=null,rateKey=null;
 try{
  stage="origin";
  assertSameOrigin(request);

  stage="database";
  const db=assertDatabase(env);
  await ensureAuthSchema(db);
  await ensureCommercialSchema(db);

  stage="input";
  const body=await readJson(request,16384),
   displayName=cleanText(body.displayName,120),
   company=cleanText(body.company,160),
   email=normalizeEmail(body.email),
   password=body.password;
  if(displayName.length<2||company.length<2||!validEmail(email)||!validPassword(password))
   throw new ApiError(422,"validation_failed","Name, Unternehmen, gültige E-Mail und mindestens 12 Zeichen Passwort sind erforderlich.");

  stage="turnstile";
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);

  stage="rate_limit";
  rateKey=await consumeRateLimit(db,request,"customer-register-v2",email,5);

  stage="existing_account";
  const existing=await db.prepare("SELECT id FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(existing)throw new ApiError(409,"account_exists","Für diese E-Mail besteht bereits ein Konto.");

  const now=new Date().toISOString();
  stage="password_hash";
  const credential=await hashPassword(password);

  stage="customer_identity";
  const identity=await ensureCommercialIdentityForLead(db,{email,displayName,company,now});
  const customerNumber=identity.customerNumber;
  organizationId=identity.organizationId;

  stage="identity_prepare";
  userId=crypto.randomUUID();

  stage="identity_insert";
  await db.batch([
   db.prepare("UPDATE organizations SET name=?,billing_email=? WHERE id=?").bind(company,email,organizationId),
   db.prepare("INSERT INTO users(id,organization_id,display_name,email,role,status,created_at) VALUES(?,?,?,?,?,?,?)").bind(userId,organizationId,displayName,email,"customer","active",now),
   db.prepare("INSERT INTO user_credentials(user_id,password_hash,password_salt,password_algorithm,password_iterations,updated_at) VALUES(?,?,?,?,?,?)").bind(userId,credential.hash,credential.salt,"PBKDF2-SHA-256",credential.iterations,now),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),userId,organizationId,"customer.account.created","user",userId,JSON.stringify({customerNumber,source:"self_registration",defaultAccess:"deny"}),now)
  ]);

  stage="erp_enqueue";
  try{
   await enqueueErpProspectSync(db,{organizationId,now});
   const task=syncPendingErpJobs(db,env,{limit:5}).catch(error=>console.error(JSON.stringify({level:"error",area:"erp.sync",requestId:traceId,message:error instanceof Error?error.message:"unknown"})));
   if(typeof context.waitUntil==="function")context.waitUntil(task);else void task;
  }catch(error){
   console.error(JSON.stringify({level:"error",area:"erp.enqueue",requestId:traceId,message:error instanceof Error?error.message:"unknown"}));
  }

  stage="session";
  const session=await createSession(db,userId,request);

  stage="rate_limit_cleanup";
  await db.prepare("DELETE FROM auth_rate_limits WHERE id=?").bind(rateKey).run();

  stage="complete";
  return withRegistrationVersion(json({
   ok:true,
   user:{displayName,email,role:"customer"},
   commercial:{customerNumber},
   contentAccess:[],
   message:"Kundenkonto erstellt. Geschützte Inhalte werden erst nach ausdrücklicher Freigabe sichtbar.",
   requestId:traceId
  },201,{"set-cookie":session.cookie}));
 }catch(error){
  if(rateKey&&!(error instanceof ApiError))try{const db=assertDatabase(env);await db.prepare("DELETE FROM auth_rate_limits WHERE id=?").bind(rateKey).run();}catch{}
  if(userId||organizationId)try{
   const db=assertDatabase(env);
   if(userId){
    await db.prepare("DELETE FROM user_sessions WHERE user_id=?").bind(userId).run();
    await db.prepare("DELETE FROM audit_events WHERE actor_user_id=?").bind(userId).run();
    await db.prepare("DELETE FROM users WHERE id=?").bind(userId).run();
   }
   if(organizationId){
    const remaining=await db.prepare("SELECT 1 AS ok FROM users WHERE organization_id=? LIMIT 1").bind(organizationId).first();
    if(!remaining){
     const lead=await db.prepare("SELECT 1 AS ok FROM contacts WHERE lower(email)=lower((SELECT billing_email FROM organizations WHERE id=?)) UNION SELECT 1 AS ok FROM enrollment_requests WHERE lower(email)=lower((SELECT billing_email FROM organizations WHERE id=?)) LIMIT 1").bind(organizationId,organizationId).first().catch(()=>null);
     if(!lead){
      await db.prepare("DELETE FROM audit_events WHERE organization_id=?").bind(organizationId).run();
      await db.prepare("DELETE FROM customer_accounts WHERE organization_id=?").bind(organizationId).run();
      await db.prepare("DELETE FROM organizations WHERE id=?").bind(organizationId).run();
     }
    }
   }
  }catch{}
  if(!(error instanceof ApiError))console.error(JSON.stringify({level:"error",area:"customer.register",stage,requestId:traceId,message:error instanceof Error?error.message:"unknown"}));
  if(error instanceof ApiError)return withRegistrationVersion(handleError(error,traceId));
  return withRegistrationVersion(json({ok:false,error:{code:"customer_registration_failed",message:"Das Kundenkonto konnte nicht erstellt werden. Technische Stufe: "+stage+". Referenz: "+traceId},requestId:traceId},500));
 }
};
export const onRequest=()=>withRegistrationVersion(json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"}));
