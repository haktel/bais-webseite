import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin}from"../../_lib/auth.js";
import{requireAdmin}from"../../_lib/admin.js";
import{ensureApprovalSchema,requestProjectApproval}from"../../_lib/approvals.js";

const overview=async db=>{
 await ensureApprovalSchema(db);
 const approvals=await db.prepare(
  "SELECT a.id,a.project_id,a.subject,a.status,a.decision_note,a.requested_by,a.decided_by,a.decided_at,a.created_at,pr.project_number,p.name AS project_name,ca.customer_number,o.name AS organization_name "+
  "FROM approvals a JOIN projects p ON p.id=a.project_id JOIN project_registry pr ON pr.project_id=p.id JOIN customer_accounts ca ON ca.organization_id=p.organization_id JOIN organizations o ON o.id=p.organization_id "+
  "ORDER BY a.created_at DESC LIMIT 300"
 ).all();
 const projects=await db.prepare(
  "SELECT p.id,pr.project_number,p.name,ca.customer_number,o.name AS organization_name FROM projects p JOIN project_registry pr ON pr.project_id=p.id JOIN customer_accounts ca ON ca.organization_id=p.organization_id JOIN organizations o ON o.id=p.organization_id JOIN project_sow s ON s.project_id=p.id WHERE s.sow_status='signed' ORDER BY pr.project_number"
 ).all();
 return{approvals:approvals.results||[],projects:projects.results||[]};
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
  const db=assertDatabase(env),admin=await requireAdmin(db,request);
  const body=await readJson(request,4096),projectId=cleanText(body.projectId,80),subject=cleanText(body.subject,180);
  if(!projectId||!subject)throw new ApiError(422,"validation_failed","Projekt und Betreff sind erforderlich.");
  const approval=await requestProjectApproval(db,{projectId,subject,actorUserId:admin.user_id});
  return json({ok:true,approval,...await overview(db),requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
