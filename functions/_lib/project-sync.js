import{ApiError}from"./api.js";
import{dolibarrRequest,getErpIntegrationConfig}from"./erp-sync.js";
import{ensureProjectSowSchema}from"./project-sow.js";

const MAX_ERROR=700;
const cleanError=value=>String(value||"Project sync failed").replace(/[\u0000-\u001f]+/g," ").replace(/\s+/g," ").trim().slice(0,MAX_ERROR);
const retryAt=(attempts,now)=>new Date(Date.parse(now)+Math.min(60,2**Math.min(6,Math.max(0,attempts)))*60_000).toISOString();

export async function ensureProjectSyncSchema(db){return ensureProjectSowSchema(db);}

export async function enqueueProjectIntegrations(db,{projectId,now=new Date().toISOString()}){
 await ensureProjectSyncSchema(db);
 const row=await db.prepare("SELECT sow_status FROM project_sow WHERE project_id=? LIMIT 1").bind(projectId).first();
 if(!row)throw new ApiError(404,"sow_not_found","Für dieses Projekt ist noch kein SOW gespeichert.");
 if(row.sow_status!=="signed")return{queued:false,reason:"sow_not_signed"};
 await db.batch([
  db.prepare("INSERT INTO project_sync_jobs(id,project_id,target,status,attempts,next_attempt_at,last_error,created_at,updated_at) VALUES(?,?,'dolibarr','pending',0,?,NULL,?,?) ON CONFLICT(project_id,target) DO UPDATE SET status='pending',next_attempt_at=excluded.next_attempt_at,last_error=NULL,updated_at=excluded.updated_at").bind(crypto.randomUUID(),projectId,now,now,now),
  db.prepare("INSERT INTO project_sync_jobs(id,project_id,target,status,attempts,next_attempt_at,last_error,created_at,updated_at) VALUES(?,?,'jira','pending',0,?,NULL,?,?) ON CONFLICT(project_id,target) DO UPDATE SET status='pending',next_attempt_at=excluded.next_attempt_at,last_error=NULL,updated_at=excluded.updated_at").bind(crypto.randomUUID(),projectId,now,now,now)
 ]);
 return{queued:true};
}

async function projectSnapshot(db,projectId){
 const project=await db.prepare(
  "SELECT p.id,p.organization_id,p.name,p.status,p.starts_at,p.ends_at,pr.project_number,ca.customer_number,o.name AS organization_name,s.offer_number,s.sow_status,s.project_start,s.valid_until "+
  "FROM projects p JOIN project_registry pr ON pr.project_id=p.id JOIN customer_accounts ca ON ca.organization_id=p.organization_id JOIN organizations o ON o.id=p.organization_id JOIN project_sow s ON s.project_id=p.id "+
  "WHERE p.id=? LIMIT 1"
 ).bind(projectId).first();
 if(!project)throw new Error("BAIS project/SOW no longer exists.");
 const modules=(await db.prepare("SELECT module_code,module_name FROM project_modules WHERE project_id=? ORDER BY module_code").bind(projectId).all()).results||[];
 return{...project,modules};
}

async function syncDolibarr(db,env,job,now){
 const config=await getErpIntegrationConfig(db,env,{includeSecrets:true});
 if(!config.configured)return{configured:false};
 const row=await projectSnapshot(db,job.project_id);
 const response=await dolibarrRequest(config,"bais/project/upsert",{method:"POST",body:{
  customer_ref:row.customer_number,
  project_ref:row.project_number,
  title:row.name,
  sow_status:row.sow_status,
  offer_number:row.offer_number||null,
  project_start:row.project_start||null,
  modules:row.modules.map(m=>({code:m.module_code,name:m.module_name}))
 }});
 const id=Number(response?.id||response?.project_id),ref=String(response?.ref||response?.project_ref||row.project_number);
 if(!Number.isInteger(id)||id<1)throw new Error("Dolibarr project upsert returned no valid project id.");
 await db.batch([
  db.prepare("UPDATE project_integration_links SET dolibarr_project_id=?,dolibarr_project_ref=?,dolibarr_sync_status='synced',last_sync_at=?,last_error=NULL,updated_at=? WHERE project_id=?").bind(id,ref,now,now,row.id),
  db.prepare("UPDATE erp_links SET erp_role='customer',sync_status='synced',last_sync_at=?,last_error=NULL,updated_at=? WHERE organization_id=?").bind(now,now,row.organization_id),
  db.prepare("UPDATE project_sync_jobs SET status='done',last_error=NULL,updated_at=? WHERE id=?").bind(now,job.id)
 ]);
 return{configured:true,id,ref};
}

