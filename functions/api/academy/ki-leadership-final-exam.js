import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="ki-leadership",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Ein Konzern investierte über Jahre mehrere Milliarden USD in ein KI-Gesundheitssystem und musste 2022 Teile davon verkaufen, nachdem die klinischen Ergebnisse hinter den Erwartungen zurückblieben. Was war die zentrale Lehre laut Modul?","Die Technologie wurde vermarktet, bevor der klinische Nutzen im Detail belegt war",["Das System scheiterte ausschließlich wegen zu geringer Rechenleistung","Gesundheits-KI ist grundsätzlich nicht wirtschaftlich einsetzbar","Der Verkauf erfolgte, weil ein Mitbewerber technisch überlegen war"],"Der IBM-Watson-Health-Fall zeigt: Erfolgreiche AI-Programme starten beim Geschäftsproblem und belegen den Nutzen, statt die Technologie vorab zu vermarkten."),
q("M01-02",1,"Ein bekannter Fintech-Anbieter fuhr die KI-gestützte Kundenservice-Automatisierung wieder zurück und stellte erneut Menschen ein, um die Servicequalität zu sichern. Was zeigt dieser Fall vor allem?","Automatisierungsgrad ist kein Selbstzweck, sondern muss an Qualität und Kundenerwartung gemessen werden",["KI-Kundenservice darf grundsätzlich nie eingeführt werden","Der Fall zeigt, dass Automatisierung immer zu Kostensteigerungen führt","Menschliche Mitarbeitende wurden ausschließlich aus PR-Gründen wieder eingestellt"],"Der Klarna-Fall zeigt eine Kurskorrektur nach Qualitätssignalen statt nach Ideologie oder Automatisierungsgrad als Selbstzweck."),
q("M01-03",1,"Ein Vorhaben wird intern durchgehend als „Pilot“ bezeichnet, obwohl nie Erfolgskriterien für ein Go/No-Go festgelegt wurden. Wie ist das laut Reifegradmodell tatsächlich einzuordnen?","De facto noch Exploration, nur mit größerem Budget",["Automatisch Skalierung, da bereits Budget vorhanden ist","Automatisch Regelbetrieb, weil das Wort „Pilot“ verwendet wird","Die Bezeichnung ist irrelevant, jede Reifestufe ist gleichwertig"],"Ein echter Pilot braucht einen abgegrenzten Testrahmen mit echten Daten und definierten Go/No-Go-Kriterien – sonst bleibt es Exploration."),
q("M01-04",1,"Eine Initiative hat plausiblen geschäftlichen Nutzen, aber die Evidenz aus einem Testlauf steht noch aus. Welchem Feld des Portfolio-Boards entspricht das?","Pilotieren",["Skalieren","Stoppen","Beobachten"],"„Pilotieren“ ist für plausiblen Nutzen ohne belastbare Evidenz vorgesehen – „Skalieren“ setzt zusätzlich kontrollierbares Risiko und belegte Evidenz voraus."),

q("M02-01",2,"Ein Immobilienkonzern nutzte ein algorithmisches Preisschätzungsmodell, um Häuser automatisiert zu kaufen und weiterzuverkaufen, und stellte das Programm 2021 nach signifikanten Abschreibungen ein. Was war die zentrale Ursache laut Modul?","Das Modell unterschätzte Marktrisiko und operativen Aufwand bei volatilen Preisen",["Das Modell war technisch fehlerfrei, das Geschäftsmodell aber von Anfang an illegal","Der Algorithmus wurde nie in der Praxis eingesetzt","Ein IT-Sicherheitsvorfall allein beendete das Programm"],"Der Zillow-Offers-Fall zeigt: Die Tool-Lizenz ist selten der größte Kostenblock – Marktrisiko und operativer Aufwand werden regelmäßig unterschätzt."),
q("M02-02",2,"Welche vier Risikoklassen nutzt der EU AI Act laut Modul als Denkraster, um eine eigene KI-Initiative selbst einzuordnen, bevor eine Behörde es tut?","Unannehmbares Risiko, hohes Risiko, begrenztes Risiko, minimales Risiko",["Intern, extern, hybrid, öffentlich","Exploration, Pilot, Skalierung, Regelbetrieb","Gering, mittel, hoch, kritisch ohne feste Definition"],"Die Risikoklassen-Logik des EU AI Act dient unabhängig von der konkreten Pflicht als nützliches Denkraster für die eigene Risikoeinordnung."),
q("M02-03",2,"Ein Scoring-Modell berechnet Score = Value×2 + Aufwand + Risiko, jede Dimension auf einer Skala von 1 (gering/hoch) bis 5 (transformativ/gering). Eine Initiative hat Value=4, Aufwand=3, Risiko=4. Welcher Score ergibt sich?","15",["11","13","19"],"4×2 + 3 + 4 = 8 + 3 + 4 = 15 – die Gewichtung von Value ist eine bewusste, dokumentierte Führungsentscheidung."),
q("M02-04",2,"Ein bereits gestartetes Projekt wird im Scoring-Modell auffällig positiver bewertet als vergleichbare neue Vorhaben, obwohl sich an Nutzen und Risiko nichts geändert hat. Um welche Verzerrung handelt es sich am ehesten?","Sunk-Cost-Bias",["Sponsor-Bias","Eine zufällige Meinungsverschiedenheit ohne System","Ein Rechenfehler im Scoring-Modell selbst"],"Sunk-Cost-Bias rechtfertigt frühere Investitionen durch eine künstlich hohe Bewertung – ein Scoring-Modell ist nicht automatisch bias-frei, nur weil es Zahlen produziert."),

