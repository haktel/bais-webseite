import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="ki-health-klinik",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Ein KI-System liefert im Rahmen der klinischen Entscheidungsunterstützung mehrere mögliche Differenzialdiagnosen. Was ist der korrekte Status dieser Ausgabe?","Ein Hinweis, der erst nach fachlicher Bewertung in die Entscheidung einfließen darf",["Eine bereits geprüfte Diagnose, die direkt übernommen werden kann","Eine bindende Therapieempfehlung","Ein Ersatz für Anamnese und körperliche Untersuchung"],"Der Lernpfad ist Anamnese & Befunde → KI-Hinweis → Fachliche Bewertung → Entscheidung der Fachperson; der Hinweis ersetzt keinen dieser Schritte."),
q("M01-02",1,"Ein KI-Vorschlag zu einer möglichen Differenzialdiagnose wird ohne weitere Prüfung direkt in die Patientenakte übernommen. Wie ist das einzuordnen?","Als unzulässige De-facto-Entscheidung, da keine fachliche Prüfung stattfand",["Als zulässiger Hinweis, da die KI-Ausgabe präzise formuliert war","Als reine Dokumentationsaufgabe ohne Entscheidungscharakter","Als zulässig, solange die Fachperson die Akte irgendwann später gegenliest"],"Ungeprüft übernommene KI-Ausgaben wirken faktisch als Entscheidung, nicht mehr als Hinweis."),
q("M01-03",1,"Welche Faktoren erhöhen laut Modul 1 das Risiko, dass ein KI-Hinweis unbemerkt zur Entscheidung wird?","Hoher Zeitdruck, viele ähnliche Routinefälle und eine ungewöhnlich sicher formulierte KI-Ausgabe",["Ausschließlich technische Störungen des KI-Systems","Nur sehr seltene, komplexe Einzelfälle","Ausschließlich eine fehlende Internetverbindung"],"Zeitdruck, Routine und überzeugende Formulierung senken die Wahrscheinlichkeit einer eigenständigen Prüfung, obwohl das Risiko gleich bleibt."),
q("M01-04",1,"Ein KI-System schlägt eine Therapie vor, die ohne weitere Prüfung begonnen wird. Wie ist dieses Vorgehen einzuordnen?","Nicht zulässig, da die Therapieentscheidung eine eigenständige fachliche Prüfung erfordert",["Zulässig, wenn die KI-Ausgabe in sich konsistent formuliert ist","Zulässig bei Zeitdruck, da dann eine Ausnahme gilt","Zulässig, wenn die Therapie ähnlich zu früheren Fällen ist"],"Auch eine konsistent wirkende KI-Ausgabe ersetzt keine fachliche Prüfung vor Therapiebeginn."),

q("M02-01",2,"Ein Kollege sagt: „Die KI-Zusammenfassung der Literatur ist fertig recherchiert, das können wir so übernehmen.“ Was ist daran falsch?","Eine KI-Zusammenfassung ist ein Ausgangspunkt der Recherche, kein Endergebnis",["Nichts, KI-Zusammenfassungen sind grundsätzlich vollständig geprüft","Nur der Wortlaut ist ungenau, inhaltlich ist die Recherche fertig","Zusammenfassungen benötigen nur bei Leitlinien überhaupt eine Prüfung"],"Eine KI-gestützte Recherche liefert einen ersten Überblick; die Prüfung von Existenz, Aktualität und Passung der Quellen steht danach noch aus."),
q("M02-02",2,"Welche drei Fragen gehören zur Prüfung einer von KI zitierten Quelle?","Existiert die Quelle, ist sie aktuell, und passt sie zur Fragestellung?",["Ist die Quelle lang genug, gut formatiert und bekannt?","Ist die Quelle kostenlos zugänglich und auf Deutsch verfasst?","Wurde die Quelle von der KI selbst verfasst?"],"Erfundene oder falsch zugeordnete Quellen, überholte Leitlinien und thematisch unpassende Treffer sind die typischen Risiken."),
q("M02-03",2,"Eine KI fasst eine Studie inhaltlich korrekt zusammen. Wer ordnet den Evidenzgrad im Verhältnis zu bestehenden Leitlinien ein?","Die Fachperson, da diese Einordnung eine fachliche Bewertung bleibt",["Die KI, da sie die Studie bereits zusammengefasst hat","Die Einordnung entfällt, sobald eine Zusammenfassung vorliegt","Der Verlag der Studie, nicht die behandelnde Fachperson"],"Studiendesign, Stichprobengröße, mögliche Interessenkonflikte und Aussagekraft im Vergleich zu Leitlinien bleiben eine fachliche Aufgabe."),
q("M02-04",2,"Warum reicht eine überzeugend formatierte KI-Quellenangabe allein nicht als Nachweis?","Weil Sprachmodelle Quellenangaben plausibel klingen lassen können, auch wenn sie ungenau oder veraltet sind",["Weil Formatierung technisch grundsätzlich unmöglich ist","Weil nur handschriftliche Quellenangaben zulässig sind","Weil KI-Systeme grundsätzlich keine Quellen nennen dürfen"],"Erst der Blick in Originalquelle oder anerkannte Datenbank zeigt, ob Inhalt, Aktualität und Kontext tatsächlich passen."),

