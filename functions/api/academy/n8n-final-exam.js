import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="n8n-bootcamp",MODULE_COUNT=12,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=60;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Ein n8n Workflow soll Kundenanfragen empfangen. Welcher Entwurf trennt Trigger und Business-Logik am saubersten?","Webhook als Trigger, danach Validierung und Transformation",["Webhook direkt mit allen Seiteneffekten überladen","Nur Schedule Trigger verwenden","Alle Daten zuerst als String serialisieren"],"Trigger startet den Prozess; Validierung und Verarbeitung bleiben getrennte Schritte."),
q("M01-02",1,"Warum sind Executions für Debugging wichtig?","Sie zeigen Input, Node-Verlauf und Output eines konkreten Runs",["Sie ersetzen Monitoring vollständig","Sie sind nur Design-Historie","Sie speichern ausschließlich Credentials"],"Execution-Daten helfen, einen konkreten Fehlerpfad nachzuvollziehen."),
q("M01-03",1,"Ein Workflow funktioniert im Test, aber nicht in Production. Was prüfst du zuerst?","Trigger/Webhook-URL, aktivierten Workflow und Production-Input",["Node-Farben","Nur Browser-Cache","Workflow neu zeichnen"],"Test- und Production-Ausführung haben unterschiedliche Triggerpfade."),
q("M01-04",1,"Was bedeutet Production-Reife bei einem einfachen Workflow?","Validierte Inputs, definierte Fehlerpfade, Monitoring und dokumentierte Ownership",["Nur grüne Nodes","Mindestens 20 Nodes","Ein schöner Screenshot"],"Produktionsreife ist ein Betriebszustand, kein Designmerkmal."),

q("M02-01",2,"Ein API-Response enthält customer.profile.email. Was ist der robusteste Zugriff?","Datenstruktur prüfen und gezielt den verschachtelten Pfad mappen",["Gesamtes JSON als Text durchsuchen","Immer $json.email annehmen","Nested JSON vermeiden"],"Expressions müssen zur tatsächlichen Datenstruktur passen."),
q("M02-02",2,"Warum sollte ein Workflow eingehende Datensätze früh normalisieren?","Downstream-Nodes arbeiten dann mit einem stabilen Datenvertrag",["Damit mehr Felder entstehen","Damit jede Node andere Feldnamen nutzt","Nur für optische Ordnung"],"Normalisierung reduziert Sonderfälle in späteren Nodes."),
q("M02-03",2,"Mehrere Items sollen unabhängig verarbeitet werden. Welche Annahme ist falsch?","$input.first() repräsentiert automatisch alle Items",["Jedes Item kann eigene JSON-Werte tragen","Code Node kann über mehrere Items iterieren","Item-Anzahl beeinflusst Downstream-Verarbeitung"],"$input.first() liefert nur das erste Item."),
q("M02-04",2,"Wann ist ein Code Node sinnvoller als viele kleine Mapping-Nodes?","Bei klar begrenzter, testbarer Transformation mit komplexerer Logik",["Immer, auch für einfaches Rename","Wenn man Credentials verstecken will","Nur bei HTTP 500"],"Code sollte gezielt eingesetzt werden, nicht als Ersatz für jede Standard-Node."),

q("M03-01",3,"Eine REST-API liefert HTTP 201. Was bedeutet das typischerweise?","Ressource wurde erfolgreich erstellt",["Authentifizierung fehlgeschlagen","Rate Limit erreicht","Server ist offline"],"201 Created signalisiert erfolgreiche Erstellung."),
q("M03-02",3,"Welche Kombination ist für eine idempotente Leseoperation typisch?","GET + Query Parameter",["POST + Delete Body","PATCH + Webhook Secret","DELETE + Pagination"],"GET wird typischerweise für Lesezugriffe verwendet."),
q("M03-03",3,"Ein Webhook nimmt externe Daten an. Was gehört vor Business-Aktionen?","Authentizität/Integrität und Schema validieren",["Sofort CRM-Datensatz löschen","Nur Status 200 senden","Payload ungeprüft loggen"],"Untrusted Input darf nicht direkt Seiteneffekte auslösen."),
q("M03-04",3,"Eine API paginiert 100 Datensätze pro Seite. 350 Datensätze sollen geladen werden. Was braucht der Workflow?","Pagination/Loop mit Abbruchbedingung",["Nur einen GET-Request","Ein Retry ohne Cursor","Ein PDF-Parser"],"Mehrere Seiten müssen kontrolliert nachgeladen werden."),

