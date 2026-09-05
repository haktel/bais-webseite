import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="ki-health-pflege",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Ein KI-Entwurf für einen Pflegebericht wird ungeprüft direkt an die nächste Schicht weitergegeben. Was widerspricht das dem Modul „Pflegedokumentation und Schichtübergaben“?","Ein KI-Entwurf ist ein Vorschlag zur Prüfung, kein fertiges Dokument zur direkten Übernahme",["KI-Entwürfe dürfen grundsätzlich nie für Übergaben verwendet werden","Ungeprüfte Weitergabe ist unproblematisch, solange der Text plausibel klingt","Die Prüfung ist nur bei besonders langen Übergabenotizen nötig"],"Ein KI-Entwurf ersetzt nicht die fachliche Prüfung durch die Pflegefachkraft vor der Übergabe."),
q("M01-02",1,"Welche vier Felder bilden laut Modul 1 die Struktur einer sicheren Schichtübergabe?","Situation, Hintergrund, Einschätzung und Empfehlung",["Diagnose, Medikation, Kosten und Unterschrift","Name, Zimmernummer, Uhrzeit und Unterschrift","Beobachtung, Meinung, Vermutung und Abschluss"],"Die Vier-Felder-Struktur hilft, bei der Übergabe nichts Wichtiges auszulassen."),
q("M01-03",1,"Welche drei Fragen bilden laut Modul 1 den Check vor der Übernahme eines KI-Entwurfs?","Stimmen die Fakten mit der Beobachtung überein, fehlt etwas Wichtiges, ist der Ton passend",["Ist der Text lang genug, klingt er professionell, wurde Rechtschreibung geprüft","Wurde ein Zeitstempel gesetzt, ist der Absender bekannt, ist der Text unterschrieben","Ist der Text kürzer als das Original, wurden Farben verwendet, ist ein Foto beigefügt"],"Auslassungen fallen oft erst später auf als ein offensichtlich falscher Wert – deshalb braucht es einen aktiven Check statt eines bloßen Überfliegens."),
q("M01-04",1,"Warum gilt Pflegedokumentation laut Modul 1 als besonders geeigneter erster Einsatzfall für KI-Unterstützung, anders als etwa eine automatisierte Medikamentengabe?","Ein Dokumentationsentwurf lässt sich vor Verwendung vollständig gegenlesen und korrigieren, bevor er wirkt",["Dokumentation ist der einzige Bereich, in dem Fehler keine Folgen haben","Medikamentengabe ist technisch nicht von KI unterscheidbar","Dokumentationsfehler werden vom System automatisch erkannt und korrigiert"],"Anders als bei einer Handlung, die eine KI-Ausgabe ungeprüft auslösen würde, kann ein Textentwurf vor Verwendung geprüft werden."),

q("M02-01",2,"Ein bereits freigegebener Aufklärungstext soll von KI in einfachere Sprache übertragen werden. Was ist laut Modul 2 die zentrale Grenze dabei?","Die Sprache darf sich ändern, der medizinische Inhalt aber nicht",["Der Text darf beliebig gekürzt werden, solange er kürzer wird","Neue Beispiele dürfen ergänzt werden, wenn sie plausibel klingen","Fachbegriffe müssen immer vollständig entfernt werden"],"Vereinfachen verändert die Sprache, nicht den medizinischen Inhalt – sobald ein neuer Fakt entsteht, ist die Grenze überschritten."),
q("M02-02",2,"Eine KI-Übersetzung eines Aufklärungstexts wirkt sprachlich sehr flüssig. Was folgt daraus laut Modul 2?","Flüssige Sprache ist kein Beleg für inhaltliche Richtigkeit – die Übereinstimmung mit dem Original muss geprüft werden",["Flüssige Sprache beweist automatisch inhaltliche Korrektheit","Übersetzungen benötigen grundsätzlich keine weitere Prüfung","Nur unflüssige Übersetzungen enthalten inhaltliche Fehler"],"Gerade bei medizinischen Fachbegriffen kann eine kleine Abweichung die Bedeutung verändern, ohne beim Lesen aufzufallen."),
q("M02-03",2,"Bei einem komplexen oder kritischen Sachverhalt reicht laut Modul 2 eine reine KI-Übersetzung nicht aus. Was ist stattdessen vorgesehen?","Eine qualifizierte Übersetzung oder Dolmetschung einholen",["Den Text unübersetzt lassen und auf Rückfragen hoffen","Die KI-Übersetzung ungeprüft verwenden, da Zeitdruck besteht","Den Text automatisch in mehrere Sprachen gleichzeitig übertragen lassen"],"Komplexe oder kritische Inhalte verlangen mehr Absicherung als ein einfacher KI-Entwurf bieten kann."),
q("M02-04",2,"Bei einer schweren Diagnose bereitet KI mögliche Gesprächspunkte vor. Wer führt laut Modul 2 das eigentliche Aufklärungsgespräch?","Die Fachperson persönlich, da menschliche Zuwendung und spontane Anpassung nötig sind",["Die KI führt das Gespräch eigenständig anhand des vorbereiteten Textes","Das Gespräch entfällt, wenn ein KI-Text vorliegt","Eine beliebige Person aus dem Team ohne fachliche Vorbereitung"],"Vorbereitung darf automatisiert werden, das Gespräch selbst bleibt zwischenmenschlich."),

