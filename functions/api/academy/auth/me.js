import{assertDatabase,handleError,json,requestId}from"../../../_lib/api.js";
import{requireSession}from"../../../_lib/auth.js";
export const onRequestGet=async({request,env})=>{const traceId=requestId(request);try{const user=await requireSession(assertDatabase(env),request);return json({ok:true,user:{displayName:user.display_name,email:user.email,role:user.role},requestId:traceId});}catch(error){return handleError(error,traceId);}};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
