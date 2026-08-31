import{json,requestId}from"../_lib/api.js";
export const onRequestGet=async({request,env})=>{
 const id=requestId(request);
 let database="not_configured";
 if(env.DB){try{await env.DB.prepare("SELECT 1 AS ok").first();database="ok";}catch{database="error";}}
 return json({ok:database==="ok",service:"bais-platform-api",database,requestId:id},database==="error"?503:200);
};
