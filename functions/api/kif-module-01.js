// Deterministic prompt-quality checker for the KI-Führerschein Modul 01
// live lab. No external AI API is called here - like the n8n bootcamp's
// budget>=5000 rule, this is a real, testable, rule-based check: it scans
// the submitted prompt for task/context/format signals (quality) and for
// obvious sensitive-data patterns (safety), then returns a verdict. That
// keeps the lab genuinely live/deterministic without depending on a paid
// LLM call from a training exercise.
const ALLOWED_ORIGINS=new Set([
  "https://bais-solutions.de",
  "https://www.bais-solutions.de",
  "https://bais-webseite.pages.dev"
]);

function allowedOrigin(origin){
  return Boolean(origin&&(ALLOWED_ORIGINS.has(origin)||origin.endsWith(".bais-webseite.pages.dev")));
}

const IBAN_PATTERN=/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/;
const EMAIL_PATTERN=/[^\s@]+@[^\s@]+\.[^\s@]+/;
const SENSITIVE_KEYWORD_PATTERN=/(kundennummer|sozialversicherungsnummer|steuer-?id|personalausweis|passwort|kreditkarten?nummer|iban)\s*[:\-]?\s*\S/i;

const TASK_VERB_PATTERN=/\b(schreibe?|erstelle?|fasse?|übersetze?|formuliere?|prüfe?|analysiere?|erkläre?|liste?|vergleiche?|entwirf|beantworte?)\b/i;
const CONTEXT_PATTERN=/\b(für|zielgruppe|kunden?|team|projekt|im stil von|als)\b/i;
const FORMAT_PATTERN=/\b(stichpunkte|tabelle|e-?mail|absätze|wörter|zeichen|format|ton:|maximal|max\.)\b/i;

export function checkPrompt(raw){
  const prompt=String(raw||"").trim();
  if(!prompt){
    return{ok:false,route:"blockiert",status:422,reason:"Der Prompt ist leer."};
  }
  if(prompt.length>4000){
    return{ok:false,route:"blockiert",status:422,reason:"Der Prompt ist zu lang für diese Übung."};
  }

  const sensitiveHit=IBAN_PATTERN.test(prompt)||EMAIL_PATTERN.test(prompt)||SENSITIVE_KEYWORD_PATTERN.test(prompt);
  if(sensitiveHit){
    return{
      ok:false,route:"blockiert",status:422,
      reason:"Der Prompt enthält offenbar personenbezogene oder vertrauliche Daten (z. B. IBAN, Kundennummer oder E-Mail-Adresse). Solche Daten gehören nicht in ein KI-Tool ohne geprüfte Datenschutzvereinbarung und Freigabe."
    };
  }

  const words=prompt.split(/\s+/).filter(Boolean);
  const hasTaskVerb=TASK_VERB_PATTERN.test(prompt);
  const hasContext=CONTEXT_PATTERN.test(prompt)&&words.length>=12;
  const hasFormat=FORMAT_PATTERN.test(prompt);

  let score=20;
  if(hasTaskVerb)score+=25;
  if(hasContext)score+=30;
  if(hasFormat)score+=25;
  score=Math.min(100,score);

  const route=score>=70?"gut":"verbesserungswuerdig";
  return{
    ok:true,route,status:200,score,
    checks:{hasTaskVerb,hasContext,hasFormat},
    feedback:route==="gut"
      ?"Klare Aufgabe, erkennbarer Kontext und ein gefordertes Format - so liefert das Modell zuverlässigere Ergebnisse."
      :"Der Prompt funktioniert, lässt dem Modell aber viel Interpretationsspielraum. Ergänze Kontext (für wen? wofür?) und ein gewünschtes Format (Länge, Struktur, Ton)."
  };
}

export async function onRequestPost({request}){
  const origin=request.headers.get("Origin");
  if(!allowedOrigin(origin)){
    return Response.json({ok:false,error:"Origin not allowed"},{status:403});
  }

  const raw=await request.text();
  if(raw.length>8192){
    return Response.json({ok:false,error:"Payload too large"},{status:413});
  }

  let body;
  try{body=JSON.parse(raw);}catch{
    return Response.json({ok:false,error:"Invalid JSON"},{status:400});
  }

  const result=checkPrompt(body?.prompt);
  const{status,...payload}=result;
  return Response.json(payload,{status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
