import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="ki-health",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Ein Pflegeteam möchte Terminerinnerungen, Übersetzungen von Merkblättern und Zusammenfassungen mit KI vorbereiten lassen. Wie ist dieser Einsatz laut Modul einzuordnen?","Als reifer administrativer Einsatzfall mit überschaubarem Risiko",["Als klinischer Einsatzfall mit dem höchsten Risiko","Als grundsätzlich unzulässiger Einsatz von KI im Gesundheitswesen","Als Einsatzfall, der zwingend vor jedem einzelnen Vorgang eine vollständige Fachfreigabe braucht"],"Administrative Entlastung – Dokumentation, Terminplanung, Übersetzung, Zusammenfassung – ist laut Modul der reife, risikoärmere Einsatzfall."),
q("M01-02",1,"Wovon hängt laut Modul das Risiko einer KI-gestützten Aufgabe im Gesundheitswesen vor allem ab?","Von der Konsequenz, falls das KI-Ergebnis falsch ist und unbemerkt bleibt",["Ausschließlich von der eingesetzten KI-Technologie","Von der Anzahl der beteiligten Mitarbeitenden","Von der Tageszeit, zu der die Aufgabe erledigt wird"],"Die gleiche KI-Funktion kann in einem Kontext harmlos und im anderen riskant sein – entscheidend ist die Konsequenz eines unbemerkten Fehlers."),
q("M01-03",1,"Ein KI-Tool liefert einen sehr überzeugend formulierten Hinweis zu einer möglichen Diagnose. Wer trifft laut Modul die Diagnose- und Therapieentscheidung?","Immer die verantwortliche approbierte Fachperson",["Das KI-Tool selbst, sofern die Formulierung sicher klingt","Die Person mit dem meisten technischen Vorwissen im Team","Niemand – die Entscheidung kann offen bleiben"],"Approbiertes Fachpersonal trägt die rechtliche und ethische Verantwortung; ein Sprachmodell kennt weder die vollständige Anamnese noch trägt es Verantwortung."),
q("M01-04",1,"Welche Faustregel hilft laut Modul 01, den Risikograd eines KI-Einsatzfalls einzuschätzen?","Je leichter ein KI-Ergebnis vor Verwendung geprüft werden kann, desto risikoärmer ist der Einsatzfall",["Je schneller ein KI-Ergebnis erzeugt wird, desto risikoärmer ist es","Je länger die KI-Ausgabe ist, desto risikoärmer ist sie","Je weniger Personen das Ergebnis lesen, desto risikoärmer ist es"],"Der Merksatz aus Modul 01 verknüpft Prüfbarkeit direkt mit Risiko."),

q("M02-01",2,"Ein Pflegebericht soll per KI vorbereitet werden, wichtige Vitalwerte fehlen aber im Prompt. Was passiert laut Modul typischerweise?","Die KI füllt die Lücke wahrscheinlich mit einer Vermutung, statt sie offen zu lassen",["Die KI bricht die Erstellung automatisch ab","Die KI markiert die Lücke automatisch farbig","Die KI fragt in jedem Fall aktiv nach den fehlenden Werten"],"Ohne ausreichenden Kontext füllt die KI Lücken mit Vermutungen – genau das soll durch guten Input vermieden werden."),
q("M02-02",2,"Welche der drei Prüffragen gehört laut Modul vor jede Übernahme eines KI-Entwurfs?","Fehlt etwas Wichtiges, das nicht sofort auffällt?",["Wie lange hat die KI für den Entwurf gebraucht?","Wie viele Wörter enthält der Entwurf?","Welche Schriftart wurde für den Entwurf verwendet?"],"Die drei Prüffragen sind: Stimmen die Fakten? Fehlt etwas Wichtiges? Ist der Ton passend?"),
q("M02-03",2,"Warum gelten Auslassungen laut Modul als unterschätzte Fehlerquelle?","Weil ein offensichtlich falscher Wert meist auffällt, eine ausgelassene Beobachtung aber oft erst später bemerkt wird",["Weil Auslassungen technisch unmöglich zu erkennen sind","Weil Auslassungen ausschließlich bei sehr langen Texten vorkommen","Weil Auslassungen automatisch durch das KI-Tool korrigiert werden"],"Deshalb braucht es einen aktiven Vollständigkeits-Check, nicht nur ein Überfliegen."),
q("M02-04",2,"Eine Patienteninformation wird von KI in eine andere Sprache übersetzt. Was darf dabei laut Modul nicht passieren?","Es darf kein neuer medizinischer Inhalt hinzugefügt werden",["Die Übersetzung darf nicht kürzer sein als das Original","Die Übersetzung darf keine Absätze verwenden","Die Übersetzung darf nur von Ärzt:innen persönlich gelesen werden"],"Vereinfachen und Übersetzen verändern die Sprache, nicht den medizinischen Inhalt."),

