import{assertDatabase,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{requireAdmin}from"../../_lib/admin.js";
import{getBrandSettings,updateBrandSettings}from"../../_lib/brand-settings.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{const db=assertDatabase(env);await requireAdmin(db,request);return json({ok:true,settings:await getBrandSettings(db),requestId:traceId});}
 catch(error){return handleError(error,traceId);}
};

export const onRequestPatch=async({request,env})=>{
 const traceId=requestId(request);
 try{const db=assertDatabase(env);await requireAdmin(db,request);const body=await readJson(request,8192);const settings=await updateBrandSettings(db,body.settings??body);return json({ok:true,settings,requestId:traceId});}
 catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, PATCH"});
