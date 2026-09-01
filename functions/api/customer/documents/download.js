import{ApiError,assertDatabase,cleanText,handleError,json,requestId}from"../../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../../_lib/auth.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../../_lib/customer-access.js";
import{DOCUMENT_DOWNLOAD_TTL_SECONDS,ensureDocumentUploadSchema,headObject,presignDownload,r2StorageMode}from"../../../_lib/r2-documents.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);
  const session=await requireSession(db,request);
  if(session.role!=="customer")throw new ApiError(403,"customer_role_required","Dokumente können nur über ein Kundenkonto heruntergeladen werden.");
  const customer=await customerContextForSession(db,session),url=new URL(request.url),documentId=cleanText(url.searchParams.get("id"),80);
  if(!documentId)throw new ApiError(422,"document_required","Dokument-ID fehlt.");

  const row=await db.prepare(
   "SELECT d.id,d.project_id,d.name,d.r2_key,d.version,d.created_at,du.mime_type,du.actual_size "+
   "FROM documents d JOIN projects p ON p.id=d.project_id LEFT JOIN document_uploads du ON du.id=d.id "+
   "WHERE d.id=? AND p.organization_id=? LIMIT 1"
  ).bind(documentId,customer.organizationId).first();
  if(!row)throw new ApiError(404,"document_not_found","Dokument gehört nicht zu diesem Kundenkonto.");
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal",projectId:row.project_id}))
   throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Projekt nicht freigeschaltet.");

  const expectedPrefix="customers/"+customer.organizationId+"/projects/"+row.project_id+"/documents/";
  if(!String(row.r2_key||"").startsWith(expectedPrefix))throw new ApiError(409,"document_storage_scope_invalid","Dokumentenspeicher-Zuordnung ist ungültig.");
  const object=await headObject(env,row.r2_key);
  if(!object)throw new ApiError(404,"document_object_missing","Die Datei ist im Dokumentenspeicher nicht verfügbar.");
  const mode=r2StorageMode(env);
  const downloadUrl=mode==="s3"?await presignDownload(env,{key:row.r2_key}):"/api/customer/documents/file?id="+encodeURIComponent(row.id);
  const expiresAt=mode==="s3"?new Date(Date.now()+DOCUMENT_DOWNLOAD_TTL_SECONDS*1000).toISOString():null;
  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),session.user_id,customer.organizationId,"customer.document.download_url_issued","document",row.id,JSON.stringify({projectId:row.project_id,expiresInSeconds:mode==="s3"?DOCUMENT_DOWNLOAD_TTL_SECONDS:null,mode}),new Date().toISOString()).run();

  return json({ok:true,download:{url:downloadUrl,expiresAt,fileName:row.name,mimeType:row.mime_type||object.mimeType||null,sizeBytes:row.actual_size||object.size||null,mode},requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