q("M03-01",3,"Warum unterliegen Gesundheitsdaten laut Modul einem strengeren Schutz als die meisten anderen personenbezogenen Daten?","Weil sie zu den besonderen Kategorien personenbezogener Daten nach Art. 9 DSGVO zählen",["Weil sie ausschließlich in Papierform vorliegen dürfen","Weil sie im Gegensatz zu anderen Daten nicht verschlüsselt werden können","Weil sie grundsätzlich nicht als personenbezogen gelten"],"Art. 9 DSGVO stellt Gesundheitsdaten unter einen strengeren Schutz als die meisten anderen personenbezogenen Daten."),
q("M03-02",3,"Ein Mitarbeitender ist unsicher, ob ein KI-Tool für echte, identifizierbare Patientendaten geeignet ist. Was ist laut Modul die richtige Regel?","Im Zweifel nur das von der Einrichtung freigegebene System verwenden",["Jedes bekannte KI-Tool ist automatisch dafür geeignet","Die Eignung hängt allein von der Internetverbindung ab","Freigaben sind nur bei stationären Patient:innen nötig, nie ambulant"],"Bei echten, identifizierbaren Patientendaten gilt: im Zweifel nur das freigegebene System der Einrichtung verwenden."),
q("M03-03",3,"Was bedeutet Datensparsamkeit laut Modul im Alltag konkret?","Wo möglich vor der Eingabe anonymisieren oder pseudonymisieren und nur nötige Daten verwenden",["Immer alle verfügbaren Patientendaten vollständig eingeben","Datensparsamkeit gilt nur für schriftliche Dokumente, nie für gesprochene Angaben","Datensparsamkeit bedeutet, komplett auf Falldaten zu verzichten"],"Wenn eine Aufgabe auch ohne echte Identifikationsdaten funktioniert, sollten diese weggelassen werden."),
q("M03-04",3,"Wodurch entstehen laut Modul die meisten Datenschutzvorfälle im KI-Kontext?","Durch die einfache Eingabe echter Patientendaten in ein nicht dafür freigegebenes, öffentliches Tool",["Durch komplexe, gezielte Cyberangriffe auf Krankenhaus-Server","Durch fehlerhafte Verschlüsselungsalgorithmen in freigegebenen Systemen","Durch zu lange Aufbewahrungsfristen bei anonymisierten Daten"],"Die meisten Vorfälle entstehen nicht durch komplexe Angriffe, sondern durch die einfache Eingabe echter Patientendaten in ein ungeeignetes Tool."),

