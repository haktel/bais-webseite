import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,ensureAuthSchema,requireSession}from"../../../_lib/auth.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../../_lib/customer-access.js";
import{ensureApprovalSchema}from"../../../_lib/approvals.js";

const DECISIONS=new Set(["approved","rejected"]);

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureApprovalSchema(db);
  const session=await requireSession(db,request);
  if(session.role!=="customer")throw new ApiError(403,"customer_role_required","Freigaben können nur über ein Kundenkonto entschieden werden.");
  const customer=await customerContextForSession(db,session);
  const body=await readJson(request,4096),approvalId=cleanText(body.approvalId,80),decision=cleanText(body.decision,20);
  if(!approvalId||!DECISIONS.has(decision))throw new ApiError(422,"validation_failed","Freigabe-ID und Entscheidung (approved/rejected) sind erforderlich.");
  const note=cleanText(body.note,500)||null;
  await consumeRateLimit(db,request,"customer-approval-decide",session.email,20);

  const approval=await db.prepare("SELECT a.id,a.project_id,a.status,p.organization_id FROM approvals a JOIN projects p ON p.id=a.project_id WHERE a.id=? LIMIT 1").bind(approvalId).first();
  if(!approval||approval.organization_id!==customer.organizationId)throw new ApiError(404,"approval_not_found","Freigabe gehört nicht zu diesem Kundenkonto.");
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal",projectId:approval.project_id}))
   throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Projekt nicht freigeschaltet.");
  if(approval.status!=="pending")throw new ApiError(409,"approval_already_decided","Über diese Freigabe wurde bereits entschieden.");

  const now=new Date().toISOString();
  await db.batch([
   db.prepare("UPDATE approvals SET status=?,decided_by=?,decided_at=?,decision_note=? WHERE id=? AND status='pending'").bind(decision,session.user_id,now,note,approvalId),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(),session.user_id,customer.organizationId,decision==="approved"?"customer.approval.approved":"customer.approval.rejected","approval",approvalId,JSON.stringify({projectId:approval.project_id,note}),now)
  ]);
  return json({ok:true,approval:{id:approvalId,status:decision,decidedAt:now},requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
