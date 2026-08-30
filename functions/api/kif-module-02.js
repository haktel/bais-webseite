// Deterministic, rule-based "Halluzinations- & Bias-Checker" for KI-Führerschein
// Modul 02. Given a piece of AI-GENERATED OUTPUT text (not a prompt - see
// kif-module-01.js for the prompt checker), it flags two independent risk
// signals that a human reviewer should always check for before publishing
// or acting on an AI answer:
//
//  - overclaiming: language that asserts certainty with no room for doubt
//    ("garantiert", "zu 100% korrekt", ...) - real models can still be
//    confidently wrong, so absolute language is itself a warning sign.
//  - an unbelegte Zahl/Fakt: a specific statistic, percentage or year
//    stated with neither a hedge ("könnte", "vermutlich", "etwa") nor an
//    attributed source ("laut...", "Quelle:", "Studie von...") nor any
//    suggestion to verify it. Precise-looking numbers are exactly where
//    generative models hallucinate most convincingly.
//
// Both flags together is a hard block (kritisch, 422) - overclaiming AND an
// unverifiable specific claim in the same output is the classic hallucination
// pattern. One flag alone still needs a second look (pruefen). Neither flag
// means the text is hedged and/or sourced responsibly (verlaesslich).

const ABSOLUTE_PATTERN=/\b(garantiert|absolut sicher|niemals falsch|ohne jeden zweifel|unumstritten|felsenfest|zweifelsfrei)\b|zu\s?100\s?%/i;
const SOURCE_PATTERN=/\b(laut|quelle|gemäß|studie von|berichten zufolge|offiziellen angaben|nach angaben von)\b/i;
const HEDGE_PATTERN=/\b(vermutlich|möglicherweise|schätzungsweise|könnte|könnten|unklar|ca\.|etwa|geschätzt|ungefähr|nicht sicher)\b/i;
const VERIFY_PATTERN=/\b(prüfen|abgleichen|verifizieren|gegenchecken|nachprüfen|nachrecherchieren)\b/i;
const STAT_PATTERN=/\b\d{1,3}(?:[.,]\d+)?\s?%|\b(19|20)\d{2}\b|\b\d+[.,]\d+\s?(millionen|milliarden)\b/i;

export function checkOutput(rawInput){
  const raw=String(rawInput??"").trim();
  if(!raw)return{ok:false,status:422,reason:"Bitte füge einen KI-generierten Text ein."};
  if(raw.length>4000)return{ok:false,status:422,reason:"Text ist zu lang (max. 4000 Zeichen)."};

  const overclaiming=ABSOLUTE_PATTERN.test(raw);
  const hasStat=STAT_PATTERN.test(raw);
  const hasCaution=SOURCE_PATTERN.test(raw)||HEDGE_PATTERN.test(raw)||VERIFY_PATTERN.test(raw);
  const unbelegteZahl=hasStat&&!hasCaution;

  const checks={
    ueberzogeneSicherheit:overclaiming,
    unbelegteZahlOderJahr:unbelegteZahl,
    hatQuelleOderVorbehalt:hasCaution
  };

  if(overclaiming&&unbelegteZahl){
    return{ok:false,status:422,route:"kritisch",reason:"Absolute Sicherheitssprache kombiniert mit einer unbelegten, präzisen Zahl/Jahresangabe - klassisches Halluzinations-Warnsignal. Nicht ohne Prüfung verwenden.",checks};
  }
  if(overclaiming||unbelegteZahl){
    const feedback=overclaiming
      ?"Absolute Sicherheitssprache (\"garantiert\", \"zu 100%\", ...) ohne belegbaren Beweis. Vor Verwendung abschwächen oder Beleg ergänzen."
      :"Eine präzise Zahl/Jahresangabe ohne Quelle oder Vorbehalt. Vor Veröffentlichung verifizieren oder als Schätzung kennzeichnen.";
    return{ok:true,status:200,route:"pruefen",score:55,feedback,checks};
  }
  return{ok:true,status:200,route:"verlaesslich",score:90,feedback:"Der Text ist angemessen zurückhaltend formuliert und/oder belegt - trotzdem bleibt eine inhaltliche Prüfung sinnvoll, bevor er verwendet wird.",checks};
}

export async function onRequestPost({request}){
  let body;
  try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
  const result=checkOutput(body?.text);
  return Response.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
