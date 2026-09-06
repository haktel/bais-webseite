import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="eu-ai-act",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Die niederländische Steuerbehörde nutzte ein selbstlernendes System zur Betrugserkennung bei Kindergeldanträgen. Was war die zentrale Folge des Falls?","Über 20.000 Familien wurden zu Unrecht der Beihilfebetrug beschuldigt, was 2021 zum Rücktritt der Regierung führte",["Das System wurde nie öffentlich bekannt und lief unverändert weiter","Es handelte sich um einen rein internen Testlauf ohne reale Auswirkungen","Die betroffenen Familien erhielten automatisch eine Entschädigung, bevor der Fall bekannt wurde"],"Der Toeslagenaffaire-Fall zeigt, was passiert, wenn automatisierte Entscheidungen ohne wirksame Kontrolle und Widerspruchsmöglichkeit weitreichenden Schaden anrichten."),
q("M01-02",1,"Seit welchem Datum ist die AI-Literacy-Pflicht nach Artikel 4 EU AI Act anwendbar?","Seit dem 2. Februar 2025",["Seit dem 1. August 2024","Erst seit dem 2. August 2025","Erst seit dem 2. Dezember 2027"],"Grundbegriffe, verbotene Praktiken (Art. 5) und die AI-Literacy-Pflicht (Art. 4) wurden am 2. Februar 2025 anwendbar."),
q("M01-03",1,"Ein Unternehmen kauft ein HR-Tool ein und setzt es im Bewerbungsprozess ein. Ein Mitarbeitender sagt: „Wir haben das Tool nicht entwickelt, also betrifft uns der AI Act nicht.“ Was ist daran falsch?","Wer ein AI-System beruflich einsetzt, ist Deployer mit eigenständigen Pflichten, unabhängig vom Provider",["Die Aussage ist korrekt, nur Provider haben Pflichten nach dem AI Act","Der AI Act gilt ausschließlich für Unternehmen, die AI-Systeme entwickeln und verkaufen","Deployer-Pflichten entstehen erst, wenn das Tool auch weiterverkauft wird"],"Deployer nutzen ein AI-System beruflich in eigener Verantwortung und haben eigene, vom Provider unabhängige Pflichten."),
q("M01-04",1,"Ein Unternehmen setzt ein System zum verbotenen Social Scoring nach Artikel 5 ein. Welcher Bußgeldrahmen greift?","Bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes",["Bis zu 15 Mio. € oder 3 % des weltweiten Jahresumsatzes","Bis zu 7,5 Mio. € oder 1 % des weltweiten Jahresumsatzes","Es gibt für Verstöße gegen Art. 5 keinen eigenen Bußgeldrahmen"],"Verstöße gegen verbotene Praktiken nach Art. 5 lösen die höchste Sanktionsstufe aus (bis 35 Mio. € oder 7 % Jahresumsatz)."),

q("M02-01",2,"Welche Rolle vertritt einen Provider außerhalb der EU gegenüber EU-Behörden?","Der Bevollmächtigte",["Der Importeur","Der Händler","Der Deployer"],"Der Bevollmächtigte (Authorised Representative) vertritt einen Nicht-EU-Provider gegenüber EU-Behörden."),
q("M02-02",2,"Ein Unternehmen passt ein allgemeines Sprachmodell so an, dass daraus ein eigenständiges Hochrisiko-System für Personalentscheidungen wird. Was folgt daraus?","Durch die wesentliche Zweckänderung kann das Unternehmen selbst zum Provider dieses veränderten Systems werden",["Das Unternehmen bleibt in jedem Fall ausschließlich Deployer","Nur die ursprünglichen Systementwickler tragen weiterhin alle Pflichten","Eine Anpassung des Zwecks hat keine Auswirkung auf die Rollenzuordnung"],"Eine wesentliche Änderung des Zwecks eines AI-Systems kann die ursprüngliche Rolle kippen und eigene Provider-Pflichten auslösen."),
q("M02-03",2,"Ein Unternehmen nutzt ein fremdes GPAI-Modell per API für ein eigenes Kundenservice-Tool. Welche Rolle nimmt es damit typischerweise ein?","Es bleibt in aller Regel Deployer des darauf aufgebauten AI-Systems, nicht GPAI-Anbieter",["Es wird automatisch selbst zum GPAI-Anbieter","Es übernimmt automatisch alle Pflichten des Foundation-Model-Herstellers","Es hat gar keine Pflichten, weil es das Modell nicht selbst trainiert hat"],"Die reine Nutzung eines GPAI-Modells per API macht ein Unternehmen nicht zum GPAI-Anbieter — es bleibt Deployer des eigenen AI-Systems."),
q("M02-04",2,"Amazon entwickelte und nutzte selbst ein internes Bewerbungs-Tool, das systematisch Männer bevorzugte. Welche Rollenkonstellation zeigt dieser Fall?","Ein Unternehmen kann gleichzeitig Provider und Deployer desselben Systems sein",["Amazon war in diesem Fall ausschließlich Händler des Systems","Der Fall zeigt, dass interne Tools grundsätzlich keiner Rolle nach dem AI Act zugeordnet werden","Amazon war ausschließlich Importeur eines fremden Systems"],"Der Amazon-Recruiting-Fall (2014–2018) zeigt eine Organisation, die ein AI-System selbst entwickelt und selbst einsetzt — beide Rollenpflichten treffen dieselbe Organisation."),

