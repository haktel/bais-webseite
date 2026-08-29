export const N8N_LEAD_WEBHOOK="https://6wejmb5u.rpcld.co/webhook/bais-lead-qualification";

export async function callLeadQualificationWebhook(payload){
  return fetch(N8N_LEAD_WEBHOOK,{
    method:"POST",
    headers:{"Content-Type":"application/json","User-Agent":"BAIS-Website/1.0"},
    body:JSON.stringify(payload)
  });
}

export function buildLeadPayload({name,email,company,topic,message}){
  return{
    name,
    email,
    company:company||"",
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
