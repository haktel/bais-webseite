import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,createSession,ensureAuthSchema,hashPassword,normalizeEmail,validPassword}from"../../../_lib/auth.js";
import{ensureCommercialIdentityForUser}from"../../../_lib/commercial.js";

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 let userId=null;
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);
  const body=await readJson(request,16384),
   displayName=cleanText(body.displayName,120),
   company=cleanText(body.company,160),
   email=normalizeEmail(body.email),
   password=body.password;
  if(displayName.length<2||company.length<2||!validEmail(email)||!validPassword(password))
   throw new ApiError(422,"validation_failed","Name, Unternehmen, gültige E-Mail und mindestens 12 Zeichen Passwort sind erforderlich.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  const rateKey=await consumeRateLimit(db,request,"customer-register",email,5);
  const existing=await db.prepare("SELECT id FROM users WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(existing)throw new ApiError(409,"account_exists","Für diese E-Mail besteht bereits ein Konto.");
  const now=new Date().toISOString(),credential=await hashPassword(password);
  userId=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO users(id,display_name,email,role,status,created_at) VALUES(?,?,?,?,?,?)").bind(userId,displayName,email,"customer","active",now),
   db.prepare("INSERT INTO user_credentials(user_id,password_hash,password_salt,password_algorithm,password_iterations,updated_at) VALUES(?,?,?,?,?,?)").bind(userId,credential.hash,credential.salt,"PBKDF2-SHA-256",credential.iterations,now)
  ]);
  const commercial=await ensureCommercialIdentityForUser(db,{userId,displayName,email,company,now,intakeName:"Erstprojekt / Intake"});
  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),userId,commercial.organizationId,"customer.account.created","user",userId,JSON.stringify({customerNumber:commercial.customerNumber,source:"self_registration",defaultAccess:"deny"}),now).run();
  const session=await createSession(db,userId,request);
  await db.prepare("DELETE FROM auth_rate_limits WHERE id=?").bind(rateKey).run();
  return json({
   ok:true,
   user:{displayName,email,role:"customer"},
   commercial:{customerNumber:commercial.customerNumber},
   contentAccess:[],
   message:"Kundenkonto erstellt. Geschützte Inhalte werden erst nach ausdrücklicher Freigabe sichtbar.",
   requestId:traceId
  },201,{"set-cookie":session.cookie});
 }catch(error){
  if(userId)try{const db=assertDatabase(env);await db.prepare("DELETE FROM users WHERE id=?").bind(userId).run();}catch{}
  return handleError(error,traceId);
 }
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