q("M03-01",3,"Warum kann ein KI-System die Verantwortung für eine Diagnose- oder Therapieentscheidung nicht übernehmen?","Weil Verantwortung an eine Person gebunden ist, die für die Entscheidung einsteht und zur Rechenschaft gezogen werden kann",["Weil KI-Systeme technisch keine Diagnosevorschläge formulieren können","Weil Verantwortung ausschließlich vom Softwarehersteller getragen wird","Weil dies nur bei sehr komplexen Fällen gilt"],"Eine Diagnose- oder Therapieentscheidung setzt eine Person voraus, die einsteht und verantwortlich ist – das erfüllt kein KI-System."),
q("M03-02",3,"Ein KI-Hinweis ist besonders sicher und klar formuliert. Was folgt daraus für seine Richtigkeit?","Nichts – der Tonfall ist kein Qualitätsbeweis",["Die Ausgabe kann deshalb ungeprüft übernommen werden","Ein sicherer Tonfall entsteht nur bei inhaltlich korrekten Ausgaben","Ein sicherer Tonfall ersetzt bei Zeitdruck die fachliche Prüfung"],"Sprachmodelle formulieren richtige und falsche Aussagen häufig im selben überzeugenden Tonfall."),
q("M03-03",3,"Ein KI-Hinweis ist widersprüchlich oder unklar. Was ist der richtige nächste Schritt?","Rücksprache mit einer erfahreneren Fachperson (Eskalation)",["Die plausiblere der beiden Aussagen ohne Rücksprache übernehmen","Die KI erneut befragen, bis eine eindeutige Antwort erscheint, und diese übernehmen","Die Ausgabe ignorieren und ohne weitere Prüfung entscheiden"],"Unsicherheit ist ein Signal zum Eskalieren, kein Grund zum Improvisieren."),
q("M03-04",3,"Welche Aussage stimmt zur Aussagekraft einer Übereinstimmung zwischen KI-Ausgabe und der Erwartung der Fachperson?","Übereinstimmung mit der Erwartung ist kein Ersatz für eine eigenständige Prüfung",["Übereinstimmung mit der Erwartung beweist automatisch die Richtigkeit","Nur bei Abweichung von der Erwartung ist überhaupt eine Prüfung nötig","Übereinstimmung macht eine Eskalation grundsätzlich überflüssig"],"Auch eine erwartungskonforme Ausgabe wird eigenständig fachlich bewertet, nicht allein deshalb übernommen."),

