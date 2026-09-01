import{ApiError}from"./api.js";

export const PROJECT_MODULES=Object.freeze({
 "MOD-01":"Website-Entwicklung",
 "MOD-02":"Project Portal",
 "MOD-03":"Wartung/Hosting-Setup",
 "MOD-04":"Content-Pflege"
});
export const PROJECT_MODULE_CODES=Object.freeze(Object.keys(PROJECT_MODULES));

export async function ensureProjectSowSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS project_sow(project_id TEXT PRIMARY KEY,organization_id TEXT NOT NULL,offer_number TEXT,sow_status TEXT NOT NULL DEFAULT 'draft' CHECK(sow_status IN('draft','approved','signed')),project_start TEXT,valid_until TEXT,scope_json TEXT NOT NULL DEFAULT '[]',created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,signed_at TEXT,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_project_sow_org_status ON project_sow(organization_id,sow_status,updated_at DESC)"),
  db.prepare("CREATE TABLE IF NOT EXISTS project_modules(project_id TEXT NOT NULL,module_code TEXT NOT NULL,module_name TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'sow' CHECK(source='sow'),selected_by TEXT NOT NULL,selected_at TEXT NOT NULL,PRIMARY KEY(project_id,module_code),FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(selected_by) REFERENCES users(id) ON DELETE RESTRICT)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_project_modules_code ON project_modules(module_code,project_id)"),
  db.prepare("CREATE TABLE IF NOT EXISTS project_integration_links(project_id TEXT PRIMARY KEY,dolibarr_project_id INTEGER,dolibarr_project_ref TEXT,dolibarr_sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(dolibarr_sync_status IN('pending','synced','failed')),jira_parent_id TEXT,jira_parent_key TEXT,jira_sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(jira_sync_status IN('pending','synced','failed')),last_sync_at TEXT,last_error TEXT,updated_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS project_module_integration_links(project_id TEXT NOT NULL,module_code TEXT NOT NULL,jira_issue_id TEXT,jira_issue_key TEXT,updated_at TEXT NOT NULL,PRIMARY KEY(project_id,module_code),FOREIGN KEY(project_id,module_code) REFERENCES project_modules(project_id,module_code) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS project_sync_jobs(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,target TEXT NOT NULL CHECK(target IN('dolibarr','jira')),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','done','failed')),attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at TEXT NOT NULL,last_error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(project_id,target),FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_project_sync_jobs_due ON project_sync_jobs(target,status,next_attempt_at,created_at)")
 ]);
}

export function normalizeProjectModules(value){
 if(!Array.isArray(value))throw new ApiError(422,"modules_required","Mindestens ein BAIS Vertragsmodul ist erforderlich.");
 const unique=[...new Set(value.map(v=>String(v||"").trim().toUpperCase()).filter(Boolean))];
 if(!unique.length)throw new ApiError(422,"modules_required","Mindestens ein BAIS Vertragsmodul ist erforderlich.");
 for(const code of unique)if(!PROJECT_MODULES[code])throw new ApiError(422,"invalid_module","Unbekanntes BAIS Vertragsmodul: "+code);
 return unique.sort();
}
export function normalizeSowStatus(value){
 const status=String(value||"draft").trim().toLowerCase();
 if(!["draft","approved","signed"].includes(status))throw new ApiError(422,"invalid_sow_status","Ungültiger SOW-Status.");
 return status;
}
export function normalizeScopeSelections(value){
 if(!Array.isArray(value))return[];
 const cleaned=value.map(x=>String(x||"").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().slice(0,160)).filter(Boolean);
 return[...new Set(cleaned)].slice(0,120);
}
const sameArray=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);

