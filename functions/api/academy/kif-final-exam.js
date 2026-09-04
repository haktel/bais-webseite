import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="ki-fuehrerschein",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Ein Kollege sagt: „ChatGPT ist wie eine Suchmaschine mit einem Nachschlagewerk dahinter.“ Was ist daran technisch falsch?","Generative KI sagt wahrscheinliche Wortfolgen vorher, sie schlägt keine gespeicherten Fakten nach",["Nichts, die Aussage ist korrekt","Nur das Wort „Nachschlagewerk“ ist ungenau, der Rest stimmt","Suchmaschinen nutzen exakt dieselbe Technik wie generative KI"],"Ein Sprachmodell ist ein Vorhersagemodell für Tokens, kein Abruf aus einer geprüften Faktendatenbank."),
q("M01-02",1,"In einem echten Schriftsatz zitierte eine KI sechs überzeugend klingende, aber vollständig erfundene Gerichtsurteile. Was ist die zentrale Lehre?","KI-generierte Zitate und Quellenangaben müssen vor Verwendung eigenständig verifiziert werden",["Juristische Texte dürfen grundsätzlich nie mit KI vorbereitet werden","Erfundene Urteile fallen beim Lesen immer sofort auf","Je selbstsicherer der Ton einer Antwort, desto verlässlicher ist ihr Inhalt"],"Überzeugender Stil ist kein Beleg für inhaltliche Richtigkeit; Quellenangaben brauchen eine eigene Prüfung."),
q("M01-03",1,"Ein Mitarbeitender fügt vertraulichen Quellcode in ein öffentliches KI-Chat-Tool ein, um sich den Code erklären zu lassen. Was ist das Kernproblem?","Eingaben in öffentliche KI-Tools gelten nicht automatisch als vertraulich",["Öffentliche KI-Tools sind für Code-Erklärungen technisch ungeeignet","Der Quellcode wird dadurch automatisch fehlerhaft","Dadurch entstehen automatisch neue Urheberrechte für den Anbieter"],"Was niemals in ein KI-Tool gehört, richtet sich danach, ob eine Eingabe vertraulich ist – nicht danach, wie das Tool heißt."),
q("M01-04",1,"Ein Modell präsentiert eine falsche Rechenaufgabe mit sehr hoher Selbstsicherheit. Warum passiert das?","Es sagt wahrscheinliche Tokenfolgen vorher, statt Arithmetik tatsächlich korrekt auszuführen",["Rechenaufgaben werden von Sprachmodellen grundsätzlich blockiert","Selbstsicherheit im Ton korreliert direkt mit Richtigkeit","Zahlen werden vom Modell vor der Ausgabe verschlüsselt"],"Wahrscheinlichkeit ist nicht dasselbe wie Wissen – das gilt besonders für exakte Berechnungen."),