q("M04-01",4,"Was gehört in den Kontext, bevor ein KI-Entwurf für einen Arztbrief erstellt wird?","Vorliegende Befunde, bisheriger Verlauf, Zweck des Briefes und Empfängerkreis",["Ausschließlich der Name der behandelnden Fachperson","Nur das gewünschte Textformat, ohne medizinische Angaben","Ausschließlich administrative Daten wie Terminzeiten"],"Ohne diesen Kontext ergänzt die KI Lücken mit Vermutungen – das soll bei einem Arztbrief vermieden werden."),
q("M04-02",4,"Warum sollen bei einem Arztbrief-Entwurf keine Befunde oder Werte von der KI erfunden werden?","Weil die KI ohne ausreichenden Kontext Lücken sonst mit Vermutungen füllt",["Weil erfundene Werte technisch nicht darstellbar sind","Weil dies nur bei sehr langen Arztbriefen ein Risiko darstellt","Weil dadurch ausschließlich Rechtschreibfehler entstehen"],"Fehlende Angaben sollen offen bleiben und von der Fachperson ergänzt werden, statt von der KI erfunden zu werden."),
q("M04-03",4,"Was gilt als die eher unterschätzte Fehlerquelle beim Gegenlesen eines KI-Entwurfs?","Eine stillschweigend ausgelassene Beobachtung oder ein fehlender Verlaufsschritt",["Ein offensichtlich falscher Zahlenwert, der sofort auffällt","Die verwendete Schriftart des Dokuments","Die Gesamtlänge des Arztbriefs"],"Ein offensichtlicher Fehler fällt meist auf; eine stillschweigende Auslassung fällt oft erst später auf und braucht einen aktiven Vollständigkeits-Check."),
q("M04-04",4,"Wann wird ein KI-Entwurf für einen Arztbrief zu einem verbindlichen Dokument?","Erst durch die fachliche Freigabe, bei der Inhalt gelesen und gegen die Quellen geprüft wurde",["Sobald der Entwurf vollständig und gut formatiert wirkt","Sobald er automatisch in die Akte übertragen wurde","Sobald die KI selbst eine hohe Konfidenz angibt"],"Erst nach vollständiger Prüfung durch die verantwortliche Fachperson wird aus dem Entwurf ein Dokument, für das sie fachlich einsteht."),

q("M05-01",5,"Was ändert sich an der fachlichen Sorgfaltspflicht, wenn eine Fachperson ein KI-System zur Vorbereitung nutzt?","Nichts – die Sorgfaltspflicht bezieht sich auf die getroffene Entscheidung, unabhängig vom genutzten Hilfsmittel",["Die Sorgfaltspflicht entfällt, wenn ein geprüftes Tool genutzt wird","Die Sorgfaltspflicht geht auf den Softwarehersteller über","Die Sorgfaltspflicht gilt nur noch für nicht-KI-gestützte Entscheidungen"],"Ob Nachschlagewerk, Kollegin oder KI-System genutzt wird, ändert nichts an der Pflicht, die Entscheidung sorgfältig zu treffen."),
q("M05-02",5,"Welche drei Angaben sollten dokumentiert werden, wenn ein KI-Hinweis in eine Entscheidung eingeflossen ist?","Welcher KI-Hinweis vorlag, wie er fachlich bewertet wurde und welche Entscheidung daraus folgte",["Nur der Name des verwendeten KI-Systems","Nur das Datum der Eingabe in das KI-System","Ausschließlich die Antwortzeit des KI-Systems"],"Diese drei Angaben machen sichtbar, dass ein Hinweis geprüft und eigenständig bewertet wurde."),
q("M05-03",5,"Ein KI-System wurde offiziell durch die Einrichtung freigegeben. Was bedeutet das für die einzelne Fachperson?","Die Freigabe betrifft die Eignung des Werkzeugs, nicht die persönliche fachliche Verantwortung der Fachperson",["Die Fachperson trägt danach keine persönliche Verantwortung mehr","Die Freigabe ersetzt die Dokumentation der eigenen Bewertung","Die Freigabe verlagert die Sorgfaltspflicht vollständig auf die Einrichtung"],"Eine Tool-Freigabe entlastet die Einrichtung organisatorisch, nicht die einzelne Fachperson von ihrer Sorgfaltspflicht."),
q("M05-04",5,"Warum ist eine nachvollziehbare Dokumentation der eigenen fachlichen Bewertung wichtig?","Sie zeigt, dass ein KI-Hinweis geprüft und eigenständig bewertet wurde, statt einfach übernommen zu werden",["Sie ersetzt die eigentliche fachliche Entscheidung","Sie ist nur bei negativen Ergebnissen erforderlich","Sie dient ausschließlich der Abrechnung"],"Dokumentation schützt und schafft Klarheit über den eigenen Sorgfaltsprozess."),