q("M03-01",3,"Welche Rolle im AI-Betriebsmodell verantwortet laut Modul primär Datenqualität, Herkunft und Zugriffsrechte auf Trainings- und Kontextdaten?","Data Steward",["AI/Product Owner","Risk & Compliance Reviewer","End-User Champion"],"Die fünf Kernrollen haben klar getrennte Verantwortungen – Datenqualität und -herkunft liegen beim Data Steward, nicht beim Product Owner."),
q("M03-02",3,"Ein Unternehmen hat bereits stabile Standards und viele parallele, unterschiedliche AI-Use-Cases in verschiedenen Fachbereichen. Welches Betriebsmodell passt laut Modul tendenziell besser?","Föderiert (in Fachbereichen)",["Zentral (Center of Excellence)","Gar kein definiertes Betriebsmodell","Ausschließlich vollständiges Outsourcing an externe Dienstleister"],"Föderierte Modelle passen zu reifen Organisationen mit vielen parallelen, unterschiedlichen Use Cases; zentrale Modelle eignen sich eher für die frühe Phase."),
q("M03-03",3,"Welche vier Kernfunktionen beschreibt das NIST AI Risk Management Framework (2023) laut Modul?","Govern, Map, Measure, Manage",["Plan, Build, Run, Retire","Explore, Pilot, Scale, Operate","Identify, Assess, Approve, Audit"],"Ein Center of Excellence übernimmt typischerweise die Govern-Funktion zentral, während Map, Measure und Manage zunehmend in Fachbereiche wandern können."),
q("M03-04",3,"Welche drei Elemente braucht laut Modul jeder wirksame Eskalationspfad bei Uneinigkeit zwischen Fachbereich und Compliance?","Maximale Bearbeitungszeit je Ebene, eine klar benannte entscheidungsbefugte Person, Pflicht zur schriftlichen Begründung",["Nur eine informelle mündliche Absprache im Flurgespräch","Ausschließlich eine E-Mail an die Geschäftsführung ohne Frist","Eine anonyme Abstimmung ohne dokumentierte Entscheidung"],"Diese drei Elemente schützen vor endlosen Diskussionen ohne Ergebnis und machen die Entscheidung im Nachhinein nachvollziehbar."),

