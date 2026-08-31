import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{adminMfaState,beginAdminMfaSetup,confirmAdminMfaSetup,ensureMfaSchema,verifyAdminMfa}from"../../_lib/mfa.js";

const requireAdminSession=async(db,request)=>{
 await ensureAuthSchema(db);await ensureMfaSchema(db);
 const user=await requireSession(db,request);
 if(user.role!=="admin")throw new ApiError(403,"admin_required","Administrator-Berechtigung erforderlich.");
 return user;
};

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env),user=await requireAdminSession(db,request),state=await adminMfaState(db,user);
  return json({ok:true,mfa:state,requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env),user=await requireAdminSession(db,request),body=await readJson(request,4096),action=cleanText(body.action,40);
  await consumeRateLimit(db,request,"admin-mfa",user.email,10);
  if(action==="begin_setup"){
   const setup=await beginAdminMfaSetup(db,user,env);
   return json({ok:true,setup,requestId:traceId});
  }
  if(action==="confirm_setup"){
   const result=await confirmAdminMfaSetup(db,user,cleanText(body.code,32),env);
   return json({ok:true,mfa:{configured:true,verified:true},recoveryCodes:result.recoveryCodes,requestId:traceId});
  }
  if(action==="verify"){
   await verifyAdminMfa(db,user,cleanText(body.code,32),env);
   return json({ok:true,mfa:{configured:true,verified:true},requestId:traceId});
  }
  throw new ApiError(422,"validation_failed","Ungültige MFA-Aktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
