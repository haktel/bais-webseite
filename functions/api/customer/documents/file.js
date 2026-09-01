import{ApiError,assertDatabase,cleanText,handleError,json,requestId}from"../../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../../_lib/auth.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../../_lib/customer-access.js";
import{ensureDocumentUploadSchema,getNativeObject,r2StorageMode,sanitizeDocumentName}from"../../../_lib/r2-documents.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  if(r2StorageMode(env)!=="binding")throw new ApiError(409,"native_download_not_enabled","Native R2-Ausgabe ist für diese Umgebung nicht aktiviert.");
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureDocumentUploadSchema(db);
  const session=await requireSession(db,request);
  if(session.role!=="customer")throw new ApiError(403,"customer_role_required","Dokumente können nur über ein Kundenkonto heruntergeladen werden.");
  const customer=await customerContextForSession(db,session),url=new URL(request.url),documentId=cleanText(url.searchParams.get("id"),80);
  if(!documentId)throw new ApiError(422,"document_required","Dokument-ID fehlt.");

  const row=await db.prepare(
   "SELECT d.id,d.project_id,d.name,d.r2_key,d.version,du.mime_type,du.actual_size FROM documents d "+
   "JOIN projects p ON p.id=d.project_id LEFT JOIN document_uploads du ON du.id=d.id "+
   "WHERE d.id=? AND p.organization_id=? LIMIT 1"
  ).bind(documentId,customer.organizationId).first();
  if(!row)throw new ApiError(404,"document_not_found","Dokument gehört nicht zu diesem Kundenkonto.");
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal",projectId:row.project_id}))
   throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Projekt nicht freigeschaltet.");
  const expectedPrefix="customers/"+customer.organizationId+"/projects/"+row.project_id+"/documents/";
  if(!String(row.r2_key||"").startsWith(expectedPrefix))throw new ApiError(409,"document_storage_scope_invalid","Dokumentenspeicher-Zuordnung ist ungültig.");

  const object=await getNativeObject(env,row.r2_key);
  if(!object)throw new ApiError(404,"document_object_missing","Die Datei ist im Dokumentenspeicher nicht verfügbar.");
  const now=new Date().toISOString();
  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),session.user_id,customer.organizationId,"customer.document.downloaded","document",row.id,JSON.stringify({projectId:row.project_id,mode:"binding"}),now).run();

  const headers=new Headers({
   "cache-control":"private, no-store, max-age=0",
   "x-content-type-options":"nosniff",
   "content-type":row.mime_type||object.httpMetadata?.contentType||"application/octet-stream",
   "content-disposition":"attachment; filename*=UTF-8''"+encodeURIComponent(sanitizeDocumentName(row.name)),
   "content-length":String(object.size)
  });
  headers.set("etag",object.httpEtag||("\""+object.etag+"\""));
  return new Response(object.body,{status:200,headers});
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
