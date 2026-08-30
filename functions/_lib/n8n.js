import{signN8nRequest}from"./n8n-signing.js";

export const N8N_LEAD_WEBHOOK="https://6wejmb5u.rpcld.co/webhook/bais-lead-qualification";

export async function callLeadQualificationWebhook(payload,{signal,db}={}){
  if(!db)throw new Error("n8n signing database unavailable");
  const signed=await signN8nRequest(db,payload);
  return fetch(N8N_LEAD_WEBHOOK,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "User-Agent":"BAIS-Website/1.0",
      ...signed.headers
    },
    body:JSON.stringify(payload),
    signal
  });
}

export function buildLeadPayload({name,email,company,topic,message}){
  return{
    name,
    email,
    company:company||"Privatperson",
    topic:topic||"Sonstiges",
    message,
    consent:true
  };
}

export function mapLeadResult(result){
  if(!result||result.ok!==true) return null;
  return{
    score:typeof result.score==="number"?result.score:null,
    route:typeof result.route==="string"?result.route:null,
    executionId:result.execution!=null?String(result.execution):null
  };
}