function jiraConfig(env){
 const baseUrl=String(env?.JIRA_BASE_URL||"").trim().replace(/\/+$/,""),email=String(env?.JIRA_EMAIL||"").trim(),
  apiToken=String(env?.JIRA_API_TOKEN||"").trim(),projectKey=String(env?.JIRA_PROJECT_KEY||"").trim().toUpperCase(),
  parentIssueType=String(env?.JIRA_PROJECT_ISSUE_TYPE||"Epic").trim(),moduleIssueType=String(env?.JIRA_MODULE_ISSUE_TYPE||"Task").trim();
 if(!baseUrl||!email||!apiToken||!projectKey)return{configured:false};
 let url;try{url=new URL(baseUrl);}catch{throw new ApiError(503,"jira_invalid_base_url","Jira Base URL ist ungültig.");}
 if(url.protocol!=="https:"||!url.hostname.toLowerCase().endsWith(".atlassian.net"))throw new ApiError(503,"jira_invalid_base_url","Jira Cloud URL muss HTTPS und *.atlassian.net sein.");
 if(!/^[A-Z][A-Z0-9_]{1,19}$/.test(projectKey))throw new ApiError(503,"jira_invalid_project_key","Jira Project Key ist ungültig.");
 return{configured:true,baseUrl:url.origin,email,apiToken,projectKey,parentIssueType,moduleIssueType};
}
async function jiraRequest(config,path,{method="GET",body}={}){
 const response=await fetch(config.baseUrl+"/rest/api/3/"+String(path||"").replace(/^\/+/, ""),{
  method,
  headers:{Accept:"application/json","Content-Type":"application/json",Authorization:"Basic "+btoa(config.email+":"+config.apiToken)},
  body:body===undefined?undefined:JSON.stringify(body),
  redirect:"error"
 });
 const text=await response.text();let data=null;if(text){try{data=JSON.parse(text);}catch{}}
 if(!response.ok)throw new Error("Jira HTTP "+response.status+": "+cleanError(data?.errorMessages?.join(" ")||Object.values(data?.errors||{}).join(" ")||text||response.statusText));
 return data;
}
const adf=text=>({type:"doc",version:1,content:[{type:"paragraph",content:[{type:"text",text:String(text)}]}]});
const jiraKey=data=>String(data?.key||"").trim(),jiraId=data=>String(data?.id||"").trim();
const jiraJqlString=value=>'"'+String(value||"").replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"';
const projectJiraLabel=row=>"bais-"+String(row.project_number||"").toLowerCase().replace(/[^a-z0-9-]/g,"-");
const moduleJiraLabel=code=>"bais-"+String(code||"").toLowerCase().replace(/[^a-z0-9-]/g,"-");
async function jiraSearch(config,jql){
 const data=await jiraRequest(config,"search/jql",{method:"POST",body:{jql,maxResults:2,fields:["summary"]}});
 return Array.isArray(data?.issues)?data.issues:[];
}

async function upsertJiraParent(db,config,row,now){
 const existing=await db.prepare("SELECT jira_parent_id,jira_parent_key FROM project_integration_links WHERE project_id=? LIMIT 1").bind(row.id).first();
 const summary=row.project_number+" · "+row.name;
 const description="BAIS Projekt "+row.project_number+" | Kunde "+row.customer_number+" | SOW "+(row.offer_number||"ohne Angebotsnummer")+" | Status "+row.sow_status;
 const uniqueLabel=projectJiraLabel(row);
 let id=String(existing?.jira_parent_id||""),key=String(existing?.jira_parent_key||"");
 if(!key){
  const jql="project = "+jiraJqlString(config.projectKey)+" AND labels = "+jiraJqlString(uniqueLabel)+" AND labels = "+jiraJqlString("bais-project");
  const matches=await jiraSearch(config,jql);
  if(matches.length>1)throw new Error("Jira contains multiple BAIS parent issues for "+row.project_number);
  if(matches.length===1){id=jiraId(matches[0]);key=jiraKey(matches[0]);}
 }
 if(key){
  await jiraRequest(config,"issue/"+encodeURIComponent(key),{method:"PUT",body:{fields:{summary,description:adf(description),labels:["bais","bais-project",uniqueLabel]}}});
  await db.prepare("UPDATE project_integration_links SET jira_parent_id=?,jira_parent_key=?,updated_at=? WHERE project_id=?").bind(id||null,key,now,row.id).run();
  return{id,key};
 }
 const created=await jiraRequest(config,"issue",{method:"POST",body:{fields:{
  project:{key:config.projectKey},summary,issuetype:{name:config.parentIssueType},description:adf(description),
  labels:["bais","bais-project",uniqueLabel]
 }}});
 key=jiraKey(created);id=jiraId(created);
 if(!key)throw new Error("Jira parent issue returned no key.");
 await db.prepare("UPDATE project_integration_links SET jira_parent_id=?,jira_parent_key=?,updated_at=? WHERE project_id=?").bind(id||null,key,now,row.id).run();
 return{id,key};
}

