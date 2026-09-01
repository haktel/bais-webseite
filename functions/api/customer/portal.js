import{ApiError,assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{customerContextForSession}from"../../_lib/customer-access.js";
import{removeLegacyEmptyIntakeProjects}from"../../_lib/commercial.js";
import{ensureDocumentUploadSchema}from"../../_lib/r2-documents.js";
import{ensureProjectSowSchema}from"../../_lib/project-sow.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);await ensureProjectSowSchema(db);
  const session=await requireSession(db,request);
  if(session.role==="admin"||session.role==="trainer")throw new ApiError(403,"customer_context_required","Das Kundenportal ist auf Kundenkonten beschränkt.");
  const customer=await customerContextForSession(db,session),org=customer.organizationId;
  await removeLegacyEmptyIntakeProjects(db,{organizationId:org});

  const [organization,projects,milestones,documents,approvals,modules,sows]=await Promise.all([
   db.prepare("SELECT id,name,billing_email FROM organizations WHERE id=? LIMIT 1").bind(org).first(),
   db.prepare("SELECT p.id,pr.project_number,p.name,p.status,p.starts_at,p.ends_at,p.created_at FROM projects p JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? ORDER BY p.created_at DESC").bind(org).all(),
   db.prepare("SELECT m.id,m.project_id,m.title,m.status,m.due_at,m.position FROM milestones m JOIN projects p ON p.id=m.project_id WHERE p.organization_id=? ORDER BY m.project_id,m.position,m.due_at").bind(org).all(),
   db.prepare("SELECT d.id,d.project_id,d.name,d.version,d.created_at,du.mime_type,du.actual_size AS size_bytes FROM documents d JOIN projects p ON p.id=d.project_id LEFT JOIN document_uploads du ON du.id=d.id WHERE p.organization_id=? ORDER BY d.project_id,d.created_at DESC").bind(org).all(),
   db.prepare("SELECT a.id,a.project_id,a.subject,a.status,a.decided_at,a.created_at FROM approvals a JOIN projects p ON p.id=a.project_id WHERE p.organization_id=? ORDER BY a.project_id,a.created_at DESC").bind(org).all(),
   db.prepare("SELECT pm.project_id,pm.module_code,pm.module_name FROM project_modules pm JOIN projects p ON p.id=pm.project_id JOIN project_sow s ON s.project_id=pm.project_id AND s.sow_status='signed' WHERE p.organization_id=? ORDER BY pm.project_id,pm.module_code").bind(org).all(),
   db.prepare("SELECT s.project_id,s.offer_number,s.sow_status,s.project_start,s.signed_at FROM project_sow s JOIN projects p ON p.id=s.project_id WHERE p.organization_id=? AND s.sow_status='signed'").bind(org).all()
  ]);

  const ms=milestones.results||[],docs=documents.results||[],apps=approvals.results||[],mods=modules.results||[],sowRows=sows.results||[];
  return json({
   ok:true,
   customer:{customerNumber:customer.customerNumber,organizationName:organization?.name||session.display_name,email:session.email},
   projects:(projects.results||[]).map(project=>({
    ...project,
    sow:sowRows.find(item=>item.project_id===project.id)||null,
    modules:mods.filter(item=>item.project_id===project.id),
    milestones:ms.filter(item=>item.project_id===project.id),
    documents:docs.filter(item=>item.project_id===project.id),
    approvals:apps.filter(item=>item.project_id===project.id)
   })),
   requestId:traceId
  },200,{"cache-control":"private, no-store"});
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
