import{ApiError,assertDatabase}from"./api.js";
import{ensureAuthSchema,requireSession}from"./auth.js";
import{ensureCommercialSchema}from"./commercial.js";

export const CUSTOMER_CONTENT_KEYS=Object.freeze([
 "angebot",
 "abnahme",
 "project_portal",
 "wartung_hosting",
 "content_pflege"
]);
const CONTENT_KEY_SET=new Set(CUSTOMER_CONTENT_KEYS);
const EXTERNAL_ROLES=new Set(["customer","student"]);

export const normalizeCustomerContentKey=value=>{
 const key=String(value||"").trim().toLowerCase();
 if(!CONTENT_KEY_SET.has(key))throw new ApiError(422,"invalid_content_key","Unbekannter Freigabebereich.");
 return key;
};

export async function ensureCustomerAccessSchema(db){
 await ensureCommercialSchema(db);
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS customer_access_grants(organization_id TEXT NOT NULL,content_key TEXT NOT NULL,project_id TEXT NOT NULL DEFAULT '*',status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','revoked')),granted_by TEXT NOT NULL,granted_at TEXT NOT NULL,expires_at TEXT,revoked_at TEXT,PRIMARY KEY(organization_id,content_key,project_id),FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,FOREIGN KEY(granted_by) REFERENCES users(id) ON DELETE RESTRICT)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_customer_access_lookup ON customer_access_grants(organization_id,content_key,project_id,status,expires_at)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_customer_access_project ON customer_access_grants(project_id,status)")
 ]);
}

export async function customerContextForSession(db,user){
 if(user.role==="admin")return{isAdmin:true,userId:user.user_id,organizationId:null,customerNumber:null};
 if(!EXTERNAL_ROLES.has(user.role))throw new ApiError(403,"customer_role_required","Dieser Bereich ist für Kundenkonten vorgesehen.");
 await ensureCustomerAccessSchema(db);
 const row=await db.prepare(
  "SELECT u.organization_id,ca.customer_number,ca.account_status FROM users u JOIN customer_accounts ca ON ca.organization_id=u.organization_id WHERE u.id=? AND u.status='active' LIMIT 1"
 ).bind(user.user_id).first();
 if(!row?.organization_id||row.account_status!=="active")throw new ApiError(403,"customer_account_inactive","Das Kundenkonto ist nicht für geschützte Inhalte freigeschaltet.");
 return{isAdmin:false,userId:user.user_id,organizationId:row.organization_id,customerNumber:row.customer_number};
}

export async function hasCustomerContentAccess(db,{organizationId,contentKey,projectId="*",now=new Date().toISOString()}){
 const key=normalizeCustomerContentKey(contentKey),scope=String(projectId||"*");
 await ensureCustomerAccessSchema(db);
 const row=await db.prepare(
  "SELECT 1 AS ok FROM customer_access_grants WHERE organization_id=? AND content_key=? AND status='active' AND (project_id='*' OR project_id=?) AND (expires_at IS NULL OR expires_at>?) LIMIT 1"
 ).bind(organizationId,key,scope,now).first();
 return Boolean(row?.ok);
}

export async function listCustomerContentAccess(db,organizationId,now=new Date().toISOString()){
 await ensureCustomerAccessSchema(db);
 const rows=await db.prepare(
  "SELECT content_key,project_id,status,granted_at,expires_at,revoked_at FROM customer_access_grants WHERE organization_id=? ORDER BY content_key,project_id"
 ).bind(organizationId).all();
 return(rows.results||[]).map(row=>({...row,effective:row.status==="active"&&(!row.expires_at||row.expires_at>now)}));
}

export async function setCustomerContentAccess(db,{organizationId,contentKey,projectId="*",enabled,actorUserId,expiresAt=null,now=new Date().toISOString()}){
 const key=normalizeCustomerContentKey(contentKey),scope=String(projectId||"*").trim()||"*";
 await ensureCustomerAccessSchema(db);
 const customer=await db.prepare("SELECT organization_id FROM customer_accounts WHERE organization_id=? AND account_status='active' LIMIT 1").bind(organizationId).first();
 if(!customer)throw new ApiError(404,"customer_not_found","Aktives Kundenkonto nicht gefunden.");
 if(scope!=="*"){
  const project=await db.prepare("SELECT id FROM projects WHERE id=? AND organization_id=? LIMIT 1").bind(scope,organizationId).first();
  if(!project)throw new ApiError(404,"project_not_found","Projekt gehört nicht zu diesem Kundenkonto.");
 }
 const status=enabled?"active":"revoked",revokedAt=enabled?null:now;
 await db.prepare(
  "INSERT INTO customer_access_grants(organization_id,content_key,project_id,status,granted_by,granted_at,expires_at,revoked_at) VALUES(?,?,?,?,?,?,?,?) "+
  "ON CONFLICT(organization_id,content_key,project_id) DO UPDATE SET status=excluded.status,granted_by=excluded.granted_by,granted_at=excluded.granted_at,expires_at=excluded.expires_at,revoked_at=excluded.revoked_at"
 ).bind(organizationId,key,scope,status,actorUserId,now,expiresAt||null,revokedAt).run();
 await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
  .bind(crypto.randomUUID(),actorUserId,organizationId,enabled?"customer.access.granted":"customer.access.revoked","customer_access",key+":"+scope,JSON.stringify({contentKey:key,projectId:scope,expiresAt:expiresAt||null}),now).run();
 return{organizationId,contentKey:key,projectId:scope,enabled:Boolean(enabled),expiresAt:expiresAt||null};
}

export async function requireCustomerContentAccess(request,env,contentKey,{projectId="*"}={}){
 const db=assertDatabase(env);
 await ensureAuthSchema(db);
 const user=await requireSession(db,request);
 const customer=await customerContextForSession(db,user);
 if(customer.isAdmin)return{ok:true,user,customer,contentKey:normalizeCustomerContentKey(contentKey)};
 const allowed=await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey,projectId});
 if(!allowed){
  return{ok:false,response:new Response("Dieser Inhalt ist für Ihr Kundenkonto nicht freigeschaltet.",{status:403,headers:{"cache-control":"private, no-store","content-type":"text/plain; charset=utf-8","x-robots-tag":"noindex, nofollow"}})};
 }
 return{ok:true,user,customer,contentKey:normalizeCustomerContentKey(contentKey)};
}

export const requireCustomerDocumentAccess=(request,env,contentKey)=>requireCustomerContentAccess(request,env,contentKey);

export function privatePageResponse(response){
 const headers=new Headers(response.headers);
 headers.set("cache-control","private, no-store, max-age=0");
 headers.set("pragma","no-cache");
 headers.set("x-robots-tag","noindex, nofollow, noarchive");
 headers.set("referrer-policy","no-referrer");
 headers.set("vary","Cookie");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export function customerLoginRedirect(request,continuePath,reason="customer_login_required"){
 const target=new URL("/academy/konto/",request.url);
 target.searchParams.set("continue",continuePath);
 target.searchParams.set("reason",reason);
 return Response.redirect(target,302);
}