q("M03-01",3,"KI fasst mehrere Sturzereignisse eines Bewohners als wiederkehrendes Muster zusammen. Was leistet dieser Hinweis laut Modul 3?","Er macht eine Häufung sichtbar, liefert aber keine Erklärung und keine Diagnose",["Er stellt automatisch die zugrunde liegende Diagnose","Er ersetzt die fachliche Bewertung durch die Pflegefachkraft vollständig","Er ist nur bei mehr als zehn Ereignissen überhaupt aussagekräftig"],"Ein Muster-Hinweis zeigt eine Häufung, keine Erklärung und keine Diagnose – die Einordnung bleibt Aufgabe der Fachperson."),
q("M03-02",3,"Welche Sofortmaßnahme gehört laut Modul 3 zu einer plötzlichen Verwirrtheit oder Bewusstseinsveränderung?","Sofort ärztlich abklären lassen",["Erst die nächste Routineprüfung abwarten","Nur im Übergabebericht vermerken, ohne sofort zu melden","Eine KI-Zusammenfassung erstellen und deren Ergebnis abwarten"],"Bestimmte Warnzeichen erfordern sofortiges Handeln, unabhängig von KI."),
q("M03-03",3,"Eine KI-Anwendung hat ein akutes Warnzeichen noch nicht als kritisch eingeordnet. Was ist laut Modul 3 trotzdem richtig?","Sofort den etablierten Meldeweg nutzen, unabhängig von der KI-Einordnung",["Erst die KI-Einordnung abwarten, bevor gehandelt wird","Das Warnzeichen ignorieren, da keine KI-Bestätigung vorliegt","Die Meldung auf die nächste Schicht verschieben"],"Ein KI-Hinweis darf den etablierten Meldeweg nie verzögern."),
q("M03-04",3,"In welcher Reihenfolge sollte laut Modul 3 bei einem klaren Warnzeichen vorgegangen werden?","Zuerst handeln und melden, danach dokumentieren",["Zuerst ausführlich dokumentieren, danach melden","Zuerst eine KI-Auswertung einholen, danach handeln","Zuerst mit Angehörigen sprechen, danach melden"],"Im Zweifel zuerst handeln und melden, danach dokumentieren – nie umgekehrt."),

