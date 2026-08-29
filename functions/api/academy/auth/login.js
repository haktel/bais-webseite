import{ApiError,assertDatabase,handleError,json,readJson,requestId,validEmail}from"../../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,consumeRateLimit,createSession,normalizeEmail,validPassword,verifyPassword}from"../../../_lib/auth.js";
export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);const db=assertDatabase(env);await ensureAuthSchema(db);const body=await readJson(request),email=normalizeEmail(body.email),password=body.password;
  if(!validEmail(email)||!validPassword(password))throw new ApiError(401,"invalid_credentials","E-Mail oder Passwort ist nicht korrekt.");
  const rateKey=await consumeRateLimit(db,request,"login",email),account=await db.prepare("SELECT u.id,u.display_name,u.email,u.role,u.status,c.password_hash,c.password_salt,c.password_iterations FROM users u JOIN user_credentials c ON c.user_id=u.id WHERE u.email=? LIMIT 1").bind(email).first();
  if(!account||account.status!=="active")throw new ApiError(401,"invalid_credentials","E-Mail oder Passwort ist nicht korrekt.");
  const valid=await verifyPassword(password,account);
  if(!valid)throw new ApiError(401,"invalid_credentials","E-Mail oder Passwort ist nicht korrekt.");
  const session=await createSession(db,account.id,request);await db.prepare("DELETE FROM auth_rate_limits WHERE id=?").bind(rateKey).run();
  return json({ok:true,user:{displayName:account.display_name,email:account.email,role:account.role},requestId:traceId},200,{"set-cookie":session.cookie});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