q("M04-01",4,"Welche Rolle darf KI laut Modul bei klinischen Entscheidungen einnehmen?","Hinweisgeber, der Literatur, Leitlinienauszüge oder ähnliche Fälle strukturiert aufbereitet",["Alleinige Entscheidungsinstanz bei eindeutigen Befunden","Ersatz für die fachliche Rücksprache in dringenden Fällen","Kontrollinstanz, die ärztliche Entscheidungen nachträglich korrigiert"],"KI kann Literatur, Leitlinienauszüge oder ähnliche frühere Fälle strukturiert aufbereiten – mehr nicht."),
q("M04-02",4,"Warum ist eine selbstbewusst formulierte KI-Aussage im klinischen Kontext laut Modul kein Qualitätsbeweis?","Weil Sprachmodelle falsche und richtige Aussagen oft im selben sicheren Tonfall formulieren",["Weil selbstbewusste Formulierungen technisch nicht möglich sind","Weil nur unsichere Formulierungen inhaltlich korrekt sein können","Weil der Tonfall automatisch mit der Modellversion zusammenhängt"],"Eine selbstbewusst klingende, aber falsche Ausgabe kann zu falscher Sicherheit führen."),
q("M04-03",4,"Was ist laut Modul der richtige nächste Schritt, wenn ein KI-Hinweis Unsicherheit erzeugt?","Rücksprache mit einer verantwortlichen Fachperson (Eskalation)",["Den Hinweis ungeprüft in die Akte übernehmen","Den Hinweis ignorieren, bis ein neuer KI-Versuch startet","Die Unsicherheit allein durch Wiederholung derselben Anfrage auflösen"],"Unsicherheit ist ein Signal zum Eskalieren, kein Grund zum Improvisieren."),
q("M04-04",4,"Wann ist laut Modul die Grenze zwischen zulässigem Hinweis und unzulässiger Entscheidung überschritten?","Sobald ein Hinweis in eine konkrete Diagnose- oder Therapieaussage für eine reale Person umschlägt",["Sobald ein Hinweis länger als zwei Sätze ist","Sobald mehr als eine Quelle zitiert wird","Diese Grenze existiert laut Modul nicht"],"Ein Hinweis darf informieren, aber niemals selbst die Entscheidung für eine reale Person treffen."),

q("M05-01",5,"Welches der folgenden Muster gilt laut Modul als typisches Warnsignal bei KI-Ausgaben?","Eine ungewöhnlich glatte, sehr sichere Formulierung zu einem eigentlich unsicheren Sachverhalt",["Eine Ausgabe mit korrekt angegebener, nachprüfbarer Quelle","Eine kurze, klar als vorläufig gekennzeichnete Formulierung","Eine Ausgabe, die um Rückfrage bei Unklarheit bittet"],"Wer die typischen Warnsignale kennt, erkennt Auffälligkeiten schneller, statt sich täuschen zu lassen."),
q("M05-02",5,"Welche drei Angaben reichen laut Modul meist, um eine Auffälligkeit nachvollziehbar zu dokumentieren?","Was aufgefallen ist, wann es aufgefallen ist und welche Situation zugrunde lag",["Nur der Name der Person, die die Auffälligkeit gemeldet hat","Nur die verwendete KI-Softwareversion","Nur eine Einschätzung, ob ein Fehler wahrscheinlich ist"],"Diese drei Angaben reichen meist, um eine Auffälligkeit später nachvollziehen zu können."),
q("M05-03",5,"Wie beschreibt das Modul den Meldeweg für Auffälligkeiten bei KI-Ausgaben?","Als Teil der Qualitätssicherung, nicht als Bürokratie",["Als rein freiwillige Option ohne Bezug zur Qualität","Als ausschließlich für schwere Zwischenfälle gedachten Prozess","Als Ersatz für jede fachliche Prüfung"],"Eine gemeldete Auffälligkeit hilft, wiederkehrende Probleme systematisch zu erkennen."),
q("M05-04",5,"Warum reicht laut Modul ein „gutes Gefühl“ beim Prüfen einer KI-Ausgabe nicht aus?","Weil Warnsignale aktiv gegengeprüft werden müssen, statt sich auf einen Eindruck zu verlassen",["Weil ein gutes Gefühl technisch nicht messbar ist und deshalb irrelevant ist","Weil Gefühle laut Modul grundsätzlich nur bei Führungskräften zulässig sind","Weil ein gutes Gefühl automatisch auf eine fehlerhafte KI-Ausgabe hindeutet"],"Ein gutes Gefühl reicht nicht – Warnsignale müssen aktiv gegengeprüft werden."),