q("M03-01",3,"Ein Anbieter baut durch ungezieltes Auslesen von Fotos aus dem Internet eine Gesichtserkennungsdatenbank auf. Wie ist das nach Art. 5 einzuordnen?","Verbotene Praktik – ungezieltes Gesichts-Scraping ist unabhängig vom Nutzen unzulässig",["Zulässig, solange die Fotos öffentlich zugänglich waren","Hochrisiko, aber mit entsprechender Dokumentation zulässig","Nur bei kommerzieller Nutzung verboten, bei Forschung erlaubt"],"Der AI Act verbietet den Aufbau von Gesichtserkennungsdatenbanken durch ungezieltes Auslesen aus dem Internet oder Kamerabildern ausdrücklich und unabhängig vom Nutzen — der Clearview-AI-Fall ist das Lehrbuchbeispiel."),
q("M03-02",3,"Ein AI-System entscheidet automatisiert über die Vorauswahl von Bewerbungen. Welchem Annex-III-Hochrisikobereich ist das zuzuordnen?","Beschäftigung",["Kritische Infrastruktur","Migration & Grenzkontrolle","Rechtspflege & Demokratie"],"Annex III listet Bewerbungsauswahl, Beförderung und Kündigung ausdrücklich unter dem Bereich Beschäftigung."),
q("M03-03",3,"Ein Chatbot auf einer Kundenservice-Website beantwortet Anfragen automatisiert. Welche Pflicht greift nach dem AI Act?","Transparenzpflicht: Es muss erkennbar gemacht werden, dass keine Person antwortet",["Keine, da Chatbots grundsätzlich unter minimales Risiko fallen und pflichtenfrei sind","Vollständige Konformitätsbewertung wie bei Hochrisiko-Systemen","Die Pflicht entfällt, wenn der Chatbot nur Standardfragen beantwortet"],"Chatbots gelten als begrenztes Risiko: Nutzer:innen müssen erkennen können, dass sie nicht mit einer Person kommunizieren."),
q("M03-04",3,"Mehrere europäische Datenschutzbehörden verhängten Bußgelder gegen Clearview AI. Was war das zentrale Problem?","Der Aufbau einer Gesichtserkennungsdatenbank durch ungezieltes Scraping von Fotos ohne Einwilligung",["Das Unternehmen hatte für alle abgebildeten Personen eine gültige Einwilligung eingeholt","Es handelte sich um eine rein interne, nie veröffentlichte Testdatenbank","Die Datenbank enthielt ausschließlich bereits anonymisierte Bilder"],"Clearview AI las milliardenfach Fotos aus dem Internet ungezielt aus, um eine Gesichtserkennungsdatenbank aufzubauen — genau diese Praktik verbietet der AI Act ausdrücklich."),

