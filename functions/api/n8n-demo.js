import { callLeadQualificationWebhook } from "../_lib/n8n.js";

export const DEMO_SCENARIOS=Object.freeze({
  automation:Object.freeze({
    label:"Automation Discovery",
    topic:"Automation / n8n",
    company:"BAIS Demo Logistics GmbH",
    message:"Ein Logistikteam überträgt täglich rund 180 Servicevorgänge manuell aus E-Mail und Formularen in interne Systeme. Gesucht wird eine n8n-Automation mit API-Anbindung, Datenvalidierung, Fehlerpfad, Monitoring und dokumentiertem Handover."
  }),
  security:Object.freeze({
    label:"Security Incident Routing",
    topic:"Cybersecurity",
    company:"BAIS Demo Industrie GmbH",
    message:"Ein mittelständischer Betrieb meldet auffällige Login-Versuche, privilegierte Konten und fehlende zentrale Alarmierung. Benötigt werden kurzfristige Einordnung, sichere Eskalation, Logging, Verantwortlichkeiten und ein nachvollziehbarer Maßnahmenpfad."
  }),
  academy:Object.freeze({
    label:"Academy Qualification",
    topic:"BAIS Academy",
    company:"BAIS Demo Consulting GmbH",
    message:"Ein Team mit 24 Mitarbeitenden möchte n8n und sichere AI-Workflows praxisnah einführen. Gesucht werden rollenbasierte Lernpfade, echte Labs, Assessments, Transferaufgaben und ein überprüfbarer Kompetenznachweis."
  })
});

const URGENCY=Object.freeze({
  planned:"Das Vorhaben ist planbar und soll innerhalb der nächsten acht bis zwölf Wochen strukturiert umgesetzt werden.",
  urgent:"Das Thema ist zeitkritisch. Eine belastbare Erstbewertung und klare nächste Aktion werden innerhalb von 24 bis 48 Stunden benötigt."
});

const ALLOWED_ORIGINS=new Set([
  "https://bais-solutions.de",
  "https://www.bais-solutions.de",
  "https://bais-webseite.pages.dev"
]);

const BURST_WINDOW_MS=60_000;
const BURST_LIMIT=4;
const burstBuckets=new Map();

function allowedOrigin(origin){
  return Boolean(origin&&(ALLOWED_ORIGINS.has(origin)||origin.endsWith(".bais-webseite.pages.dev")));
}

export function buildDemoPayload(scenarioKey,urgencyKey){
  const scenario=DEMO_SCENARIOS[scenarioKey];
  const urgency=URGENCY[urgencyKey];
  if(!scenario||!urgency)return null;
  return{
    name:"BAIS Live Demo",
    email:"n8n.demo@example.com",
    company:scenario.company,
    topic:scenario.topic,
    message:`${scenario.message} ${urgency} Dies ist ein synthetischer öffentlicher BAIS-Demolauf; es werden keine echten Personen- oder Kundendaten verarbeitet.`,
    consent:true
  };
}

export async function fingerprint(value){
  const bytes=new TextEncoder().encode(String(value));
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,"0")).join("").slice(0,20);
}

export function allowBurst(key,now=Date.now()){
  const current=burstBuckets.get(key);
  if(!current||now-current.started>=BURST_WINDOW_MS){
    burstBuckets.set(key,{started:now,count:1});
    if(burstBuckets.size>512){
      for(const [bucketKey,bucket] of burstBuckets){
        if(now-bucket.started>=BURST_WINDOW_MS)burstBuckets.delete(bucketKey);
      }
    }
    return true;
  }
  if(current.count>=BURST_LIMIT)return false;
  current.count+=1;
  return true;
}

function responseHeaders(){
  return{
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  };
}

