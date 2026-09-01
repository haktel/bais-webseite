import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,consumeRateLimit,ensureAuthSchema,requireSession}from"../../../_lib/auth.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../../_lib/customer-access.js";
import{buildIncomingKey,DOCUMENT_UPLOAD_TTL_SECONDS,ensureDocumentUploadSchema,presignUpload,r2StorageMode,validateDocumentUpload}from"../../../_lib/r2-documents.js";

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);
  const session=await requireSession(db,request);
  if(session.role!=="customer")throw new ApiError(403,"customer_role_required","Dokumente können nur über ein Kundenkonto hochgeladen werden.");
  const customer=await customerContextForSession(db,session);
  const body=await readJson(request,8192),projectId=cleanText(body.projectId,80);
  if(!projectId)throw new ApiError(422,"project_required","Ein Projekt ist erforderlich.");
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal",projectId}))
   throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Projekt nicht freigeschaltet.");
  const project=await db.prepare("SELECT id FROM projects WHERE id=? AND organization_id=? LIMIT 1").bind(projectId,customer.organizationId).first();
  if(!project)throw new ApiError(404,"project_not_found","Projekt gehört nicht zu diesem Kundenkonto.");

  const file=validateDocumentUpload({fileName:body.fileName,mimeType:body.mimeType,sizeBytes:body.sizeBytes});
  await consumeRateLimit(db,request,"customer-document-upload",session.email,20);

  const uploadId=crypto.randomUUID(),incomingKey=buildIncomingKey(uploadId),now=new Date(),
   createdAt=now.toISOString(),expiresAt=new Date(now.getTime()+DOCUMENT_UPLOAD_TTL_SECONDS*1000).toISOString();

  await db.prepare("INSERT INTO document_uploads(id,organization_id,project_id,incoming_key,original_name,mime_type,declared_size,status,created_by,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
   .bind(uploadId,customer.organizationId,projectId,incomingKey,file.name,file.mime,file.size,"pending",session.user_id,createdAt,expiresAt).run();

  let uploadUrl,uploadMode;
  try{
   uploadMode=r2StorageMode(env);
   uploadUrl=uploadMode==="s3"
    ?await presignUpload(env,{key:incomingKey,mimeType:file.mime})
    :"/api/customer/documents/upload?id="+encodeURIComponent(uploadId);
  }catch(error){
   await db.prepare("DELETE FROM document_uploads WHERE id=? AND organization_id=?").bind(uploadId,customer.organizationId).run().catch(()=>{});
   throw error;
  }

  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),session.user_id,customer.organizationId,"customer.document.upload.requested","document_upload",uploadId,JSON.stringify({projectId,mimeType:file.mime,sizeBytes:file.size}),createdAt).run();

  return json({
   ok:true,
   upload:{
    id:uploadId,
    url:uploadUrl,
    method:"PUT",
    headers:{"Content-Type":file.mime},
    expiresAt,
    maxBytes:25*1024*1024,
    mode:uploadMode
   },
   requestId:traceId
  },201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