q("M04-01",4,"Welche vier Faktoren nennt Artikel 4 ausdrücklich zur Bemessung ausreichender AI-Kompetenz?","Technisches Wissen, Erfahrung, Bildung/Ausbildung und der Einsatzkontext (inkl. betroffener Personen)",["Nur die Anzahl der absolvierten Schulungsstunden","Ausschließlich die Unternehmensgröße und Branche","Nur das Alter und die Betriebszugehörigkeit der Person"],"Art. 4 nennt technisches Wissen, Erfahrung, Bildung/Ausbildung sowie den Einsatzkontext einschließlich der betroffenen Personen als Bemessungsfaktoren."),
q("M04-02",4,"Ein AI-Tool wird eingeführt, weil ein Anbieter überzeugend präsentiert hat, ohne dass jemand mit ausreichender Kompetenz Risikostufe und Datenbasis geprüft hat. Was zeigt dieser typische Fehler?","Führungskräfte müssen wissen, wann eine Freigabeentscheidung eine vertiefte fachliche Prüfung braucht",["Führungskräfte müssen jedes Modell technisch im Detail selbst implementieren können","Vertriebspräsentationen von Anbietern ersetzen grundsätzlich die interne Prüfung","Freigabeentscheidungen benötigen keine AI-Kompetenz, da IT dafür zuständig ist"],"Führungskräfte müssen nicht jedes Modell technisch verstehen, aber erkennen, wann eine Freigabe eine vertiefte Prüfung erfordert."),
q("M04-03",4,"Eine Analyse von ProPublica ergab 2016, dass das US-Justiz-Tool COMPAS bestimmte Gruppen systematisch benachteiligte. Was zeigt dieser Fall?","Ein systematischer Bias kann über Jahre unentdeckt bleiben, wenn niemand mit ausreichender Kompetenz genau hinschaut",["Scoring-Systeme in der Justiz sind grundsätzlich fehlerfrei","Der Fall wurde nie öffentlich untersucht oder diskutiert","Bias entsteht bei Risikoscoring-Tools ausschließlich durch böswillige Absicht"],"Der COMPAS/ProPublica-Fall zeigt, wie lange ein systematischer Fehler unentdeckt bleiben kann, wenn AI-Kompetenz zur kritischen Prüfung fehlt."),
q("M04-04",4,"Ein Recruiting-Team bedient ein Scoring-Tool technisch fehlerfrei, erkennt aber nicht, dass es bestimmte Gruppen benachteiligt. Was fehlt hier?","Urteilskompetenz: das Wissen, welche Muster auf Verzerrung hindeuten, und der Mut, ein Ergebnis anzuzweifeln",["Nichts, technische Bedienkompetenz reicht für den verantwortungsvollen Einsatz aus","Eine schnellere Internetverbindung für das Tool","Zusätzliche Serverkapazität für das Scoring-System"],"Bedienkompetenz (den Knopf finden) ist nicht dasselbe wie Urteilskompetenz (Ergebnisse fachlich kritisch einordnen können)."),

q("M05-01",5,"Wozu dient die Betriebsanleitung, die ein Provider für ein Hochrisiko-System bereitstellen muss?","Sie gibt Deployern klare Angaben zu bestimmungsgemäßer Nutzung, Grenzen und nötiger menschlicher Aufsicht",["Sie ersetzt die Konformitätsbewertung vollständig","Sie ist nur für interne Marketingzwecke des Providers gedacht","Sie wird ausschließlich bei einer behördlichen Anfrage nachträglich erstellt"],"Ohne Betriebsanleitung des Providers kann ein Deployer seine eigene Aufsichtspflicht kaum sinnvoll erfüllen."),
q("M05-02",5,"Welche Deployer müssen zusätzlich eine Grundrechte-Folgenabschätzung (FRIA) durchführen, bevor ein Hochrisiko-System erstmals eingesetzt wird?","Insbesondere öffentliche Stellen und Betreiber bestimmter essenzieller Dienste",["Ausnahmslos alle Deployer jedes AI-Systems, unabhängig von der Risikostufe","Ausschließlich Provider, niemals Deployer","Nur Unternehmen mit weniger als zehn Mitarbeitenden"],"Bestimmte Deployer, insbesondere öffentliche Stellen und Betreiber essenzieller Dienste, müssen vor dem erstmaligen Einsatz eines Hochrisiko-Systems eine Grundrechte-Folgenabschätzung durchführen."),
q("M05-03",5,"Das Bezirksgericht Den Haag stoppte 2020 das staatliche Risikobewertungssystem SyRI. Was war der zentrale Grund?","Weder Betroffene noch Gerichte konnten nachvollziehen, wie die Risikoscores zustande kamen",["Das System war technisch fehlerhaft und stürzte regelmäßig ab","Es fehlte lediglich eine Datenschutz-Einwilligung der Nutzenden","Das System wurde nie tatsächlich eingesetzt"],"SyRI verstieß laut Gericht gegen das Recht auf Privatsphäre, unter anderem weil die Risikoscores nicht nachvollziehbar waren — ein Kernproblem fehlender Dokumentation und Aufsicht."),
q("M05-04",5,"Eine Person klickt bei jedem AI-Ergebnis routinemäßig auf „Bestätigen“, ohne das Ergebnis fachlich zu prüfen. Wie ist das einzuordnen?","Formale statt wirksame menschliche Aufsicht – ein bloßer Klick ersetzt keine echte Prüfung",["Das ist bereits wirksame menschliche Aufsicht im Sinne des AI Act","Menschliche Aufsicht ist bei diesem Vorgehen grundsätzlich überflüssig","Ein Klick auf Bestätigen erfüllt automatisch alle Dokumentationspflichten"],"Wirksame Aufsicht setzt voraus, dass die Person ein Ergebnis tatsächlich verstehen, infrage stellen und ablehnen kann – nicht nur einen Prozessschritt bestätigen."),

