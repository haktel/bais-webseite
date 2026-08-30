// Deterministic "Quellen- und Zitat-Checker" for KI-Führerschein Modul 05.
// Given an AI-generated text making a factual/statistical claim, checks how
// specifically it is sourced:
//
//  - belegt: a proper, specific citation is present (author + year, in
//    either narrative "Müller et al. (2021)" or parenthetical
//    "(Müller, 2021)" form).
//  - vage: the text attributes a claim to a source only in generic terms
//    ("Studien zeigen", "Experten zufolge") without naming anything
//    concrete - a very common, easy-to-miss AI habit.
//  - unbelegt: a specific factual/statistical claim (a percentage, a year,
//    a large number) with NO source mention at all, not even a vague one -
//    the most severe case, blocked until a source is added.

const CITATION_PATTERN=/[A-ZÄÖÜ][a-zà-öø-ÿß]+(?:\s(?:et al\.|(?:&|und)\s[A-ZÄÖÜ][a-zà-öø-ÿß]+))?,?\s*\((?:19|20)\d{2}\)|\([A-ZÄÖÜ][a-zà-öø-ÿß]+(?:\s(?:et al\.|(?:&|und)\s[A-ZÄÖÜ][a-zà-öø-ÿß]+))?,?\s*(?:19|20)\d{2}\)/;
const VAGUE_SOURCE_PATTERN=/\b(studien zeigen|untersuchungen zeigen|experten (sagen|zufolge|meinen)|forscher(?:innen)? (sagen|fanden)|es wird berichtet|man sagt|einer studie zufolge)\b/i;
const FACT_CLAIM_PATTERN=/\b\d{1,3}(?:[.,]\d+)?\s?%|\b(19|20)\d{2}\b|\b\d+[.,]\d+\s?(millionen|milliarden)\b/i;

export function checkCitation(rawInput){
  const raw=String(rawInput??"").trim();
  if(!raw)return{ok:false,status:422,reason:"Bitte gib einen Text ein."};
  if(raw.length>3000)return{ok:false,status:422,reason:"Text ist zu lang (max. 3000 Zeichen)."};

  const checks={
    hatZitat:CITATION_PATTERN.test(raw),
    hatVageQuelle:VAGUE_SOURCE_PATTERN.test(raw),
    hatSachaussage:FACT_CLAIM_PATTERN.test(raw)
  };

  if(checks.hatZitat){
    return{ok:true,status:200,route:"belegt",checks,feedback:"Enthält eine konkrete Quellenangabe (Autor + Jahr) - die stärkste der drei Stufen."};
  }
  if(checks.hatSachaussage&&!checks.hatVageQuelle){
    return{ok:false,status:422,route:"unbelegt",checks,reason:"Enthält eine konkrete Sachaussage (Zahl/Jahr) ganz ohne Quellenangabe - nicht einmal in vager Form. Vor Verwendung eine echte Quelle ergänzen oder als ungeprüft kennzeichnen."};
  }
  if(checks.hatVageQuelle||checks.hatSachaussage){
    return{ok:true,status:200,route:"vage",checks,feedback:"Die Quelle wird nur pauschal genannt (\"Studien zeigen\", \"Experten zufolge\") ohne konkrete Angabe. Frage nach: Welche Studie? Welche Experten?"};
  }
  return{ok:true,status:200,route:"belegt",checks,feedback:"Enthält keine überprüfbare Sachaussage, die eine Quelle benötigen würde."};
}

export async function onRequestPost({request}){
  let body;
  try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
  const result=checkCitation(body?.text);
  return Response.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
