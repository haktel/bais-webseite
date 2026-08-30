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

function allowedOrigin(origin){
  return !origin||ALLOWED_ORIGINS.has(origin)||origin.endsWith(".bais-webseite.pages.dev");
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

export async function onRequestPost({request}){
  const origin=request.headers.get("Origin");
  if(!allowedOrigin(origin)){
    return Response.json({ok:false,error:"Origin not allowed"},{status:403});
  }

  const type=request.headers.get("Content-Type")||"";
  if(!type.toLowerCase().includes("application/json")){
    return Response.json({ok:false,error:"JSON expected"},{status:415});
  }

  const raw=await request.text();
  if(raw.length>1024){
    return Response.json({ok:false,error:"Payload too large"},{status:413});
  }

  let body;
  try{body=JSON.parse(raw||"{}");}catch{
    return Response.json({ok:false,error:"Invalid JSON"},{status:400});
  }

  const scenarioKey=String(body?.scenario||"");
  const urgencyKey=String(body?.urgency||"");
  const payload=buildDemoPayload(scenarioKey,urgencyKey);
  if(!payload){
    return Response.json({ok:false,error:"Unsupported demo scenario"},{status:422});
  }

  const started=Date.now();
  try{
    const upstream=await callLeadQualificationWebhook(payload);
    const result=await upstream.json().catch(()=>null);
    const durationMs=Date.now()-started;

    if(!upstream.ok||!result||result.ok!==true){
      return Response.json({
        ok:false,
        source:"live-n8n",
        workflow:"bais-lead-qualification",
        upstreamStatus:upstream.status,
        durationMs,
        error:"n8n workflow rejected the demo execution"
      },{status:502,headers:{"Cache-Control":"no-store"}});
    }

    return Response.json({
      ok:true,
      source:"live-n8n",
      workflow:"bais-lead-qualification",
      scenario:scenarioKey,
      scenarioLabel:DEMO_SCENARIOS[scenarioKey].label,
      urgency:urgencyKey,
      score:typeof result.score==="number"?result.score:null,
      route:typeof result.route==="string"?result.route:null,
      executionId:result.execution!=null?String(result.execution):null,
      nextAction:typeof result.nextAction==="string"?result.nextAction:null,
      auditStatus:typeof result.audit?.status==="string"?result.audit.status:null,
      durationMs,
      completedAt:new Date().toISOString()
    },{
      headers:{
        "Cache-Control":"no-store",
        "X-Content-Type-Options":"nosniff"
      }
    });
  }catch{
    return Response.json({
      ok:false,
      source:"live-n8n",
      workflow:"bais-lead-qualification",
      durationMs:Date.now()-started,
      error:"Live workflow temporarily unavailable"
    },{status:502,headers:{"Cache-Control":"no-store"}});
  }
}

export function onRequest(){
  return Response.json(
    {ok:false,error:"Method not allowed"},
    {status:405,headers:{Allow:"POST","Cache-Control":"no-store"}}
  );
}