q("M06-01",6,"Welches der folgenden Signale gilt laut Modul 06 klar als Eskalationstrigger?","Eine Beschwerde einer betroffenen Person über eine automatisierte Entscheidung",["Eine positive Rückmeldung eines zufriedenen Kunden","Eine geplante, aber noch nicht durchgeführte Software-Aktualisierung","Ein Anstieg der Nutzerzahlen eines AI-Tools ohne weitere Auffälligkeiten"],"Eskalationstrigger sind u. a. Annex-III-Bezug, auffällige Muster, fehlende Dokumentation und Beschwerden Betroffener."),
q("M06-02",6,"Der britische Prüfungsalgorithmus Ofqual stufte 2020 viele Schulnoten künstlich herab. Was zeigt dieser Fall?","Nach lautstarken öffentlichen Protesten wurde der Algorithmus innerhalb weniger Tage vollständig zurückgenommen",["Der Algorithmus lief trotz Kritik jahrelang unverändert weiter","Es gab keinerlei öffentliche Reaktion auf den Vorfall","Der Fall betraf ausschließlich private Nachhilfeinstitute, keine staatlichen Prüfungen"],"Der Ofqual-Fall zeigt: sichtbarer, konkret benennbarer Schaden kann genug Druck für eine sehr schnelle Korrektur erzeugen."),
q("M06-03",6,"Im Gegensatz zum Ofqual-Fall blieben bei der Toeslagenaffaire interne Warnsignale über Jahre folgenlos. Was zeigt dieser Kontrast vor allem?","Ohne wirksame Eskalation kann ein bekannter Schaden sich über Jahre fortsetzen, statt schnell korrigiert zu werden",["Beide Fälle wurden exakt gleich schnell korrigiert","Interne Warnsignale existierten bei der Toeslagenaffaire nie","Öffentlicher Druck war für die Toeslagenaffaire völlig irrelevant für die Dauer des Schadens"],"Der Kontrast zwischen Ofqual (Tage) und Toeslagenaffaire (Jahre) zeigt, wie entscheidend ein funktionierender Eskalationsweg für die Schadensdauer ist."),
q("M06-04",6,"Im Abschlussszenario bemerkt ein Teammitglied, dass ein eingekauftes Recruiting-Tool auffällig wenige Bewerbungen von Berufseinsteiger:innen bestimmter Herkunft in die engere Auswahl bringt. Welche Annex-III-Kategorie ist berührt und was ist der richtige nächste Schritt?","Beschäftigung ist berührt; richtig ist die sofortige interne Eskalation und Aussetzung des automatisierten Ausschlusses",["Kritische Infrastruktur ist berührt; das Tool darf ohne weitere Prüfung weiterlaufen","Keine Annex-III-Kategorie ist berührt, da es sich nur um ein eingekauftes Tool handelt","Migration & Grenzkontrolle ist berührt; eine Eskalation ist in diesem Fall nicht nötig"],"Bewerbungsauswahl fällt unter Annex III „Beschäftigung“; bei einem begründeten Verdacht ist sofortige Eskalation und Aussetzung richtig, nicht stilles Weiterlaufenlassen.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Die Risikoklasse folgt aus dem konkreten Einsatzzweck eines Systems – nicht aus Produktnamen oder Marketing-Versprechen. Die vier Stufen sind unzulässig, Hochrisiko, begrenztes Risiko (Transparenz) und minimales Risiko.",
  2:"Die Rolle richtet sich danach, wer ein System entwickelt, importiert, vertreibt oder beruflich einsetzt – nicht danach, wer die Rechnung bezahlt.",
  3:"Annex III listet konkrete Lebensbereiche als Hochrisiko; Art. 5 listet unabhängig vom Nutzen verbotene Praktiken. Beide Einordnungen folgen aus dem Gesetzestext, nicht aus Bauchgefühl.",
  4:"Art. 4 misst ausreichende AI-Kompetenz an vier Faktoren: technisches Wissen, Erfahrung, Bildung/Ausbildung und Einsatzkontext einschließlich betroffener Personen.",
  5:"Provider dokumentieren das System vor Markteinführung, Deployer dokumentieren den tatsächlichen Einsatz im Betrieb – beide Pflichten ergänzen sich.",
  6:"Eskalation folgt klaren, vorab definierten Triggern statt Bauchgefühl – ein begründeter Verdacht reicht bereits aus."
};