q("M04-01",4,"Wo gehört ein produktiver API-Key in n8n hin?","In den Credential Store bzw. eine sichere Credential-Konfiguration",["In den Workflow-Namen","In öffentliches Browser-JavaScript","Als Klartext in Git"],"Secrets dürfen nicht in versionierte oder öffentliche Artefakte."),
q("M04-02",4,"HTTP 401 und 403 unterscheiden sich typischerweise wie?","401: Authentifizierung fehlt/ungültig; 403: Identität bekannt, Zugriff nicht erlaubt",["Beide bedeuten immer Rate Limit","401 ist Serverfehler, 403 Netzwerkfehler","Es gibt keinen Unterschied"],"Authentication und Authorization sind getrennte Kontrollen."),
q("M04-03",4,"Warum ist OAuth2 besser als ein dauerhaft geteilter Master-Key für viele SaaS-Integrationen?","Scopes, Ablauf und widerrufbare Tokens begrenzen den Zugriff",["OAuth2 braucht keine Credentials","OAuth2 verhindert alle Angriffe","Tokens sind immer unbegrenzt gültig"],"OAuth2 ermöglicht feinere und widerrufbare Berechtigungen."),
q("M04-04",4,"Ein Token ist abgelaufen. Was ist ein sinnvoller Pfad?","Refresh/erneute Authentifizierung gemäß Provider-Flow statt blindem Retry",["Token in Logs suchen","Denselben Request unendlich wiederholen","403 in 200 umwandeln"],"Credential-Lifecycle muss explizit behandelt werden."),

q("M05-01",5,"Wann ist Switch gegenüber mehreren verschachtelten IF-Nodes sinnvoll?","Wenn mehrere klar definierte Routen anhand eines Feldes entschieden werden",["Wenn nur true/false existiert","Nur bei Binary Data","Switch ersetzt Datenvalidierung"],"Switch macht Mehrfachrouting lesbarer."),
q("M05-02",5,"Ein Fallback-Pfad in Business-Routing dient wozu?","Unerwartete Werte kontrolliert behandeln statt still zu verlieren",["Alle Fehler ignorieren","Immer höchste Priorität vergeben","Nur Logs löschen"],"Fallback verhindert unkontrollierte Datenverluste."),
q("M05-03",5,"Warum braucht Loop/Batch-Verarbeitung eine klare Abbruchbedingung?","Sonst drohen Endlosschleifen oder unkontrollierte Last",["Damit JSON kleiner wird","Nur für CSS","Weil IF keine Zahlen kann"],"Iteration muss terminieren und Ressourcen begrenzen."),
q("M05-04",5,"Ein Workflow verarbeitet denselben Auftrag zweimal. Welche Eigenschaft fehlt möglicherweise?","Idempotency/Dedupe",["MIME-Type","Dark Mode","OAuth Scope read"],"Wiederholungen dürfen nicht unbeabsichtigt doppelte Seiteneffekte erzeugen."),

q("M06-01",6,"HTTP 429 tritt auf. Welche Policy ist am sinnvollsten?","Retry-After respektieren, begrenztes Backoff und ggf. Jitter",["Sofort 100 parallele Retries","Request als 400 behandeln","Credential im Response mitsenden"],"429 ist typischerweise ein temporäres Kapazitätssignal."),
q("M06-02",6,"Warum sollte ein HTTP 400 nicht blind mehrfach retried werden?","Der Request ist wahrscheinlich fachlich/strukturell falsch und ändert sich durch Warten nicht",["400 ist immer temporär","Retry löscht die Payload","Nur GET darf 400 liefern"],"Nicht jeder Fehler ist retryable."),
q("M06-03",6,"Was ist Zweck einer Dead-Letter-/Quarantine-Lösung?","Nicht verarbeitbare Items isolieren und später kontrolliert analysieren/replayen",["Fehler dauerhaft verstecken","Alle Inputs löschen","Nur Success-Runs speichern"],"Poison Items sollen den Hauptprozess nicht blockieren."),
q("M06-04",6,"Welche Metrik zeigt eine schleichende Performance-Verschlechterung?","Execution Duration/Latenz über Zeit",["Nur Workflow-Name","Anzahl Farben im Canvas","Credential-ID"],"Latenztrends sind ein wichtiges Reliability-Signal."),

