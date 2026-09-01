import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin}from"../../_lib/auth.js";
import{requireAdmin}from"../../_lib/admin.js";
import{enqueueProjectIntegrations,ensureProjectSyncSchema,projectIntegrationStatus,syncPendingProjectIntegrations}from"../../_lib/project-sync.js";

const overview=async db=>{
 await ensureProjectSyncSchema(db);
 const rows=await db.prepare(
  "SELECT p.id AS project_id,pr.project_number,p.name,ca.customer_number,o.name AS organization_name,s.sow_status,"+
  "l.dolibarr_project_id,l.dolibarr_project_ref,l.dolibarr_sync_status,l.jira_parent_key,l.jira_sync_status,l.last_sync_at,l.last_error,l.updated_at "+
  "FROM projects p JOIN project_registry pr ON pr.project_id=p.id JOIN customer_accounts ca ON ca.organization_id=p.organization_id JOIN organizations o ON o.id=p.organization_id "+
  "JOIN project_sow s ON s.project_id=p.id LEFT JOIN project_integration_links l ON l.project_id=p.id ORDER BY s.updated_at DESC LIMIT 200"
 ).all();
 const jobs=await db.prepare("SELECT id,project_id,target,status,attempts,next_attempt_at,last_error,updated_at FROM project_sync_jobs ORDER BY updated_at DESC LIMIT 300").all();
 return{projects:rows.results||[],jobs:jobs.results||[]};
};

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await requireAdmin(db,request);
  return json({ok:true,...await overview(db),requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await requireAdmin(db,request);
  const body=await readJson(request,8192),action=cleanText(body.action,40),projectId=cleanText(body.projectId,80),now=new Date().toISOString();
  if(action==="sync_project"){
   if(!projectId)throw new ApiError(422,"project_required","Projekt-ID fehlt.");
   await enqueueProjectIntegrations(db,{projectId,now});
   const result=await syncPendingProjectIntegrations(db,env,{limit:6,now});
   return json({ok:true,result,status:await projectIntegrationStatus(db,projectId),...await overview(db),requestId:traceId});
  }
  if(action==="retry_all"){
   await ensureProjectSyncSchema(db);
   await db.prepare("UPDATE project_sync_jobs SET status='pending',next_attempt_at=?,last_error=NULL,updated_at=? WHERE status='failed'").bind(now,now).run();
   const result=await syncPendingProjectIntegrations(db,env,{limit:25,now});
   return json({ok:true,result,...await overview(db),requestId:traceId});
  }
  throw new ApiError(422,"invalid_action","Unbekannte Projekt-Sync-Aktion.");
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
