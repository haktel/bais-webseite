// Deterministic "Datenklassifizierungs-Checker" for KI-Führerschein Modul 04.
// Given a text snippet intended for an AI tool, classifies it into one of
// three DSGVO-oriented tiers:
//
//  - besondere_kategorie: contains an Art. 9 DSGVO "special category" of
//    personal data (health, religion, union/party membership, biometric,
//    sexual orientation, criminal proceedings, ...). Hard block - this
//    category needs a much higher legal bar than ordinary personal data
//    and must never go into an unreviewed AI tool, regardless of context.
//  - personenbezogen: contains ordinary personal identifiers (customer
//    number, date of birth, ID number, IBAN, email address, ...). Needs
//    review/data minimization before use, but is not an automatic block.
//  - unbedenklich: no personal-data markers detected.

const SPECIAL_CATEGORY_PATTERN=/\b(diagnose|krankheit|medikament(?:e|en)?|schwerbehinderung|behinderung|religionszugehörigkeit|glaubensbekenntnis|gewerkschaft|parteimitgliedschaft|schwangerschaft|sexuelle orientierung|ethnische herkunft|fingerabdruck|biometrisch|vorstrafe|ermittlungsverfahren|strafverfahren)\b/i;
const IBAN_PATTERN=/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/;
const EMAIL_PATTERN=/[^\s@]+@[^\s@]+\.[^\s@]+/;
const PERSONAL_DATA_PATTERN=/\b(kundennummer|geburtsdatum|personalausweis|steuer-?id|sozialversicherungsnummer|telefonnummer|hausanschrift)\b/i;

export function checkDataClassification(rawInput){
  const raw=String(rawInput??"").trim();
  if(!raw)return{ok:false,status:422,reason:"Bitte gib einen Text ein."};
  if(raw.length>3000)return{ok:false,status:422,reason:"Text ist zu lang (max. 3000 Zeichen)."};

  const checks={
    besondereKategorie:SPECIAL_CATEGORY_PATTERN.test(raw),
    personenbezogen:PERSONAL_DATA_PATTERN.test(raw)||EMAIL_PATTERN.test(raw)||IBAN_PATTERN.test(raw)
  };

  if(checks.besondereKategorie){
    return{ok:false,status:422,route:"besondere_kategorie",checks,reason:"Enthält eine besondere Kategorie personenbezogener Daten (Art. 9 DSGVO, z. B. Gesundheit, Religion, Gewerkschaft). Darf nicht in ein ungeprüftes KI-Tool eingegeben werden."};
  }
  if(checks.personenbezogen){
    return{ok:true,status:200,route:"personenbezogen",checks,feedback:"Enthält gewöhnliche personenbezogene Daten (z. B. Kundennummer, Geburtsdatum, E-Mail). Vor Nutzung prüfen, ob die Daten wirklich nötig sind (Datenminimierung) und ob das Tool dafür freigegeben ist."};
  }
  return{ok:true,status:200,route:"unbedenklich",checks,feedback:"Keine erkennbaren personenbezogenen Daten gefunden."};
}

export async function onRequestPost({request}){
  let body;
  try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
  const result=checkDataClassification(body?.text);
  return Response.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