q("M04-01",4,"Welche zwei Schutzebenen gelten laut Modul 4 gleichzeitig für Bewohner- und Patientendaten?","Die berufliche Schweigepflicht und der besondere Schutz nach Art. 9 DSGVO",["Nur das Hausrecht der Einrichtung","Nur eine freiwillige interne Leitlinie ohne rechtliche Grundlage","Ausschließlich das Urheberrecht am Dokumentationstext"],"Schweigepflicht und Art. 9 DSGVO gelten unabhängig davon, ob mit Papier, Fachsoftware oder KI-Tool gearbeitet wird."),
q("M04-02",4,"Ein Mitarbeitender möchte ein öffentliches, nicht freigegebenes KI-Tool für echte Bewohnerdaten nutzen, weil es besonders hilfreich wirkt. Was gilt laut Modul 4?","Hilfreich sein reicht nicht – nur freigegebene Systeme dürfen echte Bewohner- oder Patientendaten verarbeiten",["Jedes leistungsfähige KI-Tool ist automatisch auch datenschutzrechtlich zulässig","Öffentliche Tools sind grundsätzlich sicherer als interne Systeme","Die Freigabe ist nur bei besonders sensiblen Diagnosen relevant"],"Die meisten Datenschutzvorfälle entstehen durch die einfache Eingabe echter Daten in ein nicht dafür vorgesehenes Tool."),
q("M04-03",4,"Für einen Übungsfall soll eine allgemeine Formulierungshilfe erstellt werden, ohne dass echte Falldaten nötig sind. Was ist laut Modul 4 (Datensparsamkeit) richtig?","Name, genaues Geburtsdatum und Zimmer- oder Wohnbereichsnummer weglassen, da sie für die Aufgabe nicht nötig sind",["Möglichst viele echte Details ergänzen, damit die Ausgabe realistischer wirkt","Datensparsamkeit gilt nur für Papierdokumentation, nicht für KI-Tools","Ein Übungsfall benötigt immer den vollständigen echten Namen"],"Wenn eine Aufgabe auch ohne echte Identifikationsdaten funktioniert, sollten diese weggelassen werden."),
q("M04-04",4,"Es ist unklar, ob ein KI-Tool für Bewohner- oder Patientendaten freigegeben ist. Was ist laut Modul 4 der richtige nächste Schritt?","Vor Nutzung bei der zuständigen Stelle nachfragen",["Das Tool auf eigene Verantwortung einfach ausprobieren","Nur mit anonymisierten Daten arbeiten und die Freigabefrage ignorieren","Ein anderes, ebenfalls ungeprüftes Tool ausprobieren"],"Im Zweifel gilt: bei echten, identifizierbaren Daten nur das freigegebene System verwenden – im Zweifel nachfragen."),

q("M05-01",5,"Welche Entscheidung darf laut Modul 5 niemals von einer KI-Ausgabe eigenständig getroffen werden?","Eine Diagnose oder eine Pflegeeinstufung",["Eine sprachliche Vereinfachung eines bereits freigegebenen Textes","Eine Formatierungshilfe für eine Übergabenotiz","Ein Vorschlag für die Gliederung eines Pflegeberichts"],"Diagnose und Pflegeeinstufung setzen fachliche Ausbildung und Verantwortung voraus, die eine KI-Ausgabe nicht ersetzen kann."),
q("M05-02",5,"Welche Rolle darf KI laut Modul 5 bei Medikamentengabe oder Dosierung höchstens einnehmen?","Unterstützung beim Formulieren der Dokumentation, nie die Entscheidung selbst",["Eigenständiges Bestätigen einer Dosierung bei Zeitdruck","Automatisches Anpassen der Dosierung anhand von Vitalwerten","Ersatz der ärztlichen Verordnung bei eindeutigen Fällen"],"KI darf niemals selbstständig eine Gabe empfehlen, bestätigen oder auslösen – das bleibt bei der verordnenden oder verabreichenden Fachperson."),
q("M05-03",5,"Eine KI-gestützte Zusammenfassung eines Sturzrisiko-Erhebungsbogens liegt vor. Wie ist sie laut Modul 5 einzuordnen?","Als Unterstützung des Hilfsmittels, nicht als alleinige Grundlage für die abschließende Einschätzung",["Als vollwertiger Ersatz für die Risikoskala","Als rein dekoratives Zusatzdokument ohne fachlichen Wert","Als bindende Entscheidung, die nicht mehr geprüft werden muss"],"Eine KI-gestützte Zusammenfassung darf das Hilfsmittel unterstützen, aber nicht als alleinige Grundlage für die abschließende Einschätzung dienen."),
q("M05-04",5,"Ein KI-Hinweis weicht von der eigenen fachlichen Einschätzung ab. Was ist laut Modul 5 der richtige nächste Schritt?","Rücksprache mit einer verantwortlichen Fachperson halten",["Die KI-Ausgabe automatisch übernehmen, da sie meist korrekt ist","Den Hinweis vollständig ignorieren, ohne ihn zu dokumentieren","Eigenständig zwischen beiden Einschätzungen vermitteln, ohne Rücksprache"],"Unsicherheit ist ein Signal zum Eskalieren, kein Grund zum Improvisieren."),

