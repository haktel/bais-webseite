import{signN8nRequest}from"./n8n-signing.js";

export const N8N_LEAD_WEBHOOK="https://6wejmb5u.rpcld.co/webhook/bais-lead-qualification";

const BUSINESS_SIGNALS=Object.freeze([
  ["automation",["automation","automatisierung"]],
  ["n8n",["n8n"]],
  ["api",["api","schnittstelle"]],
  ["webhook",["webhook"]],
  ["workflow",["workflow","prozess"]],
  ["integration",["integration","systemanbindung"]],
  ["cybersecurity",["cybersecurity","cyber security","it-sicherheit","security"]],
  ["identity",["identity","iam","identität","berechtigung"]],
  ["cloud",["cloud","azure","aws","gcp"]],
  ["governance",["governance","eu ai act","compliance"]],
  ["ai",[" ai ","ki ","künstliche intelligenz","artificial intelligence"]],
  ["rag",["rag","retrieval augmented"]],
  ["agents",["agent","agenten"]],
  ["academy",["academy","schulung","training","workshop"]],
  ["monitoring",["monitoring","observability"]],
  ["audit",["audit","evidence","nachweis"]],
  ["iso27001",["iso 27001","iso27001"]],
  ["incident",["incident","störung","vorfall"]],
  ["backup",["backup","recovery","wiederherstellung"]],
  ["migration",["migration","umzug"]],
  ["database",["datenbank","database","sql"]],
  ["network",["netzwerk","network","firewall"]],
  ["support",["support","wartung","betrieb"]]
]);

function normalizeSignalText(value){
  return String(value??"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim();
}

export function deriveLeadSignals(message){
  const raw=typeof message==="string"?message:"";
  const normalized=" "+normalizeSignalText(raw)+" ";
  const signals=[];
  for(const [label,needles]of BUSINESS_SIGNALS){
    const matched=needles.some(needle=>{
      const token=normalizeSignalText(needle);
      return token&&normalized.includes(" "+token+" ");
    });
    if(matched)signals.push(label);
    if(signals.length>=12)break;
  }
  return{
    signals:signals.length?signals:["general"],
    messageLength:raw.length
  };
}

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

export function buildLeadPayload({topic,message}){
  const safeTopic=typeof topic==="string"&&topic.trim()?topic.trim():"Sonstiges";
  const derived=deriveLeadSignals(message);
  return{
    name:"BAIS Lead Signal",
    email:"privacy-minimized@bais.invalid",
    company:"Nicht an n8n übermittelt",
    topic:safeTopic,
    message:`Topic: ${safeTopic}. Business signals: ${derived.signals.join(", ")}. Message length: ${derived.messageLength} characters. Contact identifiers and free text withheld by BAIS privacy minimization.`,
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
