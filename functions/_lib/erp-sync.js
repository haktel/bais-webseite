import{ApiError}from"./api.js";

export const ERP_DEFAULT_BASE_URL="https://erp.bais-solutions.de";
export const ERP_PROSPECT_JOB="thirdparty.prospect.upsert";

const CONFIG_ID="default",MAX_ERROR=700;
const encoder=new TextEncoder(),decoder=new TextDecoder();

const b64url=bytes=>{let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");};
const fromB64url=value=>{const s=String(value||"").replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-String(value||"").length%4)%4),bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0));};
const cleanError=value=>String(value||"ERP sync failed").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().slice(0,MAX_ERROR);
const normalizeBaseUrl=value=>String(value||ERP_DEFAULT_BASE_URL).trim().replace(/\/+$/,"");
const normalizeCredential=(value,headerName="")=>{let v=String(value||"").trim();if(!v)return"";v=v.replace(/^[\"\']|[\"\']$/g,"").trim();if(headerName){const prefix=String(headerName).toLowerCase()+":";if(v.toLowerCase().startsWith(prefix))v=v.slice(prefix.length).trim();}return v;};
const retryAt=(attempts,now)=>new Date(Date.parse(now)+Math.min(60,2**Math.min(6,Math.max(0,attempts)))*60_000).toISOString();

const rootSecrets=env=>{
 const candidates=[env?.ERP_ENCRYPTION_KEY,env?.MFA_ENCRYPTION_KEY,env?.TURNSTILE_SECRET].map(x=>String(x||"")).filter(x=>x.length>=32);
 if(!candidates.length)throw new ApiError(503,"erp_encryption_key_missing","ERP-Zugangsdaten können noch nicht sicher gespeichert werden.");
 return[...new Set(candidates)];
};
async function deriveKey(secret){
 const digest=await crypto.subtle.digest("SHA-256",encoder.encode("BAIS-ERP-AES-GCM-v1\u0000"+secret));
 return crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
async function encryptSecret(value,env){
 const iv=new Uint8Array(12);crypto.getRandomValues(iv);
 const key=await deriveKey(rootSecrets(env)[0]);
 const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(String(value)));
 return{ciphertext:b64url(new Uint8Array(ciphertext)),iv:b64url(iv)};
}
async function decryptSecret(ciphertext,iv,env){
 if(!ciphertext||!iv)return"";
 const data=fromB64url(ciphertext),nonce=fromB64url(iv);
 for(const root of rootSecrets(env)){
  try{return decoder.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:nonce},await deriveKey(root),data));}catch{}
 }
 throw new ApiError(503,"erp_secret_unavailable","ERP-Zugangsdaten konnten nicht entschlüsselt werden.");
}

export async function ensureErpSyncSchema(db){
 const now=new Date().toISOString();
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS erp_integration_config(id TEXT PRIMARY KEY CHECK(id='default'),base_url TEXT NOT NULL DEFAULT 'https://erp.bais-solutions.de',api_key_ciphertext TEXT,api_key_iv TEXT,cf_access_client_id_ciphertext TEXT,cf_access_client_id_iv TEXT,cf_access_client_secret_ciphertext TEXT,cf_access_client_secret_iv TEXT,enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN(0,1)),created_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS erp_links(organization_id TEXT PRIMARY KEY,bais_customer_number TEXT NOT NULL,dolibarr_thirdparty_id INTEGER,erp_role TEXT NOT NULL DEFAULT 'prospect' CHECK(erp_role IN('prospect','customer')),sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN('pending','synced','failed')),remote_ref TEXT,last_sync_at TEXT,last_error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE)"),
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_erp_links_customer_number ON erp_links(bais_customer_number)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_erp_links_status ON erp_links(sync_status,updated_at)"),
  db.prepare("CREATE TABLE IF NOT EXISTS erp_sync_jobs(id TEXT PRIMARY KEY,organization_id TEXT NOT NULL,job_type TEXT NOT NULL,object_key TEXT NOT NULL DEFAULT '*',status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','done','failed')),attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at TEXT NOT NULL,last_error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(organization_id,job_type,object_key),FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_erp_sync_jobs_due ON erp_sync_jobs(status,next_attempt_at,created_at)"),
  db.prepare("INSERT OR IGNORE INTO erp_integration_config(id,base_url,enabled,created_at,updated_at) VALUES('default',?,1,?,?)").bind(ERP_DEFAULT_BASE_URL,now,now)
 ]);
}