q("M07-01",7,"Was ist ein Upsert?","Bei vorhandenem Domain-Key aktualisieren, sonst neu einfügen",["Immer neue Row einfügen","Nur SELECT ausführen","Tabelle löschen und neu erstellen"],"Upsert kombiniert Update-or-Insert."),
q("M07-02",7,"Warum ist eventId ein guter Dedupe-Key?","Sie identifiziert ein fachliches Ereignis über getrennte Executions hinweg",["Sie ist immer ein Passwort","Sie ändert sich bei jedem Retry","Nur weil sie kurz ist"],"Stabile Event-IDs ermöglichen Wiedererkennung."),
q("M07-03",7,"Wann sollte ein Sync-Cursor gespeichert werden?","Nach erfolgreicher Verarbeitung des zugehörigen Abschnitts",["Vor der Verarbeitung","Nur beim Serverstart","Nie persistent"],"Vorzeitiges Fortschreiben kann Daten überspringen."),
q("M07-04",7,"Wann ist PostgreSQL eher geeigneter als eine einfache n8n Data Table?","Bei komplexen Relationen, Constraints und Multi-Table-Transactions",["Für jedes einzelne Flag","Nur für Textdateien","Wenn keine Keys existieren"],"Data Tables sind nicht Ersatz für jede relationale Datenbank."),

q("M08-01",8,"Warum sind JSON-Daten und Binary File Data in n8n getrennt?","Strukturierte Metadaten und eigentliche Datei haben unterschiedliche Verarbeitung",["JSON kann keine Strings enthalten","Binary ist immer verschlüsselt","Nur PDFs sind binary"],"Items können JSON und Binary parallel tragen."),
q("M08-02",8,"Eine CSV-Zelle aus User-Input beginnt mit '=CMD(...)'. Was ist das Risiko?","Spreadsheet Formula Injection",["SQL Deadlock","OAuth Expiry","HTTP Pagination"],"Spreadsheet-Programme können solche Werte als Formel interpretieren."),
q("M08-03",8,"Ein PDF enthält nur gescannte Seiten ohne Textlayer. Welche zusätzliche Technik kann nötig sein?","OCR",["DNS","JWT Refresh","SQL Upsert"],"Scan-PDFs benötigen für Textgewinnung häufig OCR."),
q("M08-04",8,"Warum große Dateien eher in Object Storage und nicht als Base64 in normale DB-Felder?","Weniger Speicher-/Transfer-Overhead und bessere Skalierung",["Base64 ist unsicher verschlüsselt","DBs erlauben keine Strings","Object Storage braucht keine Rechte"],"Blob Storage ist für große Binärdaten ausgelegt."),

q("M09-01",9,"Ein RAG-Retrieval liefert nur sehr schwache Evidenz. Was sollte das System tun?","Abstain/keine unbelegte Antwort erzeugen",["Confidence ignorieren und antworten","Secrets ausgeben","Top-K auf 1000 erhöhen und immer antworten"],"No-answer ist besser als Halluzination."),
q("M09-02",9,"Warum ist ein retrieved Dokument untrusted input?","Es kann Prompt-Injection-Anweisungen enthalten, die keine Systemautorität besitzen",["Vector Stores verschlüsseln nie","Dokumente sind immer falsch","Nur User-Prompts sind untrusted"],"Retrieved text ist Dateninhalt, keine Policy."),
q("M09-03",9,"Welche Agent-Aktion braucht am ehesten Human Approval?","Benutzerkonto löschen",["Knowledge Base durchsuchen","Status lesen","FAQ zusammenfassen"],"Hohe Auswirkung und geringe Reversibilität erhöhen Approval-Bedarf."),
q("M09-04",9,"Warum Retrieval und Generation getrennt evaluieren?","So lässt sich unterscheiden, ob falsche Evidenz oder falsche Modellantwort Ursache ist",["Damit Tokens verdoppelt werden","Nur Retrieval kostet Geld","Es gibt keinen Qualitätsunterschied"],"Fehlerursachen müssen isolierbar sein."),

