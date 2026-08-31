import{ApiError}from"./api.js";
import{normalizeEmail,randomToken,sha256}from"./auth.js";

const HOUR=60*60*1000;
const inviteHours=env=>{
 const value=Number.parseInt(String(env?.ACADEMY_INVITE_HOURS??""),10);
 return Number.isInteger(value)&&value>=1&&value<=720?value:168;
};
export async function ensureInviteSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS academy_registration_invites(id TEXT PRIMARY KEY,enrollment_request_id TEXT NOT NULL,email TEXT NOT NULL,course_id TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,used_at TEXT,created_by TEXT,created_at TEXT NOT NULL,FOREIGN KEY(enrollment_request_id) REFERENCES enrollment_requests(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_academy_invites_request ON academy_registration_invites(enrollment_request_id,expires_at DESC)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_academy_invites_email ON academy_registration_invites(email,expires_at DESC)")
 ]);
}
export async function createRegistrationInvite(db,{enrollmentRequestId,email,courseId,createdBy,env,now=new Date().toISOString()}){
 await ensureInviteSchema(db);
 const token=randomToken(32),tokenHash=await sha256(token),id=crypto.randomUUID(),expiresAt=new Date(Date.parse(now)+inviteHours(env)*HOUR).toISOString();
 await db.batch([
  db.prepare("UPDATE academy_registration_invites SET used_at=COALESCE(used_at,?) WHERE enrollment_request_id=? AND used_at IS NULL").bind(now,enrollmentRequestId),
  db.prepare("INSERT INTO academy_registration_invites(id,enrollment_request_id,email,course_id,token_hash,expires_at,used_at,created_by,created_at) VALUES(?,?,?,?,?,?,NULL,?,?)").bind(id,enrollmentRequestId,normalizeEmail(email),courseId,tokenHash,expiresAt,createdBy||null,now)
 ]);
 return{id,token,expiresAt};
}
export async function resolveRegistrationInvite(db,{token,email,courseSlug,now=new Date().toISOString()}){
 await ensureInviteSchema(db);
 if(typeof token!=="string"||token.length<32)throw new ApiError(403,"invite_required","Für die Kontoerstellung ist ein gültiger Einladungslink erforderlich.");
 const tokenHash=await sha256(token),normalizedEmail=normalizeEmail(email);
 const row=await db.prepare("SELECT i.id,i.enrollment_request_id,i.email,i.course_id,i.expires_at,c.slug,c.title FROM academy_registration_invites i JOIN courses c ON c.id=i.course_id WHERE i.token_hash=? AND i.used_at IS NULL AND i.expires_at>? LIMIT 1").bind(tokenHash,now).first();
 if(!row||row.email!==normalizedEmail||row.slug!==courseSlug)throw new ApiError(403,"invite_invalid","Der Einladungslink ist ungültig, abgelaufen oder passt nicht zu den Registrierungsdaten.");
 return row;
}
export async function consumeRegistrationInvite(db,inviteId,now=new Date().toISOString()){
 const result=await db.prepare("UPDATE academy_registration_invites SET used_at=? WHERE id=? AND used_at IS NULL").bind(now,inviteId).run();
 if(Number(result?.meta?.changes||0)!==1)throw new ApiError(409,"invite_used","Der Einladungslink wurde bereits verwendet.");
}
