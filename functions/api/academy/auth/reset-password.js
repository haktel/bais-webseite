import{ApiError,assertDatabase,handleError,json,readJson,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,findPasswordReset,hashPassword,validPassword}from"../../../_lib/auth.js";

export const onRequestPost=async context=>{
 const{request,env}=context,traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);
  const body=await readJson(request,4096),password=body.password;
  const reset=await findPasswordReset(db,body.token);
  if(!reset)throw new ApiError(400,"invalid_reset_link","Der Link zum Zurücksetzen des Passworts ist ungültig oder nicht mehr verfügbar.");
  const now=new Date().toISOString();
  if(reset.expires_at<=now)throw new ApiError(410,"reset_expired","Der Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.");
  if(reset.used_at)throw new ApiError(400,"reset_used","Der Link wurde bereits verwendet.");
  if(!validPassword(password))throw new ApiError(422,"validation_failed","Das neue Passwort muss mindestens 12 und höchstens 128 Zeichen haben.");
  const credential=await hashPassword(password);
  await db.batch([
   db.prepare("UPDATE user_credentials SET password_hash=?,password_salt=?,password_algorithm=?,password_iterations=?,updated_at=? WHERE user_id=?")
    .bind(credential.hash,credential.salt,"PBKDF2-SHA-256",credential.iterations,now,reset.user_id),
   db.prepare("UPDATE user_password_resets SET used_at=? WHERE user_id=? AND token_hash=? AND used_at IS NULL").bind(now,reset.user_id,reset.tokenHash),
   db.prepare("DELETE FROM user_sessions WHERE user_id=?").bind(reset.user_id),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),reset.user_id,reset.organization_id,"user.password.reset","user",reset.user_id,JSON.stringify({source:"password_reset"}),now)
  ]);
  return json({ok:true,message:"Passwort wurde geändert. Bitte melden Sie sich mit dem neuen Passwort an.",requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