q("M04-01",4,"Eine vielzitierte Untersuchung von 2016 analysierte ein Risikobewertungssystem im US-Justizsystem und kam zu dem Schluss, es habe bestimmte Gruppen überproportional benachteiligt. Was zeigt dieser Fall vor allem laut Modul?","Wie schwer echte Aufsicht ist, wenn weder Fachleute noch Öffentlichkeit die genaue Funktionsweise des Modells nachvollziehen können",["Dass algorithmische Risikobewertung in der Justiz grundsätzlich verboten ist","Dass der Hersteller die Methodik vollständig akzeptierte","Dass es sich ausschließlich um ein rein technisches, kein organisatorisches Problem handelte"],"Der COMPAS-Fall zeigt: Ohne Transparenz ist wirksame menschliche Aufsicht kaum möglich, unabhängig von der Fachdebatte um die genaue Methodik."),
q("M04-02",4,"Bei welchem Aufsichtsmodell überwacht ein Mensch laufend und greift bei Bedarf ein, entscheidet aber nicht jeden Einzelfall aktiv mit?","Human-on-the-loop",["Human-in-the-loop","Human-in-command","Vollautomatisierung ohne jede menschliche Aufsicht"],"Human-on-the-loop passt z.B. zur Betrugserkennung: ein Analyst prüft Alarme, das System handelt bei niedrigem Risiko autonom."),
q("M04-03",4,"Welche drei Bedingungen müssen laut Modul erfüllt sein, damit menschliche Aufsicht über eine KI-Entscheidung tatsächlich wirksam statt nur formal ist?","Genug Information, um die Entscheidung zu verstehen, genug Zeit zur Prüfung, eine reale Möglichkeit zu widersprechen",["Ein einziger schneller Freigabe-Klick ohne weitere Prüfung","Ausschließlich eine nachträgliche jährliche Stichprobenkontrolle","Eine rein technische Systemzertifizierung ohne menschliche Beteiligung"],"Fehlt eine der drei Bedingungen, ist die „Aufsicht“ laut Modul nur ein Feigenblatt."),
q("M04-04",4,"Welche vier Elemente gehören laut Modul in einen Audit-Trail für KI-gestützte Entscheidungen?","Eingabedaten & Modellversion, KI-Ausgabe & Begründung/Konfidenz, menschliche Entscheidung, Zeitstempel & verantwortliche Person",["Nur der finale Freigabe-Status ohne weitere Details","Ausschließlich die Namen aller am Projekt beteiligten Personen","Nur die Lizenzkosten des eingesetzten KI-Tools"],"Ohne diese vier Elemente ist eine Entscheidung im Streitfall nicht nachweisbar, selbst wenn sie inhaltlich sorgfältig getroffen wurde."),

q("M05-01",5,"Eine RAND-Untersuchung von 2024 mit Interviews von über 65 Data Scientists und Ingenieuren kam zu welchem zentralen Ergebnis laut Modul?","Rund 80% der untersuchten AI-Projekte scheitern, vor allem wegen unklarer Ziele, Datenqualität und fehlender Priorisierung",["Fast alle AI-Projekte scheitern ausschließlich an unzureichender Rechenleistung","Nur etwa 5% der AI-Projekte scheitern, meist an reinen Budgetfragen","Die Studie fand keinen Zusammenhang zwischen Priorisierung und Projekterfolg"],"Die RAND-Studie nennt unklare Geschäftsziele, mangelnde Datenqualität und fehlende Priorisierung als Hauptursachen – nicht in erster Linie Modellqualität."),
q("M05-02",5,"Zehn Piloten laufen parallel in einem Unternehmen, aber keiner wird offiziell skaliert oder gestoppt. Wie nennt das Modul dieses Muster?","Pilot-Purgatory",["Portfolio-Reife","Center of Excellence","Sponsor-Bias"],"Einen Piloten zu starten ist organisatorisch einfach; ihn zu stoppen oder zu skalieren erfordert eine explizite Entscheidung – ohne Review-Rhythmus entsteht Pilot-Purgatory."),
q("M05-03",5,"Welche Ressource wird laut Modul bei der Skalierung mehrerer AI-Initiativen am ehesten komplett übersehen?","Die Aufmerksamkeit der Fachbereichsleitung",["Das verfügbare Budget","Die Anzahl verfügbarer Laptops","Die verfügbare Bürofläche für neue Teams"],"Budget wird meist realistisch eingeplant, doch jede Initiative braucht zusätzlich Zeit derselben wenigen Führungskräfte – das wird oft komplett übersehen."),
q("M05-04",5,"Was ist laut Modul die zentrale Pflicht in einem funktionierenden quartalsweisen Portfolio-Review?","Jede Initiative bekommt eine explizite Entscheidung, kein „läuft einfach weiter“",["Nur neue Initiativen werden besprochen, laufende nicht","Ein Review ohne Stop-Option, um Teams nicht zu demotivieren","Ausschließlich eine schriftliche Statusmeldung ohne Diskussion"],"Ein Review ohne die Möglichkeit zu stoppen ist laut Modul kein Review, sondern nur ein Statusbericht."),

