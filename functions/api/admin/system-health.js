import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{requireAdmin}from"../../_lib/admin.js";
import{getErpIntegrationConfig}from"../../_lib/erp-sync.js";
import{N8N_LEAD_WEBHOOK}from"../../_lib/n8n.js";

const item=(status,detail)=>({status,detail});

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await requireAdmin(db,request);
  const services={
   cloudflare:item("healthy","Pages Function aktiv")
  };

  try{
   const row=await db.prepare("SELECT 1 AS ok").first();
   services.d1=item(Number(row?.ok)===1?"healthy":"degraded",Number(row?.ok)===1?"D1 Query erfolgreich":"D1 Query unerwartet");
  }catch{
   services.d1=item("degraded","D1 Query fehlgeschlagen");
  }

  if(env?.PROJECT_DOCUMENTS?.list){
   try{
    await env.PROJECT_DOCUMENTS.list({limit:1});
    services.r2=item("healthy","PROJECT_DOCUMENTS Binding erreichbar");
   }catch{
    services.r2=item("degraded","R2 Binding vorhanden, Zugriff fehlgeschlagen");
   }
  }else{
   services.r2=item("missing","PROJECT_DOCUMENTS Binding fehlt");
  }

  try{
   const erp=await getErpIntegrationConfig(db,env);
   services.dolibarr=item(erp.configured?"configured":erp.enabled?"degraded":"disabled",erp.configured?"ERP Zugangsdaten konfiguriert":erp.enabled?"ERP aktiv, Zugangsdaten unvollständig":"ERP deaktiviert");
  }catch{
   services.dolibarr=item("degraded","ERP Konfiguration konnte nicht geprüft werden");
  }

  try{
   const webhook=new URL(N8N_LEAD_WEBHOOK);
   services.n8n=item(webhook.protocol==="https:"?"configured":"degraded",webhook.protocol==="https:"?"n8n Webhook über HTTPS konfiguriert":"n8n Webhook nicht sicher konfiguriert");
  }catch{
   services.n8n=item("missing","n8n Webhook fehlt");
  }

  services.mail=item(env?.RESEND_API_KEY&&env?.TRANSACTIONAL_EMAIL_FROM?"configured":"missing",env?.RESEND_API_KEY&&env?.TRANSACTIONAL_EMAIL_FROM?"Transaktionaler E-Mail-Versand konfiguriert":"E-Mail Runtime-Konfiguration unvollständig");

  return json({ok:true,checkedAt:new Date().toISOString(),services,requestId:traceId});
 }catch(error){
  return handleError(error,traceId);
 }
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
