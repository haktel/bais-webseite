import{ApiError}from"./api.js";
import{randomToken,sha256}from"./auth.js";

const ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",STEP=30,SETUP_TTL_MS=10*60*1000;

const b64url=bytes=>{let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");};
const fromB64url=value=>{const s=value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4),bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0));};

export function base32Encode(bytes){
 let bits=0,value=0,out="";
 for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=ALPHABET[(value>>>(bits-5))&31];bits-=5;}}
 if(bits>0)out+=ALPHABET[(value<<(5-bits))&31];
 return out;
}
export function base32Decode(input){
 const clean=String(input||"").replace(/=+$/,"").replace(/\s+/g,"").toUpperCase();
 let bits=0,value=0,out=[];
 for(const char of clean){const idx=ALPHABET.indexOf(char);if(idx<0)throw new ApiError(400,"mfa_secret_invalid","Ungültiger MFA-Schlüssel.");value=(value<<5)|idx;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}
 return new Uint8Array(out);
}
const rootSecrets=env=>[String(env?.MFA_ENCRYPTION_KEY||""),String(env?.TURNSTILE_SECRET||"")].filter((value,index,array)=>value.length>=20&&array.indexOf(value)===index);
async function deriveEncryptionKey(secret){
 const material="BAIS-MFA-AES-GCM-v1\u0000"+secret;
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(material));
 return crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