async function upsertJiraModules(db,config,row,parent,now){
 for(const module of row.modules){
  const existing=await db.prepare("SELECT jira_issue_id,jira_issue_key FROM project_module_integration_links WHERE project_id=? AND module_code=? LIMIT 1").bind(row.id,module.module_code).first();
  const summary=module.module_code+" · "+module.module_name+" · "+row.project_number;
  const fields={summary,description:adf("Vertragsmodul aus BAIS SOW: "+module.module_code+" – "+module.module_name+" | "+row.project_number),labels:["bais",module.module_code.toLowerCase(),"sow-module"]};
  if(existing?.jira_issue_key){
   await jiraRequest(config,"issue/"+encodeURIComponent(existing.jira_issue_key),{method:"PUT",body:{fields}});
   continue;
  }
  fields.project={key:config.projectKey};fields.issuetype={name:config.moduleIssueType};fields.parent={key:parent.key};
  const created=await jiraRequest(config,"issue",{method:"POST",body:{fields}}),key=jiraKey(created),id=jiraId(created);
  if(!key)throw new Error("Jira module issue returned no key for "+module.module_code);
  await db.prepare("INSERT INTO project_module_integration_links(project_id,module_code,jira_issue_id,jira_issue_key,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(project_id,module_code) DO UPDATE SET jira_issue_id=excluded.jira_issue_id,jira_issue_key=excluded.jira_issue_key,updated_at=excluded.updated_at")
   .bind(row.id,module.module_code,id||null,key,now).run();
 }
}
async function syncJira(db,env,job,now){
 const config=jiraConfig(env);if(!config.configured)return{configured:false};
 const row=await projectSnapshot(db,job.project_id),parent=await upsertJiraParent(db,config,row,now);
 await upsertJiraModules(db,config,row,parent,now);
 await db.batch([
  db.prepare("UPDATE project_integration_links SET jira_parent_id=?,jira_parent_key=?,jira_sync_status='synced',last_sync_at=?,last_error=NULL,updated_at=? WHERE project_id=?").bind(parent.id||null,parent.key,now,now,row.id),
  db.prepare("UPDATE project_sync_jobs SET status='done',last_error=NULL,updated_at=? WHERE id=?").bind(now,job.id)
 ]);
 return{configured:true,key:parent.key};
}

export async function syncPendingProjectIntegrations(db,env,{limit=10,now=new Date().toISOString()}={}){
 await ensureProjectSyncSchema(db);
 const staleBefore=new Date(Date.parse(now)-10*60_000).toISOString();
 await db.prepare("UPDATE project_sync_jobs SET status='pending',next_attempt_at=?,updated_at=? WHERE status='processing' AND updated_at<=?").bind(now,now,staleBefore).run();
 const jobs=(await db.prepare("SELECT id,project_id,target,attempts FROM project_sync_jobs WHERE status IN('pending','failed') AND next_attempt_at<=? ORDER BY created_at ASC LIMIT ?")
  .bind(now,Math.max(1,Math.min(50,Number(limit)||10))).all()).results||[];
 let synced=0,failed=0,deferred=0,claimed=0;
 for(const job of jobs){
  const claim=await db.prepare("UPDATE project_sync_jobs SET status='processing',updated_at=? WHERE id=? AND status IN('pending','failed') AND next_attempt_at<=?")
   .bind(new Date().toISOString(),job.id,now).run();
  if(Number(claim?.meta?.changes||0)!==1)continue;
  claimed++;
  try{
   const result=job.target==="dolibarr"?await syncDolibarr(db,env,job,new Date().toISOString()):job.target==="jira"?await syncJira(db,env,job,new Date().toISOString()):null;
   if(!result)throw new Error("Unsupported project sync target: "+job.target);
   if(result.configured===false){
    deferred++;
    await db.prepare("UPDATE project_sync_jobs SET status='pending',next_attempt_at=?,updated_at=? WHERE id=? AND status='processing'")
     .bind(new Date(Date.parse(now)+15*60_000).toISOString(),new Date().toISOString(),job.id).run();
   }else synced++;
  }catch(error){
   failed++;
   const attempts=Number(job.attempts||0)+1,err=cleanError(error instanceof Error?error.message:error),updatedAt=new Date().toISOString();
   await db.batch([
    db.prepare("UPDATE project_sync_jobs SET status='failed',attempts=?,next_attempt_at=?,last_error=?,updated_at=? WHERE id=? AND status='processing'").bind(attempts,retryAt(attempts,now),err,updatedAt,job.id),
    db.prepare("UPDATE project_integration_links SET "+(job.target==="jira"?"jira_sync_status":"dolibarr_sync_status")+"='failed',last_error=?,updated_at=? WHERE project_id=?").bind(err,updatedAt,job.project_id)
   ]);
  }
 }
 return{processed:jobs.length,claimed,synced,failed,deferred};
}

export async function projectIntegrationStatus(db,projectId){
 await ensureProjectSyncSchema(db);
 const link=await db.prepare("SELECT dolibarr_project_id,dolibarr_project_ref,dolibarr_sync_status,jira_parent_id,jira_parent_key,jira_sync_status,last_sync_at,last_error FROM project_integration_links WHERE project_id=? LIMIT 1").bind(projectId).first();
 const modules=(await db.prepare("SELECT pm.module_code,pm.module_name,pil.jira_issue_id,pil.jira_issue_key FROM project_modules pm LEFT JOIN project_module_integration_links pil ON pil.project_id=pm.project_id AND pil.module_code=pm.module_code WHERE pm.project_id=? ORDER BY pm.module_code").bind(projectId).all()).results||[];
 return{link:link||null,modules};
}
