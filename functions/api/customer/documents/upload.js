import{ApiError,assertDatabase,cleanText,handleError,json,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../../_lib/auth.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../../_lib/customer-access.js";
import{deleteObject,DOCUMENT_MAX_BYTES,ensureDocumentUploadSchema,putIncomingObject,r2StorageMode}from"../../../_lib/r2-documents.js";

const limitedBody=(body,maxBytes)=>{
 if(!body)throw new ApiError(400,"empty_file","Die Datei enthält keine übertragbaren Daten.");
 let seen=0;
 return body.pipeThrough(new TransformStream({
  transform(chunk,controller){
   const size=Number(chunk?.byteLength??chunk?.length??0);seen+=size;
   if(seen>maxBytes)throw new ApiError(413,"file_too_large","Dateien dürfen maximal 25 MiB groß sein.");
   controller.enqueue(chunk);
  }
 }));
};

export const onRequestPut=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  if(r2StorageMode(env)!=="binding")throw new ApiError(409,"native_upload_not_enabled","Direkter R2-Upload ist für diese Umgebung nicht aktiviert.");
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);
  const session=await requireSession(db,request);
  if(session.role!=="customer")throw new ApiError(403,"customer_role_required","Dokumente können nur über ein Kundenkonto hochgeladen werden.");
  const customer=await customerContextForSession(db,session),url=new URL(request.url),uploadId=cleanText(url.searchParams.get("id"),80);
  if(!uploadId)throw new ApiError(422,"upload_required","Upload-ID fehlt.");

  const row=await db.prepare(
   "SELECT du.id,du.organization_id,du.project_id,du.incoming_key,du.original_name,du.mime_type,du.declared_size,du.status,du.created_by,du.expires_at "+
   "FROM document_uploads du JOIN projects p ON p.id=du.project_id WHERE du.id=? AND du.organization_id=? AND p.organization_id=? LIMIT 1"
  ).bind(uploadId,customer.organizationId,customer.organizationId).first();
  if(!row)throw new ApiError(404,"upload_not_found","Upload gehört nicht zu diesem Kundenkonto.");
  if(row.created_by!==session.user_id)throw new ApiError(403,"upload_owner_required","Dieser Upload wurde von einem anderen Benutzer gestartet.");
  if(row.status!=="pending")throw new ApiError(409,"upload_not_pending","Dieser Upload kann nicht mehr beschrieben werden.");
  const now=new Date().toISOString();
  if(row.expires_at<=now)throw new ApiError(410,"upload_expired","Upload-Zeitfenster ist abgelaufen. Bitte wählen Sie die Datei erneut aus.");
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal",projectId:row.project_id}))
   throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Projekt nicht freigeschaltet.");

  const contentType=String(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
  if(contentType!==String(row.mime_type).toLowerCase())throw new ApiError(415,"uploaded_type_invalid","Der Dateityp entspricht nicht der zuvor geprüften Datei.");
  const length=Number(request.headers.get("content-length")||0),declared=Number(row.declared_size);
  if(length&&length!==declared)throw new ApiError(413,"uploaded_size_invalid","Die übertragene Dateigröße entspricht nicht der zuvor geprüften Größe.");
  if(declared<1||declared>DOCUMENT_MAX_BYTES)throw new ApiError(413,"file_too_large","Dateien dürfen maximal 25 MiB groß sein.");

  let object;
  try{
   object=await putIncomingObject(env,{key:row.incoming_key,body:limitedBody(request.body,DOCUMENT_MAX_BYTES),mimeType:row.mime_type});
  }catch(error){
   try{await deleteObject(env,row.incoming_key);}catch{}
   throw error;
  }
  if(object.size!==declared){
   try{await deleteObject(env,row.incoming_key);}catch{}
   await db.prepare("UPDATE document_uploads SET status='rejected',rejection_reason='size_mismatch',finalized_at=? WHERE id=? AND organization_id=? AND status='pending'")
    .bind(now,row.id,customer.organizationId).run();
   throw new ApiError(413,"uploaded_size_invalid","Die tatsächlich gespeicherte Dateigröße entspricht nicht der freigegebenen Größe.");
  }

  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),session.user_id,customer.organizationId,"customer.document.upload.received","document_upload",row.id,JSON.stringify({projectId:row.project_id,sizeBytes:object.size,mimeType:row.mime_type,mode:"binding"}),now).run();

  return json({ok:true,upload:{id:row.id,sizeBytes:object.size,etag:object.etag},requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"PUT"});
