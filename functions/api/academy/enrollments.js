import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../_lib/api.js";
const PROGRAMS={"ki-fuehrerschein":"KI-Führerschein Essentials","ki-leadership":"KI-Führerschein Leadership","ki-it-security":"KI-Führerschein IT & Security","data-literacy":"Datenkompetenz für AI","prompt-engineering":"Prompt Engineering Professional","secure-ai-rag":"Secure AI & RAG","ai-agents":"AI Agents & Workflow Labs","enterprise-tools":"ChatGPT, Copilot & Gemini","n8n-bootcamp":"n8n Automation Bootcamp","ai-coding":"AI-gestützte Softwareentwicklung","api-integration":"APIs, Webhooks & Systemintegration","knowledge-assistant-lab":"Knowledge Assistant Lab","ai-governance":"AI Governance Essentials","eu-ai-act":"AI Literacy & EU AI Act Awareness","caio-masterguide":"CAIO Masterguide","policy-enablement":"AI Policy Enablement","ai-for-sales":"AI for Sales & B2B Vertrieb","ai-customer-service":"AI im Kundenservice","prozessanalyse-automation":"Prozessanalyse & Automation Discovery","it-projektmanagement-ai-delivery":"IT-Projektmanagement & AI Delivery"};
export const onRequestPost=async({request,env})=>{
 const id=requestId(request);
 try{
  const db=assertDatabase(env),body=await readJson(request);
  const name=cleanText(body.name,120),email=cleanText(body.email,254).toLowerCase(),company=cleanText(body.company,160);
  const courseSlug=cleanText(body.courseSlug,120),note=cleanText(body.note,2000);
  if(name.length<2||!validEmail(email)||!courseSlug||!PROGRAMS[courseSlug]) throw new ApiError(422,"validation_failed","Name, gültige E-Mail und Programm sind erforderlich.");
  let course=await db.prepare("SELECT id,title,status FROM courses WHERE slug=? LIMIT 1").bind(courseSlug).first();
  if(!course){const courseId="course-"+courseSlug,now=new Date().toISOString();await db.prepare("INSERT OR IGNORE INTO courses(id,slug,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(courseId,courseSlug,PROGRAMS[courseSlug],"BAIS Academy Programm","published",now,now).run();course=await db.prepare("SELECT id,title,status FROM courses WHERE slug=? LIMIT 1").bind(courseSlug).first();}
  if(!course||course.status!=="published") throw new ApiError(404,"course_not_found","Das gewählte Academy-Programm ist nicht verfügbar.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  const idValue=crypto.randomUUID(),createdAt=new Date().toISOString();
  await db.prepare("INSERT INTO enrollment_requests(id,course_id,name,email,company,note,status,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(idValue,course.id,name,email,company||null,note||null,"new",createdAt).run();
  return json({ok:true,id:idValue,message:"Ihre Academy-Anfrage wurde übermittelt.",requestId:id},201);
 }catch(error){return handleError(error,id);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