q("M06-01",6,"Zwei Aussagen in derselben KI-gestützten Übergabenotiz widersprechen sich zur Trinkmenge. Welches Warnsignal aus Modul 6 liegt vor?","Widersprüchliche Angaben",["Fehlende Quelle","Ungewöhnlich glatte Formulierung","Kein Warnsignal, da beide Sätze für sich plausibel klingen"],"Widersprüchliche Angaben in derselben Notiz sind eines der typischen Warnsignale bei KI-gestützter Dokumentation."),
q("M06-02",6,"Welche drei Angaben reichen laut Modul 6, damit eine Auffälligkeit im Team nachvollziehbar dokumentiert ist?","Was aufgefallen ist, wann es aufgefallen ist und welche Situation zugrunde lag",["Nur der Name der meldenden Person","Nur ein Screenshot des KI-Chats","Nur die Uhrzeit ohne weitere Angaben"],"Diese drei Angaben reichen meist, damit das Team eine Auffälligkeit später nachvollziehen und einordnen kann."),
q("M06-03",6,"Ein Teammitglied meldet eine Auffälligkeit im Umgang mit einem KI-Text. Wie ist das laut Modul 6 einzuordnen?","Als Beitrag zur Qualität, nicht als Vorwurf an eine einzelne Person",["Als Fehlverhalten, das sanktioniert werden muss","Als unnötige Bürokratie ohne Nutzen","Als Vorwurf gegen die Person, die den Text zuerst gelesen hat"],"Eine gemeldete Auffälligkeit hilft dem ganzen Team, keiner einzelnen Person zu schaden."),
q("M06-04",6,"Ein KI-Text zu einer Beobachtung klingt sehr sicher, obwohl der zugrunde liegende Befund eigentlich unsicher ist. Welches Warnsignal aus Modul 6 trifft zu?","Ungewöhnlich glatte Formulierung",["Fehlende Quelle","Widersprüchliche Angaben","Das ist kein Warnsignal, da ein sicherer Ton positiv zu werten ist"],"Ein gutes Gefühl reicht nicht – ungewöhnlich glatte Formulierungen bei eigentlich unsicheren Befunden verdienen besondere Aufmerksamkeit.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Die Vier-Felder-Struktur (Situation, Hintergrund, Einschätzung, Empfehlung) macht eine Übergabe vollständig nachvollziehbar; fehlt eines der Felder, bleibt die Übergabe lückenhaft.",
  2:"Vereinfachen darf die Sprache verändern, nie den medizinischen Inhalt; bei komplexen oder mehrsprachigen Aufklärungen braucht es zusätzlich eine fachliche oder qualifizierte Prüfung.",
  3:"Ein akutes Warnzeichen löst unabhängig von jeder KI-Einordnung sofort den etablierten Meldeweg aus.",
  4:"Gesundheitsbezogene Angaben sind eine besondere Kategorie personenbezogener Daten nach Art. 9 DSGVO und gehören nur in freigegebene Systeme; wo möglich, gilt Datensparsamkeit.",
  5:"Diagnose, Medikamentenentscheidung und die abschließende Risikoeinschätzung bleiben bei der Fachperson; bei Unsicherheit ist Rücksprache der richtige Weg, nicht Improvisation.",
  6:"Widersprüche, ungewöhnlich glatte Formulierungen und fehlende Quellen sind typische Warnsignale, die vor Übernahme aktiv gegengeprüft werden müssen."
};

