import{assertDatabase,handleError,json,readJson,requestId}from"../_lib/api.js";
import{ensureAnalyticsSchema,recordLeave,recordView}from"../_lib/analytics.js";

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await ensureAnalyticsSchema(db);
  const body=await readJson(request,4096);
  if(body.action==="view"){
   const result=await recordView(db,{sessionId:body.sessionId,path:body.path,referrer:body.referrer,isEntry:Boolean(body.isEntry)});
   return json({ok:true,...result});
  }
  if(body.action==="leave"){
   await recordLeave(db,{visitId:body.visitId,durationSeconds:Number(body.durationSeconds)});
   return json({ok:true});
  }
  return json({ok:true});
 }catch(error){
  return handleError(error,traceId);
 }
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
