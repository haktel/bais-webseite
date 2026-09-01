import{AwsClient}from"../_vendor/aws4fetch.js";
import{ApiError}from"./api.js";

export const DOCUMENT_MAX_BYTES=25*1024*1024;
export const DOCUMENT_UPLOAD_TTL_SECONDS=180;
export const DOCUMENT_DOWNLOAD_TTL_SECONDS=300;

const EXTENSIONS_BY_MIME=new Map([
 ["application/pdf",["pdf"]],
 ["image/png",["png"]],
 ["image/jpeg",["jpg","jpeg"]],
 ["image/jpg",["jpg","jpeg"]],
 ["image/webp",["webp"]],
 ["text/plain",["txt","log","md"]],
 ["text/markdown",["md"]],
 ["text/csv",["csv"]],
 ["application/vnd.ms-excel",["csv"]],
 ["application/zip",["zip"]],
 ["application/x-zip-compressed",["zip"]],
 ["application/vnd.openxmlformats-officedocument.wordprocessingml.document",["docx"]],
 ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",["xlsx"]],
 ["application/vnd.openxmlformats-officedocument.presentationml.presentation",["pptx"]]
]);
const ALLOWED_MIME_TYPES=new Set(EXTENSIONS_BY_MIME.keys());

const normalizeMime=value=>String(value||"").split(";")[0].trim().toLowerCase();
const encodePath=value=>String(value).split("/").map(part=>encodeURIComponent(part)).join("/");
const normalizeEtag=value=>String(value||"").trim().replace(/^W\//,"").replace(/^"|"$/g,"");
const nativeBucket=env=>env?.PROJECT_DOCUMENTS&&typeof env.PROJECT_DOCUMENTS.get==="function"&&typeof env.PROJECT_DOCUMENTS.put==="function"?env.PROJECT_DOCUMENTS:null;
const hasS3Config=env=>Boolean(String(env?.R2_ACCOUNT_ID||"").trim()&&String(env?.R2_BUCKET_NAME||"").trim()&&String(env?.R2_ACCESS_KEY_ID||"").trim()&&String(env?.R2_SECRET_ACCESS_KEY||"").trim());

export function r2StorageMode(env){
 if(nativeBucket(env))return"binding";
 if(hasS3Config(env))return"s3";
 throw new ApiError(503,"r2_not_configured","Dokumentenspeicher ist noch nicht vollständig konfiguriert.");
}

export function sanitizeDocumentName(value){
 const raw=String(value||"").normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g," ").trim();
 const leaf=raw.split(/[\\/]/).pop().replace(/\s+/g," ").replace(/[<>:"|?*]/g,"_").replace(/^\.+/,"");
 const safe=leaf.slice(0,180).trim();
 if(safe.length<1)throw new ApiError(422,"invalid_file_name","Ein gültiger Dateiname ist erforderlich.");
 return safe;
}

export function validateDocumentUpload({fileName,mimeType,sizeBytes}){
 const name=sanitizeDocumentName(fileName),mime=normalizeMime(mimeType),size=Number(sizeBytes);
 if(!ALLOWED_MIME_TYPES.has(mime))throw new ApiError(415,"unsupported_file_type","Dieser Dateityp ist für das Project Portal nicht freigegeben.");
 const extension=(name.includes(".")?name.split(".").pop():"").toLowerCase();
 if(!EXTENSIONS_BY_MIME.get(mime)?.includes(extension))throw new ApiError(415,"file_extension_mismatch","Dateiendung und Dateityp passen nicht zusammen.");
 if(!Number.isInteger(size)||size<1||size>DOCUMENT_MAX_BYTES)throw new ApiError(413,"file_too_large","Dateien dürfen maximal 25 MiB groß sein.");
 return{name,mime,size};
}

export function ensureDocumentUploadSchema(db){
 return db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS document_uploads(id TEXT PRIMARY KEY,organization_id TEXT NOT NULL,project_id TEXT NOT NULL,incoming_key TEXT NOT NULL UNIQUE,final_key TEXT,original_name TEXT NOT NULL,mime_type TEXT NOT NULL,declared_size INTEGER NOT NULL CHECK(declared_size>0),actual_size INTEGER,etag TEXT,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','finalizing','ready','rejected')),created_by TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,finalized_at TEXT,rejection_reason TEXT,FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_document_uploads_tenant ON document_uploads(organization_id,project_id,status,created_at DESC)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_document_uploads_expiry ON document_uploads(status,expires_at)")
 ]);
}

function s3Config(env){
 const accountId=String(env?.R2_ACCOUNT_ID||"").trim(),bucket=String(env?.R2_BUCKET_NAME||"").trim(),
  accessKeyId=String(env?.R2_ACCESS_KEY_ID||"").trim(),secretAccessKey=String(env?.R2_SECRET_ACCESS_KEY||"").trim();
 if(!accountId||!bucket||!accessKeyId||!secretAccessKey)throw new ApiError(503,"r2_s3_not_configured","R2 S3 Direct-Mode ist nicht konfiguriert.");
 if(!/^[a-f0-9]{32}$/i.test(accountId))throw new ApiError(503,"r2_invalid_account","Dokumentenspeicher ist falsch konfiguriert.");
 if(!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(bucket))throw new ApiError(503,"r2_invalid_bucket","Dokumentenspeicher ist falsch konfiguriert.");
 return{accountId,bucket,client:new AwsClient({accessKeyId,secretAccessKey,service:"s3",region:"auto"})};
}
function objectUrl(config,key){return new URL("https://"+config.accountId+".r2.cloudflarestorage.com/"+encodeURIComponent(config.bucket)+"/"+encodePath(key));}

export function buildIncomingKey(uploadId){return"incoming/customer-documents/"+String(uploadId);}
export function buildFinalKey({organizationId,projectId,documentId,fileName}){
 return"customers/"+String(organizationId)+"/projects/"+String(projectId)+"/documents/"+String(documentId)+"/"+sanitizeDocumentName(fileName);
}

export async function presignUpload(env,{key,mimeType,expires=DOCUMENT_UPLOAD_TTL_SECONDS}){
 const config=s3Config(env),url=objectUrl(config,key);url.searchParams.set("X-Amz-Expires",String(expires));
 const request=new Request(url,{method:"PUT",headers:{"Content-Type":normalizeMime(mimeType)}});
 const signed=await config.client.sign(request,{aws:{signQuery:true}});
 return signed.url.toString();
}

export async function presignDownload(env,{key,expires=DOCUMENT_DOWNLOAD_TTL_SECONDS}){
 const config=s3Config(env),url=objectUrl(config,key);url.searchParams.set("X-Amz-Expires",String(expires));
 const signed=await config.client.sign(new Request(url,{method:"GET"}),{aws:{signQuery:true}});
 return signed.url.toString();
}

export async function putIncomingObject(env,{key,body,mimeType}){
 const bucket=nativeBucket(env);
 if(!bucket)throw new ApiError(503,"r2_binding_not_configured","Native R2-Binding ist nicht konfiguriert.");
 if(!body)throw new ApiError(400,"empty_file","Die Datei enthält keine übertragbaren Daten.");
 const result=await bucket.put(key,body,{httpMetadata:{contentType:normalizeMime(mimeType)},customMetadata:{purpose:"customer-document-incoming"}});
 if(!result)throw new ApiError(502,"r2_put_failed","Die Datei konnte nicht in R2 gespeichert werden.");
 return{size:Number(result.size||0),mimeType:normalizeMime(result.httpMetadata?.contentType||mimeType),etag:normalizeEtag(result.etag)};
}

export async function headObject(env,key){
 const bucket=nativeBucket(env);
 if(bucket){
  const object=await bucket.head(key);
  if(!object)return null;
  return{size:Number(object.size||0),mimeType:normalizeMime(object.httpMetadata?.contentType),etag:normalizeEtag(object.etag)};
 }
 const config=s3Config(env),response=await config.client.fetch(objectUrl(config,key).toString(),{method:"HEAD"});
 if(response.status===404)return null;
 if(!response.ok)throw new ApiError(502,"r2_head_failed","Die hochgeladene Datei konnte im Dokumentenspeicher nicht geprüft werden.");
 return{size:Number(response.headers.get("content-length")||0),mimeType:normalizeMime(response.headers.get("content-type")),etag:normalizeEtag(response.headers.get("etag"))};
}

export async function copyIncomingToFinal(env,{incomingKey,finalKey,mimeType,fileName,sourceEtag}){
 if(!sourceEtag)throw new ApiError(502,"r2_etag_missing","Upload-Integrität konnte nicht geprüft werden.");
 const bucket=nativeBucket(env);
 if(bucket){
  const source=await bucket.get(incomingKey,{onlyIf:{etagMatches:normalizeEtag(sourceEtag)}});
  if(!source)throw new ApiError(404,"r2_source_missing","Die temporäre Upload-Datei ist nicht mehr vorhanden.");
  if(!("body"in source))throw new ApiError(409,"upload_changed_during_finalize","Die Upload-Datei wurde während der Prüfung verändert. Bitte erneut hochladen.");
  const result=await bucket.put(finalKey,source.body,{
   httpMetadata:{contentType:normalizeMime(mimeType),contentDisposition:"attachment; filename*=UTF-8''"+encodeURIComponent(sanitizeDocumentName(fileName))},
   customMetadata:{sourceEtag:normalizeEtag(sourceEtag),purpose:"customer-document"}
  });
  if(!result)throw new ApiError(502,"r2_copy_failed","Die Datei konnte nicht sicher in den Dokumentbereich übernommen werden.");
  return result;
 }
 const config=s3Config(env),source="/"+encodeURIComponent(config.bucket)+"/"+encodePath(incomingKey);
 const headers={
  "x-amz-copy-source":source,
  "x-amz-copy-source-if-match":"\""+normalizeEtag(sourceEtag)+"\"",
  "x-amz-metadata-directive":"REPLACE",
  "content-type":normalizeMime(mimeType),
  "content-disposition":"attachment; filename*=UTF-8''"+encodeURIComponent(sanitizeDocumentName(fileName))
 };
 const response=await config.client.fetch(objectUrl(config,finalKey).toString(),{method:"PUT",headers});
 if(response.status===412)throw new ApiError(409,"upload_changed_during_finalize","Die Upload-Datei wurde während der Prüfung verändert. Bitte erneut hochladen.");
 if(!response.ok)throw new ApiError(502,"r2_copy_failed","Die Datei konnte nicht sicher in den Dokumentbereich übernommen werden.");
 return response;
}

export async function deleteObject(env,key){
 const bucket=nativeBucket(env);
 if(bucket){await bucket.delete(key);return;}
 const config=s3Config(env),response=await config.client.fetch(objectUrl(config,key).toString(),{method:"DELETE"});
 if(!response.ok&&response.status!==404)throw new ApiError(502,"r2_delete_failed","Temporäre Upload-Datei konnte nicht bereinigt werden.");
}

export async function getNativeObject(env,key){
 const bucket=nativeBucket(env);
 if(!bucket)throw new ApiError(503,"r2_binding_not_configured","Native R2-Binding ist nicht konfiguriert.");
 const object=await bucket.get(key);
 if(!object)return null;
 if(!("body"in object))return null;
 return object;
}

export function normalizedMime(value){return normalizeMime(value);}