async function configRow(db){
 await ensureErpSyncSchema(db);
 return await db.prepare("SELECT * FROM erp_integration_config WHERE id='default' LIMIT 1").first();
}
export async function getErpIntegrationConfig(db,env,{includeSecrets=false}={}){
 const row=await configRow(db);
 const baseUrl=normalizeBaseUrl(env?.ERP_BASE_URL||row?.base_url||ERP_DEFAULT_BASE_URL);
 const apiKey=normalizeCredential(String(env?.ERP_DOLAPIKEY||"")||await decryptSecret(row?.api_key_ciphertext,row?.api_key_iv,env),"DOLAPIKEY");
 const accessClientId=normalizeCredential(String(env?.ERP_CF_ACCESS_CLIENT_ID||"")||await decryptSecret(row?.cf_access_client_id_ciphertext,row?.cf_access_client_id_iv,env),"CF-Access-Client-Id");
 const accessClientSecret=normalizeCredential(String(env?.ERP_CF_ACCESS_CLIENT_SECRET||"")||await decryptSecret(row?.cf_access_client_secret_ciphertext,row?.cf_access_client_secret_iv,env),"CF-Access-Client-Secret");
 const enabled=Boolean(Number(row?.enabled??1));
 const status={enabled,baseUrl,apiKeyConfigured:Boolean(apiKey),accessConfigured:Boolean(accessClientId&&accessClientSecret),configured:Boolean(enabled&&apiKey)};
 return includeSecrets?{...status,apiKey,accessClientId,accessClientSecret}:status;
}

export async function saveErpIntegrationConfig(db,env,{baseUrl,apiKey,accessClientId,accessClientSecret,enabled=true}){
 await ensureErpSyncSchema(db);
 const current=await configRow(db),now=new Date().toISOString(),updates={
  baseUrl:normalizeBaseUrl(baseUrl||current?.base_url||ERP_DEFAULT_BASE_URL),
  enabled:enabled?1:0,
  apiKeyCiphertext:current?.api_key_ciphertext||null,apiKeyIv:current?.api_key_iv||null,
  clientIdCiphertext:current?.cf_access_client_id_ciphertext||null,clientIdIv:current?.cf_access_client_id_iv||null,
  clientSecretCiphertext:current?.cf_access_client_secret_ciphertext||null,clientSecretIv:current?.cf_access_client_secret_iv||null
 };
 if(String(apiKey||"").trim()){const x=await encryptSecret(normalizeCredential(apiKey,"DOLAPIKEY"),env);updates.apiKeyCiphertext=x.ciphertext;updates.apiKeyIv=x.iv;}
 if(String(accessClientId||"").trim()){const x=await encryptSecret(normalizeCredential(accessClientId,"CF-Access-Client-Id"),env);updates.clientIdCiphertext=x.ciphertext;updates.clientIdIv=x.iv;}
 if(String(accessClientSecret||"").trim()){const x=await encryptSecret(normalizeCredential(accessClientSecret,"CF-Access-Client-Secret"),env);updates.clientSecretCiphertext=x.ciphertext;updates.clientSecretIv=x.iv;}
 await db.prepare("UPDATE erp_integration_config SET base_url=?,api_key_ciphertext=?,api_key_iv=?,cf_access_client_id_ciphertext=?,cf_access_client_id_iv=?,cf_access_client_secret_ciphertext=?,cf_access_client_secret_iv=?,enabled=?,updated_at=? WHERE id='default'")
  .bind(updates.baseUrl,updates.apiKeyCiphertext,updates.apiKeyIv,updates.clientIdCiphertext,updates.clientIdIv,updates.clientSecretCiphertext,updates.clientSecretIv,updates.enabled,now).run();
 return getErpIntegrationConfig(db,env);
}

