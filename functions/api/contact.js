import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../_lib/api.js";
import{buildLeadPayload,callLeadQualificationWebhook,mapLeadResult}from"../_lib/n8n.js";
const TOPICS=new Set(["AI Engineering","Cybersecurity","Automation / n8n","BAIS Academy","AI Governance / CAIO","Project Portal","Sonstiges"]);

async function qualifyLead(db,leadId,lead,requestId){
 try{
  const upstream=await callLeadQualificationWebhook(buildLeadPayload(lead));
  const mapped=mapLeadResult(await upstream.json().catch(()=>null));
  if(!mapped) throw new Error(`n8n responded with status ${upstream.status}`);
  await db.prepare("UPDATE contacts SET score=?,route=?,n8n_execution_id=? WHERE id=?")
   .bind(mapped.score,mapped.route,mapped.executionId,leadId).run();
  console.log(JSON.stringify({level:"info",event:"contact_qualified",leadId,score:mapped.score,route:mapped.route,requestId}));
 }catch(error){
  console.error(JSON.stringify({level:"error",event:"contact_qualification_failed",leadId,requestId,message:error instanceof Error?error.message:"unknown"}));
 }
}

export const onRequestPost=async({request,env,waitUntil})=>{
 const id=requestId(request);
 try{
  const db=assertDatabase(env),body=await readJson(request);
  const name=cleanText(body.name,120),company=cleanText(body.company,160),email=cleanText(body.email,254).toLowerCase();
  const phone=cleanText(body.phone,60),topic=cleanText(body.topic,80),timeline=cleanText(body.timeline,80),message=cleanText(body.message,4000);
  if(name.length<2||!validEmail(email)||message.length<20) throw new ApiError(422,"validation_failed","Name, gültige E-Mail und eine Nachricht mit mindestens 20 Zeichen sind erforderlich.");
  if(topic&&!TOPICS.has(topic)) throw new ApiError(422,"invalid_topic","Das gewählte Thema ist ungültig.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  const leadId=crypto.randomUUID(),createdAt=new Date().toISOString();
  await db.prepare("INSERT INTO contacts(id,name,company,email,phone,topic,timeline,message,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
   .bind(leadId,name,company||null,email,phone||null,topic||"Sonstiges",timeline||null,message,"new",createdAt).run();
  waitUntil(Promise.resolve().then(()=>console.log(JSON.stringify({level:"info",event:"contact_created",leadId,requestId:id}))));
  waitUntil(qualifyLead(db,leadId,{name,email,company,topic,message},id));
  return json({ok:true,id:leadId,message:"Vielen Dank. Ihre Anfrage wurde sicher übermittelt.",requestId:id},201);
 }catch(error){return handleError(error,id);}
};
export const onRequest=({request})=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
