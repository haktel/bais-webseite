import{json,requestId}from"../_lib/api.js";
export const onRequestGet=async({request,env})=>{
 const id=requestId(request);
 let database="not_configured",documentStorage=env.PROJECT_DOCUMENTS&&typeof env.PROJECT_DOCUMENTS.get==="function"?"ok":"not_configured";
 if(env.DB){try{await env.DB.prepare("SELECT 1 AS ok").first();database="ok";}catch{database="error";}}
 return json({ok:database==="ok",service:"bais-platform-api",database,documentStorage,requestId:id},database==="error"?503:200);
};