function dynamicCandidates(module){
  if(module===1){
    const tiers=["Minimales Risiko – keine spezifischen AI-Act-Pflichten, Art. 4 gilt trotzdem","Begrenztes Risiko – Transparenzpflicht (Kennzeichnung erforderlich)","Hochrisiko – Annex-III-Bereich betroffen, strenge Pflichten (Dokumentation, Aufsicht)","Unzulässig – verbotene Praktik nach Artikel 5, unabhängig vom Nutzen verboten"];
    const scenarios=[
      ["minimal","Ein Mitarbeitender nutzt eine KI-gestützte Rechtschreibkorrektur beim Verfassen interner E-Mails.",tiers[0]],
      ["transparency","Ein Chatbot auf der Kundenservice-Website beantwortet Standardanfragen automatisiert, ohne erkennbar zu machen, dass keine Person antwortet.",tiers[1]],
      ["high","Ein AI-System bewertet automatisiert die Kreditwürdigkeit von Privatkunden für die Vergabe von Verbraucherkrediten.",tiers[2]],
      ["prohibited","Ein System baut durch ungezieltes Auslesen von Fotos aus dem Internet eine Gesichtserkennungsdatenbank auf.",tiers[3]]
    ];
    return scenarios.map(([code,desc,correct])=>{
      const wrong=tiers.filter(t=>t!==correct);
      return q("D01-"+code,1,`Wie ist folgender Anwendungsfall einzuordnen: ${desc}`,correct,wrong,DYNAMIC_EXPLANATIONS[1]);
    });
  }
  if(module===2){
    const cases=[
      ["provider","Ein Unternehmen entwickelt ein Scoring-Tool und bringt es unter eigenem Namen auf den Markt.","Provider",["Deployer","Importeur","Händler"]],
      ["deployer","Ein Unternehmen kauft ein HR-Tool ein und setzt es unverändert im eigenen Bewerbungsprozess ein.","Deployer",["Provider","Bevollmächtigter","Händler"]],
      ["importeur","Ein Unternehmen bringt ein AI-System eines Nicht-EU-Herstellers erstmals auf den EU-Markt.","Importeur",["Provider","Händler","Deployer"]],
      ["haendler","Ein Unternehmen stellt ein bereits importiertes AI-System im eigenen Online-Shop bereit, ohne es selbst entwickelt oder importiert zu haben.","Händler",["Provider","Importeur","Deployer"]],
      ["bevollmaechtigter","Ein Unternehmen vertritt einen Provider außerhalb der EU gegenüber EU-Behörden.","Bevollmächtigter",["Provider","Importeur","Händler"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D02-"+code,2,`Welche Rolle nimmt folgendes Unternehmen im AI-Ökosystem ein: ${prompt}`,correct,wrong,DYNAMIC_EXPLANATIONS[2]));
  }
  if(module===3){
    const cases=[
      ["beschaeftigung","Ein AI-System filtert automatisiert Bewerbungen für offene Stellen vor.","Beschäftigung (Annex III)",["Kritische Infrastruktur (Annex III)","Migration & Grenzkontrolle (Annex III)","Verbotene Praktik nach Art. 5"]],
      ["bildung","Ein AI-System bewertet automatisiert Prüfungsleistungen an einer Hochschule.","Bildung (Annex III)",["Beschäftigung (Annex III)","Strafverfolgung (Annex III)","Verbotene Praktik nach Art. 5"]],
      ["essenzielle","Ein AI-System entscheidet automatisiert über die Vergabe von Verbraucherkrediten.","Essenzielle Dienste (Annex III)",["Bildung (Annex III)","Rechtspflege & Demokratie (Annex III)","Verbotene Praktik nach Art. 5"]],
      ["migration","Ein AI-System bewertet automatisiert das Risiko in Asylverfahren.","Migration & Grenzkontrolle (Annex III)",["Beschäftigung (Annex III)","Essenzielle Dienste (Annex III)","Verbotene Praktik nach Art. 5"]],
      ["prohibited","Ein System bewertet automatisiert das Sozialverhalten von Bürger:innen mit nachteiligen, unverhältnismäßigen Folgen in unabhängigen Lebensbereichen.","Verbotene Praktik nach Art. 5 (Social Scoring)",["Beschäftigung (Annex III)","Bildung (Annex III)","Essenzielle Dienste (Annex III)"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D03-"+code,3,`Wie ist folgender Anwendungsfall einzuordnen: ${prompt}`,correct,wrong,DYNAMIC_EXPLANATIONS[3]));
  }
  if(module===4){
    const cases=[
      ["technisches-wissen","Ein Bemessungsfaktor nach Art. 4 fragt danach, ob eine Person versteht, wie ein AI-System funktioniert und welche Grenzen es hat. Um welchen Faktor handelt es sich?","Technisches Wissen",["Erfahrung","Bildung und Ausbildung","Einsatzkontext (inkl. betroffener Personen)"]],
      ["erfahrung","Ein Bemessungsfaktor nach Art. 4 fragt danach, wie lange und in welchen Situationen eine Person bereits mit AI-Systemen gearbeitet hat. Um welchen Faktor handelt es sich?","Erfahrung",["Technisches Wissen","Bildung und Ausbildung","Einsatzkontext (inkl. betroffener Personen)"]],
      ["bildung","Ein Bemessungsfaktor nach Art. 4 fragt danach, welche Schulung oder Qualifikation eine Person mitbringt. Um welchen Faktor handelt es sich?","Bildung und Ausbildung",["Technisches Wissen","Erfahrung","Einsatzkontext (inkl. betroffener Personen)"]],
      ["kontext","Ein Bemessungsfaktor nach Art. 4 fragt danach, in welchem Umfeld ein System eingesetzt wird und wer davon betroffen ist. Um welchen Faktor handelt es sich?","Einsatzkontext (inkl. betroffener Personen)",["Technisches Wissen","Erfahrung","Bildung und Ausbildung"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D04-"+code,4,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[4]));
  }
  if(module===5){
    const cases=[
      ["tech-doku","Wer muss vor Markteinführung eine technische Dokumentation mit Trainingsdaten und Leistungskennzahlen erstellen?","Provider",["Deployer","Importeur","Händler"]],
      ["logs","Wer muss automatisch erzeugte Protokolle (Logs) eines Hochrisiko-Systems für einen angemessenen Zeitraum aufbewahren?","Deployer",["Provider","Bevollmächtigter","Händler"]],
      ["konformitaet","Wer muss vor Markteinführung eine Konformitätsbewertung durchführen?","Provider",["Deployer","Importeur","Händler"]],
      ["fria","Wer muss ggf. eine Grundrechte-Folgenabschätzung durchführen, bevor ein Hochrisiko-System erstmals eingesetzt wird?","Deployer (insbesondere öffentliche Stellen)",["Provider","Bevollmächtigter","Importeur"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D05-"+code,5,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[5]));
  }
  if(module===6){
    const triggers=["Annex-III-Bereich berührt","Auffällige Muster in Ergebnissen","Fehlende oder unklare Dokumentation vom Anbieter","Beschwerde einer betroffenen Person"];
    const scenarios=[
      ["annex","Ein neues AI-Tool soll im Bereich Kreditvergabe eingesetzt werden, was in Annex III als Hochrisiko-Bereich gilt.",triggers[0]],
      ["muster","Ein Recruiting-Tool zeigt über mehrere Monate ein wiederkehrendes, auffälliges Muster: Bewerbungen bestimmter Gruppen kommen fast nie in die engere Auswahl.",triggers[1]],
      ["doku","Der Anbieter eines AI-Tools kann auf Nachfrage keine vollständige technische Dokumentation liefern.",triggers[2]],
      ["beschwerde","Eine betroffene Person meldet sich und beschwert sich über eine automatisierte Entscheidung.",triggers[3]]
    ];
    return scenarios.map(([code,desc,correct])=>{
      const wrong=triggers.filter(t=>t!==correct);
      return q("D06-"+code,6,`Welcher Eskalationstrigger liegt in folgendem Fall vor: ${desc}`,correct,wrong,DYNAMIC_EXPLANATIONS[6]);
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für AI Literacy & EU AI Act Awareness besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für AI Literacy & EU AI Act Awareness besteht keine aktive Anmeldung.");
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
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"eu-ai-act-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
