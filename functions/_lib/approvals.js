import{ApiError}from"./api.js";

let ready=false;
export async function ensureApprovalSchema(db){
 if(ready)return;
 const info=await db.prepare("PRAGMA table_info(approvals)").all();
 const existing=new Set((info.results||[]).map(row=>String(row.name)));
 if(!existing.has("decision_note")){
  try{await db.prepare("ALTER TABLE approvals ADD COLUMN decision_note TEXT").run();}
  catch(error){if(!/duplicate column name/i.test(String(error?.message||"")))throw error;}
 }
 await db.prepare("CREATE INDEX IF NOT EXISTS idx_approvals_project_status ON approvals(project_id,status)").run();
 ready=true;
}

export async function requestProjectApproval(db,{projectId,subject,actorUserId,now=new Date().toISOString()}){
 await ensureApprovalSchema(db);
 const project=await db.prepare("SELECT id,organization_id FROM projects WHERE id=? LIMIT 1").bind(projectId).first();
 if(!project)throw new ApiError(404,"project_not_found","Projekt wurde nicht gefunden.");
 const id=crypto.randomUUID();
 await db.batch([
  db.prepare("INSERT INTO approvals(id,project_id,subject,status,requested_by,created_at) VALUES(?,?,?,'pending',?,?)").bind(id,projectId,subject,actorUserId,now),
  db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),actorUserId,project.organization_id,"project.approval.requested","approval",id,JSON.stringify({projectId,subject}),now)
 ]);
 return{id,projectId,subject,status:"pending",createdAt:now};
}
