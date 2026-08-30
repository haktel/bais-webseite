// Deterministic "Freigabe-Router" for KI-Führerschein Modul 06. Given a
// short description of an intended use of AI-generated content, determines
// which approval tier applies before it can be used/published:
//
//  - keine: a personal, internal draft with no sensitive topic and no
//    external audience. No formal approval needed, but still worth a
//    self-check before sharing it further.
//  - team_review: internal, team-facing content, or content touching a
//    sensitive topic but staying internal. Needs a second person's review.
//  - vollfreigabe: external/customer-facing AND touching a sensitive topic
//    (legal, medical, financial, data protection). Hard block until a full
//    sign-off has happened - this is exactly the combination that caused
//    several public chatbot incidents.

// Word-stem wildcards (\w*), not exact \b-bounded words: German inflected
// endings ("externe", "rechtlichen", "Kundinnen") otherwise silently fail
// to match a bare "extern"/"recht"/"kunde" bounded on both sides.
const EXTERNAL_PATTERN=/\b(kund\w*|öffentlich\w*|extern\w*|website|presse|social media|marketing)\b/i;
const TEAM_PATTERN=/\b(intern\w*|team\w*|kolleg\w*|abteilung\w*)\b/i;
const PERSONAL_PATTERN=/\b(persönlich\w*|eigen\w*|entwurf\w*|notiz\w*)\b/i;
const SENSITIVE_TOPIC_PATTERN=/\b(recht\w*|vertrag\w*|klage\w*|medizin\w*|gesundheit\w*|diagnose\w*|finanz\w*|kredit\w*|steuer\w*|dsgvo|datenschutz\w*)\b/i;

export function checkEscalation(rawInput){
  const raw=String(rawInput??"").trim();
  if(!raw)return{ok:false,status:422,reason:"Bitte beschreibe das Szenario."};
  if(raw.length>2000)return{ok:false,status:422,reason:"Beschreibung ist zu lang (max. 2000 Zeichen)."};

  const checks={
    extern:EXTERNAL_PATTERN.test(raw),
    team:TEAM_PATTERN.test(raw),
    persoenlich:PERSONAL_PATTERN.test(raw),
    sensiblesThema:SENSITIVE_TOPIC_PATTERN.test(raw)
  };

  if(checks.extern&&checks.sensiblesThema){
    return{ok:false,status:422,route:"vollfreigabe",checks,reason:"Externe/kundenseitige Reichweite kombiniert mit einem sensiblen Themenfeld (Recht, Medizin, Finanzen, Datenschutz). Braucht eine vollständige Freigabe durch die zuständige Fachstelle, bevor es verwendet wird."};
  }
  if(checks.extern||checks.team||checks.sensiblesThema){
    return{ok:true,status:200,route:"team_review",checks,feedback:"Braucht eine Prüfung durch eine zweite Person, bevor es verwendet oder weitergegeben wird."};
  }
  if(checks.persoenlich){
    return{ok:true,status:200,route:"keine",checks,feedback:"Persönlicher Entwurf ohne externe Reichweite oder sensibles Thema - keine formale Freigabe nötig, vor Weitergabe aber trotzdem kurz prüfen."};
  }
  return{ok:true,status:200,route:"team_review",checks,feedback:"Reichweite und Thema sind unklar - im Zweifel eine zweite Person prüfen lassen."};
}

export async function onRequestPost({request}){
  let body;
  try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
  const result=checkEscalation(body?.scenario);
  return Response.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
