import{ApiError,assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{customerContextForSession}from"../../_lib/customer-access.js";
import{ensureDocumentUploadSchema}from"../../_lib/r2-documents.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);
  const session=await requireSession(db,request);
  if(session.role==="admin"||session.role==="trainer")throw new ApiError(403,"customer_context_required","Das Kundenportal ist auf Kundenkonten beschränkt.");
  const customer=await customerContextForSession(db,session),org=customer.organizationId;

  const [organization,projects,milestones,documents,approvals]=await Promise.all([
   db.prepare("SELECT id,name,billing_email FROM organizations WHERE id=? LIMIT 1").bind(org).first(),
   db.prepare("SELECT p.id,pr.project_number,p.name,p.status,p.starts_at,p.ends_at,p.created_at FROM projects p JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? ORDER BY p.created_at DESC").bind(org).all(),
   db.prepare("SELECT m.id,m.project_id,m.title,m.status,m.due_at,m.position FROM milestones m JOIN projects p ON p.id=m.project_id WHERE p.organization_id=? ORDER BY m.project_id,m.position,m.due_at").bind(org).all(),
   db.prepare("SELECT d.id,d.project_id,d.name,d.version,d.created_at,du.mime_type,du.actual_size AS size_bytes FROM documents d JOIN projects p ON p.id=d.project_id LEFT JOIN document_uploads du ON du.id=d.id WHERE p.organization_id=? ORDER BY d.project_id,d.created_at DESC").bind(org).all(),
   db.prepare("SELECT a.id,a.project_id,a.subject,a.status,a.decided_at,a.created_at FROM approvals a JOIN projects p ON p.id=a.project_id WHERE p.organization_id=? ORDER BY a.project_id,a.created_at DESC").bind(org).all()
  ]);

  const ms=milestones.results||[],docs=documents.results||[],apps=approvals.results||[];
  return json({
   ok:true,
   customer:{customerNumber:customer.customerNumber,organizationName:organization?.name||session.display_name,email:session.email},
   projects:(projects.results||[]).map(project=>({
    ...project,
    milestones:ms.filter(item=>item.project_id===project.id),
    documents:docs.filter(item=>item.project_id===project.id),
    approvals:apps.filter(item=>item.project_id===project.id)
   })),
   requestId:traceId
  },200,{"cache-control":"private, no-store"});
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