q("M10-01",10,"Was ist der Hauptvorteil eines typisierten Sub-Workflow Contracts?","Caller und Component teilen eine explizite, stabile Schnittstelle",["Child sieht automatisch alle Secrets","Versionierung wird unnötig","Jeder Caller braucht Copy-Paste"],"Contracts reduzieren Kopplung."),
q("M10-02",10,"Ein Parent hat internalSecret, Child braucht es nicht. Was ist korrekt?","Nicht durch den Child-Input-Contract senden",["Immer mitsenden","In Workflow-Namen schreiben","Als Query Parameter veröffentlichen"],"Least-data reduziert Leakage und Coupling."),
q("M10-03",10,"20 Workflows nutzen dasselbe Child. Was erhöht sich bei Breaking Changes?","Blast Radius",["Nur Dateigröße","MIME-Type","Token-Länge"],"Shared Components brauchen Versionierung und Caller-Inventar."),
q("M10-04",10,"Warum Git → Test → Deploy → Smoke für n8n-Workflows?","Review, reproduzierbare Änderungen und Runtime-Verifikation",["Damit Credentials im Repo landen","Nur wegen UI","Smoke ersetzt alle Tests"],"Workflow-as-Code verbessert Change Management."),

q("M11-01",11,"Ein Webhook-Payload-Hash stimmt nicht mit dem erwarteten Wert überein. Was ist korrekt?","Verarbeitung vor Business-Aktion blockieren",["Trotzdem ausführen","Hash in Logs durch Passwort ersetzen","Nur warnen und löschen"],"Integritätsfehler dürfen keine Seiteneffekte passieren."),
q("M11-02",11,"User kontrolliert eine URL, die auf 169.254.169.254 zeigt. Welches Risiko?","SSRF gegen Link-Local/Metadata-Services",["CSV Injection","SQL Normalform","OAuth Consent"],"Private/link-local Ziele müssen geblockt werden."),
q("M11-03",11,"Warum Secrets nicht in normalen Audit-Logs speichern?","Logs haben breiten Zugriff/Lifecycle und würden Credential-Leaks erzeugen",["Secrets sind zu kurz","Logs akzeptieren keine Strings","Nur DSGVO verbietet Logs generell"],"Observability darf keine Secret-Exposure erzeugen."),
q("M11-04",11,"Destruktive Aktion soll autonom ausgeführt werden. Welche Control ist sinnvoll?","Explizite Approval-/Policy-Grenze vor dem Seiteneffekt",["Nur größere Schrift","Retry ohne Limit","Credential im Prompt"],"High-impact actions brauchen zusätzliche Kontrolle."),

