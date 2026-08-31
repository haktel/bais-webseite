import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../_lib/api.js";
import{buildLeadPayload,callLeadQualificationWebhook,mapLeadResult}from"../../_lib/n8n.js";
import{privacyPolicy,scheduleRetention,runPrivacyCleanup}from"../../_lib/privacy.js";
import{ensureLeadScoringSchema}from"../../_lib/lead-scoring-schema.js";
const PROGRAMS={"ki-fuehrerschein":"KI-Führerschein Essentials","ki-leadership":"KI-Führerschein Leadership","ki-it-security":"KI-Führerschein IT & Security","data-literacy":"Datenkompetenz für AI","prompt-engineering":"Prompt Engineering Professional","secure-ai-rag":"Secure AI & RAG","ai-agents":"AI Agents & Workflow Labs","enterprise-tools":"ChatGPT, Copilot & Gemini","n8n-bootcamp":"n8n Automation Bootcamp","ai-coding":"AI-gestützte Softwareentwicklung","api-integration":"APIs, Webhooks & Systemintegration","knowledge-assistant-lab":"Knowledge Assistant Lab","ai-governance":"AI Governance Essentials","eu-ai-act":"AI Literacy & EU AI Act Awareness","caio-masterguide":"CAIO Masterguide","policy-enablement":"AI Policy Enablement","ai-for-sales":"AI for Sales & B2B Vertrieb","ai-customer-service":"AI im Kundenservice","prozessanalyse-automation":"Prozessanalyse & Automation Discovery","it-projektmanagement-ai-delivery":"IT-Projektmanagement & AI Delivery"};

async function qualifyEnrollment(db,enrollmentId,lead,traceId){
 try{
  await ensureLeadScoringSchema(db,"enrollment_requests");
  const upstream=await callLeadQualificationWebhook(buildLeadPayload(lead),{db});
  const mapped=mapLeadResult(await upstream.json().catch(()=>null));
  if(!mapped) throw new Error(`n8n responded with status ${upstream.status}`);
  await db.prepare("UPDATE enrollment_requests SET score=?,route=?,n8n_execution_id=? WHERE id=?")
   .bind(mapped.score,mapped.route,mapped.executionId,enrollmentId).run();
  console.log(JSON.stringify({level:"info",event:"enrollment_qualified",enrollmentId,score:mapped.score,route:mapped.route,traceId}));
 }catch(error){
  console.error(JSON.stringify({level:"error",event:"enrollment_qualification_failed",enrollmentId,traceId,message:error instanceof Error?error.message:"unknown"}));
 }
}

export const onRequestPost=async({request,env,waitUntil})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env),body=await readJson(request);
  const name=cleanText(body.name,120),email=cleanText(body.email,254).toLowerCase(),company=cleanText(body.company,160);
  const courseSlug=cleanText(body.courseSlug,120),note=cleanText(body.note,2000);
  if(name.length<2||!validEmail(email)||!PROGRAMS[courseSlug])throw new ApiError(422,"validation_failed","Name, gültige E-Mail und Academy-Programm sind erforderlich.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  const now=new Date().toISOString(),courseId="course-"+courseSlug;
  await db.prepare("INSERT OR IGNORE INTO courses(id,slug,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(courseId,courseSlug,PROGRAMS[courseSlug],"BAIS Academy Programm","published",now,now).run();
  const course=await db.prepare("SELECT id,status FROM courses WHERE slug=? LIMIT 1").bind(courseSlug).first();
  if(!course||course.status!=="published")throw new ApiError(404,"course_not_found","Das gewählte Academy-Programm ist nicht verfügbar.");
  const enrollmentId=crypto.randomUUID();
  await db.prepare("INSERT INTO enrollment_requests(id,course_id,name,email,company,note,status,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(enrollmentId,course.id,name,email,company||null,note||null,"new",now).run();
  await scheduleRetention(db,{entityType:"enrollment_request",entityId:enrollmentId,days:privacyPolicy(env).openLeadDays,reason:"open_enrollment_retention",now});
  waitUntil(qualifyEnrollment(db,enrollmentId,{name,email,company,topic:PROGRAMS[courseSlug],message:note||`Anmeldung für ${PROGRAMS[courseSlug]}`},traceId));
  waitUntil(runPrivacyCleanup(db,{limit:20}).catch(()=>null));
  return json({ok:true,id:enrollmentId,message:"Ihre Academy-Anmeldung wurde übermittelt. Wir melden uns persönlich bei Ihnen.",requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});