export async function enqueueErpProspectSync(db,{organizationId,now=new Date().toISOString()}){
 await ensureErpSyncSchema(db);
 const customer=await db.prepare("SELECT ca.customer_number FROM customer_accounts ca JOIN organizations o ON o.id=ca.organization_id WHERE ca.organization_id=? AND ca.account_status='active' LIMIT 1").bind(organizationId).first();
 if(!customer)throw new ApiError(404,"erp_customer_not_found","Aktives Kundenkonto für ERP-Synchronisierung nicht gefunden.");
 await db.batch([
  db.prepare("INSERT INTO erp_links(organization_id,bais_customer_number,erp_role,sync_status,created_at,updated_at) VALUES(?,?,'prospect','pending',?,?) ON CONFLICT(organization_id) DO UPDATE SET bais_customer_number=excluded.bais_customer_number,updated_at=excluded.updated_at").bind(organizationId,customer.customer_number,now,now),
  db.prepare("INSERT INTO erp_sync_jobs(id,organization_id,job_type,object_key,status,attempts,next_attempt_at,last_error,created_at,updated_at) VALUES(?,?,?,'*','pending',0,?,NULL,?,?) ON CONFLICT(organization_id,job_type,object_key) DO UPDATE SET status=CASE WHEN erp_sync_jobs.status='done' THEN erp_sync_jobs.status ELSE 'pending' END,next_attempt_at=excluded.next_attempt_at,last_error=NULL,updated_at=excluded.updated_at").bind(crypto.randomUUID(),organizationId,ERP_PROSPECT_JOB,now,now,now)
 ]);
 return{organizationId,customerNumber:customer.customer_number};
}

export async function queueUnsyncedCustomerProspects(db,{limit=100,now=new Date().toISOString()}={}){
 await ensureErpSyncSchema(db);
 const rows=await db.prepare("SELECT ca.organization_id FROM customer_accounts ca LEFT JOIN erp_links l ON l.organization_id=ca.organization_id WHERE ca.account_status='active' AND (l.organization_id IS NULL OR l.sync_status!='synced') ORDER BY ca.created_at ASC LIMIT ?").bind(Math.max(1,Math.min(500,Number(limit)||100))).all();
 let queued=0;
 for(const row of rows.results||[]){await enqueueErpProspectSync(db,{organizationId:row.organization_id,now});queued++;}
 return queued;
}

async function dolibarrRequest(config,path,{method="GET",body}={}){
 const url=config.baseUrl+"/api/index.php/"+String(path||"").replace(/^\/+/, "");
 const headers={Accept:"application/json",DOLAPIKEY:config.apiKey,"User-Agent":"BAIS-Website-ERP-Sync/1.0"};
 if(config.accessClientId&&config.accessClientSecret){
  headers["CF-Access-Client-Id"]=config.accessClientId;
  headers["CF-Access-Client-Secret"]=config.accessClientSecret;
 }
 if(body!==undefined)headers["Content-Type"]="application/json";
 const response=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:"follow"});
 const text=await response.text(),contentType=response.headers.get("content-type")||"";
 let data=null;
 if(text){try{data=JSON.parse(text);}catch{}}
 if(!response.ok){const error=new Error("Dolibarr HTTP "+response.status+": "+cleanError(data?.error?.message||data?.error||text||response.statusText));error.status=response.status;throw error;}
 if(!contentType.includes("json")&&data===null){const finalUrl=response.url||url;const accessHint=/cloudflareaccess\.com|\/cdn-cgi\/access/i.test(finalUrl+" "+text)?" Cloudflare Access login page detected.":"";throw new Error("Dolibarr API returned non-JSON content (HTTP "+response.status+", final URL: "+finalUrl+")."+accessHint);}
 return data;
}