q("M06-01",6,"Welche Warnsignale bei KI-Ausgaben werden im Modul genannt?","Widersprüchliche Angaben, ungewöhnlich glatte Formulierung und fehlende Quelle oder Begründung",["Ausschließlich die Länge der Ausgabe","Ausschließlich Rechtschreibfehler in der Ausgabe","Ausschließlich die Antwortzeit des Systems"],"Wer diese Muster kennt, erkennt Auffälligkeiten schneller, statt sich von einer überzeugenden Formulierung täuschen zu lassen."),
q("M06-02",6,"Welche drei Angaben sollten bei einer dokumentierten Auffälligkeit festgehalten werden?","Was aufgefallen ist, wann es aufgefallen ist und welche Situation zugrunde lag",["Nur der Name der Fachperson, die es bemerkt hat","Nur die Softwareversion des KI-Systems","Nur das Ergebnis der Meldung, ohne Kontext"],"Diese drei Angaben reichen meist, um eine Auffälligkeit später nachvollziehen und einordnen zu können."),
q("M06-03",6,"Ein KI-Hinweis deutet auf einen möglicherweise kritischen Befund hin. Was gilt?","Der etablierte klinische Meldeweg hat Vorrang; der KI-Hinweis kann ihn allenfalls anstoßen, aber nie ersetzen",["Der KI-Hinweis ersetzt den etablierten Meldeweg vollständig","Kritische Befunde müssen ausschließlich über die KI dokumentiert werden","Der Meldeweg entfällt, wenn die KI-Ausgabe sicher formuliert ist"],"Ein KI-Hinweis auf einen kritischen Befund ersetzt nie den etablierten klinischen Meldeweg."),
q("M06-04",6,"Warum verbessert eine offene Fehlerkultur die Qualität des KI-Einsatzes über die Zeit?","Weil Auffälligkeiten ohne Angst vor Schuldzuweisung gemeldet werden und so für die Qualitätssicherung nutzbar werden",["Weil dadurch weniger Meldungen entstehen","Weil Fehler dadurch nicht mehr dokumentiert werden müssen","Weil sie ausschließlich die Reaktionszeit des KI-Systems verbessert"],"Eine offene Fehlerkultur ist Teil der Qualitätssicherung, nicht Bürokratie.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Ob eine KI-Ausgabe ein zulässiger Hinweis oder eine unzulässige De-facto-Entscheidung ist, hängt davon ab, ob eine fachliche Prüfung stattfindet – nicht von der Formulierung der Ausgabe.",
  2:"Eine KI-Recherche ist ein Ausgangspunkt: Quellen werden auf Existenz, Aktualität und fachliche Passung geprüft, der Evidenzgrad bleibt eine fachliche Einordnung.",
  3:"Verantwortung für Diagnose und Therapie bleibt bei der Fachperson; ein sicherer Tonfall ist kein Qualitätsbeweis, Unsicherheit ist ein Signal zum Eskalieren.",
  4:"Ein Arztbrief-Entwurf braucht ausreichenden Kontext, wird gegen die Quellen geprüft und wird erst durch die fachliche Freigabe zum verbindlichen Dokument.",
  5:"Die fachliche Sorgfaltspflicht bleibt unabhängig vom genutzten Hilfsmittel bei der entscheidenden Person; eine Tool-Freigabe entlastet die Einrichtung organisatorisch, nicht die einzelne Fachperson.",
  6:"Warnsignale werden aktiv geprüft, Auffälligkeiten nachvollziehbar dokumentiert, und bei kritischen Befunden hat der etablierte Meldeweg immer Vorrang vor der KI-Ausgabe."
};

