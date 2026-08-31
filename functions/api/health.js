import{json,requestId}from"../_lib/api.js";
export const onRequestGet=async({request,env})=>{
 const id=requestId(request);
 let database="not_configured";
 if(env.DB){try{await env.DB.prepare("SELECT 1 AS ok").first();database="ok";}catch{database="error";}}
 const runtime={mfa:Boolean(env.MFA_ENCRYPTION_KEY),bootstrap:Boolean(env.ADMIN_BOOTSTRAP_SECRET),mail:Boolean(env.RESEND_API_KEY)};
 const securityRuntime=runtime.mfa&&runtime.bootstrap&&runtime.mail?"ready":"degraded";
 return json({ok:database==="ok",service:"bais-platform-api",database,securityRuntime,runtime,requestId:id},database==="error"?503:200);
};