q("M06-01",6,"Ein Fast-Food-Konzern beendete 2024 gemeinsam mit einem Technologiepartner ein KI-gestütztes Bestellsystem, nachdem Videos fehlerhafter Bestellungen viral gegangen waren. Wie bewertet das Modul diesen Schritt?","Als sauberen, bewussten Stopp nach ehrlicher Prüfung statt stillem Weiterlaufen trotz sichtbarer Probleme",["Als Beweis, dass KI im Kundenkontakt grundsätzlich ungeeignet ist","Als reines PR-Versagen ohne inhaltlichen Grund","Als Zeichen, dass die Governance in diesem Fall vollständig versagt hat"],"Der McDonald's/IBM-Fall zeigt laut Modul: Der eigentliche Fehler wäre gewesen, trotz sichtbarer Qualitätsprobleme unverändert weiterlaufen zu lassen."),
q("M06-02",6,"Welche Aussage beschreibt einen Leading Indicator laut Modul korrekt?","Er zeigt ein Signal, bevor sich das Geschäftsergebnis zeigt, z.B. die Nutzungsrate in den ersten Wochen",["Er ist erst Monate nach dem Rollout zuverlässig messbar","Er misst ausschließlich die Kundenzufriedenheit nach drei Monaten","Er ist per Definition immer eine Vanity Metric"],"Leading Indicators liefern eine Frühwarnung, bevor das Geschäftsergebnis (Lagging Indicator) sichtbar wird."),
q("M06-03",6,"Eine hohe Anzahl an Chat-Anfragen an ein internes KI-Tool wird intern als Erfolg gemeldet. Warum kann das laut Modul eine Vanity Metric sein?","Weil unklar bleibt, ob die Antworten korrekt waren oder Nutzer nur mehrfach nachfragen mussten",["Weil eine hohe Anzahl an Anfragen immer automatisch Kosten spart","Weil Nutzungszahlen grundsätzlich nie gemessen werden dürfen","Weil es sich technisch zwingend um einen Lagging Indicator handelt"],"Die Testfrage laut Modul: Wenn sich die Zahl verdoppelt, wissen wir dann automatisch, dass mehr Geschäftsnutzen entstanden ist? Wenn nein, ist es eine Vanity Metric."),
q("M06-04",6,"Wofür ist der 90-Tage-Review nach einem Rollout laut Modul besonders geeignet?","Er ist lang genug für echte Nutzungsdaten, aber kurz genug, um noch leicht nachzusteuern",["Er ersetzt vollständig jede weitere spätere Prüfung","Er ist nur bei bereits gescheiterten Projekten überhaupt nötig","Er wird ausschließlich von der IT-Abteilung ohne Fachbereich durchgeführt"],"Ein guter Start ist laut Modul kein Freibrief für Dauerbetrieb ohne weitere Prüfung – der 90-Tage-Review ist der erste strukturierte Check, nicht der letzte.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Die Portfolio-Board-Einordnung folgt Nutzen, Risiko und Evidenzlage – nicht dem Bauchgefühl oder der Begeisterung für die Technologie.",
  2:"Der Score ergibt sich aus der festgelegten Formel Value×2 + Aufwand + Risiko; die Gewichtung ist eine bewusste, dokumentierte Führungsentscheidung.",
  3:"Eine RACI-Matrix macht sichtbar, wer Responsible und wer Accountable ist – gerade bei bereichsübergreifenden Initiativen darf das nicht implizit bleiben.",
  4:"Das Aufsichtsmodell richtet sich nach Auswirkung auf Personen, Reversibilität und regulatorischer Einstufung – je kritischer, desto strenger die Aufsicht.",
  5:"Ein Portfolio-Review ohne echte Entscheidung ist nur ein Statusbericht; die Kriterien aus dem Scoring-Modell entscheiden über Skalieren, Anpassen oder Stoppen.",
  6:"Leading Indicators zeigen ein Signal vor dem Geschäftsergebnis, Lagging Indicators bestätigen es danach – eine Kennzahl ohne Bezug zum Geschäftsergebnis ist eine Vanity Metric."
};