function dynamicCandidates(module){
  if(module===1){
    const cases=[
      ["ddx-geprueft","Eine KI zeigt mehrere mögliche Differenzialdiagnosen als Denkanstoß; die Fachperson prüft sie eigenständig, bevor eine Entscheidung fällt. Wie ist das einzuordnen?","Zulässiger Hinweis, da eine fachliche Prüfung stattfindet",["Unzulässig, da KI grundsätzlich keine Differenzialdiagnosen nennen darf","Nur zulässig, wenn die KI sich zu 100% sicher zeigt","Unzulässig, da die KI-Ausgabe die endgültige Entscheidung ersetzt"]],
      ["befund-ungeprueft","Ein möglicher Befund aus einer KI-Ausgabe wird ohne weitere Prüfung direkt in die Akte übernommen. Wie ist das einzuordnen?","Unzulässige De-facto-Entscheidung, da keine fachliche Prüfung erfolgt ist",["Zulässiger Hinweis, da die Formulierung plausibel klang","Zulässig, solange später irgendwann gegengelesen wird","Unerheblich, da die Akte ohnehin regelmäßig aktualisiert wird"]],
      ["therapie-sofort","Eine KI schlägt eine Therapie vor, die ohne weitere Prüfung sofort begonnen wird. Wie ist das einzuordnen?","Nicht zulässig, da die Therapieentscheidung eine eigenständige Prüfung erfordert",["Zulässig, wenn der Vorschlag in sich schlüssig wirkt","Zulässig, wenn keine Zeit für eine Rückfrage bleibt","Zulässig, wenn ähnliche Fälle früher genauso behandelt wurden"]],
      ["routine-zeitdruck","Unter hohem Zeitdruck und in einem Routinefall wird eine ungewöhnlich sicher formulierte KI-Ausgabe direkt übernommen. Wie ist das einzuordnen?","Riskant: Zeitdruck, Routine und sichere Formulierung erhöhen das Risiko einer unzulässigen Übernahme",["Unbedenklich, da Routinefälle grundsätzlich unkritisch sind","Unbedenklich, solange die Ausgabe kurz ist","Nur bei Erstfällen riskant, nie bei Routinefällen"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D01-"+code,1,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[1]));
  }
  if(module===2){
    const cases=[
      ["quelle-nicht-auffindbar","Eine KI nennt eine Studie mit Autor, Jahr und Zeitschrift. Beim Nachschlagen lässt sich diese Studie in keiner Datenbank finden. Wie ist das einzuordnen?","Wahrscheinlich eine erfundene oder falsch zugeordnete Quelle – vor Verwendung ausschließen",["Ein technisches Problem der Datenbank, die Quelle gilt trotzdem als geprüft","Unerheblich, solange der Studieninhalt plausibel klingt","Ausreichend belegt, da Autor und Jahr genannt wurden"]],
      ["leitlinie-veraltet","Eine von der KI zitierte Leitlinie stammt aus einer mittlerweile durch eine neuere Fassung ersetzten Version. Wie ist damit umzugehen?","Die aktuelle Fassung der Leitlinie heranziehen, nicht die veraltete Version übernehmen",["Die veraltete Fassung weiterverwenden, da sie zuerst genannt wurde","Beide Fassungen gleichwertig kombinieren, ohne Prüfung","Die Frage der Aktualität ignorieren, da Leitlinien sich selten ändern"]],
      ["studientyp-bewertung","Eine KI fasst eine kleine, nicht-randomisierte Studie korrekt zusammen, ohne den Studientyp zu bewerten. Wer ordnet die Aussagekraft im Vergleich zu bestehenden Leitlinien ein?","Die Fachperson, da dies eine fachliche Bewertung bleibt",["Die KI, da sie den Studieninhalt bereits korrekt wiedergegeben hat","Niemand, die Einordnung entfällt bei korrekter Zusammenfassung","Die Redaktion der Zeitschrift, in der die Studie erschien"]],
      ["falsches-kollektiv","Eine KI zitiert eine Quelle mit passendem Titel, deren Inhalt bei näherer Prüfung aber ein anderes Patientenkollektiv betrifft. Wie ist die Quelle einzuordnen?","Nicht ausreichend passend – ein passender Titel ersetzt nicht die inhaltliche Prüfung",["Ausreichend passend, da der Titel zur Fragestellung passt","Automatisch unbrauchbar, jede zitierte Quelle mit Abweichung ist wertlos","Passend, solange die Zeitschrift renommiert ist"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D02-"+code,2,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[2]));
  }
  if(module===3){
    const cases=[
      ["ton-sicher","Ein KI-Hinweis zu einer möglichen Diagnose ist ungewöhnlich sicher und bestimmt formuliert. Was folgt daraus für die Richtigkeit?","Nichts – der Tonfall ist kein Beleg für inhaltliche Richtigkeit",["Ein sicherer Tonfall belegt automatisch eine hohe Trefferquote","Die Ausgabe kann deshalb ohne weitere Prüfung übernommen werden","Ein sicherer Tonfall bedeutet, dass keine Eskalation nötig ist"]],
      ["widersprueche","Zwei Anfragen an dasselbe KI-System liefern zu einem Fall widersprüchliche Hinweise. Was ist der richtige nächste Schritt?","Rücksprache mit einer erfahreneren Fachperson (Eskalation)",["Die zuletzt erhaltene Antwort automatisch übernehmen","Die KI so lange erneut befragen, bis eine Antwort gefällt und übernommen wird","Beide Hinweise ignorieren und ohne weitere Prüfung entscheiden"]],
      ["erwartung-bestaetigt","Ein KI-Hinweis bestätigt genau das, was die Fachperson ohnehin erwartet hatte. Was folgt daraus?","Auch hier bleibt eine eigenständige fachliche Prüfung erforderlich",["Übereinstimmung mit der Erwartung macht eine Prüfung überflüssig","Übereinstimmung mit der Erwartung beweist automatisch die Richtigkeit","Nur bei abweichenden Hinweisen ist überhaupt eine Prüfung nötig"]],
      ["verantwortung-delegieren","Eine Klinik erwägt, unsichere Fälle künftig direkt anhand der KI-Ausgabe zu entscheiden, um Zeit zu sparen. Wie ist das einzuordnen?","Nicht zulässig, da Verantwortung an eine Person gebunden bleibt, die zur Rechenschaft gezogen werden kann",["Zulässig, wenn dies vorab schriftlich festgelegt wird","Zulässig, solange die KI-Ausgabe im System gespeichert bleibt","Zulässig bei hohem Patientenaufkommen"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D03-"+code,3,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[3]));
  }
  if(module===4){
    const cases=[
      ["fehlender-wert","Ein KI-Entwurf für einen Arztbrief enthält an einer Stelle einen Laborwert, der in den Originalunterlagen gar nicht vorliegt. Wie ist damit umzugehen?","Die Angabe entfernen und die Lücke offen lassen, statt einen erfundenen Wert zu übernehmen",["Den Wert unverändert im Brief belassen, da er plausibel wirkt","Den Wert durch einen ähnlichen, geschätzten Wert ersetzen","Den gesamten Abschnitt unkommentiert löschen, ohne die Lücke zu kennzeichnen"]],
      ["auslassung-verlauf","Beim Gegenlesen eines Arztbrief-Entwurfs fehlt ein Verlaufsschritt, der in den Originalunterlagen dokumentiert ist. Wie ist dieses Risiko einzuordnen?","Als riskante Auslassung, die leicht übersehen wird und aktiv gegengeprüft werden muss",["Als unkritisch, da nur offensichtliche Fehler relevant sind","Als reines Formatierungsproblem ohne inhaltliche Bedeutung","Als Aufgabe der Empfängerseite, nicht der verfassenden Fachperson"]],
      ["empfaengerbezug","Derselbe KI-Entwurf soll sowohl an eine weiterbehandelnde Fachperson als auch an die Patientin gehen, ohne Anpassung von Ton und Detailtiefe. Wie ist das einzuordnen?","Nicht ausreichend, da Ton und Detailtiefe an den jeweiligen Empfänger angepasst werden müssen",["Ausreichend, da der medizinische Inhalt in beiden Fällen identisch bleibt","Ausreichend, solange der Entwurf möglichst lang gehalten wird","Unerheblich, da die KI den Empfänger automatisch korrekt erkennt"]],
      ["freigabe-fehlt","Ein vollständig und professionell wirkender KI-Entwurf für einen Arztbrief wurde noch nicht von der zuständigen Fachperson gegengelesen. Ist er bereits ein verbindliches Dokument?","Nein, ohne fachliche Freigabe bleibt er ein Entwurf, unabhängig davon, wie fertig er wirkt",["Ja, sobald der Text vollständig und gut formuliert ist","Ja, sobald er in die Patientenakte kopiert wurde","Ja, wenn die KI selbst eine hohe Konfidenz ausweist"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D04-"+code,4,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[4]));
  }
  if(module===5){
    const cases=[
      ["tool-freigegeben","Eine Klinik hat ein KI-System offiziell geprüft und freigegeben. Entlastet das die einzelne Fachperson von ihrer persönlichen Sorgfaltspflicht?","Nein, die Freigabe betrifft die Eignung des Werkzeugs, nicht die persönliche Verantwortung im Einzelfall",["Ja, eine offizielle Freigabe übernimmt automatisch die persönliche Verantwortung","Ja, aber nur bei Nutzung durch erfahrenes Personal","Ja, sofern die Nutzung dokumentiert im System hinterlegt ist"]],
      ["dokumentation-fehlt","Eine Entscheidung wurde unter Einbeziehung eines KI-Hinweises getroffen, aber nirgends dokumentiert, wie der Hinweis bewertet wurde. Was fehlt hier?","Eine nachvollziehbare Dokumentation, dass der Hinweis eigenständig geprüft und bewertet wurde",["Nichts, die Entscheidung selbst reicht als Nachweis aus","Eine zusätzliche Unterschrift der IT-Abteilung","Eine Meldung an den Softwarehersteller des KI-Systems"]],
      ["vergleich-nachschlagewerk","Eine Fachperson nutzt statt eines Fachbuchs ein KI-System zur Vorbereitung einer Entscheidung. Ändert sich dadurch die fachliche Sorgfaltspflicht?","Nein, die Sorgfaltspflicht bezieht sich auf die getroffene Entscheidung, unabhängig vom genutzten Hilfsmittel",["Ja, bei Nutzung eines KI-Systems gilt ein geringerer Sorgfaltsmaßstab","Ja, die Sorgfaltspflicht geht in diesem Fall auf den Systemanbieter über","Ja, ein KI-System ersetzt in diesem Fall das Fachbuch vollständig als Beleg"]],
      ["nachtraegliche-pruefung","Nach einer kritisierten Entscheidung soll im Nachhinein geklärt werden, ob ein KI-Hinweis eigenständig bewertet wurde. Was ermöglicht diese Klärung am ehesten?","Eine zeitnah erstellte Dokumentation, welcher Hinweis vorlag und wie er bewertet wurde",["Die bloße Tatsache, dass ein KI-System überhaupt genutzt wurde","Eine allgemeine Beschreibung der Klinik-IT-Ausstattung","Die Softwareversion des verwendeten KI-Systems"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D05-"+code,5,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[5]));
  }
  if(module===6){
    const cases=[
      ["widerspruechlich","Ein KI-Entwurf enthält zwei Aussagen, die sich inhaltlich widersprechen. Wie ist dieses Muster einzuordnen?","Als Warnsignal, das aktiv gegengeprüft werden sollte",["Als unkritisch, da Sprachmodelle gelegentlich variieren","Als reines Stilproblem ohne inhaltliche Bedeutung","Als Zeichen dafür, dass beide Aussagen gleichermaßen korrekt sind"]],
      ["glatte-formulierung","Zu einem eigentlich unsicheren Befund liefert die KI eine auffällig glatte, sehr sichere Formulierung. Wie ist das einzuordnen?","Als Warnsignal – eine überzeugende Formulierung ist kein Beleg für Sicherheit des Befunds",["Als Bestätigung, dass der Befund eindeutig ist","Als Hinweis, dass keine weitere Prüfung nötig ist","Als rein stilistische Eigenheit ohne Bedeutung für den Inhalt"]],
      ["fehlende-begruendung","Eine KI-Angabe in einem Entwurf enthält keine erkennbare fachliche Begründung oder Quelle. Wie ist das einzuordnen?","Als Warnsignal, das vor Übernahme genauer geprüft werden sollte",["Als unbedeutend, solange die Angabe plausibel klingt","Als Beleg dafür, dass die Angabe auf Erfahrungswissen beruht","Als Zeichen besonders hoher Zuverlässigkeit"]],
      ["kritischer-befund","Ein KI-Hinweis deutet auf einen möglicherweise kritischen Befund hin. Welcher Weg hat Vorrang?","Der etablierte klinische Meldeweg – der KI-Hinweis kann ihn allenfalls anstoßen",["Eine interne Notiz an das KI-Systemteam anstelle des Meldewegs","Eine erneute KI-Anfrage zur Bestätigung, statt den Meldeweg zu nutzen","Kein gesonderter Weg, da kritische Befunde selten vorkommen"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D06-"+code,6,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[6]));
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für KI Health Klinik & Arzt besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für KI Health Klinik & Arzt besteht keine aktive Anmeldung.");
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
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"ki-health-klinik-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
