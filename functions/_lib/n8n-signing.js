const KEY_ID="lead-webhook-v1";
const MAX_CLOCK_SKEW_SECONDS=90;

export function stableStringify(value){
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(Array.isArray(value))return "["+value.map(stableStringify).join(",")+"]";
  const keys=Object.keys(value).sort();
  return "{"+keys.map(key=>JSON.stringify(key)+":"+stableStringify(value[key])).join(",")+"}";
}

function toBase64Url(bytes){
  let binary="";
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

function fromBase64Url(value){
  const normalized=String(value).replace(/-/g,"+").replace(/_/g,"/");
  const padded=normalized+"=".repeat((4-normalized.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
}

export function timingSafeEqual(a,b){
  const left=new TextEncoder().encode(String(a));
  const right=new TextEncoder().encode(String(b));
  if(left.length!==right.length)return false;
  let diff=0;
  for(let i=0;i<left.length;i++)diff|=left[i]^right[i];
  return diff===0;
}

async function hmacSha256(secretBytes,message){
  const key=await crypto.subtle.importKey(
    "raw",
    secretBytes,
    {name:"HMAC",hash:"SHA-256"},
    false,
    ["sign"]
  );
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

export async function signCanonical(secretB64,payload,timestamp,nonce){
  const canonical=stableStringify(payload);
  const message=`${timestamp}.${nonce}.${canonical}`;
  return toBase64Url(await hmacSha256(fromBase64Url(secretB64),message));
}

export async function ensureN8nSigningSchema(db){
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS n8n_webhook_keys(id TEXT PRIMARY KEY,secret_b64 TEXT NOT NULL,created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS n8n_webhook_nonces(nonce TEXT PRIMARY KEY,used_at TEXT NOT NULL)")
  ]);
}

async function signingSecret(db){
  await ensureN8nSigningSchema(db);
  let row=await db.prepare("SELECT secret_b64 FROM n8n_webhook_keys WHERE id=? LIMIT 1").bind(KEY_ID).first();
  if(row?.secret_b64)return String(row.secret_b64);

  const bytes=new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const generated=toBase64Url(bytes);
  const now=new Date().toISOString();
  await db.prepare("INSERT OR IGNORE INTO n8n_webhook_keys(id,secret_b64,created_at) VALUES(?,?,?)").bind(KEY_ID,generated,now).run();
  row=await db.prepare("SELECT secret_b64 FROM n8n_webhook_keys WHERE id=? LIMIT 1").bind(KEY_ID).first();
  if(!row?.secret_b64)throw new Error("n8n signing key unavailable");
  return String(row.secret_b64);
}

export async function signN8nRequest(db,payload){
  const secret=await signingSecret(db);
  const timestamp=String(Math.floor(Date.now()/1000));
  const nonce=crypto.randomUUID();
  const signature=await signCanonical(secret,payload,timestamp,nonce);
  return{
    scheme:"hmac-sha256",
    timestamp,
    nonce,
    signature,
    headers:{
      "X-BAIS-Signature-Version":"1",
      "X-BAIS-Timestamp":timestamp,
      "X-BAIS-Nonce":nonce,
      "X-BAIS-Signature":signature
    }
  };
}

export async function verifyN8nSignature(db,{timestamp,nonce,signature,body}){
  const ts=String(timestamp??"");
  const id=String(nonce??"");
  const sig=String(signature??"");

  if(!/^\d{10}$/.test(ts))return false;
  if(!/^[0-9a-f-]{36}$/i.test(id))return false;
  if(!/^[A-Za-z0-9_-]{40,60}$/.test(sig))return false;
  if(!body||typeof body!=="object"||Array.isArray(body))return false;

  const nowSeconds=Math.floor(Date.now()/1000);
  if(Math.abs(nowSeconds-Number(ts))>MAX_CLOCK_SKEW_SECONDS)return false;

  const secret=await signingSecret(db);
  const expected=await signCanonical(secret,body,ts,id);
  if(!timingSafeEqual(expected,sig))return false;

  const cutoff=new Date(Date.now()-10*60_000).toISOString();
  await db.prepare("DELETE FROM n8n_webhook_nonces WHERE used_at<?").bind(cutoff).run();
  const inserted=await db.prepare("INSERT OR IGNORE INTO n8n_webhook_nonces(nonce,used_at) VALUES(?,?)").bind(id,new Date().toISOString()).run();
  return Number(inserted?.meta?.changes||0)===1;
}