function dynamicCandidates(module){
  if(module===1){
    const tiers=["Skalieren","Pilotieren","Beobachten","Stoppen"];
    const scenarios=[
      ["hoch-kontrolliert","hohem Nutzen, kontrollierbarem Risiko und bereits belastbarer Evidenz aus einem abgeschlossenen Pilotversuch","Skalieren"],
      ["plausibel-offen","plausiblem Nutzen, wobei die Evidenz aus dem Pilotversuch noch aussteht","Pilotieren"],
      ["reife-fehlt","geringer organisatorischer Reife und ungeklärten Abhängigkeiten zu anderen Initiativen","Beobachten"],
      ["unvertretbar","einem Risiko, das rechtlich oder reputativ nicht vertretbar ist","Stoppen"]
    ];
    return scenarios.map(([code,desc,correct])=>{
      const wrong=tiers.filter(t=>t!==correct);
      return q("D01-"+code,1,`Welches Feld des Portfolio-Boards passt zu einer Initiative mit ${desc}?`,correct,wrong,DYNAMIC_EXPLANATIONS[1]);
    });
  }
  if(module===2){
    const cases=[[4,3,4],[5,2,1],[2,5,3],[3,4,5],[5,5,5],[1,1,1]];
    return cases.map(([v,a,r])=>{
      const correct=v*2+a+r;
      const wrong=[correct-1,correct+1,correct+2].filter(x=>x!==correct).map(String);
      return q("D02-"+v+"-"+a+"-"+r,2,`Scoring-Modell: Score = Value×2 + Aufwand + Risiko (jede Dimension 1-5). Eine Initiative hat Value=${v}, Aufwand=${a}, Risiko=${r}. Welcher Score ergibt sich?`,String(correct),wrong,DYNAMIC_EXPLANATIONS[2]);
    });
  }
  if(module===3){
    const pool=["Geschäftsführung","AI Owner","Compliance Reviewer","IT/Security"];
    const activities=[
      ["use-case","Use-Case-Auswahl","Geschäftsführung"],
      ["risiko","Risikoeinstufung","Geschäftsführung"],
      ["technik","Technische Umsetzung","AI Owner"],
      ["golive","Go-Live-Freigabe","Geschäftsführung"]
    ];
    return activities.map(([code,activity,correct])=>{
      const wrong=pool.filter(p=>p!==correct);
      return q("D03-"+code,3,`In der RACI-Matrix des Moduls: Wer ist bei der Aktivität "${activity}" Accountable?`,correct,wrong,DYNAMIC_EXPLANATIONS[3]);
    });
  }
  if(module===4){
    const options=["Human-in-the-loop","Human-on-the-loop","Human-in-command"];
    const filler="Vollautomatisierung ohne jede menschliche Beteiligung";
    const cases=[
      ["hoch-hoch","eine automatisierte Kreditvergabe mit hoher Auswirkung auf Einzelpersonen und einer schwer rückgängig zu machenden Entscheidung","Human-in-the-loop"],
      ["mittel-laufend","eine Betrugserkennung, bei der ein Analyst laufend Alarme prüft, aber nicht jeden unauffälligen Einzelfall aktiv bestätigt","Human-on-the-loop"],
      ["gering-rahmen","eine automatisierte Rechnungsfreigabe unter 500 € mit vorab klar festgelegten Ausschlusskriterien","Human-in-command"]
    ];
    return cases.map(([code,desc,correct])=>{
      const wrong=options.filter(o=>o!==correct).concat(filler);
      return q("D04-"+code,4,`Welches Aufsichtsmodell passt laut Modul am besten zu folgendem Fall: ${desc}?`,correct,wrong,DYNAMIC_EXPLANATIONS[4]);
    });
  }
  if(module===5){
    const outcomes=["Skalieren","Weiterpilotieren mit Anpassung","Bewusst stoppen"];
    const filler="Automatisch fortsetzen, ohne dokumentierte Entscheidung";
    const cases=[
      ["stark","die Kriterien aus dem Scoring-Modell sind vollständig erfüllt und die Pilotphase zeigt den erwarteten Nutzen","Skalieren"],
      ["teilweise","der Nutzen zeigt sich in Ansätzen, aber ein zentrales Risiko wurde erst während des Piloten sichtbar und muss zuerst adressiert werden","Weiterpilotieren mit Anpassung"],
      ["negativ","seit zwei Quartalen liefert die Initiative nicht den erwarteten Nutzen und es gibt keinen plausiblen Anpassungspfad","Bewusst stoppen"]
    ];
    return cases.map(([code,desc,correct])=>{
      const wrong=outcomes.filter(o=>o!==correct).concat(filler);
      return q("D05-"+code,5,`Quartalsweiser Portfolio-Review: ${desc}. Welche Entscheidung passt laut Modul am besten?`,correct,wrong,DYNAMIC_EXPLANATIONS[5]);
    });
  }
  if(module===6){
    const cats=["Leading Indicator","Lagging Indicator","Vanity Metric"];
    const filler="Ein rein technischer Systemwert ohne jede Aussagekraft";
    const cases=[
      ["nutzung-woche1","die Nutzungsrate eines neuen KI-Tools in Woche 1 bis 4 nach dem Rollout","Leading Indicator"],
      ["zufriedenheit-3monate","die Kundenzufriedenheit, gemessen drei Monate nach dem Rollout","Lagging Indicator"],
      ["prompts-anzahl","die reine Anzahl gestellter Prompts pro Monat, ohne Bezug zu Korrektheit oder Zeitersparnis","Vanity Metric"]
    ];
    return cases.map(([code,desc,correct])=>{
      const wrong=cats.filter(c=>c!==correct).concat(filler);
      return q("D06-"+code,6,`Wie ist folgende Kennzahl einzuordnen: ${desc}?`,correct,wrong,DYNAMIC_EXPLANATIONS[6]);
    });
  }
  return[];
}

