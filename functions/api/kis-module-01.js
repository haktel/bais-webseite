// Deterministic "Trust-Boundary-Analyzer" for KI-Führerschein IT & Security
// Modul 01. Given a short description of an AI integration scenario,
// classifies the data-flow risk of that scenario:
//
//  - unkritisch: the data flow never crosses an external/third-party trust
//    boundary (stays on-premise / internal).
//  - pruefen: crosses an external boundary (cloud/SaaS/third-party API),
//    but without both a sensitive-data type AND a missing mitigation at
//    once - needs review before rollout.
//  - hochrisiko: crosses an external boundary AND involves a sensitive
//    data type AND no mitigation (encryption/anonymisation/on-prem/DPA/
//    EU hosting) is mentioned at all - hard block until addressed.

const EXTERNAL_PATTERN=/\b(extern\w*|cloud\w*|drittanbieter\w*|saas\b|außerhalb\w*|api-aufruf\w*|api-anbindung\w*)\b/i;
const MITIGATION_PATTERN=/\b(verschlüssel\w*|anonymisier\w*|pseudonymisier\w*|on-premise|on premise|eu-gehostet\w*|dsgvo-konform\w*|vertraulichkeitsvereinbarung\w*|auftragsverarbeitungsvertrag\w*|\bdpa\b)\b/i;
const SENSITIVE_DATA_PATTERN=/\b(kundendaten\w*|gesundheitsdaten\w*|quellcode\w*|geschäftsgeheimnis\w*|personalakte\w*|finanzdaten\w*|zugangsdaten\w*|passwort\w*|passwörter\w*|kreditkarte\w*|zahlungsdaten\w*)\b/i;

export function checkDataFlow(rawInput){
  const raw=String(rawInput??"").trim();
  if(!raw)return{ok:false,status:422,reason:"Bitte beschreibe das Szenario."};
  if(raw.length>2000)return{ok:false,status:422,reason:"Beschreibung ist zu lang (max. 2000 Zeichen)."};

  const checks={
    externeGrenze:EXTERNAL_PATTERN.test(raw),
    sensibleDaten:SENSITIVE_DATA_PATTERN.test(raw),
    mitigationErwaehnt:MITIGATION_PATTERN.test(raw)
  };

  if(checks.externeGrenze&&checks.sensibleDaten&&!checks.mitigationErwaehnt){
    return{ok:false,status:422,route:"hochrisiko",checks,reason:"Sensible Daten überschreiten eine externe Vertrauensgrenze (Cloud/Drittanbieter), ohne dass eine Schutzmaßnahme genannt wird. Darf nicht ohne zusätzliche Kontrolle in Betrieb gehen."};
  }
  if(checks.externeGrenze){
    return{ok:true,status:200,route:"pruefen",checks,feedback:"Der Datenfluss überschreitet eine externe Vertrauensgrenze. Prüfen, ob Datenart und Schutzmaßnahmen ausreichend dokumentiert sind, bevor es produktiv geht."};
  }
  return{ok:true,status:200,route:"unkritisch",checks,feedback:"Keine erkennbare externe Vertrauensgrenze - der Datenfluss bleibt intern."};
}

export async function onRequestPost({request}){
  let body;
  try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
  const result=checkDataFlow(body?.scenario);
  return Response.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
