import{ApiError}from"./api.js";
const SESSION_COOKIE="__Host-bais_session",SESSION_SECONDS=60*60*24,IDLE_SECONDS=60*60*8;export const PASSWORD_HASH_ITERATIONS=600000;

const bytesToBase64Url=bytes=>{
 let value="";for(const byte of bytes)value+=String.fromCharCode(byte);
 return btoa(value).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const base64UrlToBytes=value=>{
 const normalized=value.replace(/-/g,"+").replace(/_/g,"/");
 const padded=normalized+"=".repeat((4-normalized.length%4)%4),binary=atob(padded);
 return Uint8Array.from(binary,char=>char.charCodeAt(0));
};
export const normalizeEmail=value=>typeof value==="string"?value.trim().toLowerCase():"";
export const validPassword=value=>typeof value==="string"&&value.length>=12&&value.length<=128;
export const randomToken=(size=32)=>{const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return bytesToBase64Url(bytes);};
export async function sha256(value){
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
 return bytesToBase64Url(new Uint8Array(digest));
}
export async function hashPassword(password,salt=randomToken(16),iterations=PASSWORD_HASH_ITERATIONS){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:base64UrlToBytes(salt),iterations},key,256);
 return{hash:bytesToBase64Url(new Uint8Array(bits)),salt,iterations};
}
const safeEqual=(left,right)=>{
 if(typeof left!=="string"||typeof right!=="string"||left.length!==right.length)return false;
 let result=0;for(let index=0;index<left.length;index++)result|=left.charCodeAt(index)^right.charCodeAt(index);
 return result===0;
};
export async function verifyPassword(password,credential){
 const result=await hashPassword(password,credential.password_salt,credential.password_iterations);
 return safeEqual(result.hash,credential.password_hash);
}
export function assertSameOrigin(request){
 const origin=request.headers.get("origin"),expected=new URL(request.url).origin;
 if(!origin||origin!==expected)throw new ApiError(403,"invalid_origin","Die Anfrage wurde aus Sicherheitsgründen abgelehnt.");
}
export function parseCookies(request){
 const values={};for(const part of(request.headers.get("cookie")||"").split(";")){
  const index=part.indexOf("=");if(index>0)values[part.slice(0,index).trim()]=part.slice(index+1).trim();
 }return values;
}
export function sessionCookie(token,maxAge=null){
 const base=SESSION_COOKIE+"="+token+"; Path=/; HttpOnly; Secure; SameSite=Lax";
 return maxAge===null?base:base+"; Max-Age="+maxAge;
}
export function clearSessionCookie(){return sessionCookie("",0)+"; Expires=Thu, 01 Jan 1970 00:00:00 GMT";}
export async function createSession(db,userId,request){
 const token=randomToken(),tokenHash=await sha256(token),now=new Date(),expires=new Date(now.getTime()+SESSION_SECONDS*1000),uaHash=await sha256(request.headers.get("user-agent")||"unknown");
 const nowIso=now.toISOString();
 await db.batch([
  db.prepare("DELETE FROM user_sessions WHERE expires_at<=? OR last_seen_at<?").bind(nowIso,new Date(now.getTime()-IDLE_SECONDS*1000).toISOString()),
  db.prepare("DELETE FROM user_sessions WHERE user_id=? AND id IN (SELECT id FROM user_sessions WHERE user_id=? ORDER BY last_seen_at DESC LIMIT -1 OFFSET 4)").bind(userId,userId),
  db.prepare("INSERT INTO user_sessions(id,user_id,token_hash,created_at,last_seen_at,expires_at,user_agent_hash) VALUES(?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),userId,tokenHash,nowIso,nowIso,expires.toISOString(),uaHash)
 ]);
 return{token,cookie:sessionCookie(token)};
}
export async function requireSession(db,request){
 const token=parseCookies(request)[SESSION_COOKIE];
 if(!token)throw new ApiError(401,"authentication_required","Bitte melden Sie sich an.");
 const tokenHash=await sha256(token),nowMs=Date.now(),now=new Date(nowMs).toISOString();
 const session=await db.prepare("SELECT s.id AS session_id,s.user_id,s.expires_at,s.last_seen_at,s.user_agent_hash,u.display_name,u.email,u.role,u.status FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? LIMIT 1").bind(tokenHash).first();
 const idleExpired=!session?.last_seen_at||Date.parse(session.last_seen_at)<nowMs-IDLE_SECONDS*1000;
 const uaHash=await sha256(request.headers.get("user-agent")||"unknown"),uaMismatch=Boolean(session?.user_agent_hash)&&!safeEqual(session.user_agent_hash,uaHash);
 if(!session||session.expires_at<=now||idleExpired||uaMismatch||session.status!=="active"){
  if(session?.session_id)try{await db.prepare("DELETE FROM user_sessions WHERE id=?").bind(session.session_id).run();}catch{}
  throw new ApiError(401,"session_expired","Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
 }
 await db.prepare("UPDATE user_sessions SET last_seen_at=? WHERE id=?").bind(now,session.session_id).run();
 return session;
}
export async function deleteSession(db,request){
 const token=parseCookies(request)[SESSION_COOKIE];if(!token)return;
 await db.prepare("DELETE FROM user_sessions WHERE token_hash=?").bind(await sha256(token)).run();
}

export async function ensureAuthSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS user_credentials(user_id TEXT PRIMARY KEY,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,password_algorithm TEXT NOT NULL,password_iterations INTEGER NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS user_sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,last_seen_at TEXT NOT NULL,expires_at TEXT NOT NULL,user_agent_hash TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS auth_rate_limits(id TEXT PRIMARY KEY,attempts INTEGER NOT NULL,window_started_at TEXT NOT NULL,updated_at TEXT NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS course_progress(user_id TEXT NOT NULL,course_id TEXT NOT NULL,progress_percent INTEGER NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100),status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN('not_started','in_progress','completed')),updated_at TEXT NOT NULL,PRIMARY KEY(user_id,course_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS academy_module_progress(user_id TEXT NOT NULL,course_id TEXT NOT NULL,module_slug TEXT NOT NULL,completed_lessons_json TEXT NOT NULL DEFAULT '[]',lab_cases_json TEXT NOT NULL DEFAULT '[]',assessment_best INTEGER NOT NULL DEFAULT 0 CHECK(assessment_best BETWEEN 0 AND 100),module_percent INTEGER NOT NULL DEFAULT 0 CHECK(module_percent BETWEEN 0 AND 100),updated_at TEXT NOT NULL,PRIMARY KEY(user_id,course_id,module_slug),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS academy_lesson_sessions(user_id TEXT NOT NULL,course_id TEXT NOT NULL,module_slug TEXT NOT NULL,lesson_id TEXT NOT NULL,started_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,course_id,module_slug,lesson_id),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE)")
 ]);
}

export async function consumeRateLimit(db,request,action,email,maxAttempts=8){
 const ip=request.headers.get("cf-connecting-ip")||"unknown",key=await sha256(action+":"+ip+":"+normalizeEmail(email));
 const now=Date.now(),windowStart=new Date(now-15*60*1000).toISOString();
 await db.prepare("DELETE FROM auth_rate_limits WHERE updated_at<?").bind(new Date(now-24*60*60*1000).toISOString()).run();
 const current=await db.prepare("SELECT attempts,window_started_at FROM auth_rate_limits WHERE id=?").bind(key).first();
 if(!current||current.window_started_at<windowStart){
  await db.prepare("INSERT INTO auth_rate_limits(id,attempts,window_started_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,updated_at=excluded.updated_at").bind(key,1,new Date(now).toISOString(),new Date(now).toISOString()).run();return key;
 }
 if(current.attempts>=maxAttempts)throw new ApiError(429,"too_many_attempts","Zu viele Versuche. Bitte warten Sie 15 Minuten.");
 await db.prepare("UPDATE auth_rate_limits SET attempts=attempts+1,updated_at=? WHERE id=?").bind(new Date(now).toISOString(),key).run();return key;
}
