import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../../_lib/auth.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../../_lib/customer-access.js";
import{buildFinalKey,copyIncomingToFinal,deleteObject,DOCUMENT_MAX_BYTES,ensureDocumentUploadSchema,headObject,normalizedMime}from"../../../_lib/r2-documents.js";

const rejectUpload=async(db,env,row,reason)=>{
 try{await deleteObject(env,row.incoming_key);}catch(error){console.error(JSON.stringify({level:"warn",area:"r2.cleanup",uploadId:row.id,message:error instanceof Error?error.message:"unknown"}));}
 await db.prepare("UPDATE document_uploads SET status='rejected',rejection_reason=?,finalized_at=? WHERE id=? AND status='pending'")
  .bind(reason,new Date().toISOString(),row.id).run();
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);
  const session=await requireSession(db,request);
  if(session.role!=="customer")throw new ApiError(403,"customer_role_required","Dokumente können nur über ein Kundenkonto bestätigt werden.");
  const customer=await customerContextForSession(db,session);
  const body=await readJson(request,4096),uploadId=cleanText(body.uploadId,80);
  if(!uploadId)throw new ApiError(422,"upload_required","Upload-ID fehlt.");

  const row=await db.prepare(
   "SELECT du.id,du.organization_id,du.project_id,du.incoming_key,du.final_key,du.original_name,du.mime_type,du.declared_size,du.actual_size,du.etag,du.status,du.created_by,du.created_at,du.expires_at,du.finalized_at "+
   "FROM document_uploads du JOIN projects p ON p.id=du.project_id WHERE du.id=? AND du.organization_id=? AND p.organization_id=? LIMIT 1"
  ).bind(uploadId,customer.organizationId,customer.organizationId).first();
  if(!row)throw new ApiError(404,"upload_not_found","Upload gehört nicht zu diesem Kundenkonto.");
  if(row.created_by!==session.user_id)throw new ApiError(403,"upload_owner_required","Dieser Upload wurde von einem anderen Benutzer gestartet.");
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal",projectId:row.project_id}))
   throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Projekt nicht freigeschaltet.");

  if(row.status==="ready"){
   const existing=await db.prepare("SELECT id,project_id,name,version,created_at FROM documents WHERE id=? LIMIT 1").bind(row.id).first();
   if(existing)return json({ok:true,document:existing,alreadyFinalized:true,requestId:traceId});
  }
  if(row.status!=="pending")throw new ApiError(409,"upload_not_pending","Dieser Upload kann nicht mehr abgeschlossen werden.");
  const now=new Date().toISOString();
  if(row.expires_at<=now){
   await rejectUpload(db,env,row,"expired");
   throw new ApiError(410,"upload_expired","Upload-Zeitfenster ist abgelaufen. Bitte wählen Sie die Datei erneut aus.");
  }

  const object=await headObject(env,row.incoming_key);
  if(!object)throw new ApiError(409,"upload_not_found_in_storage","Die Datei wurde noch nicht vollständig zu R2 übertragen.");
  if(!Number.isInteger(object.size)||object.size<1||object.size>DOCUMENT_MAX_BYTES||object.size!==Number(row.declared_size)){
   await rejectUpload(db,env,row,"size_mismatch");
   throw new ApiError(413,"uploaded_size_invalid","Die tatsächlich hochgeladene Dateigröße entspricht nicht der freigegebenen Größe.");
  }
  if(normalizedMime(object.mimeType)!==normalizedMime(row.mime_type)){
   await rejectUpload(db,env,row,"mime_mismatch");
   throw new ApiError(415,"uploaded_type_invalid","Der tatsächlich hochgeladene Dateityp entspricht nicht der Freigabe.");
  }

  const lock=await db.prepare("UPDATE document_uploads SET status='finalizing' WHERE id=? AND organization_id=? AND status='pending'")
   .bind(row.id,customer.organizationId).run();
  if(Number(lock?.meta?.changes||0)!==1){
   const latest=await db.prepare("SELECT status FROM document_uploads WHERE id=? AND organization_id=? LIMIT 1").bind(row.id,customer.organizationId).first();
   if(latest?.status==="ready"){
    const existing=await db.prepare("SELECT id,project_id,name,version,created_at FROM documents WHERE id=? LIMIT 1").bind(row.id).first();
    if(existing)return json({ok:true,document:existing,alreadyFinalized:true,requestId:traceId});
   }
   throw new ApiError(409,"upload_finalizing","Dieser Upload wird bereits abgeschlossen.");
  }

  const finalKey=buildFinalKey({organizationId:customer.organizationId,projectId:row.project_id,documentId:row.id,fileName:row.original_name});
  try{
   await copyIncomingToFinal(env,{incomingKey:row.incoming_key,finalKey,mimeType:row.mime_type,fileName:row.original_name,sourceEtag:object.etag});
  }catch(error){
   await db.prepare("UPDATE document_uploads SET status='pending' WHERE id=? AND organization_id=? AND status='finalizing'").bind(row.id,customer.organizationId).run().catch(()=>{});
   throw error;
  }

  const finalObject=await headObject(env,finalKey);
  if(!finalObject||finalObject.size!==object.size||normalizedMime(finalObject.mimeType)!==normalizedMime(row.mime_type)){
   try{await deleteObject(env,finalKey);}catch{}
   await db.prepare("UPDATE document_uploads SET status='pending' WHERE id=? AND organization_id=? AND status='finalizing'").bind(row.id,customer.organizationId).run().catch(()=>{});
   throw new ApiError(502,"r2_finalize_verification_failed","Die finale Dokumentkopie konnte nicht verifiziert werden.");
  }

  const versionRow=await db.prepare("SELECT COALESCE(MAX(version),0)+1 AS next_version FROM documents WHERE project_id=? AND lower(name)=lower(?)")
   .bind(row.project_id,row.original_name).first();
  const version=Math.max(1,Number(versionRow?.next_version)||1);
  try{
   await db.batch([
    db.prepare("INSERT INTO documents(id,project_id,name,r2_key,version,uploaded_by,created_at) VALUES(?,?,?,?,?,?,?)")
     .bind(row.id,row.project_id,row.original_name,finalKey,version,session.user_id,now),
    db.prepare("UPDATE document_uploads SET final_key=?,actual_size=?,etag=?,status='ready',finalized_at=?,rejection_reason=NULL WHERE id=? AND organization_id=? AND status='finalizing'")
     .bind(finalKey,finalObject.size,finalObject.etag||object.etag||null,now,row.id,customer.organizationId),
    db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
     .bind(crypto.randomUUID(),session.user_id,customer.organizationId,"customer.document.uploaded","document",row.id,JSON.stringify({projectId:row.project_id,mimeType:row.mime_type,sizeBytes:finalObject.size,version}),now)
   ]);
  }catch(error){
   try{await deleteObject(env,finalKey);}catch{}
   await db.prepare("UPDATE document_uploads SET status='pending' WHERE id=? AND organization_id=? AND status='finalizing'").bind(row.id,customer.organizationId).run().catch(()=>{});
   throw error;
  }

  try{await deleteObject(env,row.incoming_key);}catch(error){console.error(JSON.stringify({level:"warn",area:"r2.cleanup",uploadId:row.id,message:error instanceof Error?error.message:"unknown"}));}
  return json({ok:true,document:{id:row.id,project_id:row.project_id,name:row.original_name,version,created_at:now,mime_type:row.mime_type,size_bytes:finalObject.size},requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
