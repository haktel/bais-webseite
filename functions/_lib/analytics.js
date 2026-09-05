import{ApiError}from"./api.js";

export async function ensureAnalyticsSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS site_visits(id TEXT PRIMARY KEY,session_id TEXT NOT NULL,path TEXT NOT NULL,referrer TEXT,is_entry INTEGER NOT NULL DEFAULT 0,entered_at TEXT NOT NULL,left_at TEXT,duration_seconds INTEGER,created_at TEXT NOT NULL)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_site_visits_created ON site_visits(created_at DESC)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_site_visits_session ON site_visits(session_id,created_at DESC)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_site_visits_path ON site_visits(path)")
 ]);
}

const MAX_PATH=300,MAX_REF=500,MAX_SESSION=80;

function cleanPath(value){
 if(typeof value!=="string"||!value.startsWith("/"))throw new ApiError(400,"invalid_path","Ungültiger Pfad.");
 return value.replace(/[\r\n\t]/g," ").slice(0,MAX_PATH);
}
function cleanSessionId(value){
 if(typeof value!=="string"||!/^[a-zA-Z0-9-]{8,80}$/.test(value))throw new ApiError(400,"invalid_session","Ungültige Sitzungskennung.");
 return value.slice(0,MAX_SESSION);
}
function cleanReferrer(value){
 if(typeof value!=="string")return null;
 return value.slice(0,MAX_REF)||null;
}

export async function recordView(db,{sessionId,path,referrer,isEntry}){
 const id=crypto.randomUUID(),now=new Date().toISOString();
 await db.prepare("INSERT INTO site_visits(id,session_id,path,referrer,is_entry,entered_at,created_at) VALUES(?,?,?,?,?,?,?)")
  .bind(id,cleanSessionId(sessionId),cleanPath(path),cleanReferrer(referrer),isEntry?1:0,now,now).run();
 return{id,enteredAt:now};
}

export async function recordLeave(db,{visitId,durationSeconds}){
 if(typeof visitId!=="string"||visitId.length>64)throw new ApiError(400,"invalid_visit","Ungültige Besuchskennung.");
 const duration=Number.isFinite(durationSeconds)?Math.max(0,Math.min(3600,Math.round(durationSeconds))):null;
 await db.prepare("UPDATE site_visits SET left_at=?,duration_seconds=? WHERE id=?")
  .bind(new Date().toISOString(),duration,visitId).run();
}

export async function visitorOverview(db){
 const since=new Date(Date.now()-24*3600*1000).toISOString(),activeSince=new Date(Date.now()-5*60*1000).toISOString();
 const today=await db.prepare("SELECT COUNT(*) AS views,COUNT(DISTINCT session_id) AS sessions,AVG(duration_seconds) AS avg_duration FROM site_visits WHERE created_at>=?").bind(since).first();
 const active=await db.prepare("SELECT COUNT(DISTINCT session_id) AS active FROM site_visits WHERE created_at>=? AND left_at IS NULL").bind(activeSince).first();
 const topPages=await db.prepare("SELECT path,COUNT(*) AS views,AVG(duration_seconds) AS avg_duration FROM site_visits WHERE created_at>=? GROUP BY path ORDER BY views DESC LIMIT 10").bind(since).all();
 const entryPages=await db.prepare("SELECT path,COUNT(*) AS views FROM site_visits WHERE created_at>=? AND is_entry=1 GROUP BY path ORDER BY views DESC LIMIT 10").bind(since).all();
 const recent=await db.prepare("SELECT session_id,path,referrer,duration_seconds,entered_at FROM site_visits WHERE created_at>=? ORDER BY entered_at DESC LIMIT 30").bind(since).all();
 return{
  todayViews:Number(today?.views||0),
  todaySessions:Number(today?.sessions||0),
  avgDurationSeconds:today?.avg_duration?Math.round(today.avg_duration):0,
  activeNow:Number(active?.active||0),
  topPages:(topPages.results||[]).map(row=>({path:row.path,views:Number(row.views),avgDurationSeconds:row.avg_duration?Math.round(row.avg_duration):0})),
  entryPages:(entryPages.results||[]).map(row=>({path:row.path,views:Number(row.views)})),
  recent:(recent.results||[]).map(row=>({sessionId:row.session_id,path:row.path,referrer:row.referrer,durationSeconds:row.duration_seconds,enteredAt:row.entered_at}))
 };
}