q("M06-01",6,"Welche fünf Prinzipien fasst Modul 06 als roten Faden des Programms zusammen?","Prüfpfad, Fachverantwortung, Datensparsamkeit, Eskalation und Meldekultur",["Geschwindigkeit, Kosten, Reichweite, Design und Marketing","Nur Datenschutz und Eskalation, alle anderen Prinzipien sind optional","Diagnose, Therapie, Abrechnung, Dokumentation und Archivierung"],"Die Tabelle in Modul 06 fasst genau diese fünf Prinzipien aus den Modulen 1–5 zusammen."),
q("M06-02",6,"Welche Prinzipien stehen laut Modul für Pflegekräfte im Alltag meist im Vordergrund?","Dokumentation und Patientenkommunikation",["Ausschließlich Abrechnung und Terminplanung","Ausschließlich Forschung und Studiendesign","Ausschließlich IT-Sicherheit der Server"],"Für Pflegekräfte stehen laut Modul häufig Dokumentation und Patientenkommunikation im Vordergrund."),
q("M06-03",6,"Welches vertiefende Programm passt laut Modul zu ärztlichem und therapeutischem Fachpersonal mit klinischer Entscheidungsverantwortung?","KI Health Klinik & Arzt",["KI Health Pflege","KI-Führerschein Essentials","n8n Automation Bootcamp"],"KI Health Klinik & Arzt vertieft klinische Entscheidungsunterstützung, Evidenzrecherche, Arztbriefe und Sorgfaltspflicht."),
q("M06-04",6,"Wie fasst das Modul den gemeinsamen roten Faden aller fünf Prinzipien zusammen?","KI unterstützt sichtbar und prüfbar, ohne der Fachperson die Verantwortung abzunehmen",["KI ersetzt die Fachperson, sobald genug Trainingsdaten vorliegen","KI trägt automatisch die rechtliche Verantwortung für ihre Ausgaben","KI-Ergebnisse benötigen keine Prüfung, wenn sie professionell formatiert sind"],"Alle fünf Prinzipien lassen sich auf diese eine Haltung zurückführen.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Das Risiko einer Aufgabe hängt von der Konsequenz ab, falls das KI-Ergebnis falsch ist und unbemerkt bleibt – nicht von der eingesetzten Technik.",
  2:"Ein KI-Entwurf darf erst fachlich weiterverwendet werden, wenn Vollständigkeit und Zahlenwerte gegen die Originalnotizen geprüft wurden – unabhängig davon, wie professionell er wirkt.",
  3:"Ob eine Information zu den besonderen Kategorien nach Art. 9 DSGVO zählt, entscheidet der Inhalt (z. B. Gesundheitsdaten), nicht das Format oder der Speicherort.",
  4:"KI liefert Hinweise auf Literatur oder Muster, nie eine Diagnose- oder Therapieentscheidung für eine reale Person – bei Unsicherheit wird eskaliert statt improvisiert.",
  5:"Warnsignale wie widersprüchliche Angaben oder unbelegte, sehr sicher klingende Aussagen müssen aktiv gegengeprüft werden, statt sich auf ein gutes Gefühl zu verlassen.",
  6:"Alle fünf Prinzipien laufen auf eine Haltung hinaus: KI unterstützt sichtbar und prüfbar, ohne der Fachperson die Verantwortung abzunehmen – je nach Rolle stehen unterschiedliche Prinzipien im Vordergrund."
};

