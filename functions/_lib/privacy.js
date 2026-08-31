import{ApiError}from"./api.js";

const DAY=24*60*60*1000;
const intDays=(value,fallback,min=1,max=3650)=>{
 const parsed=Number.parseInt(String(value??""),10);
 return Number.isInteger(parsed)&&parsed>=min&&parsed<=max?parsed:fallback;
};
export const privacyPolicy=env=>({
 openLeadDays:intDays(env?.PRIVACY_OPEN_LEAD_RETENTION_DAYS,365),
 closedLeadDays:intDays(env?.PRIVACY_CLOSED_LEAD_RETENTION_DAYS,180)
});
export async function ensurePrivacySchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS privacy_retention(entity_type TEXT NOT NULL,entity_id TEXT NOT NULL,delete_after TEXT,legal_hold INTEGER NOT NULL DEFAULT 0 CHECK(legal_hold IN(0,1)),reason TEXT,updated_at TEXT NOT NULL,PRIMARY KEY(entity_type,entity_id))"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_privacy_retention_due ON privacy_retention(legal_hold,delete_after)"),
  db.prepare("CREATE TABLE IF NOT EXISTS privacy_requests(id TEXT PRIMARY KEY,user_id TEXT,email TEXT NOT NULL,request_type TEXT NOT NULL CHECK(request_type IN('access','deletion','rectification','restriction','objection','portability')),status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','in_progress','completed','rejected')),note TEXT,created_at TEXT NOT NULL,resolved_at TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status,created_at DESC)")
 ]);
}
export async function scheduleRetention(db,{entityType,entityId,days,reason,now=new Date().toISOString()}){
 if(!["contact","enrollment_request"].includes(entityType))throw new ApiError(500,"privacy_entity_invalid","Ungültiger Datenschutz-Datensatz.");
 const deleteAfter=new Date(Date.parse(now)+days*DAY).toISOString();
 await ensurePrivacySchema(db);
 await db.prepare("INSERT INTO privacy_retention(entity_type,entity_id,delete_after,legal_hold,reason,updated_at) VALUES(?,?,?,0,?,?) ON CONFLICT(entity_type,entity_id) DO UPDATE SET delete_after=excluded.delete_after,reason=excluded.reason,updated_at=excluded.updated_at")
  .bind(entityType,entityId,deleteAfter,reason||null,now).run();
 return deleteAfter;
}
export async function clearRetention(db,entityType,entityId,now=new Date().toISOString()){
 await ensurePrivacySchema(db);
 await db.prepare("UPDATE privacy_retention SET delete_after=NULL,reason='active_or_required',updated_at=? WHERE entity_type=? AND entity_id=?")
  .bind(now,entityType,entityId).run();
}
export async function runPrivacyCleanup(db,{now=new Date().toISOString(),limit=50}={}){
 await ensurePrivacySchema(db);
 const due=await db.prepare("SELECT entity_type,entity_id FROM privacy_retention WHERE legal_hold=0 AND delete_after IS NOT NULL AND delete_after<=? ORDER BY delete_after ASC LIMIT ?").bind(now,Math.max(1,Math.min(200,Number(limit)||50))).all();
 let deleted=0;
 for(const row of due.results||[]){
  let result=null;
  if(row.entity_type==="contact")result=await db.prepare("DELETE FROM contacts WHERE id=? AND status IN('new','in_progress','closed')").bind(row.entity_id).run();
  if(row.entity_type==="enrollment_request")result=await db.prepare("DELETE FROM enrollment_requests WHERE id=? AND status IN('new','contacted','qualified','closed','rejected')").bind(row.entity_id).run();
  if(Number(result?.meta?.changes||0)>0){
   await db.prepare("DELETE FROM privacy_retention WHERE entity_type=? AND entity_id=?").bind(row.entity_type,row.entity_id).run();
   deleted++;
  }
 }
 return{checked:(due.results||[]).length,deleted};
}
