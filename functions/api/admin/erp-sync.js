import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin}from"../../_lib/auth.js";
import{requireAdmin}from"../../_lib/admin.js";
import{getErpSyncOverview,queueUnsyncedCustomerProspects,saveErpIntegrationConfig,syncPendingErpJobs}from"../../_lib/erp-sync.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await requireAdmin(db,request);
  const queued=await queueUnsyncedCustomerProspects(db,{limit:500});
  return json({ok:true,queued,...await getErpSyncOverview(db,env),requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);
  await requireAdmin(db,request);
  const body=await readJson(request,16384),action=cleanText(body.action,40);

  if(action==="save_config"){
   const baseUrl=cleanText(body.baseUrl,300),
    apiKey=cleanText(body.apiKey,600),
    accessClientId=cleanText(body.accessClientId,600),
    accessClientSecret=cleanText(body.accessClientSecret,1200),
    enabled=body.enabled!==false;
   if(baseUrl&&!/^https:\/\//i.test(baseUrl))throw new ApiError(422,"invalid_erp_url","ERP-Adresse muss HTTPS verwenden.");
   const integration=await saveErpIntegrationConfig(db,env,{baseUrl,apiKey,accessClientId,accessClientSecret,enabled});
   const queued=await queueUnsyncedCustomerProspects(db,{limit:500});
   return json({ok:true,integration,queued,...await getErpSyncOverview(db,env),requestId:traceId});
  }

  if(action==="sync"){
   const queued=await queueUnsyncedCustomerProspects(db,{limit:500});
   const result=await syncPendingErpJobs(db,env,{limit:25});
   return json({ok:true,queued,result,...await getErpSyncOverview(db,env),requestId:traceId});
  }

  if(action==="retry_all"){
   const now=new Date().toISOString();
   await db.prepare("UPDATE erp_sync_jobs SET status='pending',next_attempt_at=?,last_error=NULL,updated_at=? WHERE status='failed'").bind(now,now).run();
   const result=await syncPendingErpJobs(db,env,{limit:25,now});
   return json({ok:true,result,...await getErpSyncOverview(db,env),requestId:traceId});
  }

  throw new ApiError(422,"invalid_action","Unbekannte ERP-Aktion.");
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
