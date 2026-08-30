// Deterministic "Prompt-Bausteine-Analyzer" for KI-Führerschein Modul 03.
// Unlike kif-module-01.js (which checks a prompt for datenschutz/quality
// red flags) this scores STRUCTURAL COMPLETENESS: how many of the five
// building blocks taught in this module - Rolle, Aufgabe, Kontext, Format,
// Einschränkung - are actually present in a given prompt.

const ROLE_PATTERN=/\b(als|in der rolle|du bist|agiere als|antworte als)\b/i;
const TASK_PATTERN=/\b(schreibe?|erstelle?|fasse?|übersetze?|formuliere?|prüfe?|analysiere?|erkläre?|liste?|vergleiche?|entwirf|beantworte?)\b/i;
const CONTEXT_PATTERN=/\b(für|zielgruppe|kunden?|team|projekt|im stil von|zweck|damit)\b/i;
const FORMAT_PATTERN=/\b(stichpunkte|tabelle|e-?mail|absätze|wörter|zeichen|format|ton:|maximal|max\.|liste|überschrift)\b/i;
const CONSTRAINT_PATTERN=/\b(nicht|kein|keine|ohne|vermeide|ausschließlich|nur)\b/i;

export function checkPromptStructure(rawInput){
  const raw=String(rawInput??"").trim();
  if(!raw)return{ok:false,status:422,reason:"Bitte gib einen Prompt ein."};
  if(raw.length>2000)return{ok:false,status:422,reason:"Prompt ist zu lang (max. 2000 Zeichen)."};

  const blocks={
    rolle:ROLE_PATTERN.test(raw),
    aufgabe:TASK_PATTERN.test(raw),
    kontext:CONTEXT_PATTERN.test(raw),
    format:FORMAT_PATTERN.test(raw),
    einschraenkung:CONSTRAINT_PATTERN.test(raw)
  };
  const present=Object.values(blocks).filter(Boolean).length;
  const score=Math.round(present/5*100);
  const missing=Object.entries(blocks).filter(([,v])=>!v).map(([k])=>k);

  if(score<40){
    return{ok:false,status:422,route:"unzureichend",score,blocks,missing,reason:"Zu wenige Bausteine vorhanden ("+present+"/5). Dieser Prompt sollte vor dem Absenden überarbeitet werden."};
  }
  if(score<80){
    return{ok:true,status:200,route:"teilweise",score,blocks,missing,feedback:"Ein brauchbarer Ausgangspunkt ("+present+"/5 Bausteine) - noch nicht vollständig. Fehlend: "+missing.join(", ")+"."};
  }
  return{ok:true,status:200,route:"vollstaendig",score,blocks,missing,feedback:"Alle oder fast alle Bausteine vorhanden ("+present+"/5) - ein präziser, gut strukturierter Prompt."};
}

export async function onRequestPost({request}){
  let body;
  try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
  const result=checkPromptStructure(body?.prompt);
  return Response.json(result,{status:result.status,headers:{"Cache-Control":"no-store"}});
}

export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