q("M02-01",2,"Im Februar 2023 enthielt die wichtigste Produkt-Demo eines Sprachmodell-Anbieters eine falsche Behauptung, die breite öffentliche Aufmerksamkeit erhielt. Was zeigt dieser Fall vor allem?","Auch bei hochkarätigen, sorgfältig vorbereiteten Präsentationen können Halluzinationen unentdeckt bleiben",["Nur kleine, wenig bekannte Anbieter sind von Halluzinationen betroffen","Live-Demos großer Anbieter sind grundsätzlich halluzinationsfrei","Das Problem trat einmalig auf und ist seither vollständig gelöst"],"Der Bard-Vorfall zeigt: Prüfung vor Veröffentlichung ist unabhängig von Größe oder Renommee des Anbieters nötig."),
q("M02-02",2,"Ein Recruiting-Tool, trainiert auf zehn Jahren Bewerbungsdaten, benachteiligte systematisch bestimmte Bewerbergruppen. Was war die Ursache?","Historische Trainingsdaten können bestehende Verzerrungen systematisch fortschreiben",["Das Modell erfindet Vorurteile unabhängig von den Trainingsdaten","Bias entsteht ausschließlich durch böswillige Absicht der Entwickler","Ein Recruiting-Tool kann keine Diskriminierung erzeugen, da es nur Text verarbeitet"],"Das Modell übernimmt Bias aus den Daten, es erfindet ihn nicht selbst."),
q("M02-03",2,"Ein Chatbot, der von Nutzereingaben lernte, wurde innerhalb von unter 24 Stunden diskriminierend. Was zeigt dieser Fall?","Ein lernendes System kann durch gezielte Nutzereingaben in sehr kurzer Zeit stark verzerrtes Verhalten annehmen",["Chatbots können sich grundsätzlich nicht durch Nutzerinteraktion verändern","Der Effekt trat über mehrere Monate schleichend auf","Nur Bilderkennungsmodelle sind für einen solchen Effekt anfällig"],"Der Tay-Fall zeigt, wie schnell Verzerrung durch Interaktion mit Nutzenden entstehen kann."),
q("M02-04",2,"Eine KI-Antwort kombiniert sehr selbstsicheren Tonfall mit einer präzisen, aber unbelegten Zahl. Wie ist das einzuordnen?","Diese Kombination ist ein typisches Warnsignal für eine mögliche Halluzination",["Ein sicherer Tonfall beweist, dass die Angabe korrekt ist","Zahlen sind grundsätzlich kein Risiko, nur Namen sind riskant","Das Zwei-Quellen-Prinzip gilt ausschließlich für juristische Texte"],"Sicherheit ist eine Eigenschaft des Stils, nicht des Inhalts – unbelegte präzise Zahlen brauchen eine zweite Quelle."),

q("M03-01",3,"Welche fünf Bausteine bilden einen präzisen Prompt?","Rolle, Aufgabe, Kontext, Format und Einschränkungen",["Titel, Länge, Emojis, Sprache und Farbe","Nur Aufgabe und Format sind für einen präzisen Prompt nötig","Rolle, Kontext, Zeitstempel, Signatur und Passwort"],"Struktur statt Zufall: die fünf Bausteine steuern die Antwort gezielt."),
q("M03-02",3,"Ein bekannter Fintech-Anbieter (Klarna) zeigte, dass Prompt-Iteration auch in großem Maßstab funktioniert. Was folgt daraus?","Iteration und gezieltes Nachschärfen lassen sich systematisch und in großem Maßstab anwenden",["Große Unternehmen benötigen grundsätzlich keine Prompt-Iteration","Ein einmalig perfekter Prompt reicht für jeden Anwendungsfall aus","Iteration funktioniert nur bei sehr kurzen, einfachen Prompts"],"Der Klarna-Fall zeigt gezieltes Nachschärfen statt Neuanfang – auch im großen Maßstab."),
q("M03-03",3,"Der Fall „Sydney“ zeigt, was passieren kann, wenn ein Chat-Dialog nicht re-fokussiert wird. Was ist die Lehre?","Ohne Re-Fokussierung kann ein Dialog vom eigentlichen Ziel abdriften",["Lange Dialoge werden automatisch präziser","Ein Modell kann seinen eigenen Gesprächskontext grundsätzlich nicht verlassen","Re-Fokussierung ist nur bei rein technischen Themen nötig"],"Ohne erneutes Ausrichten auf Rolle und Ziel kann sich ein Dialog vom Auftrag entfernen."),
q("M03-04",3,"Im Fall des „1-Dollar-Autos“ sagte ein Chatbot ohne klare Einschränkungen einen ungewollten Preis zu. Was zeigt der Fall?","Ohne klare Einschränkungen kann ein KI-Tool im Kundenkontakt unbeabsichtigte, bindend wirkende Aussagen treffen",["Chatbots im Kundenservice benötigen grundsätzlich keine Einschränkungen","Ein von einem Chatbot genannter Preis ist rechtlich immer unverbindlich","Dieses Risiko besteht nur bei rein internen Tools, nie im Kundenkontakt"],"Der Baustein „Einschränkungen“ fehlt am häufigsten – mit realen Konsequenzen im Kundenkontakt."),

