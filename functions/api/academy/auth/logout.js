import{assertDatabase,handleError,json,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,clearSessionCookie,deleteSession}from"../../../_lib/auth.js";

const LOCAL_LOGOUT_HEADERS={
 "set-cookie":clearSessionCookie(),
 "clear-site-data":"\"cache\", \"cookies\", \"storage\"",
 "cache-control":"no-store",
 "pragma":"no-cache"
};
const withLocalLogout=response=>{
 const headers=new Headers(response.headers);
 for(const[name,value]of Object.entries(LOCAL_LOGOUT_HEADERS))headers.set(name,value);
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{assertSameOrigin(request);}catch(error){return handleError(error,traceId);}
 try{
  const db=assertDatabase(env);
  await ensureAuthSchema(db);
  await deleteSession(db,request);
  return withLocalLogout(json({ok:true,requestId:traceId}));
 }catch(error){
  return withLocalLogout(handleError(error,traceId));
 }
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
