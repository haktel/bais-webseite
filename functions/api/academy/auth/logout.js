import{assertDatabase,handleError,json,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,clearSessionCookie,deleteSession}from"../../../_lib/auth.js";
export const onRequestPost=async({request,env})=>{const traceId=requestId(request);try{assertSameOrigin(request);const db=assertDatabase(env);await ensureAuthSchema(db);await deleteSession(db,request);return json({ok:true,requestId:traceId},200,{"set-cookie":clearSessionCookie(),"clear-site-data":"\"cache\", \"cookies\", \"storage\"","pragma":"no-cache"});}catch(error){return handleError(error,traceId);}};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
