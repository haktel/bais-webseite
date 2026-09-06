import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{requireAdmin}from"../../_lib/admin.js";
import{ensureAnalyticsSchema,visitorOverview}from"../../_lib/analytics.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await requireAdmin(db,request);
  await ensureAnalyticsSchema(db);
  const overview=await visitorOverview(db);
  return json({ok:true,...overview,requestId:traceId});
 }catch(error){
  return handleError(error,traceId);
 }
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