export async function saveProjectSow(db,{projectId,organizationId,offerNumber,sowStatus,projectStart,validUntil,modules,scopeSelections,actorUserId,now=new Date().toISOString()}){
 await ensureProjectSowSchema(db);
 const project=await db.prepare("SELECT p.id,p.organization_id,p.name,pr.project_number FROM projects p JOIN project_registry pr ON pr.project_id=p.id WHERE p.id=? AND p.organization_id=? LIMIT 1")
  .bind(projectId,organizationId).first();
 if(!project)throw new ApiError(404,"project_not_found","Projekt gehört nicht zum ausgewählten Kunden.");
 const normalizedModules=normalizeProjectModules(modules),status=normalizeSowStatus(sowStatus),scope=normalizeScopeSelections(scopeSelections),
  offer=String(offerNumber||"").trim().slice(0,80)||null,start=String(projectStart||"").trim().slice(0,10)||null,valid=String(validUntil||"").trim().slice(0,10)||null;

 const existing=await db.prepare("SELECT offer_number,sow_status,project_start,valid_until,scope_json,signed_at FROM project_sow WHERE project_id=? LIMIT 1").bind(projectId).first();
 const existingModules=existing?(await db.prepare("SELECT module_code FROM project_modules WHERE project_id=? ORDER BY module_code").bind(projectId).all()).results.map(x=>x.module_code):[];
 if(existing?.sow_status==="signed"){
  const existingScope=JSON.parse(existing.scope_json||"[]");
  const idempotent=existing.offer_number===offer&&existing.project_start===start&&existing.valid_until===valid&&sameArray(existingModules,normalizedModules)&&JSON.stringify(existingScope)===JSON.stringify(scope)&&status==="signed";
  if(!idempotent)throw new ApiError(409,"signed_sow_immutable","Ein unterschriebener SOW ist unveränderlich. Änderungen müssen als Change Request erfasst werden.");
  return{project,modules:normalizedModules.map(code=>({code,name:PROJECT_MODULES[code]})),sowStatus:"signed",idempotent:true};
 }

 const signedAt=status==="signed"?(existing?.signed_at||now):null,createdAt=existing?null:now;
 const statements=[];
 if(existing){
  statements.push(db.prepare("UPDATE project_sow SET offer_number=?,sow_status=?,project_start=?,valid_until=?,scope_json=?,updated_at=?,signed_at=? WHERE project_id=? AND organization_id=?")
   .bind(offer,status,start,valid,JSON.stringify(scope),now,signedAt,projectId,organizationId));
  statements.push(db.prepare("DELETE FROM project_modules WHERE project_id=?").bind(projectId));
 }else{
  statements.push(db.prepare("INSERT INTO project_sow(project_id,organization_id,offer_number,sow_status,project_start,valid_until,scope_json,created_by,created_at,updated_at,signed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
   .bind(projectId,organizationId,offer,status,start,valid,JSON.stringify(scope),actorUserId,createdAt,now,signedAt));
 }
 for(const code of normalizedModules)statements.push(db.prepare("INSERT INTO project_modules(project_id,module_code,module_name,source,selected_by,selected_at) VALUES(?,?,?,'sow',?,?)")
  .bind(projectId,code,PROJECT_MODULES[code],actorUserId,now));
 statements.push(db.prepare("INSERT INTO project_integration_links(project_id,dolibarr_sync_status,jira_sync_status,updated_at) VALUES(?,'pending','pending',?) ON CONFLICT(project_id) DO UPDATE SET dolibarr_sync_status='pending',jira_sync_status='pending',last_error=NULL,updated_at=excluded.updated_at").bind(projectId,now));
 statements.push(db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
  .bind(crypto.randomUUID(),actorUserId,organizationId,"project.sow.saved","project",projectId,JSON.stringify({projectNumber:project.project_number,offerNumber:offer,sowStatus:status,modules:normalizedModules}),now));
 await db.batch(statements);
 return{project,modules:normalizedModules.map(code=>({code,name:PROJECT_MODULES[code]})),sowStatus:status,idempotent:false};
}

export async function getProjectSow(db,projectId){
 await ensureProjectSowSchema(db);
 const sow=await db.prepare("SELECT project_id,organization_id,offer_number,sow_status,project_start,valid_until,scope_json,created_at,updated_at,signed_at FROM project_sow WHERE project_id=? LIMIT 1").bind(projectId).first();
 if(!sow)return null;
 const modules=await db.prepare("SELECT module_code,module_name,selected_at FROM project_modules WHERE project_id=? ORDER BY module_code").bind(projectId).all();
 return{...sow,scopeSelections:JSON.parse(sow.scope_json||"[]"),modules:modules.results||[]};
}
