import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin}from"../../_lib/auth.js";
import{requireAdmin}from"../../_lib/admin.js";
import{CUSTOMER_CONTENT_KEYS,ensureCustomerAccessSchema,listCustomerContentAccess,setCustomerContentAccess}from"../../_lib/customer-access.js";

const LABELS=Object.freeze({
 angebot:"Angebot / SOW",
 abnahme:"Abnahmeprotokoll",
 project_portal:"Project Portal",
 wartung_hosting:"Wartung/Hosting-Setup",
 content_pflege:"Content-Pflege"
});

const customerRows=async db=>{
 const rows=await db.prepare(
  "SELECT ca.organization_id,ca.customer_number,ca.account_status,o.name AS organization_name,o.billing_email "+
  "FROM customer_accounts ca JOIN organizations o ON o.id=ca.organization_id "+
  "WHERE ca.account_status IN('active','inactive','blocked') ORDER BY ca.customer_number"
 ).all();
 return rows.results||[];
};

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await requireAdmin(db,request);
  await ensureCustomerAccessSchema(db);
  const customers=await customerRows(db);
  const grantRows=await db.prepare(
   "SELECT organization_id,content_key,project_id,status,granted_at,expires_at,revoked_at "+
   "FROM customer_access_grants ORDER BY organization_id,content_key,project_id"
  ).all();
  const now=new Date().toISOString();
  const grants=(grantRows.results||[]).map(row=>({...row,effective:row.status==="active"&&(!row.expires_at||row.expires_at>now)}));
  return json({
   ok:true,
   contentKeys:CUSTOMER_CONTENT_KEYS.map(key=>({key,label:LABELS[key]||key})),
   customers,
   grants,
   requestId:traceId
  });
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPatch=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env),admin=await requireAdmin(db,request);
  const body=await readJson(request,8192),
   organizationId=cleanText(body.organizationId,80),
   contentKey=cleanText(body.contentKey,80),
   projectId=cleanText(body.projectId,80)||"*",
   enabled=body.enabled===true,
   rawExpires=cleanText(body.expiresAt,64);
  if(!organizationId||!contentKey)throw new ApiError(422,"validation_failed","Kunde und Freigabebereich sind erforderlich.");
  let expiresAt=null;
  if(rawExpires){
   const parsed=Date.parse(rawExpires);
   if(!Number.isFinite(parsed))throw new ApiError(422,"invalid_expiry","Ungültiges Ablaufdatum.");
   expiresAt=new Date(parsed).toISOString();
   if(expiresAt<=new Date().toISOString())throw new ApiError(422,"invalid_expiry","Das Ablaufdatum muss in der Zukunft liegen.");
  }
  const grant=await setCustomerContentAccess(db,{
   organizationId,contentKey,projectId,enabled,actorUserId:admin.user_id,expiresAt
  });
  return json({
   ok:true,
   grant,
   access:await listCustomerContentAccess(db,organizationId),
   requestId:traceId
  });
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, PATCH"});