function dynamicCandidates(module){
  if(module===1){
    const tiers=["administrativ, geringes Risiko","Dokumentation, mittleres Risiko","klinisch, hohes Risiko"];
    const filler="Das Risiko hängt ausschließlich vom eingesetzten KI-Modell ab, nicht von der Aufgabe";
    const cases=[
      ["appointment-reminder","eine automatisierte Terminerinnerung an Patient:innen ohne medizinischen Inhalt","administrativ, geringes Risiko"],
      ["merkblatt-translation","die Übersetzung eines allgemeinen Merkblatts zur Stationsordnung","administrativ, geringes Risiko"],
      ["pflegebericht-entwurf","einen KI-Entwurf für einen Pflegebericht vor der fachlichen Prüfung","Dokumentation, mittleres Risiko"],
      ["uebergabenotiz","eine KI-unterstützte Übergabenotiz vor Schichtwechsel","Dokumentation, mittleres Risiko"],
      ["diagnosehinweis","einen KI-generierten Hinweis auf eine mögliche Diagnose für eine reale Patientin","klinisch, hohes Risiko"],
      ["therapieempfehlung","eine KI-generierte Therapieempfehlung für einen realen Patienten","klinisch, hohes Risiko"]
    ];
    return cases.map(([code,task,correct])=>{
      const wrong=tiers.filter(t=>t!==correct).concat(filler);
      return q("D01-"+code,1,`Wie ist folgende Aufgabe nach der Risiko-Faustregel aus Modul 01 einzuordnen: ${task}?`,correct,wrong,DYNAMIC_EXPLANATIONS[1]);
    });
  }
  if(module===2){
    const dims=[["mit möglicher Auslassung","nicht gegen die Originalnotizen geprüft"],["mit möglicher Auslassung","gegen die Originalnotizen geprüft"],["ohne erkennbare Auslassung","nicht gegen die Originalnotizen geprüft"],["ohne erkennbare Auslassung","gegen die Originalnotizen geprüft"]];
    return dims.map(([completeness,check],idx)=>{
      const ok=completeness==="ohne erkennbare Auslassung"&&check==="gegen die Originalnotizen geprüft";
      const correct=ok?"Entwurf kann nach diesem Check fachlich weiterverwendet werden":"Vor Übernahme erneut gegen die Originalnotizen prüfen und offene Punkte klären";
      const wrong=["Der Ton des Entwurfs entscheidet allein über die Übernahme, unabhängig vom Inhalt","Der Entwurf kann ohne weitere Prüfung übernommen werden, weil er professionell wirkt","Auslassungen sind nur bei sehr langen Berichten überhaupt relevant"];
      return q("D02-"+idx,2,`Ein KI-Entwurf für einen Pflegebericht liegt vor: Vollständigkeit ${completeness}, Zahlenwerte ${check}. Was ist die richtige Reaktion?`,correct,wrong,DYNAMIC_EXPLANATIONS[2]);
    });
  }
  if(module===3){
    const tiers=["besondere Kategorie personenbezogener Daten (Gesundheitsdaten, Art. 9 DSGVO)","normale personenbezogene Daten (kein besonderer Schutzbedarf)","keine personenbezogenen Daten (kein Personenbezug)"];
    const filler="Nur relevant, wenn die Daten ausgedruckt werden";
    const cases=[
      ["diagnosis-note","eine Notiz über eine bestätigte Diagnose eines Patienten","besondere Kategorie personenbezogener Daten (Gesundheitsdaten, Art. 9 DSGVO)"],
      ["medication-list","die Medikamentenliste einer Patientin","besondere Kategorie personenbezogener Daten (Gesundheitsdaten, Art. 9 DSGVO)"],
      ["staff-schedule","der interne Dienstplan des Pflegeteams ohne jeden Patientenbezug","keine personenbezogenen Daten (kein Personenbezug)"],
      ["contact-name","Name und Zimmernummer eines Ansprechpartners in der Verwaltung","normale personenbezogene Daten (kein besonderer Schutzbedarf)"],
      ["anonymized-case","ein vollständig anonymisierter Lehrfall ohne jede Rückschlussmöglichkeit","keine personenbezogenen Daten (kein Personenbezug)"]
    ];
    return cases.map(([code,item,correct])=>{
      const wrong=tiers.filter(t=>t!==correct).concat(filler);
      return q("D03-"+code,3,`Wie ist ${item} datenschutzrechtlich einzuordnen?`,correct,wrong,DYNAMIC_EXPLANATIONS[3]);
    });
  }
  if(module===4){
    const cases=[
      ["confident-no-source","Eine KI liefert einen sehr selbstsicher formulierten Hinweis auf eine mögliche Diagnose, ohne Quellenangabe oder Bezug zu Leitlinien.","Hinweis nicht übernehmen, sondern von einer Fachperson eigenständig anhand von Anamnese und Leitlinien prüfen lassen",["Direkt als Diagnose in die Akte übernehmen, weil die Formulierung sicher klingt","Den Hinweis ignorieren, da selbstsichere KI-Aussagen grundsätzlich falsch sind","Den Hinweis ungeprüft an die Patientin weitergeben"]],
      ["uncertain-hedge","Eine KI formuliert einen klinischen Hinweis vorsichtig und weist selbst auf Unsicherheit hin.","Trotz vorsichtiger Formulierung eskalieren und Rücksprache mit einer Fachperson halten",["Vorsichtige Formulierungen benötigen keine weitere Prüfung","Den Hinweis so lange wiederholen lassen, bis er sicher klingt","Nur bei sehr selbstsicheren Hinweisen ist eine Rücksprache nötig"]],
      ["literature-summary","Eine KI fasst ausschließlich Literatur und Leitlinienauszüge zusammen, ohne eine Aussage zu einer realen Patientin zu treffen.","Als zulässige Unterstützung werten, solange keine konkrete Diagnose für eine reale Person ausgesprochen wird",["Grundsätzlich unzulässig, da es sich um ein klinisches Thema handelt","Automatisch als bindende Therapieempfehlung übernehmen","Nur zulässig, wenn die Zusammenfassung sehr kurz ausfällt"]],
      ["direct-diagnosis","Eine KI formuliert eine konkrete Diagnoseaussage für einen namentlich genannten Patienten.","Grenze ist überschritten – Aussage nicht übernehmen und eskalieren",["Zulässig, solange die KI sich auf Literatur beruft","Die Fachperson muss die KI-Diagnose nur noch gegenzeichnen","Zulässig, wenn der Patient der Nutzung vorab zugestimmt hat"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D04-"+code,4,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[4]));
  }
  if(module===5){
    const cases=[
      ["contradiction","Zwei Aussagen im selben KI-generierten Text widersprechen sich inhaltlich.","Warnsignal – aktiv gegenprüfen",["Kein Warnsignal, da KI-Texte nie inhaltlich widersprüchlich sein können","Nur relevant, wenn der Text sehr lang ist","Automatisch unbedenklich, solange der Ton einheitlich bleibt"]],
      ["confident-no-source","Eine sehr sicher klingende Aussage zu einem eigentlich unsicheren Sachverhalt, ohne erkennbare Quelle.","Warnsignal – aktiv gegenprüfen",["Kein Warnsignal, da ein sicherer Tonfall Richtigkeit belegt","Nur bei Zahlenwerten relevant, nie bei Fließtext","Automatisch unbedenklich, wenn der Text professionell formatiert ist"]],
      ["clear-source","Eine Aussage mit korrekt angegebener, nachprüfbarer Quelle.","Kein spezifisches Warnsignal – reguläre Prüfung reicht",["Warnsignal, da jede Quellenangabe grundsätzlich verdächtig ist","Muss zwingend eskaliert werden, unabhängig vom Inhalt","Darf grundsätzlich nie verwendet werden"]],
      ["explicit-uncertainty","Eine Aussage, die selbst offen als vorläufig gekennzeichnet ist und um Rückfrage bittet.","Kein spezifisches Warnsignal – reguläre Prüfung reicht",["Warnsignal, da jede Unsicherheitsangabe automatisch ein Fehler ist","Muss ignoriert werden, weil sie unvollständig wirkt","Bedeutet automatisch, dass die gesamte Ausgabe falsch ist"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D05-"+code,5,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[5]));
  }
  if(module===6){
    const scenarios=[
      ["pflege","eine Pflegekraft, die täglich Übergaben und Patienteninformationen vorbereitet","Dokumentation und Patientenkommunikation stehen im Vordergrund"],
      ["arzt","ärztliches oder therapeutisches Fachpersonal mit klinischer Entscheidungsverantwortung","Die Grenze bei klinischen Entscheidungen steht im Vordergrund"],
      ["management","Praxis- oder Klinikmanagement, das Terminplanung und Aufnahmeprozesse organisiert","Datenschutz und Prozessorganisation stehen im Vordergrund"]
    ];
    const all=scenarios.map(([,,c])=>c);
    return scenarios.map(([code,desc,correct])=>{
      const wrong=all.filter(c=>c!==correct).concat("Für alle Rollen sind exakt dieselben Prinzipien gleich wichtig, eine Gewichtung gibt es nicht");
      return q("D06-"+code,6,`Welcher Schwerpunkt passt laut Modul am ehesten zu folgender Rolle: ${desc}?`,correct,wrong,DYNAMIC_EXPLANATIONS[6]);
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für KI Health Essentials besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für KI Health Essentials besteht keine aktive Anmeldung.");
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
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"ki-health-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