function dynamicQuestion(module,excluded){
  const all=dynamicCandidates(module),fresh=all.filter(item=>!excluded.has(item.id));
  return shuffle(fresh.length?fresh:all)[0]||null;
}

export function gradeFor(score){return score>=92?1:score>=81?2:score>=67?3:score>=50?4:5;}
export function buildExam(excludeIds=[]){
 const excluded=new Set(excludeIds.map(String)),selected=[];
 for(let module=1;module<=MODULE_COUNT;module++){
  const all=FINAL_EXAM_BANK.filter(item=>item.module===module),fresh=all.filter(item=>!excluded.has(item.id));
  const staticQuestion=shuffle(fresh.length?fresh:all)[0];
  const dynamic=dynamicQuestion(module,new Set([...excluded,staticQuestion?.id].filter(Boolean)));
  if(staticQuestion)selected.push(staticQuestion);
  if(dynamic)selected.push(dynamic);
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für den KI-Führerschein Leadership besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für den KI-Führerschein Leadership besteht keine aktive Anmeldung.");
  const body=await readJson(request,20000),action=cleanText(body.action,20);
  if(action==="start"){
   const modules=await moduleReadiness(db,user.user_id,enrollment.course_id);
   if(!modules.every(m=>m.ready))throw new ApiError(409,"modules_incomplete","Die Abschlussprüfung wird erst nach 100% in allen 6 Modulen freigeschaltet.");
   const now=new Date(),nowIso=now.toISOString();
   const active=await db.prepare("SELECT id,questions_json,started_at,expires_at FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status='in_progress' AND expires_at>? ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id,nowIso).first();
   if(active)return json({ok:true,resumed:true,attemptId:active.id,questions:JSON.parse(active.questions_json),startedAt:active.started_at,expiresAt:active.expires_at,passScore:PASS_SCORE});
   await db.prepare("UPDATE academy_final_exam_attempts SET status='expired' WHERE user_id=? AND course_id=? AND status='in_progress' AND expires_at<=?").bind(user.user_id,enrollment.course_id,nowIso).run();
   const previous=await db.prepare("SELECT questions_json FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status IN(\'passed\',\'failed\',\'expired\') ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id).first();
   let previousIds=[];try{previousIds=(JSON.parse(previous?.questions_json||"[]")||[]).map(item=>item.id);}catch{}
   const built=buildExam(previousIds),id=crypto.randomUUID(),expiresAt=new Date(now.getTime()+EXAM_MINUTES*60000).toISOString();
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
    review.push({id:question.id,module:question.module,correct:isCorrect,explanation:def?.explanation||DYNAMIC_EXPLANATIONS[question.module]||""});
   }
   const score=Math.round(correct/questions.length*100),grade=gradeFor(score),passed=score>=PASS_SCORE,status=passed?"passed":"failed";
   await db.prepare("UPDATE academy_final_exam_attempts SET answers_json=?,score=?,status=?,completed_at=? WHERE id=?").bind(JSON.stringify(answers),score,status,nowIso,row.id).run();
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"ki-leadership-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
