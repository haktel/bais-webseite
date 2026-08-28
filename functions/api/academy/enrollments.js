import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../_lib/api.js";
const PROGRAMS={"ki-fuehrerschein":"KI-Führerschein Essentials","ki-leadership":"KI-Führerschein Leadership","ki-it-security":"KI-Führerschein IT & Security","data-literacy":"Datenkompetenz für AI","prompt-engineering":"Prompt Engineering Professional","secure-ai-rag":"Secure AI & RAG","ai-agents":"AI Agents & Workflow Labs","enterprise-tools":"ChatGPT, Copilot & Gemini","n8n-bootcamp":"n8n Automation Bootcamp","ai-coding":"AI-gestützte Softwareentwicklung","api-integration":"APIs, Webhooks & Systemintegration","knowledge-assistant-lab":"Knowledge Assistant Lab","ai-governance":"AI Governance Essentials","eu-ai-act":"AI Literacy & EU AI Act Awareness","caio-masterguide":"CAIO Masterguide","policy-enablement":"AI Policy Enablement","ai-for-sales":"AI for Sales & B2B Vertrieb","ai-customer-service":"AI im Kundenservice","prozessanalyse-automation":"Prozessanalyse & Automation Discovery","it-projektmanagement-ai-delivery":"IT-Projektmanagement & AI Delivery"};
const normalizeInterests=(value,primary)=>{const raw=Array.isArray(value)?value:typeof value==="string"?[value]:[];return[...new Set(raw.map(item=>cleanText(item,120)).filter(slug=>slug&&slug!==primary&&PROGRAMS[slug]))].slice(0,19);};
export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env),body=await readJson(request);
  const name=cleanText(body.name,120),email=cleanText(body.email,254).toLowerCase(),company=cleanText(body.company,160);
  const courseSlug=cleanText(body.courseSlug,120),note=cleanText(body.note,2000),additionalCourses=normalizeInterests(body.additionalCourses,courseSlug);
  if(name.length<2||!validEmail(email)||!courseSlug||!PROGRAMS[courseSlug])throw new ApiError(422,"validation_failed","Name, gültige E-Mail und Hauptprogramm sind erforderlich.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  await db.exec("CREATE TABLE IF NOT EXISTS enrollment_request_interests(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,course_id TEXT NOT NULL,interest_type TEXT NOT NULL CHECK(interest_type IN ('primary','additional')),created_at TEXT NOT NULL,UNIQUE(request_id,course_id),FOREIGN KEY(request_id) REFERENCES enrollment_requests(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id))");
  const requested=[courseSlug,...additionalCourses],now=new Date().toISOString();
  for(const slug of requested){
   await db.prepare("INSERT OR IGNORE INTO courses(id,slug,title,description,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind("course-"+slug,slug,PROGRAMS[slug],"BAIS Academy Programm","published",now,now).run();
  }
  const rows=await db.prepare("SELECT id,slug,status FROM courses WHERE slug IN ("+requested.map(()=>"?").join(",")+")").bind(...requested).all();
  const bySlug=new Map((rows.results||[]).filter(row=>row.status==="published").map(row=>[row.slug,row.id]));
  if(!bySlug.has(courseSlug))throw new ApiError(404,"course_not_found","Das gewählte Academy-Programm ist nicht verfügbar.");
  const requestIdValue=crypto.randomUUID();
  const statements=[
   db.prepare("INSERT INTO enrollment_requests(id,course_id,name,email,company,note,status,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(requestIdValue,bySlug.get(courseSlug),name,email,company||null,note||null,"new",now),
   db.prepare("INSERT INTO enrollment_request_interests(id,request_id,course_id,interest_type,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),requestIdValue,bySlug.get(courseSlug),"primary",now)
  ];
  for(const slug of additionalCourses){const courseId=bySlug.get(slug);if(courseId)statements.push(db.prepare("INSERT INTO enrollment_request_interests(id,request_id,course_id,interest_type,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),requestIdValue,courseId,"additional",now));}
  await db.batch(statements);
  return json({ok:true,id:requestIdValue,additionalCourseCount:additionalCourses.length,message:"Ihre Academy-Anfrage wurde übermittelt. Wir stimmen den passenden Lernpfad mit Ihnen ab.",requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});