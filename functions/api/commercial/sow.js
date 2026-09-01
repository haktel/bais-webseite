import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{requireAdmin}from"../../_lib/admin.js";
import{customerContextForSession}from"../../_lib/customer-access.js";
import{enqueueErpProspectSync,syncPendingErpJobs}from"../../_lib/erp-sync.js";
import{getProjectSow,saveProjectSow}from"../../_lib/project-sow.js";
import{enqueueProjectIntegrations,projectIntegrationStatus,syncPendingProjectIntegrations}from"../../_lib/project-sync.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);const session=await requireSession(db,request);
  const url=new URL(request.url),projectId=cleanText(url.searchParams.get("projectId"),80);
  if(!projectId)throw new ApiError(422,"project_required","Projekt-ID fehlt.");
  if(session.role!=="admin"){
   const customer=await customerContextForSession(db,session);
   const project=await db.prepare("SELECT id FROM projects WHERE id=? AND organization_id=? LIMIT 1").bind(projectId,customer.organizationId).first();
   if(!project)throw new ApiError(404,"project_not_found","Projekt gehört nicht zu diesem Kundenkonto.");
  }
  const sow=await getProjectSow(db,projectId),integrations=session.role==="admin"?await projectIntegrationStatus(db,projectId):null;
  return json({ok:true,sow,integrations,requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async context=>{
 const{request,env}=context,traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);const admin=await requireAdmin(db,request);
  const body=await readJson(request,32768),
   projectId=cleanText(body.projectId,80),organizationId=cleanText(body.organizationId,80);
  if(!projectId||!organizationId)throw new ApiError(422,"project_customer_required","Kunde und Projekt müssen aus der BAIS Datenbank ausgewählt sein.");

  const result=await saveProjectSow(db,{
   projectId,organizationId,
   offerNumber:body.offerNumber,
   sowStatus:body.sowStatus,
   projectStart:body.projectStart,
   validUntil:body.validUntil,
   modules:body.modules,
   scopeSelections:body.scopeSelections,
   actorUserId:admin.user_id,
   now:new Date().toISOString()
  });

  await db.prepare("UPDATE projects SET starts_at=? WHERE id=? AND organization_id=?")
   .bind(body.projectStart||null,projectId,organizationId).run();

  let queued={queued:false,reason:"sow_not_approved"};
  if(["approved","signed"].includes(result.sowStatus)){
   await enqueueErpProspectSync(db,{organizationId,now:new Date().toISOString()});
   queued=await enqueueProjectIntegrations(db,{projectId,now:new Date().toISOString()});
   const task=(async()=>{
    await syncPendingErpJobs(db,env,{limit:5}).catch(error=>console.error(JSON.stringify({level:"error",area:"erp.project.prerequisite",requestId:traceId,message:error instanceof Error?error.message:"unknown"})));
    await syncPendingProjectIntegrations(db,env,{limit:6}).catch(error=>console.error(JSON.stringify({level:"error",area:"project.integrations",requestId:traceId,message:error instanceof Error?error.message:"unknown"})));
   })();
   if(typeof context.waitUntil==="function")context.waitUntil(task);else void task;
  }

  return json({ok:true,project:{id:result.project.id,projectNumber:result.project.project_number,name:result.project.name},sow:{status:result.sowStatus,modules:result.modules,idempotent:result.idempotent},integrations:{queued:queued.queued===true},requestId:traceId},result.idempotent?200:201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