q("M12-01",12,"Discovery zeigt 5 Minuten manuelle Arbeit pro Monat, Projekt kostet 20.000 €. Was ist die beste Reaktion?","Business Case neu bewerten statt Automation technisch zu erzwingen",["Sofort bauen","ROI ignorieren","Scope ohne Kunde erweitern"],"Automation muss wirtschaftlich und fachlich sinnvoll sein."),
q("M12-02",12,"Wann ist ein Kundenprojekt technisch abnahmebereit?","Definierte Acceptance Criteria sind mit Evidence nachgewiesen",["Wenn der Workflow einmal grün war","Wenn alle Nodes benannt sind","Sobald Angebot versendet wurde"],"Abnahme braucht vorher definierte Kriterien und Nachweise."),
q("M12-03",12,"Was gehört vor Go-Live in ein Handover?","Owner, Runbook, Monitoring, Credentials-Verantwortung, Rollback und Dokumentation",["Nur Screenshot","Nur Rechnung","Nur Workflow-ID"],"Betrieb muss nach Übergabe kontrolliert möglich sein."),
q("M12-04",12,"Security Review schlägt fehl, ROI ist positiv. Darf trotzdem Go-Live erfolgen?","Nein, Security Gate muss vor Go-Live erfüllt oder formal behandelt werden",["Ja, ROI überstimmt Security","Nur bei hohem Umsatz","Ja, wenn Smoke Test grün ist"],"Wirtschaftlichkeit ersetzt keine Sicherheitsfreigabe.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};
export function gradeFor(score){return score>=92?1:score>=81?2:score>=67?3:score>=50?4:5;}
export function buildExam(){
 const selected=[];
 for(let module=1;module<=MODULE_COUNT;module++){
  const pool=shuffle(FINAL_EXAM_BANK.filter(item=>item.module===module)).slice(0,QUESTIONS_PER_MODULE);
  selected.push(...pool);
 }
 const questions=[],answerKey={};
 for(const item of shuffle(selected)){
  const options=shuffle(item.answers.map(text=>({text,correct:text===item.correct})));
  answerKey[item.id]=options.findIndex(option=>option.correct);
  questions.push({id:item.id,module:item.module,prompt:item.prompt,options:options.map(option=>option.text)});
 }
 return{questions,answerKey};
}
async function ensureFinalExamSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS academy_final_exam_attempts(id TEXT PRIMARY KEY,enrollment_id TEXT NOT NULL,user_id TEXT NOT NULL,course_id TEXT NOT NULL,questions_json TEXT NOT NULL,answer_key_json TEXT NOT NULL,answers_json TEXT,score INTEGER,status TEXT NOT NULL,started_at TEXT NOT NULL,expires_at TEXT NOT NULL,completed_at TEXT,FOREIGN KEY(enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_final_exam_user_course ON academy_final_exam_attempts(user_id,course_id,started_at DESC)")
 ]);
}
async function enrollmentForUser(db,userId){
 return db.prepare("SELECT e.id AS enrollment_id,c.id AS course_id,c.title AS course_title FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug=? AND e.status IN('active','completed') ORDER BY e.enrolled_at DESC LIMIT 1").bind(userId,COURSE_SLUG).first();
}
async function moduleReadiness(db,userId,courseId){
 const rows=await db.prepare("SELECT module_slug,module_percent,assessment_best FROM academy_module_progress WHERE user_id=? AND course_id=? ORDER BY module_slug").bind(userId,courseId).all();
 const map=new Map((rows.results||[]).map(row=>[row.module_slug,row]));
 const modules=[];
 for(let i=1;i<=MODULE_COUNT;i++){
  const slug="modul-"+String(i).padStart(2,"0"),row=map.get(slug);
  modules.push({moduleSlug:slug,modulePercent:Number(row?.module_percent||0),assessmentBest:Number(row?.assessment_best||0),ready:Number(row?.module_percent||0)===100});
 }
 return modules;
}
async function certificateFor(db,userId,courseId){
 return db.prepare("SELECT public_code,title,issued_at,revoked_at FROM certificates WHERE user_id=? AND course_id=? AND revoked_at IS NULL ORDER BY issued_at DESC LIMIT 1").bind(userId,courseId).first();
}
async function issueCertificate(db,userId,courseId,courseTitle,now){
 const existing=await certificateFor(db,userId,courseId);if(existing)return existing;
 let code="";
 for(let i=0;i<8;i++){
  const candidate=createCertificateCode();
  const collision=await db.prepare("SELECT id FROM certificates WHERE public_code=? LIMIT 1").bind(candidate).first();
  if(!collision){code=candidate;break;}
 }
 if(!code)throw new ApiError(500,"certificate_code_failed","Zertifikatscode konnte nicht erzeugt werden.");
 const title=courseTitle+" · Abschlussnachweis";
 await db.prepare("INSERT INTO certificates(id,public_code,user_id,course_id,title,issued_at,revoked_at) VALUES(?,?,?,?,?,?,NULL)").bind(crypto.randomUUID(),code,userId,courseId,title,now).run();
 return{public_code:code,title,issued_at:now,revoked_at:null};
}
const safeAttempt=row=>row?{attemptId:row.id,status:row.status,score:row.score===null?null:Number(row.score),startedAt:row.started_at,expiresAt:row.expires_at,completedAt:row.completed_at}:null;

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureCertificateSchema(db);await ensureFinalExamSchema(db);
  const user=await requireSession(db,request),enrollment=await enrollmentForUser(db,user.user_id);
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für den n8n Automation Bootcamp besteht keine aktive Anmeldung.");
  const modules=await moduleReadiness(db,user.user_id,enrollment.course_id),eligible=modules.every(m=>m.ready);
  const latest=await db.prepare("SELECT id,status,score,started_at,expires_at,completed_at FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id).first();
  const best=await db.prepare("SELECT MAX(score) AS best FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status='passed'").bind(user.user_id,enrollment.course_id).first();
  const certificate=await certificateFor(db,user.user_id,enrollment.course_id);
  return json({ok:true,eligible,passScore:PASS_SCORE,questionCount:MODULE_COUNT*QUESTIONS_PER_MODULE,timeLimitMinutes:EXAM_MINUTES,modules,latestAttempt:safeAttempt(latest),bestPassedScore:Number(best?.best||0),certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null,requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensureCertificateSchema(db);await ensureFinalExamSchema(db);
  const user=await requireSession(db,request),enrollment=await enrollmentForUser(db,user.user_id);
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für den n8n Automation Bootcamp besteht keine aktive Anmeldung.");
  const body=await readJson(request,20000),action=cleanText(body.action,20);
  if(action==="start"){
   const modules=await moduleReadiness(db,user.user_id,enrollment.course_id);
   if(!modules.every(m=>m.ready))throw new ApiError(409,"modules_incomplete","Die Abschlussprüfung wird erst nach 100% in allen 12 Modulen freigeschaltet.");
   const now=new Date(),nowIso=now.toISOString();
   const active=await db.prepare("SELECT id,questions_json,started_at,expires_at FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status='in_progress' AND expires_at>? ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id,nowIso).first();
   if(active)return json({ok:true,resumed:true,attemptId:active.id,questions:JSON.parse(active.questions_json),startedAt:active.started_at,expiresAt:active.expires_at,passScore:PASS_SCORE});
   await db.prepare("UPDATE academy_final_exam_attempts SET status='expired' WHERE user_id=? AND course_id=? AND status='in_progress' AND expires_at<=?").bind(user.user_id,enrollment.course_id,nowIso).run();
   const built=buildExam(),id=crypto.randomUUID(),expiresAt=new Date(now.getTime()+EXAM_MINUTES*60000).toISOString();
   await db.prepare("INSERT INTO academy_final_exam_attempts(id,enrollment_id,user_id,course_id,questions_json,answer_key_json,status,started_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,enrollment.enrollment_id,user.user_id,enrollment.course_id,JSON.stringify(built.questions),JSON.stringify(built.answerKey),"in_progress",nowIso,expiresAt).run();
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.started","assessment",id,JSON.stringify({courseSlug:COURSE_SLUG,questionCount:built.questions.length}),nowIso).run();
   return json({ok:true,resumed:false,attemptId:id,questions:built.questions,startedAt:nowIso,expiresAt,passScore:PASS_SCORE});
  }
  if(action==="submit"){
   const attemptId=cleanText(body.attemptId,80),answers=body.answers;
   if(!attemptId||!answers||typeof answers!=="object"||Array.isArray(answers))throw new ApiError(422,"answers_invalid","Antworten sind unvollständig.");
   const row=await db.prepare("SELECT id,enrollment_id,questions_json,answer_key_json,status,expires_at FROM academy_final_exam_attempts WHERE id=? AND user_id=? AND course_id=? LIMIT 1").bind(attemptId,user.user_id,enrollment.course_id).first();
   if(!row)throw new ApiError(404,"attempt_not_found","Prüfungsversuch nicht gefunden.");
   if(row.status!=="in_progress")throw new ApiError(409,"attempt_closed","Dieser Prüfungsversuch ist bereits abgeschlossen.");
   const now=new Date(),nowIso=now.toISOString();
   if(row.expires_at<=nowIso){await db.prepare("UPDATE academy_final_exam_attempts SET status='expired',completed_at=? WHERE id=?").bind(nowIso,row.id).run();throw new ApiError(409,"attempt_expired","Die Prüfungszeit ist abgelaufen.");}
   const questions=JSON.parse(row.questions_json),key=JSON.parse(row.answer_key_json);
   if(questions.some(question=>!Number.isInteger(Number(answers[question.id]))))throw new ApiError(422,"answers_incomplete","Bitte beantworten Sie alle Prüfungsfragen.");
   let correct=0;
   const review=[];
   for(const question of questions){
    const selected=Number(answers[question.id]),isCorrect=selected===Number(key[question.id]);
    if(isCorrect)correct++;
    const def=FINAL_EXAM_BANK.find(item=>item.id===question.id);
    review.push({id:question.id,module:question.module,correct:isCorrect,explanation:def?.explanation||""});
   }
   const score=Math.round(correct/questions.length*100),grade=gradeFor(score),passed=score>=PASS_SCORE,status=passed?"passed":"failed";
   await db.prepare("UPDATE academy_final_exam_attempts SET answers_json=?,score=?,status=?,completed_at=? WHERE id=?").bind(JSON.stringify(answers),score,status,nowIso,row.id).run();
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"n8n-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
