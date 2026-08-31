import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,createSession,ensureAuthSchema,hashPassword,normalizeEmail,validPassword}from"../../../_lib/auth.js";
import{allocateCustomerNumber,ensureCommercialSchema}from"../../../_lib/commercial.js";

const withRegistrationVersion=response=>{const headers=new Headers(response.headers);headers.set("x-bais-customer-register","identity-only-v2");return new Response(response.body,{status:response.status,statusText:response.statusText,headers});};

const customerSlug=(company,organizationId)=>{
 const base=String(company||"kunde").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"kunde";
 return base+"-"+organizationId.slice(0,8);
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 let stage="start",userId=null,organizationId=null;
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
  const rateKey=await consumeRateLimit(db,request,"customer-register",email,5);

  stage="existing_account";
  const existing=await db.prepare("SELECT id FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(existing)throw new ApiError(409,"account_exists","Für diese E-Mail besteht bereits ein Konto.");

  stage="identity_prepare";
  const now=new Date().toISOString(),credential=await hashPassword(password);
  userId=crypto.randomUUID();
  organizationId=crypto.randomUUID();
  const customerNumber=await allocateCustomerNumber(db,now),slug=customerSlug(company,organizationId);

  stage="identity_insert";
  await db.batch([
   db.prepare("INSERT INTO organizations(id,name,slug,billing_email,created_at) VALUES(?,?,?,?,?)").bind(organizationId,company,slug,email,now),
   db.prepare("INSERT INTO users(id,organization_id,display_name,email,role,status,created_at) VALUES(?,?,?,?,?,?,?)").bind(userId,organizationId,displayName,email,"customer","active",now),
   db.prepare("INSERT INTO customer_accounts(organization_id,customer_number,account_status,created_at,updated_at) VALUES(?,?,?,?,?)").bind(organizationId,customerNumber,"active",now,now),
   db.prepare("INSERT INTO user_credentials(user_id,password_hash,password_salt,password_algorithm,password_iterations,updated_at) VALUES(?,?,?,?,?,?)").bind(userId,credential.hash,credential.salt,"PBKDF2-SHA-256",credential.iterations,now),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),userId,organizationId,"customer.account.created","user",userId,JSON.stringify({customerNumber,source:"self_registration",defaultAccess:"deny"}),now)
  ]);

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
  if(userId||organizationId)try{
   const db=assertDatabase(env);
   if(userId){
    await db.prepare("DELETE FROM user_sessions WHERE user_id=?").bind(userId).run();
    await db.prepare("DELETE FROM audit_events WHERE actor_user_id=?").bind(userId).run();
    await db.prepare("DELETE FROM users WHERE id=?").bind(userId).run();
   }
   if(organizationId){
    await db.prepare("DELETE FROM audit_events WHERE organization_id=?").bind(organizationId).run();
    await db.prepare("DELETE FROM customer_accounts WHERE organization_id=?").bind(organizationId).run();
    await db.prepare("DELETE FROM organizations WHERE id=?").bind(organizationId).run();
   }
  }catch{}
  if(!(error instanceof ApiError))console.error(JSON.stringify({level:"error",area:"customer.register",stage,requestId:traceId,message:error instanceof Error?error.message:"unknown"}));
  if(error instanceof ApiError)return withRegistrationVersion(handleError(error,traceId));
  return withRegistrationVersion(json({ok:false,error:{code:"customer_registration_failed",message:"Das Kundenkonto konnte nicht erstellt werden. Technische Stufe: "+stage+". Referenz: "+traceId},requestId:traceId},500));
 }
};
export const onRequest=()=>withRegistrationVersion(json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"}));