q("M04-01",4,"Ob eine Information personenbezogen ist, hängt wovon ab?","Vom Personenbezug der Information, nicht vom Dateiformat",["Nur von strukturierten Datenbankfeldern","Ausschließlich davon, ob es sich um ein Foto handelt","Nur davon, ob die Daten verschlüsselt gespeichert sind"],"Der Personenbezug entscheidet, nicht das Format der Information."),
q("M04-02",4,"Welche Datenarten zählen zu den besonderen Kategorien personenbezogener Daten?","Gesundheits-, religiöse, politische und biometrische Daten",["Ausschließlich Finanzdaten","Alle personenbezogenen Daten sind identisch geschützt, es gibt keine Sonderkategorie","Ausschließlich biometrische Daten"],"Besondere Kategorien haben aufgrund des Diskriminierungsrisikos einen erhöhten Schutzbedarf."),
q("M04-03",4,"Im Fall Clearview AI wurden biometrische Daten in großem Umfang gesammelt. Was war das zentrale Problem?","Die Daten wurden ohne ausreichende Rechtsgrundlage gesammelt",["Das Unternehmen hatte für alle betroffenen Personen eine gültige Einwilligung","Es handelte sich ausschließlich um bereits anonymisierte Daten","Es war eine rein interne Testdatenbank ohne jede Veröffentlichung"],"Biometrische Daten ohne Rechtsgrundlage zu sammeln, ist der Kern des Clearview-Falls."),
q("M04-04",4,"Was unterscheidet Pseudonymisierung von Anonymisierung?","Pseudonymisierte Daten lassen sich mit Zusatzwissen wieder einer Person zuordnen, anonymisierte nicht",["Beide Begriffe beschreiben denselben Vorgang","Anonymisierung ist grundsätzlich umkehrbar","Pseudonymisierung entfernt den Personenbezug vollständig und dauerhaft"],"Der Unterschied entscheidet darüber, ob ein Datensatz weiterhin dem Datenschutzrecht unterliegt."),

q("M05-01",5,"Warum sind konkrete Quellenangaben wertvoller als vage Formulierungen wie „Studien zeigen“?","Konkrete, nachprüfbare Quellenangaben lassen sich tatsächlich verifizieren, vage Angaben nicht",["Vage Formulierungen sind genauso prüfbar wie konkrete Quellenangaben","Quellenangaben sind bei KI-generierten Texten grundsätzlich überflüssig","Nur akademische Texte benötigen überhaupt prüfbare Quellen"],"Prüfbarkeit ist der eigentliche Wert einer konkreten Quellenangabe."),
q("M05-02",5,"Was sind konfabulierte Zitate?","Zitate, die überzeugend und konkret klingen, ohne dass es sie tatsächlich gibt",["Zitate, die immer offensichtlich falsch formuliert sind","Ausschließlich sehr lange, wörtliche Zitate","Zitate, die grundsätzlich nur bei unbekannten Personen vorkommen"],"Konkret klingend ist nicht dasselbe wie real existierend."),
q("M05-03",5,"Im Fall CNET enthielten professionell wirkende, redaktionell aufbereitete KI-Artikel reale Sachfehler. Was folgt daraus?","Auch professionell wirkende Artikel können sachlich falsch sein – das Layout ist kein Qualitätsbeleg",["Professionelles Layout ist ein verlässlicher Indikator für inhaltliche Richtigkeit","Der Fall betraf ausschließlich unformatierten Rohtext ohne Veröffentlichung","Finanzartikel sind grundsätzlich fehlerfrei, sobald sie veröffentlicht wurden"],"Der CNET-Fall (Januar 2023) zeigt, dass Prüfung unabhängig vom professionellen Erscheinungsbild nötig ist."),
q("M05-04",5,"Im Fall Sports Illustrated wurden Autor:innenprofile samt Porträtfotos vollständig erfunden. Was zeigt das?","Auch Autor:innenangaben und Porträtfotos können vollständig erfunden sein",["Autor:innenangaben werden grundsätzlich nie durch KI erzeugt","Ein Porträtfoto ist immer ein verlässlicher Echtheitsnachweis","Der Fall betraf ausschließlich Bildunterschriften, nicht die Autor:innen selbst"],"Prüfbarkeit muss sich auch auf Autor:innenschaft erstrecken, nicht nur auf den Fließtext."),

