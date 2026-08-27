const JSON_HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};

export function json(data,status=200,extraHeaders={}){
  return new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...extraHeaders}});
}

export function requestId(request){
  return request.headers.get("cf-ray")||crypto.randomUUID();
}

export async function readJson(request,maxBytes=16384){
  const length=Number(request.headers.get("content-length")||0);
  if(length>maxBytes) throw new ApiError(413,"payload_too_large","Die Anfrage ist zu groß.");
  const type=request.headers.get("content-type")||"";
  if(!type.toLowerCase().includes("application/json")) throw new ApiError(415,"unsupported_media_type","JSON wird erwartet.");
  try{return await request.json();}catch{throw new ApiError(400,"invalid_json","Ungültiges JSON.");}
}

export class ApiError extends Error{
  constructor(status,code,message){super(message);this.status=status;this.code=code;}
}

export function cleanText(value,max=500){
  if(typeof value!=="string") return "";
  return value.trim().replace(/[\u0000-\u001F\u007F]/g," ").replace(/\s+/g," ").slice(0,max);
}

export function validEmail(value){
  return typeof value==="string"&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function verifyTurnstile(token,request,secret){
  if(!secret) throw new ApiError(503,"turnstile_not_configured","Sicherheitsprüfung ist noch nicht konfiguriert.");
  if(typeof token!=="string"||token.length<10) throw new ApiError(400,"turnstile_required","Bitte bestätigen Sie die Sicherheitsprüfung.");
  const body=new FormData();
  body.set("secret",secret); body.set("response",token);
  const ip=request.headers.get("cf-connecting-ip"); if(ip) body.set("remoteip",ip);
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body});
  if(!response.ok) throw new ApiError(502,"turnstile_unavailable","Sicherheitsprüfung ist vorübergehend nicht erreichbar.");
  const result=await response.json();
  if(!result.success) throw new ApiError(400,"turnstile_failed","Sicherheitsprüfung fehlgeschlagen.");
}

export function handleError(error,id){
  if(error instanceof ApiError) return json({ok:false,error:{code:error.code,message:error.message},requestId:id},error.status);
  console.error(JSON.stringify({level:"error",requestId:id,message:error instanceof Error?error.message:"unknown"}));
  return json({ok:false,error:{code:"internal_error",message:"Die Anfrage konnte nicht verarbeitet werden."},requestId:id},500);
}

export function assertDatabase(env){
  if(!env.DB) throw new ApiError(503,"database_not_configured","Der Dienst wird gerade eingerichtet.");
  return env.DB;
}