function dynamicCandidates(module){
  if(module===1){
    const fields=["Situation","Hintergrund","Einschätzung","Empfehlung"];
    const cases=[
      ["situation","Eine Übergabenotiz enthält: Hintergrund: Diagnose seit 2019 bekannt. Einschätzung: Zustand unverändert seit letzter Schicht. Empfehlung: Vitalwerte in 4 Stunden erneut prüfen. Welches der vier Felder fehlt eindeutig?","Situation",["Hintergrund","Einschätzung","Empfehlung"]],
      ["hintergrund","Eine Übergabenotiz enthält: Situation: Bewohner wirkt heute unruhiger als sonst. Einschätzung: Unruhe seit dem Nachmittag zunehmend. Empfehlung: Beobachtung engmaschig fortsetzen. Welches der vier Felder fehlt eindeutig?","Hintergrund",["Situation","Einschätzung","Empfehlung"]],
      ["einschaetzung","Eine Übergabenotiz enthält: Situation: Neue Rötung am linken Unterschenkel festgestellt. Hintergrund: Keine bekannte Vorerkrankung der Haut. Empfehlung: Stelle in der Frühschicht erneut ansehen. Welches der vier Felder fehlt eindeutig?","Einschätzung",["Situation","Hintergrund","Empfehlung"]],
      ["empfehlung","Eine Übergabenotiz enthält: Situation: Appetit heute deutlich geringer als üblich. Hintergrund: Seit zwei Tagen reduzierte Flüssigkeitsaufnahme bekannt. Einschätzung: Zustand im Vergleich zu gestern unverändert. Welches der vier Felder fehlt eindeutig?","Empfehlung",["Situation","Hintergrund","Einschätzung"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D01-"+code,1,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[1]));
  }
  if(module===2){
    const combos=[
      ["unveraendert","Standardaufklärung"],
      ["unveraendert","komplexer, mehrsprachiger Sachverhalt"],
      ["veraendert","Standardaufklärung"],
      ["veraendert","komplexer, mehrsprachiger Sachverhalt"]
    ];
    return combos.map(([content,context],idx)=>{
      const changed=content==="veraendert";
      const correct=changed?"Nicht weitergeben, da durch die Vereinfachung ein neuer medizinischer Inhalt entstanden ist":(context.includes("komplexer")?"Vor Weitergabe gegen das Original prüfen bzw. qualifizierte Übersetzung/Dolmetschung nutzen":"Weitergabe zulässig, da nur die Sprache vereinfacht wurde, ohne neuen Inhalt");
      const wrong=["Weitergabe immer zulässig, da eine KI-Vereinfachung grundsätzlich unkritisch ist","Nicht weitergeben, weil jede Vereinfachung automatisch verboten ist","Die inhaltliche Prüfung ist bei diesem Fall generell entbehrlich"].filter(w=>w!==correct);
      return q("D02-"+idx,2,`Ein Aufklärungstext wurde von KI sprachlich bearbeitet. Inhalt gegenüber dem Original: ${content==="veraendert"?"eine neue medizinische Aussage ist hinzugekommen":"inhaltlich unverändert"}. Kontext: ${context}. Was ist die richtige Reaktion?`,correct,wrong.slice(0,3),DYNAMIC_EXPLANATIONS[2]);
    });
  }
  if(module===3){
    const cases=[
      ["akuter-sturz","Ein Bewohner stürzt akut und zeigt Anzeichen einer möglichen Verletzung. Wie ist laut Modul 3 zu handeln?","Sofort Fachkraft/Arzt informieren, keine Bewertung abwarten",["Erst eine KI-Zusammenfassung erstellen, dann entscheiden","Bis zur nächsten Routinevisite abwarten","Nur dokumentieren, ohne sofort zu melden"]],
      ["verwirrtheit","Ein Bewohner zeigt eine plötzliche, bislang untypische Verwirrtheit. Wie ist laut Modul 3 zu handeln?","Sofort ärztlich abklären lassen",["Abwarten, ob sich der Zustand von selbst bessert","Nur im Tagesbericht vermerken","Erst mit Angehörigen telefonieren, dann entscheiden"]],
      ["vitalwerte","Bei der Routinemessung zeigt sich eine deutliche Abweichung der Vitalwerte vom Vortag. Wie ist laut Modul 3 zu handeln?","Sofort melden, nicht auf die nächste Routineprüfung warten",["Den Wert notieren und bei der nächsten geplanten Messung erneut prüfen","Den Wert als Messfehler werten und ignorieren","Erst eine KI-Einordnung der Werte abwarten"]],
      ["schluckstoerung","Bei einem Bewohner tritt erstmals eine Schluckstörung auf. Wie ist laut Modul 3 zu handeln?","Vor weiterer Nahrungs- oder Flüssigkeitsgabe fachlich klären",["Die nächste Mahlzeit wie gewohnt weitergeben","Nur die Konsistenz der Nahrung ohne Rücksprache anpassen","Die Beobachtung erst am Ende der Schicht weitergeben"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D03-"+code,3,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[3]));
  }
  if(module===4){
    const cases=[
      ["diagnose","eine Diagnoseangabe eines Bewohners","besondere Kategorie personenbezogener Daten (Gesundheitsdaten) – nur in freigegebenen Systemen verarbeiten",["personenbezogene Daten ohne besonderen Schutzbedarf","keine personenbezogenen Daten, da nur medizinisch","frei verwendbar in jedem KI-Tool, da fachlich begründet"]],
      ["medikamentenplan","den vollständigen Medikamentenplan eines Bewohners","besondere Kategorie personenbezogener Daten (Gesundheitsdaten) – nur in freigegebenen Systemen verarbeiten",["personenbezogene Daten ohne besonderen Schutzbedarf","keine personenbezogenen Daten, da nur eine Liste","unproblematisch in öffentlichen KI-Tools, da anonym wirkend"]],
      ["name-zimmer","Name und Zimmernummer eines Bewohners ohne jede Gesundheitsangabe","personenbezogene Daten ohne besonderen Schutzbedarf, aber mit Datensparsamkeit zu behandeln",["besondere Kategorie personenbezogener Daten","keine personenbezogenen Daten, da kein Gesundheitsbezug","uneingeschränkt in jedem öffentlichen Tool nutzbar"]],
      ["uebungsfall","eine anonyme Übungsformulierung ohne Namen, Geburtsdatum oder Diagnose","keine personenbezogenen Daten – für Übungszwecke unproblematisch",["besondere Kategorie personenbezogener Daten","personenbezogene Daten ohne besonderen Schutzbedarf","grundsätzlich verboten, da es sich um einen Pflegefall handelt"]]
    ];
    return cases.map(([code,item,correct,wrong])=>q("D04-"+code,4,`Wie ist ${item} datenschutzrechtlich einzuordnen?`,correct,wrong,DYNAMIC_EXPLANATIONS[4]));
  }
  if(module===5){
    const cases=[
      ["diagnosevorschlag","Ein KI-Tool schlägt anhand der Verlaufsnotizen eine mögliche Diagnose vor. Wie ist damit laut Modul 5 umzugehen?","Nur als Hinweis behandeln – die Diagnose bleibt Aufgabe der Fachperson",["Den Vorschlag direkt in die Akte übernehmen","Den Vorschlag ignorieren, ohne ihn der Fachperson zu zeigen","Den Vorschlag an Angehörige weitergeben, um Zeit zu sparen"]],
      ["dosisvorschlag","Ein KI-Tool schlägt eine Anpassung der Medikamentendosis vor. Wie ist damit laut Modul 5 umzugehen?","Nicht übernehmen – Medikamentenentscheidungen bleiben ausschließlich bei der verordnenden/verabreichenden Fachperson",["Den Vorschlag bei Zeitdruck direkt umsetzen","Den Vorschlag automatisch in die Verordnung übernehmen","Den Vorschlag nur bei kleinen Abweichungen selbst entscheiden"]],
      ["risikoskala","Eine KI-Zusammenfassung schlägt eine Einstufung im Sturzrisiko-Bogen vor. Wie ist damit laut Modul 5 umzugehen?","Als Unterstützung des Hilfsmittels werten, nicht als alleinige Grundlage der abschließenden Einschätzung",["Die vorgeschlagene Einstufung ungeprüft übernehmen","Den Erhebungsbogen künftig durch die KI-Ausgabe ersetzen","Die Einstufung ignorieren, da KI dabei nie helfen darf"]],
      ["abweichung","Ein KI-Hinweis widerspricht der eigenen fachlichen Einschätzung zu einem Bewohner. Wie ist damit laut Modul 5 umzugehen?","Rücksprache mit einer verantwortlichen Fachperson halten",["Die KI-Ausgabe automatisch übernehmen, da sie meist korrekt ist","Den Hinweis komplett ignorieren","Eigenständig zwischen beiden Einschätzungen vermitteln, ohne Rücksprache"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D05-"+code,5,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[5]));
  }
  if(module===6){
    const cases=[
      ["widerspruch","Zwei Sätze in derselben KI-gestützten Übergabenotiz widersprechen sich zur Trinkmenge des Bewohners. Welches Warnsignal liegt vor?","Widersprüchliche Angaben",["Fehlende Quelle","Ungewöhnlich glatte Formulierung","Kein Warnsignal, da beide Sätze plausibel klingen"]],
      ["glatte-formulierung","Eine sehr sichere Formulierung beschreibt einen eigentlich unsicheren Befund, ohne jede Einschränkung. Welches Warnsignal liegt vor?","Ungewöhnlich glatte Formulierung",["Fehlende Quelle","Widersprüchliche Angaben","Kein Warnsignal, da ein sicherer Ton positiv zu werten ist"]],
      ["fehlende-quelle","Ein Wert taucht im KI-Text auf, der sich in keiner Originalnotiz wiederfindet. Welches Warnsignal liegt vor?","Fehlende Quelle",["Ungewöhnlich glatte Formulierung","Widersprüchliche Angaben","Kein Warnsignal, da der Wert plausibel wirkt"]],
      ["sauberer-text","Ein KI-Text stimmt vollständig mit den Originalnotizen überein und enthält keine Widersprüche. Wie ist das einzuordnen?","Kein Warnsignal erkennbar, Text kann nach üblicher Prüfung verwendet werden",["Fehlende Quelle","Widersprüchliche Angaben","Ungewöhnlich glatte Formulierung"]]
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für KI Health Pflege besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für KI Health Pflege besteht keine aktive Anmeldung.");
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
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"ki-health-pflege-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