q("M06-01",6,"Welche drei Eskalations-/Freigabestufen kennt das Modul?","Keine formale Freigabe, Team-Review und vollständige Freigabe",["Nur eine einzige Freigabestufe für alle Fälle","Freigabestufen hängen ausschließlich von der Textlänge ab","Freigabe ist nur bei externen Kund:innen nötig, nie intern"],"Die mittlere Stufe (Team-Review) liegt zwischen „gar nicht“ und „vollständig“."),
q("M06-02",6,"Der MyCity-Chatbot einer Stadtverwaltung gab zu rechtlich sensiblen Themen fehlerhafte öffentliche Auskünfte. Was war der Kernfehler?","Ein öffentlicher Chatbot zu rechtlich sensiblen Themen wurde ohne ausreichende Prüfung freigegeben",["Der Chatbot richtete sich ausschließlich an interne Mitarbeitende","Rechtlich sensible Themen benötigen grundsätzlich keine besondere Prüfung","Der Fall wurde nie öffentlich bekannt"],"Externe Reichweite plus rechtlich sensibles Thema löst die höchste Freigabestufe aus."),
q("M06-03",6,"Ein Kundenservice-Chatbot eines Logistikunternehmens (DPD) ging viral und wurde danach abgeschaltet. Was zeigt dieser Fall?","Ein viral gegangener Chatbot mit unangemessenen Antworten wurde nach öffentlicher Kritik abgeschaltet",["Der Chatbot lief unverändert weiter, ohne jede Konsequenz","Es handelte sich um ein rein internes Testsystem ohne Kundenkontakt","Externe Reichweite spielte in diesem Fall keine Rolle"],"Ungeprüfte, öffentlich sichtbare Automatisierung kann sehr schnell Reputationsschaden verursachen."),
q("M06-04",6,"Im Fall iTutorGroup führte ein automatisiertes Bewerbungssystem ohne Kontrollinstanz zu systematischer Benachteiligung. Was folgt daraus?","Automatisierte Entscheidungen ohne Kontrollinstanz können zu systematischer Diskriminierung führen",["Automatisierung schließt Diskriminierung grundsätzlich aus","Der Fall betraf ausschließlich technische Störungen, keine Personenentscheidungen","Kontrollinstanzen sind bei automatisierten Systemen überflüssig"],"Klare Zuständigkeiten und Tests vor Live-Betrieb verhindern, dass Entscheidungen unkontrolliert automatisiert werden.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Was in ein KI-Tool darf, entscheidet sich am Vertraulichkeitsgrad der Eingabe und daran, ob es sich um ein freigegebenes Unternehmens-Tool handelt – nicht am Werkzeug selbst.",
  2:"Sicherheit im Tonfall ist eine Stileigenschaft, keine Inhaltseigenschaft. Nur eine geprüfte, konkrete Quelle rechtfertigt Vertrauen in eine präzise Zahl.",
  3:"Ein präziser Prompt braucht alle fünf Bausteine: Rolle, Aufgabe, Kontext, Format, Einschränkungen. Fehlt einer, bleibt die Erwartung vage.",
  4:"Die Einordnung folgt festen Kriterien: Personenbezug entscheidet über „personenbezogen“, die Art der Information über „besondere Kategorie“.",
  5:"Sourcing-Qualität heißt: konkrete, nachprüfbare Angaben statt vager Verweise – unabhängig davon, wie professionell ein Text wirkt.",
  6:"Die Freigabestufe richtet sich nach externer Reichweite und Sensibilität des Themas – nicht nach Bauchgefühl oder Zeitdruck."
};