async function encryptionKeys(env){
 const roots=rootSecrets(env);
 if(!roots.length)throw new ApiError(503,"mfa_key_not_configured","MFA-Verschlüsselung ist noch nicht konfiguriert.");
 return Promise.all(roots.map(deriveEncryptionKey));
}
async function encryptText(value,env){
 const iv=new Uint8Array(12);crypto.getRandomValues(iv);const[key]=await encryptionKeys(env);
 const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(value));
 return{ciphertext:b64url(new Uint8Array(ciphertext)),iv:b64url(iv)};
}
async function decryptText(ciphertext,iv,env){
 const keys=await encryptionKeys(env),nonce=fromB64url(iv),data=fromB64url(ciphertext);
 for(const key of keys){
  try{
   const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:nonce},key,data);
   return new TextDecoder().decode(plain);
  }catch{}
 }
 throw new ApiError(503,"mfa_secret_unavailable","MFA-Schlüssel konnte nicht entschlüsselt werden.");
}
export async function ensureMfaSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS admin_mfa(user_id TEXT PRIMARY KEY,secret_ciphertext TEXT NOT NULL,secret_iv TEXT NOT NULL,enabled_at TEXT NOT NULL,created_at TEXT NOT NULL,last_counter INTEGER NOT NULL DEFAULT -1,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS admin_mfa_setup(user_id TEXT PRIMARY KEY,secret_ciphertext TEXT NOT NULL,secret_iv TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS admin_mfa_sessions(session_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,verified_at TEXT NOT NULL,FOREIGN KEY(session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"),
  db.prepare("CREATE TABLE IF NOT EXISTS admin_mfa_recovery_codes(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,code_hash TEXT NOT NULL UNIQUE,used_at TEXT,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_mfa_recovery_user ON admin_mfa_recovery_codes(user_id,used_at)")
 ]);
}
async function hotp(secret,counter,digits=6){
 const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-1"},false,["sign"]);
 const msg=new Uint8Array(8);let n=BigInt(counter);for(let i=7;i>=0;i--){msg[i]=Number(n&255n);n>>=8n;}
 const mac=new Uint8Array(await crypto.subtle.sign("HMAC",key,msg)),offset=mac[mac.length-1]&15;
 const binary=((mac[offset]&127)<<24)|(mac[offset+1]<<16)|(mac[offset+2]<<8)|mac[offset+3];
 return String(binary%(10**digits)).padStart(digits,"0");
}
const safeEqual=(a,b)=>{if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;};

export async function verifyTotpSecret(secretB32,code,{now=Date.now(),lastCounter=-1}={}){
 if(!/^\d{6}$/.test(String(code||"")))return{ok:false};
 const secret=base32Decode(secretB32),current=Math.floor(now/1000/STEP);
 for(const delta of[-1,0,1]){
  const counter=current+delta;if(counter<=Number(lastCounter))continue;
  if(safeEqual(await hotp(secret,counter),String(code)))return{ok:true,counter};
 }
 return{ok:false};
}
export async function adminMfaState(db,user){
 await ensureMfaSchema(db);
 const configured=Boolean(await db.prepare("SELECT user_id FROM admin_mfa WHERE user_id=? LIMIT 1").bind(user.user_id).first());
 const verified=configured&&Boolean(await db.prepare("SELECT session_id FROM admin_mfa_sessions WHERE session_id=? AND user_id=? LIMIT 1").bind(user.session_id,user.user_id).first());
 return{configured,verified};
}
export async function beginAdminMfaSetup(db,user,env){
 await ensureMfaSchema(db);await encryptionKey(env);
 if(user.role!=="admin")throw new ApiError(403,"admin_required","Administrator-Berechtigung erforderlich.");
 const bytes=new Uint8Array(20);crypto.getRandomValues(bytes);const secret=base32Encode(bytes),enc=await encryptText(secret,env),now=new Date(),expires=new Date(now.getTime()+SETUP_TTL_MS).toISOString();
 await db.prepare("INSERT INTO admin_mfa_setup(user_id,secret_ciphertext,secret_iv,expires_at,created_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=excluded.secret_ciphertext,secret_iv=excluded.secret_iv,expires_at=excluded.expires_at,created_at=excluded.created_at")
  .bind(user.user_id,enc.ciphertext,enc.iv,expires,now.toISOString()).run();
 return{secret,expiresAt:expires,otpauthUri:"otpauth://totp/BAIS:"+encodeURIComponent(user.email)+"?secret="+secret+"&issuer=BAIS&algorithm=SHA1&digits=6&period=30"};
}
const recoveryPlain=()=>{const bytes=new Uint8Array(8);crypto.getRandomValues(bytes);return base32Encode(bytes).slice(0,10);};
export async function confirmAdminMfaSetup(db,user,code,env){
 await ensureMfaSchema(db);
 const setup=await db.prepare("SELECT secret_ciphertext,secret_iv,expires_at FROM admin_mfa_setup WHERE user_id=? LIMIT 1").bind(user.user_id).first();
 if(!setup||setup.expires_at<=new Date().toISOString())throw new ApiError(410,"mfa_setup_expired","MFA-Einrichtung ist abgelaufen. Bitte neu starten.");
 const secret=await decryptText(setup.secret_ciphertext,setup.secret_iv,env),verified=await verifyTotpSecret(secret,code);
 if(!verified.ok)throw new ApiError(401,"mfa_code_invalid","Der MFA-Code ist nicht gültig.");
 const now=new Date().toISOString(),enc=await encryptText(secret,env),codes=Array.from({length:8},()=>recoveryPlain()),statements=[
  db.prepare("INSERT INTO admin_mfa(user_id,secret_ciphertext,secret_iv,enabled_at,created_at,last_counter) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=excluded.secret_ciphertext,secret_iv=excluded.secret_iv,enabled_at=excluded.enabled_at,last_counter=excluded.last_counter").bind(user.user_id,enc.ciphertext,enc.iv,now,now,verified.counter),
  db.prepare("DELETE FROM admin_mfa_setup WHERE user_id=?").bind(user.user_id),
  db.prepare("DELETE FROM admin_mfa_recovery_codes WHERE user_id=?").bind(user.user_id),
  db.prepare("INSERT INTO admin_mfa_sessions(session_id,user_id,verified_at) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET verified_at=excluded.verified_at").bind(user.session_id,user.user_id,now)
 ];
 for(const codeValue of codes)statements.push(db.prepare("INSERT INTO admin_mfa_recovery_codes(id,user_id,code_hash,used_at,created_at) VALUES(?,?,?,NULL,?)").bind(crypto.randomUUID(),user.user_id,await sha256(codeValue),now));
 await db.batch(statements);
 return{recoveryCodes:codes};
}
export async function verifyAdminMfa(db,user,code,env){
 await ensureMfaSchema(db);
 const row=await db.prepare("SELECT secret_ciphertext,secret_iv,last_counter FROM admin_mfa WHERE user_id=? LIMIT 1").bind(user.user_id).first();
 if(!row)throw new ApiError(428,"mfa_setup_required","Administrator-MFA muss zuerst eingerichtet werden.");
 const input=String(code||"").trim();
 let accepted=false,counter=null,recoveryId=null;
 if(/^\d{6}$/.test(input)){
  const secret=await decryptText(row.secret_ciphertext,row.secret_iv,env),result=await verifyTotpSecret(secret,input,{lastCounter:Number(row.last_counter||-1)});
  accepted=result.ok;counter=result.counter;
 }else if(/^[A-Z0-9]{8,16}$/i.test(input)){
  const hash=await sha256(input.toUpperCase()),recovery=await db.prepare("SELECT id FROM admin_mfa_recovery_codes WHERE user_id=? AND code_hash=? AND used_at IS NULL LIMIT 1").bind(user.user_id,hash).first();
  accepted=Boolean(recovery);recoveryId=recovery?.id||null;
 }
 if(!accepted)throw new ApiError(401,"mfa_code_invalid","Der MFA- oder Wiederherstellungscode ist nicht gültig.");
 const now=new Date().toISOString(),statements=[db.prepare("INSERT INTO admin_mfa_sessions(session_id,user_id,verified_at) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET verified_at=excluded.verified_at").bind(user.session_id,user.user_id,now)];
 if(counter!==null)statements.push(db.prepare("UPDATE admin_mfa SET last_counter=? WHERE user_id=?").bind(counter,user.user_id));
 if(recoveryId)statements.push(db.prepare("UPDATE admin_mfa_recovery_codes SET used_at=? WHERE id=? AND used_at IS NULL").bind(now,recoveryId));
 await db.batch(statements);
 return{verified:true};
}
export async function requireAdminMfa(db,user){
 const state=await adminMfaState(db,user);
 if(!state.configured)throw new ApiError(428,"mfa_setup_required","Administrator-MFA muss zuerst eingerichtet werden.");
 if(!state.verified)throw new ApiError(401,"mfa_required","Bitte bestätigen Sie die Administrator-Anmeldung mit MFA.");
 return user;
}