const filterByRefExt=ref=>"thirdparties?sortfield=t.rowid&sortorder=ASC&limit=2&sqlfilters="+encodeURIComponent("(t.ref_ext:=:'"+String(ref).replace(/'/g,"")+"')");
async function findRemoteByCustomerNumber(config,customerNumber){
 try{
  const data=await dolibarrRequest(config,filterByRefExt(customerNumber));
  const rows=Array.isArray(data)?data:(Array.isArray(data?.data)?data.data:[]);
  return rows.find(row=>String(row?.ref_ext||"")===customerNumber)||null;
 }catch(error){
  // Dolibarr answers 404 when an authenticated filtered list has no matching third party.
  // For an idempotent upsert this means "not found", not "sync failed".
  if(Number(error?.status)===404)return null;
  throw error;
 }
}
const remoteId=data=>{
 const id=Number(typeof data==="number"?data:(data?.id??data?.rowid));
 return Number.isInteger(id)&&id>0?id:null;
};

async function syncProspect(db,config,job,now){
 const row=await db.prepare("SELECT o.name,o.billing_email,ca.customer_number,l.dolibarr_thirdparty_id FROM organizations o JOIN customer_accounts ca ON ca.organization_id=o.id LEFT JOIN erp_links l ON l.organization_id=o.id WHERE o.id=? AND ca.account_status='active' LIMIT 1").bind(job.organization_id).first();
 if(!row)throw new Error("BAIS customer no longer exists or is inactive.");

 let id=Number(row.dolibarr_thirdparty_id)||null;
 if(!id){
  const existing=await findRemoteByCustomerNumber(config,row.customer_number);
  id=remoteId(existing);
 }
 if(!id){
  const created=await dolibarrRequest(config,"thirdparties",{method:"POST",body:{
   name:String(row.name||"BAIS Prospect").slice(0,160),
   email:row.billing_email||null,
   client:2,
   code_client:"-1",
   ref_ext:row.customer_number,
   note_private:"BAIS Kunden-Nr.: "+row.customer_number+" | Quelle: bais-solutions.de Selbstregistrierung"
  }});
  id=remoteId(created);
 }
 if(!id)throw new Error("Dolibarr did not return a valid thirdparty id.");

 await db.batch([
  db.prepare("INSERT INTO erp_links(organization_id,bais_customer_number,dolibarr_thirdparty_id,erp_role,sync_status,remote_ref,last_sync_at,last_error,created_at,updated_at) VALUES(?,?,?,'prospect','synced',?,?,NULL,?,?) ON CONFLICT(organization_id) DO UPDATE SET bais_customer_number=excluded.bais_customer_number,dolibarr_thirdparty_id=excluded.dolibarr_thirdparty_id,erp_role='prospect',sync_status='synced',remote_ref=excluded.remote_ref,last_sync_at=excluded.last_sync_at,last_error=NULL,updated_at=excluded.updated_at").bind(job.organization_id,row.customer_number,id,row.customer_number,now,now,now,now),
  db.prepare("UPDATE erp_sync_jobs SET status='done',last_error=NULL,updated_at=? WHERE id=?").bind(now,job.id)
 ]);
 return{id,customerNumber:row.customer_number};
}

export async function syncPendingErpJobs(db,env,{limit=10,now=new Date().toISOString()}={}){
 await ensureErpSyncSchema(db);
 const config=await getErpIntegrationConfig(db,env,{includeSecrets:true});
 if(!config.configured)return{configured:false,processed:0,synced:0,failed:0};
 const jobs=await db.prepare("SELECT id,organization_id,job_type,attempts FROM erp_sync_jobs WHERE status IN('pending','failed') AND next_attempt_at<=? ORDER BY created_at ASC LIMIT ?").bind(now,Math.max(1,Math.min(50,Number(limit)||10))).all();
 let synced=0,failed=0;
 for(const job of jobs.results||[]){
  const started=new Date().toISOString();
  await db.prepare("UPDATE erp_sync_jobs SET status='processing',updated_at=? WHERE id=?").bind(started,job.id).run();
  try{
   if(job.job_type!==ERP_PROSPECT_JOB)throw new Error("Unsupported ERP job type: "+job.job_type);
   await syncProspect(db,config,job,new Date().toISOString());synced++;
  }catch(error){
   failed++;
   const attempts=Number(job.attempts||0)+1,err=cleanError(error instanceof Error?error.message:error);
   await db.batch([
    db.prepare("UPDATE erp_sync_jobs SET status='failed',attempts=?,next_attempt_at=?,last_error=?,updated_at=? WHERE id=?").bind(attempts,retryAt(attempts,now),err,new Date().toISOString(),job.id),
    db.prepare("UPDATE erp_links SET sync_status='failed',last_error=?,updated_at=? WHERE organization_id=?").bind(err,new Date().toISOString(),job.organization_id)
   ]);
  }
 }
 return{configured:true,processed:(jobs.results||[]).length,synced,failed};
}

export async function getErpSyncOverview(db,env){
 await ensureErpSyncSchema(db);
 const integration=await getErpIntegrationConfig(db,env);
 const jobs=await db.prepare("SELECT j.id,j.organization_id,j.job_type,j.status,j.attempts,j.next_attempt_at,j.last_error,j.updated_at,ca.customer_number,o.name AS organization_name FROM erp_sync_jobs j JOIN customer_accounts ca ON ca.organization_id=j.organization_id JOIN organizations o ON o.id=j.organization_id ORDER BY j.updated_at DESC LIMIT 100").all();
 const links=await db.prepare("SELECT l.organization_id,l.bais_customer_number,l.dolibarr_thirdparty_id,l.erp_role,l.sync_status,l.last_sync_at,l.last_error,l.updated_at,o.name AS organization_name FROM erp_links l JOIN organizations o ON o.id=l.organization_id ORDER BY l.updated_at DESC LIMIT 100").all();
 return{integration,jobs:jobs.results||[],links:links.results||[]};
}