function dynamicCandidates(module){
  if(module===1){
    const cases=[
      ["contract","Ein Mitarbeitender möchte einen vertraulichen Kundenvertrag mit echten Namen und Beträgen von einem öffentlichen KI-Tool zusammenfassen lassen. Wie sollte er vorgehen?","Nicht in ein öffentliches Tool einfügen, stattdessen ein freigegebenes Unternehmens-KI-Tool oder anonymisierte Daten verwenden",["Direkt einfügen, da Zusammenfassungen grundsätzlich unkritisch sind","Nur den Firmennamen entfernen und den Rest unverändert einfügen","Den Vertrag als Bild statt als Text einfügen macht die Eingabe vertraulich"]],
      ["recipe","Ein Mitarbeitender fragt ein öffentliches KI-Tool nach einer allgemeinen Rezeptidee für ein Abendessen, ohne jeden Firmenbezug. Wie ist das einzuordnen?","Unbedenklich, da keine vertraulichen oder personenbezogenen Daten enthalten sind",["Grundsätzlich verboten, weil es sich um ein KI-Tool handelt","Nur mit Freigabe der Geschäftsführung erlaubt","Nur in einem internen Unternehmens-KI-Tool zulässig"]],
      ["source-code","Quellcode mit eingebetteten produktiven API-Keys soll zur Fehlersuche in ein öffentliches KI-Tool eingefügt werden. Was ist korrekt?","Zuerst Keys entfernen oder rotieren bzw. ein internes Tool nutzen, bevor der Code irgendwo eingefügt wird",["API-Keys sind für KI-Tools unsichtbar und daher unkritisch","Solange der Chat als privat markiert ist, ist die Eingabe unbedenklich","Es reicht, nur den Dateinamen zu anonymisieren"]],
      ["public-history","Eine bereits öffentlich veröffentlichte Unternehmenschronik soll durch ein öffentliches KI-Tool sprachlich verbessert werden. Wie ist das einzuordnen?","Unbedenklich, da es sich um bereits öffentliche, nicht vertrauliche Informationen handelt",["Grundsätzlich verboten, weil es sich um Unternehmensdaten handelt","Nur mit schriftlicher Kundenzustimmung erlaubt","Nur zulässig, wenn das Tool firmenintern gehostet wird"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D01-"+code,1,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[1]));
  }
  if(module===2){
    const tones=[["sehr selbstsicher formuliert","ohne jede Quellenangabe"],["sehr selbstsicher formuliert","mit einer konkreten, prüfbaren Quelle"],["vorsichtig formuliert, mit Einschränkung","ohne jede Quellenangabe"],["vorsichtig formuliert, mit Einschränkung","mit einer konkreten, prüfbaren Quelle"]];
    return tones.map(([tone,source],idx)=>{
      const hasSource=source.includes("prüfbaren Quelle");
      const correct=hasSource?"Die konkrete Quelle prüfen, dann ggf. übernehmen":"Nicht übernehmen, bevor eine zweite unabhängige Quelle die Zahl bestätigt";
      const wrong=["Da der Tonfall "+tone+" ist, entscheidet allein das über die Übernahme","Die Zahl kann ungeprüft übernommen werden, weil sie präzise wirkt","Tonfall und Quellenlage sind für die Bewertung gleich unwichtig"];
      return q("D02-"+idx,2,`Eine KI-Antwort enthält eine präzise Zahl. Tonfall: ${tone}. Quellenlage: ${source}. Was ist die richtige Reaktion?`,correct,wrong,DYNAMIC_EXPLANATIONS[2]);
    });
  }
  if(module===3){
    const cases=[
      ["rolle","„Fasse den Quartalsbericht für die Geschäftsleitung in maximal 200 Wörtern als Bulletpoints zusammen, sachlicher Ton.“ Welcher Baustein fehlt eindeutig?","Rolle",["Format","Kontext","Einschränkungen"]],
      ["aufgabe","„Du bist Finanzanalyst. Für die Geschäftsleitung, maximal 200 Wörter, als Bulletpoints, sachlicher Ton.“ Welcher Baustein fehlt eindeutig?","Aufgabe",["Rolle","Format","Kontext"]],
      ["kontext","„Du bist Finanzanalyst. Fasse den Quartalsbericht in maximal 200 Wörtern als Bulletpoints zusammen, sachlicher Ton.“ Welcher Baustein fehlt eindeutig?","Kontext",["Rolle","Aufgabe","Format"]],
      ["format","„Du bist Finanzanalyst. Fasse den Quartalsbericht für die Geschäftsleitung in maximal 200 Wörtern zusammen, sachlicher Ton.“ Welcher Baustein fehlt eindeutig?","Format",["Rolle","Aufgabe","Kontext"]],
      ["einschraenkungen","„Du bist Finanzanalyst. Fasse den Quartalsbericht für die Geschäftsleitung als Bulletpoints zusammen.“ Welcher Baustein fehlt eindeutig?","Einschränkungen",["Rolle","Aufgabe","Format"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D03-"+code,3,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[3]));
  }
  if(module===4){
    const filler="Nur relevant, wenn die Daten veröffentlicht werden";
    const cases=[
      ["health","eine Information über eine chronische Erkrankung eines Kunden","besondere Kategorie personenbezogener Daten (Gesundheitsdaten)",["normale personenbezogene Daten (kein besonderer Schutzbedarf)","keine personenbezogenen Daten (kein Personenbezug)",filler]],
      ["religion","die Konfession eines Bewerbers aus dem Lebenslauf","besondere Kategorie personenbezogener Daten",["normale personenbezogene Daten (kein besonderer Schutzbedarf)","keine personenbezogenen Daten (kein Personenbezug)",filler]],
      ["name-email","Name und geschäftliche E-Mail-Adresse eines Ansprechpartners","normale personenbezogene Daten (kein besonderer Schutzbedarf)",["besondere Kategorie personenbezogener Daten","keine personenbezogenen Daten (kein Personenbezug)",filler]],
      ["biometric","ein Fingerabdruck-Template zur Zugangskontrolle","besondere Kategorie personenbezogener Daten (biometrisch)",["normale personenbezogene Daten (kein besonderer Schutzbedarf)","keine personenbezogenen Daten (kein Personenbezug)",filler]],
      ["revenue","der öffentlich gemeldete Jahresumsatz eines Unternehmens","keine personenbezogenen Daten (kein Personenbezug)",["besondere Kategorie personenbezogener Daten","normale personenbezogene Daten (kein besonderer Schutzbedarf)",filler]]
    ];
    return cases.map(([code,item,correct,wrong])=>q("D04-"+code,4,`Wie ist ${item} datenschutzrechtlich einzuordnen?`,correct,wrong,DYNAMIC_EXPLANATIONS[4]));
  }
  if(module===5){
    const cases=[
      ["specific-source","Eine Aussage verweist auf „Studie der Universität Leipzig, 2022, Tabelle 3, S. 14“. Wie ist die Quellenangabe einzuordnen?","Konkret und prüfbar – kann nachvollzogen werden",["Zu detailliert, um echt zu sein","Nicht überprüfbar, da akademische Quellen grundsätzlich nicht zitierfähig sind","Automatisch korrekt, allein weil eine Universität genannt wird"]],
      ["vague-source","Eine Aussage verweist nur auf „laut mehreren Studien“, ohne weitere Angaben. Wie ist die Quellenangabe einzuordnen?","Vage – ohne konkrete Angabe nicht prüfbar",["Genauso prüfbar wie eine konkrete Quellenangabe","Automatisch falsch, allein weil mehrere Studien genannt werden","Ausreichend, wenn der Tonfall sicher klingt"]],
      ["fabricated-quote","Ein wortwörtliches Zitat einer bekannten Person lässt sich in keiner Originalquelle auffinden. Wie ist das einzuordnen?","Wahrscheinlich konfabuliert – vor Verwendung verifizieren",["Automatisch echt, weil es wortwörtlich klingt","Zitate können durch KI grundsätzlich nicht erfunden werden","Nur bei sehr langen Zitaten überhaupt ein Risiko"]],
      ["byline-photo","Ein Artikel zeigt ein Autor:innenprofil mit Foto, das sich keiner realen Person zuordnen lässt. Wie ist das einzuordnen?","Möglicherweise vollständig erfunden – Autor:innenschaft separat prüfen",["Ein Foto ist immer ein verlässlicher Echtheitsnachweis","Autor:innenprofile werden grundsätzlich nie durch KI erzeugt","Nur der Artikeltext muss geprüft werden, nicht die Autor:innenangabe"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D05-"+code,5,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[5]));
  }
  if(module===6){
    const tiers=["keine formale Freigabe nötig","Team-Review","vollständige Freigabe"];
    const scenarios=[
      ["intern-niedrig","eine interne, fachlich gut bekannte Information nur für das eigene Team","keine formale Freigabe nötig"],
      ["intern-hoch","ein internes Dokument zu einem rechtlich/gesellschaftlich sensiblen Thema, nur für interne Leser","Team-Review"],
      ["extern-niedrig","eine öffentlich sichtbare, fachlich unkritische Kundenkommunikation","Team-Review"],
      ["extern-hoch","einen öffentlich sichtbaren Chatbot zu einem rechtlich sensiblen Thema","vollständige Freigabe"]
    ];
    return scenarios.map(([code,desc,correct])=>{
      const wrong=tiers.filter(t=>t!==correct);
      return q("D06-"+code,6,`Welche Freigabestufe passt zu folgendem Fall: ${desc}?`,correct,wrong,DYNAMIC_EXPLANATIONS[6]);
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für den KI-Führerschein Essentials besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für den KI-Führerschein Essentials besteht keine aktive Anmeldung.");
  const body=await readJson(request,20000),action=cleanText(body.action,20);
  if(action==="start"){
   const modules=await moduleReadiness(db,user.user_id,enrollment.course_id);
   if(!modules.every(m=>m.ready))throw new ApiError(409,"modules_incomplete","Die Abschlussprüfung wird erst nach 100% in allen 6 Modulen freigeschaltet.");
   const now=new Date(),nowIso=now.toISOString();
   const active=await db.prepare("SELECT id,questions_json,started_at,expires_at FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status='in_progress' AND expires_at>? ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id,nowIso).first();
   if(active)return json({ok:true,resumed:true,attemptId:active.id,questions:JSON.parse(active.questions_json),startedAt:active.started_at,expiresAt:active.expires_at,passScore:PASS_SCORE});
   await db.prepare("UPDATE academy_final_exam_attempts SET status='expired' WHERE user_id=? AND course_id=? AND status='in_progress' AND expires_at<=?").bind(user.user_id,enrollment.course_id,nowIso).run();
   const previous=await db.prepare("SELECT questions_json FROM academy_final_exam_attempts WHERE user_id=? AND course_id=? AND status IN('passed','failed','expired') ORDER BY started_at DESC LIMIT 1").bind(user.user_id,enrollment.course_id).first();
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
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"kif-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