export async function onRequestPost({request}){
  const requestId=request.headers.get("cf-ray")||crypto.randomUUID();
  const origin=request.headers.get("Origin");
  if(!allowedOrigin(origin)){
    return Response.json({ok:false,requestId,error:"Origin not allowed"},{status:403,headers:responseHeaders()});
  }

  const clientIp=request.headers.get("cf-connecting-ip")||"unknown";
  const burstKey=await fingerprint(`n8n-demo|${clientIp}`);
  if(!allowBurst(burstKey)){
    return Response.json(
      {ok:false,requestId,error:"Too many demo executions. Please try again shortly."},
      {status:429,headers:{...responseHeaders(),"Retry-After":"60"}}
    );
  }

  const type=request.headers.get("Content-Type")||"";
  if(!type.toLowerCase().includes("application/json")){
    return Response.json({ok:false,requestId,error:"JSON expected"},{status:415,headers:responseHeaders()});
  }

  const raw=await request.text();
  if(raw.length>1024){
    return Response.json({ok:false,requestId,error:"Payload too large"},{status:413,headers:responseHeaders()});
  }

  let body;
  try{body=JSON.parse(raw||"{}");}catch{
    return Response.json({ok:false,requestId,error:"Invalid JSON"},{status:400,headers:responseHeaders()});
  }

  const scenarioKey=String(body?.scenario||"");
  const urgencyKey=String(body?.urgency||"");
  const payload=buildDemoPayload(scenarioKey,urgencyKey);
  if(!payload){
    return Response.json({ok:false,requestId,error:"Unsupported demo scenario"},{status:422,headers:responseHeaders()});
  }

  const inputFingerprint=await fingerprint(`${scenarioKey}|${urgencyKey}|${payload.topic}|${payload.company}`);
  const started=Date.now();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);

  try{
    const upstream=await callLeadQualificationWebhook(payload,{signal:controller.signal});
    const result=await upstream.json().catch(()=>null);
    const durationMs=Date.now()-started;

    if(!upstream.ok||!result||result.ok!==true){
      return Response.json({
        ok:false,
        requestId,
        source:"live-n8n",
        workflow:"bais-lead-qualification",
        upstreamStatus:upstream.status,
        inputFingerprint,
        durationMs,
        evidence:[
          {step:"edge-validation",status:"verified"},
          {step:"n8n-webhook",status:"rejected"}
        ],
        error:"n8n workflow rejected the demo execution"
      },{status:502,headers:responseHeaders()});
    }

    const safeResult={
      score:typeof result.score==="number"?result.score:null,
      route:typeof result.route==="string"?result.route:null,
      executionId:result.execution!=null?String(result.execution):null,
      nextAction:typeof result.nextAction==="string"?result.nextAction:null,
      auditStatus:typeof result.audit?.status==="string"?result.audit.status:null
    };
    const resultFingerprint=await fingerprint([
      "bais-lead-qualification",
      safeResult.executionId,
      safeResult.score,
      safeResult.route,
      safeResult.auditStatus
    ].join("|"));

    return Response.json({
      ok:true,
      requestId,
      source:"live-n8n",
      workflow:"bais-lead-qualification",
      scenario:scenarioKey,
      scenarioLabel:DEMO_SCENARIOS[scenarioKey].label,
      urgency:urgencyKey,
      ...safeResult,
      upstreamStatus:upstream.status,
      inputFingerprint,
      resultFingerprint,
      durationMs,
      completedAt:new Date().toISOString(),
      evidence:[
        {step:"edge-validation",status:"verified"},
        {step:"synthetic-payload",status:"verified"},
        {step:"n8n-webhook",status:"verified"},
        {step:"routing-output",status:"verified"}
      ]
    },{headers:responseHeaders()});
  }catch(error){
    const timedOut=error instanceof Error&&error.name==="AbortError";
    return Response.json({
      ok:false,
      requestId,
      source:"live-n8n",
      workflow:"bais-lead-qualification",
      inputFingerprint,
      durationMs:Date.now()-started,
      evidence:[
        {step:"edge-validation",status:"verified"},
        {step:"n8n-webhook",status:timedOut?"timeout":"unavailable"}
      ],
      error:timedOut?"Live workflow timeout after 12 seconds":"Live workflow temporarily unavailable"
    },{status:504,headers:responseHeaders()});
  }finally{
    clearTimeout(timeout);
  }
}

export function onRequest(){
  return Response.json(
    {ok:false,error:"Method not allowed"},
    {status:405,headers:{Allow:"POST",...responseHeaders()}}
  );
}
