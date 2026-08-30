import{ApiError,assertDatabase,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";

const COURSE="n8n-bootcamp",TOTAL_MODULES=12,EXAM_SIZE=30,PASS_SCORE=81;

const q=(id,topic,prompt,correct,wrong)=>({id,topic,prompt,correct,wrong});
const BANK=[
q("M01-01","grundlagen","Was ist in n8n ein Workflow?","Ein gerichteter Ablauf aus Triggern/Nodes, Daten und Verbindungen",["Eine einzelne API","Nur ein Cronjob","Ein Credential"]),
q("M01-02","grundlagen","Was startet einen ereignisbasierten n8n Ablauf?","Ein Trigger",["Merge","Set","Respond"]),
q("M01-03","grundlagen","Was beschreibt eine Execution?","Einen konkreten Lauf eines Workflows mit Input, Nodes und Resultaten",["Nur die Workflow-Datei","Ein Credential","Eine Datenbanktabelle"]),
q("M01-04","grundlagen","Warum ist ein Production Workflow mehr als ein Happy Path?","Er braucht Validierung, Fehlerpfade, Security, Observability und Recovery",["Weil er mehr Farben braucht","Nur wegen Git","Damit er länger wird"]),

q("M02-01","daten","Was ist ein n8n Item?","Eine Verarbeitungseinheit mit JSON und optional Binary Data",["Nur ein String","Ein Workflow-Tab","Ein API Key"]),
q("M02-02","daten","Warum Daten früh normalisieren?","Downstream Nodes erhalten einen stabilen Contract statt vieler Sonderfälle",["Damit mehr Felder entstehen","Nur für UI","Weil JSON sonst nicht funktioniert"]),
q("M02-03","daten","Expression {{$json.email}} bezieht sich typischerweise worauf?","Auf das aktuelle Item-Feld email",["Auf alle Workflows","Auf ein Credential","Auf eine SQL-Tabelle"]),
q("M02-04","daten","Merge ohne klaren Join-Key kann welches Problem erzeugen?","Falsche Zuordnung oder Datenverlust",["Automatisch bessere Performance","OAuth Refresh","TLS Error"]),

q("M03-01","api","HTTP GET wird primär wofür verwendet?","Ressourcen lesen/abrufen",["Ressourcen immer löschen","Passwort hashen","Workflow aktivieren"]),
q("M03-02","api","422 bedeutet typischerweise?","Request ist syntaktisch verständlich, aber fachlich/semantisch ungültig",["Success","Unauthorized","Rate Limit"]),
q("M03-03","api","Warum Statuscode + Response Body gemeinsam prüfen?","Transporterfolg allein beweist keinen fachlich richtigen Output",["Body ist immer leer","Nur wegen Logging","Statuscode hat keine Bedeutung"]),
q("M03-04","api","Pagination ist nötig wenn?","API Resultate auf mehrere Seiten/Cursor verteilt",["Nur bei POST","Nur bei OAuth","Nur bei Dateien"]),

q("M04-01","auth","401 vs 403?","401: Authentifizierung fehlt/fehlschlägt; 403: Identität erkannt, Zugriff verboten",["Beide identisch","401 Rate Limit, 403 Timeout","401 Not Found, 403 Success"]),
q("M04-02","auth","Wo gehört ein produktiver API Key hin?","Credential/Secret Store",["Workflow JSON","Browser LocalStorage","Git Commit"]),
q("M04-03","auth","OAuth2 Refresh Token dient wozu?","Neues Access Token erhalten, ohne Benutzer jedes Mal neu anzumelden",["Daten verschlüsseln","Webhook signieren","Rate Limit erhöhen"]),
q("M04-04","auth","Least Privilege bedeutet?","Nur benötigte Scopes/Rechte vergeben",["Immer Admin","Ein Credential für alles","Alle Scopes vorsorglich"]),

q("M05-01","flow","IF Node passt am besten wann?","Bei binärer Ja/Nein-Entscheidung",["Bei zehn klaren Routen immer","Nur bei Loops","Nur bei Fehlern"]),
q("M05-02","flow","Switch ist nützlich wann?","Mehrere klar definierte Routing-Fälle existieren",["Nur zwei Boolean-Werte","Nur HTTP","Nur Credentials"]),
q("M05-03","flow","Loop Over Items warum?","Items kontrolliert iterieren/batchen und Rate/Resource Limits respektieren",["Damit Item-Zahl steigt","Nur UI","Damit JSON verschlüsselt wird"]),
q("M05-04","flow","Idempotent işlem ne demek?","Aynı fachliche request tekrarlandığında unerwünschte ek side effect oluşmaması",["Her retry yeni kayıt oluşturur","Sadece GET demektir","Bir encryption türüdür"]),

q("M06-01","resilience","HTTP 429 için genel doğru yaklaşım?","Sınırlı retry + backoff + provider limitlerine saygı",["Sonsuz hızlı retry","Delete workflow","401'e çevir"]),
q("M06-02","resilience","HTTP 400/422 neden körlemesine retry edilmemeli?","Input düzelmeden aynı hata tekrar oluşur",["Çünkü server kapalıdır","Sadece network error","Rate limit"]),
q("M06-03","resilience","Dead Letter/Quarantine pattern amacı?","Tekrarlı başarısız işleri ana akışı bozmayacak şekilde ayırıp incelemek/replay etmek",["Success kayıtlarını silmek","Credential saklamak","Cache"]),
q("M06-04","resilience","Runbook ne sağlar?","Incident sırasında tanı, aksiyon, escalation ve recovery adımları",["Sadece architecture resmi","Fiyat listesi","OAuth token"]),

q("M07-01","persistence","Upsert ne yapar?","Match varsa update, yoksa insert",["Her zaman insert","Her zaman delete","Sadece read"]),
q("M07-02","persistence","Dedupe için güçlü event key?","Kaynak sistemin stabil ve benzersiz eventId'si",["Node position","Timestamp tek başına her zaman","İsim"]),
q("M07-03","persistence","Incremental sync cursor ne zaman ilerletilmeli?","İlgili batch başarıyla işlendiğinde",["İşleme başlamadan önce her zaman","Trigger çalışınca","Asla"]),
q("M07-04","persistence","Data Table yerine SQL DB ne zaman daha uygun olabilir?","Kompleks ilişkiler, büyük hacim ve multi-table transactions gerektiğinde",["Her basit lookup'ta","Sadece CSV için","Hiçbir zaman"]),

q("M08-01","files","n8n Binary Data ne taşır?","Dosya/byte içeriğini JSON'dan ayrı binary property'de",["Sadece Base64 text","Credential","SQL row"]),
q("M08-02","files","CSV Formula Injection riski hangi başlangıç karakterlerinde olabilir?","=, +, - veya @",["Sadece #","Sadece &","Sadece _"]),
q("M08-03","files","UTF-8 mismatch tipik belirtisi?","Umlaut/Türkçe karakterlerin bozulması",["401","Duplicate row","Webhook timeout"]),
q("M08-04","files","Untrusted file upload için hangi controls birlikte mantıklı?","Size/type validation, safe naming, content/scan ve controlled storage",["Sadece extension","Sadece filename","Sadece HTTPS"]),

q("M09-01","ai","RAG'ın temel amacı?","İlgili harici evidence'ı retrieval ile modele context olarak vermek",["Modeli her soruda retrain etmek","Secrets'i prompta koymak","Sadece token azaltmak"]),
q("M09-02","ai","Retrieval evidence zayıfsa güvenilir davranış?","Abstain / yeterli kaynak olmadığını söylemek",["Cevabı tahmin etmek","Temperature artırmak","Daha fazla tool izni"]),
q("M09-03","ai","Prompt Injection neden tool-using agent için daha riskli?","Manipüle edilmiş metin gerçek side effect tetikleyebilir",["Sadece output rengi değişir","Token sayısı sıfırlanır","Vector store silinir"]),
q("M09-04","ai","High-impact AI action için uygun control?","Policy check + least privilege + gerekirse human approval",["Model ne derse execute","Sadece uzun prompt","Secret'i modele ver"]),

q("M10-01","architecture","Sub-workflow neden kullanılır?","Tekrarlanan responsibility'yi reusable, test edilebilir component yapmak",["Her node'u ayrı workflow yapmak","Sadece UI düzeni","Credentials'i paylaşmak"]),
q("M10-02","architecture","Workflow input contract neden önemli?","Beklenen alan/tipleri ve data boundary'yi açıkça tanımlar",["Tüm parent data'yı zorunlu geçirir","Sadece naming","Retry sayısını artırır"]),
q("M10-03","architecture","Breaking contract change için güvenli rollout?","Yeni version paralel, caller migration, sonra eski version deprecate",["Eski version'u anında sil","Tüm caller'ları görmezden gel","Sadece workflow adını değiştir"]),
q("M10-04","architecture","Async sub-workflow için ekstra ne gerekir?","Correlation, independent monitoring ve error/recovery path",["Hiçbir şey","Sadece wait=true","Sadece UI notification"]),

q("M11-01","security","SSRF nedir?","Server-side request'in attacker-controlled target'a yönlendirilmesi",["SQL Injection","XSS","CSRF"]),
q("M11-02","security","169.254.169.254 target'ı neden block edilir?","Link-local/cloud metadata gibi hassas internal endpoint olabilir",["Public CDN olduğu için","Sadece HTTP/2 desteklemez","DNS değildir"]),
q("M11-03","security","SHA-256 hash tek başına gönderenin kimliğini kanıtlar mı?","Hayır; keyed HMAC/signature gibi authenticity control gerekir",["Evet her zaman","Sadece HTTPS'de evet","Hash encryption'dır"]),
q("M11-04","security","Audit log'da ne yapılmamalı?","Raw API key/password/access token saklamak",["requestId saklamak","status saklamak","redacted identifier saklamak"]),

q("M12-01","delivery","Discovery neden implementation'dan önce gelir?","Problem, volume, scope ve success criteria bilinmeden doğru solution/ROI tasarlanamaz",["Sadece sunum için","Node seçmek daha önemlidir","Gereksiz"]),
q("M12-02","delivery","Acceptance criterion nasıl olmalı?","Ölçülebilir ve test edilebilir pass/fail şartı",["'İyi olsun'","'Modern olsun'","'Mümkün olduğunca hızlı'"]),
q("M12-03","delivery","Payback period kaba formülü?","Project cost / monthly savings",["Monthly savings / project cost","Volume × hourly rate","Platform cost + project cost"]),
q("M12-04","delivery","Functional test passed ama security gate failed. Go-Live?","No-Go / security issue çözülmeli",["Go-Live","Sadece warning","Daha fazla retry"])
];

const randomInt=max=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%max;};
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=randomInt(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

function dynamicQuestions(){
 const mins=[5,8,12,15,20][randomInt(5)],volume=[50,120,300,500,800][randomInt(5)],rate=[35,42,50,60][randomInt(4)];
 const manual=Math.round(mins*volume/60*rate*100)/100;
 const project=[3000,5000,7500,12000][randomInt(4)],savings=[500,1000,1800,3000][randomInt(4)],payback=Math.round(project/savings*100)/100;
 const score=[0.08,0.14,0.22,0.55][randomInt(4)],threshold=0.18;
 const status=[400,422,429,500,503][randomInt(5)],retry=[429,500,503].includes(status);
 const url=["https://api.partner.example/v1","http://169.254.169.254/latest/meta-data/","http://127.0.0.1/admin","https://hooks.example.org/ingest"][randomInt(4)],blocked=/^http:|169\.254|127\.0\.0\.1/.test(url);
 const budget=[2500,6500,12000,22000][randomInt(4)],route=budget>=10000?"sales_priority":"sales_standard";
 const fields=["requestId,status,email","requestId,status,apiKey","customerId,route,token"][randomInt(3)],secret=/apiKey|token/.test(fields);
 const seen=Boolean(randomInt(2));
 return[
  q("DYN-ROI-"+mins+"-"+volume+"-"+rate,"economics",mins+" Min./Case × "+volume+" Cases/Monat × "+rate+" €/h. Manueller Monatsaufwand ungefähr?",manual.toLocaleString("de-DE")+" €",[Math.round(manual/10)+" €",Math.round(manual*2)+" €",volume+" €"]),
  q("DYN-PAY-"+project+"-"+savings,"economics","Projektkosten "+project+" €, monatliche Einsparung "+savings+" €. Payback?",payback+" Monate",[Math.round(savings/project*100)/100+" Monate",project+savings+" Monate","Nicht berechenbar"]),
  q("DYN-RAG-"+score,"ai","RAG maxScore="+score+", Threshold="+threshold+". Genügend Evidence?",score>=threshold?"Ja":"Nein",[score>=threshold?"Nein":"Ja","Immer antworten","Nur bei Top-K=1"]),
  q("DYN-HTTP-"+status,"resilience","Upstream HTTP "+status+". Generic Retry ohne Inputänderung grundsätzlich sinnvoll?",retry?"Ja, begrenzt und nur bei sicher wiederholbarer Operation":"Nein",[retry?"Nein":"Ja, unendlich","Nur nachts","Status irrelevant"]),
  q("DYN-URL-"+randomInt(100000),"security","Outbound target "+url+". Policy: HTTPS + public destinations. Ergebnis?",blocked?"Block":"Allow",[blocked?"Allow":"Block","Retry forever","Nur Admin"]),
  q("DYN-BUDGET-"+budget,"flow","Valid lead, budget="+budget+" €. Regel: ≥10000 priority. Route?",route,[route==="sales_priority"?"sales_standard":"sales_priority","validation_reject","security_review"]),
  q("DYN-LOG-"+randomInt(100000),"security","Audit fields: "+fields+". Secret-value redaction erforderlich?",secret?"Ja":"Keine Secrets; PII/minimization trotzdem prüfen",[secret?"Nein":"Ja, alles löschen","Nur Hash nötig","Logging verboten"]),
  q("DYN-DEDUP-"+seen,"persistence","eventId ist bereits persistent gespeichert="+seen+". Zweite fachliche Side-Effect ausführen?",seen?"Nein":"Ja",[seen?"Ja":"Nein","Immer zweimal","Nur bei 200"])
 ];
}

async function ensureExamSchema(db){
 await db.prepare("CREATE TABLE IF NOT EXISTS academy_final_exam_attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,course_id TEXT NOT NULL,enrollment_id TEXT NOT NULL,question_set_json TEXT NOT NULL,answer_key_json TEXT NOT NULL,submitted_answers_json TEXT,score INTEGER,status TEXT NOT NULL,started_at TEXT NOT NULL,submitted_at TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,FOREIGN KEY(enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE)").run();
}
async function enrollmentFor(db,userId){
 return db.prepare("SELECT e.id AS enrollment_id,c.id AS course_id FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug=? AND e.status IN('active','completed') LIMIT 1").bind(userId,COURSE).first();
}
async function progressFor(db,userId,courseId){
 const row=await db.prepare("SELECT COUNT(*) AS completed FROM academy_module_progress WHERE user_id=? AND course_id=? AND module_slug BETWEEN 'modul-01' AND 'modul-12' AND module_percent=100").bind(userId,courseId).first();
 return Number(row?.completed||0);
}
const publicAttempt=row=>row?{id:row.id,status:row.status,score:row.score===null?null:Number(row.score),startedAt:row.started_at,submittedAt:row.submitted_at,questions:row.status==="started"?JSON.parse(row.question_set_json||"[]"):undefined}:null;

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureExamSchema(db);
  const user=await requireSession(db,request),enrollment=await enrollmentFor(db,user.user_id);
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Keine aktive Anmeldung für den n8n Bootcamp.");
  const completedModules=await progressFor(db,user.user_id,enrollment.course_id);
  const best=await db.prepare("SELECT MAX(score) AS best,COUNT(*) AS attempts FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status<>'started'").bind(user.user_id,enrollment.course_id).first();
  const active=await db.prepare("SELECT id,status,score,started_at,submitted_at,question_set_json FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status='started' ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id).first();
  return json({ok:true,eligibility:{completedModules,totalModules:TOTAL_MODULES,modulesReady:completedModules===TOTAL_MODULES},exam:{bestScore:Number(best?.best||0),attempts:Number(best?.attempts||0),passScore:PASS_SCORE,activeAttempt:publicAttempt(active)},requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureExamSchema(db);
  const user=await requireSession(db,request),enrollment=await enrollmentFor(db,user.user_id);
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Keine aktive Anmeldung für den n8n Bootcamp.");
  const body=await readJson(request,32768),action=String(body?.action||"");
  if(action==="start"){
   const active=await db.prepare("SELECT id,status,score,started_at,submitted_at,question_set_json FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status='started' ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id).first();
   if(active)return json({ok:true,resumed:true,attempt:publicAttempt(active),requestId:traceId});

   const previous=await db.prepare("SELECT question_set_json FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status<>'started' ORDER BY submitted_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id).first();
   const prevIds=new Set((previous?JSON.parse(previous.question_set_json||"[]"):[]).map(x=>x.id));
   const pool=[...BANK,...dynamicQuestions()];
   const fresh=shuffle(pool.filter(x=>!prevIds.has(x.id))),old=shuffle(pool.filter(x=>prevIds.has(x.id)));
   const selected=[...fresh,...old].slice(0,EXAM_SIZE);
   const answerKey={},questions=selected.map(item=>{
    const options=shuffle([item.correct,...item.wrong]);
    answerKey[item.id]=item.correct;
    return{id:item.id,topic:item.topic,prompt:item.prompt,options};
   });
   const id=crypto.randomUUID(),now=new Date().toISOString();
   await db.prepare("INSERT INTO academy_final_exam_attempts(id,user_id,course_id,enrollment_id,question_set_json,answer_key_json,status,started_at) VALUES(?,?,?,?,?,?,?,?)").bind(id,user.user_id,enrollment.course_id,enrollment.enrollment_id,JSON.stringify(questions),JSON.stringify(answerKey),"started",now).run();
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.started","course",enrollment.course_id,JSON.stringify({attemptId:id,questionCount:questions.length}),now).run();
   return json({ok:true,resumed:false,attempt:{id,status:"started",startedAt:now,questions},requestId:traceId});
  }

  if(action==="submit"){
   const attemptId=String(body?.attemptId||""),answers=body?.answers;
   if(!attemptId||!answers||typeof answers!=="object"||Array.isArray(answers))throw new ApiError(422,"validation_failed","Ungültige Prüfungsabgabe.");
   const attempt=await db.prepare("SELECT * FROM academy_final_exam_attempts WHERE id=? AND user_id=? AND course_id=? LIMIT 1").bind(attemptId,user.user_id,enrollment.course_id).first();
   if(!attempt)throw new ApiError(404,"attempt_not_found","Prüfungsversuch nicht gefunden.");
   if(attempt.status!=="started")throw new ApiError(409,"attempt_closed","Dieser Prüfungsversuch wurde bereits abgegeben.");
   const questions=JSON.parse(attempt.question_set_json||"[]"),key=JSON.parse(attempt.answer_key_json||"{}");
   if(questions.length!==EXAM_SIZE)throw new ApiError(500,"attempt_invalid","Prüfungsversuch ist technisch ungültig.");
   let correct=0;
   for(const item of questions){if(String(answers[item.id]??"")===String(key[item.id]??""))correct++;}
   const score=Math.round(correct/questions.length*100),examPassed=score>=PASS_SCORE,completedModules=await progressFor(db,user.user_id,enrollment.course_id),modulesReady=completedModules===TOTAL_MODULES;
   const status=examPassed?(modulesReady?"passed":"exam_passed_modules_pending"):"failed",now=new Date().toISOString();
   await db.batch([
    db.prepare("UPDATE academy_final_exam_attempts SET submitted_answers_json=?,score=?,status=?,submitted_at=? WHERE id=?").bind(JSON.stringify(answers),score,status,now,attemptId),
    db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),enrollment.enrollment_id,score,status,JSON.stringify({type:"n8n-bootcamp-final",attemptId,questionCount:questions.length,completedModules}),now),
    db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.submitted","course",enrollment.course_id,JSON.stringify({attemptId,score,status,completedModules}),now)
   ]);
   return json({ok:true,result:{score,correct,total:questions.length,passScore:PASS_SCORE,examPassed,completedModules,totalModules:TOTAL_MODULES,modulesReady,certificationEligible:examPassed&&modulesReady,status},requestId:traceId});
  }
  throw new ApiError(422,"validation_failed","Unbekannte Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});