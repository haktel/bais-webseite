import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";

const COURSE_SLUG="secure-ai-rag",MODULE_COUNT=6,QUESTIONS_PER_MODULE=2,PASS_SCORE=81,EXAM_MINUTES=40;

const q=(id,module,prompt,correct,wrong,explanation)=>({id,module,prompt,answers:[correct,...wrong],correct,explanation});
export const FINAL_EXAM_BANK=[
q("M01-01",1,"Im Google-Bard-Demo-Video vom 8. Februar 2023 behauptete das Modell, das James-Webb-Weltraumteleskop habe „die allerersten Bilder eines Planeten außerhalb unseres Sonnensystems“ aufgenommen. Was zeigt dieser Fall vor allem?","Auch bei einer hochkarätigen, sorgfältig vorbereiteten Produkt-Demo kann ein ungeprüfter Faktenfehler unentdeckt bleiben und reale Konsequenzen haben",["Nur kleine, unbekannte Anbieter sind von Halluzinationen betroffen","Grounding war zum Zeitpunkt der Demo technisch noch gar nicht möglich","Der Fehler wurde vor der Veröffentlichung von Astronominnen korrigiert"],"Der Bard-Fall kostete Alphabet rund 100 Mrd. USD Marktkapitalisierung und zeigt, dass Prüfung vor Veröffentlichung unabhängig von Größe oder Renommee des Anbieters nötig ist."),
q("M01-02",1,"Was ist der Kernunterschied zwischen naiver Vector Search und Hybrid Search in einer RAG-Pipeline?","Hybrid Search kombiniert semantische Ähnlichkeit mit exakter Begriffstreffer-Suche und gleicht so die Schwächen beider Verfahren aus",["Hybrid Search ersetzt das Embed-&-Index-Retrieve-Augment-Generate-Muster vollständig","Vector Search findet exakte Artikelnummern zuverlässiger als Keyword Search","Hybrid Search benötigt keinen Re-Ranking-Schritt mehr"],"Vector Search erkennt semantische Nähe, versagt aber bei exakten Begriffen wie Fehlercodes; Keyword Search (z. B. BM25) ist dort zuverlässiger. Hybrid Search kombiniert beide Signale, ein Re-Ranker sortiert danach neu."),
q("M01-03",1,"Wozu dient ein No-Answer-Gate in der Context-Assembly-Phase einer RAG-Pipeline?","Es erlaubt dem System, explizit „dazu liegt keine ausreichende Quelle vor“ zu antworten, statt eine unsichere Antwort ohne Grundlage zu erzeugen",["Es blockiert grundsätzlich alle Anfragen außerhalb der Bürozeiten","Es ersetzt die Notwendigkeit eines Context Budget vollständig","Es sorgt dafür, dass immer möglichst viele Chunks in den Prompt aufgenommen werden"],"Ein System, das bei fehlender Evidenz ehrlich „ich weiß es nicht“ sagen kann, ist für den Unternehmenseinsatz oft wertvoller als eines, das immer eine flüssige Antwort liefert."),
q("M01-04",1,"Was ist laut Modul 01 die zentrale Grenze von Grounding durch RAG?","Auch mit Retrieval kann ein Modell Quellen falsch zusammenfassen, widersprüchliche Dokumente falsch gewichten oder Aussagen erfinden, die im Kontext so nicht stehen",["RAG beseitigt Halluzination vollständig, sobald Retrieval aktiv ist","Grounding funktioniert nur bei sehr kurzen Nutzerfragen","Sobald ein System RAG nutzt, ist keine weitere Qualitätsprüfung mehr nötig"],"„Wir nutzen RAG“ ist eine Architekturaussage, keine Qualitätsgarantie — ob es wirkt, entscheidet sich in jedem einzelnen nachfolgenden Kontroll-Modul."),

q("M02-01",2,"Die Studie „Lost in the Middle“ (Liu et al., Stanford/UC Berkeley, arXiv:2307.03172, 2023) fand einen U-förmigen Leistungsverlauf. Was bedeutet das für Context Assembly?","Informationen am Anfang oder Ende des Kontexts werden vom Modell zuverlässiger genutzt als identische Informationen in der Mitte, daher sollten die wichtigsten Chunks nicht in der Mitte platziert werden",["Die Position der Chunks im Kontext hat keinerlei Einfluss auf die Antwortqualität","Modelle nutzen ausschließlich Informationen aus der Mitte des Kontexts zuverlässig","Der Effekt tritt nur bei sehr kurzen Kontexten mit wenigen Chunks auf"],"Die Studie zeigt: Selbst wenn eine Information technisch im Kontext enthalten ist, wird sie in der Mitte platziert seltener korrekt genutzt als am Rand."),
q("M02-02",2,"Warum reicht es laut Modul 02 nicht, bei einer Löschanfrage nur das Ursprungsdokument aus dem System zu entfernen?","Weil ein Löschkonzept auch alle daraus erzeugten Chunks, Embeddings und Caches erfassen muss, sonst bleibt der Personenbezug im Index bestehen",["Weil Ursprungsdokumente technisch gar nicht löschbar sind","Weil Embeddings grundsätzlich keinen Personenbezug transportieren können","Weil Löschanfragen nur für gescannte PDF-Dokumente relevant sind"],"Ein Löschkonzept, das nur die Quelldatei entfernt, aber abgeleitete Vektoren im Index belässt, erfüllt die Anforderung an Datenminimierung nicht wirklich."),
q("M02-03",2,"Welche Aussage zu Chunking-Strategien ist laut Modul 02 zutreffend?","Semantic Chunking folgt inhaltlichen Absätzen oder Themenwechseln und ist meist präziser als Fixed-Size Chunking, dafür aufwendiger",["Fixed-Size Chunking garantiert, dass Sätze niemals mitten durchtrennt werden","Overlap zwischen Chunks ist grundsätzlich schädlich und sollte vermieden werden","Es gibt eine einzige, universell richtige Chunk-Größe für alle Dokumenttypen"],"Es gibt keine universell richtige Chunk-Größe — die Wahl hängt von Dokumenttyp, Fragestellung und Embedding-Modell ab und sollte empirisch mit Testfragen geprüft werden."),
q("M02-04",2,"Welche Metadaten sollten laut Modul 02 mit jedem Chunk mitgeführt werden, statt sie nachträglich zu rekonstruieren?","Quell-Dokument-ID, Erstellungs-/Änderungsdatum, Version, Autor bzw. Owner sowie die zugehörigen Zugriffsberechtigungen",["Ausschließlich die Dateigröße in Byte","Nur die verwendete Embedding-Modellversion","Ausschließlich die Sprache des Dokuments"],"Metadaten, die erst nachträglich ergänzt werden, sind in der Praxis fast immer unvollständig — sie gehören von Anfang an in die Ingestion-Pipeline, insbesondere die Zugriffsberechtigungen für Modul 03."),

q("M03-01",3,"Eine Concentric-AI-Analyse über mehr als 550 Millionen Datensätze im Kontext von Microsoft 365 Copilot fand, dass rund 16% geschäftskritischer Daten überteilt sind. Was ist die zentrale Lehre für RAG-Systeme?","Über Jahre angesammelte, nie überprüfte Berechtigungen sind oft das größte praktische Risiko — nicht ein Fehler im RAG-System selbst",["Copilot vergibt eigenständig neue, unautorisierte Zugriffsrechte","Das Risiko betrifft ausschließlich kleine Unternehmen ohne IT-Abteilung","Oversharing entsteht ausschließlich durch Fehler im Chunking-Prozess"],"Der Fall zeigt: Retrieval macht bereits bestehende, zu weit gefasste Berechtigungen erstmals durch einfache Sprachanfragen praktisch auffindbar."),
q("M03-02",3,"Warum ist Pre-Filtering von Berechtigungen einem nachträglichen Post-Filtering auf bereits gefundene Treffer vorzuziehen?","Weil Post-Filtering nach der Top-k-Begrenzung dazu führen kann, dass am Ende zu wenige oder gar keine zulässigen Treffer übrig bleiben, obwohl geeignete existiert hätten",["Weil Post-Filtering technisch grundsätzlich nicht implementierbar ist","Weil Pre-Filtering keine Metadaten benötigt","Weil beide Verfahren exakt dasselbe Ergebnis liefern"],"Pre-Filtering wendet die Berechtigungsprüfung bereits als Bedingung der Suche selbst an, sodass ausschließlich zulässige Dokumente überhaupt in die Treffermenge gelangen."),
q("M03-03",3,"Worin unterscheiden sich ACL, RBAC und ABAC als Zugriffsmodelle?","ACL vergibt Zugriff explizit pro Dokument, RBAC über Rollen, ABAC über Attribute wie Abteilung oder Vertraulichkeitsstufe",["Alle drei Modelle sind technisch identisch und unterscheiden sich nur im Namen","ACL, RBAC und ABAC gelten ausschließlich für Multi-Tenant-Systeme","ABAC vergibt Zugriff ausschließlich nach Tageszeit"],"ACL (Access Control List), RBAC (Role-Based) und ABAC (Attribute-Based) sind unterschiedliche Mechanismen, um zu entscheiden, wer ein Dokument sehen darf."),
q("M03-04",3,"Was sollte ein RAG-System tun, wenn nach Anwendung der Berechtigungsprüfung keine für die anfragende Person zulässigen Treffer übrig bleiben?","Transparent machen, dass keine für diese Person zugängliche Quelle vorliegt, statt auf schwächere, aber zulässige Treffer auszuweichen",["Automatisch auf das leistungsfähigste verfügbare Sprachmodell wechseln","Die Berechtigungsprüfung für diesen einen Fall stillschweigend überspringen","Die Anfrage ungeprüft an alle Nutzer der Organisation weiterleiten"],"Im Berechtigungskontext hat das No-Answer-Gate eine sicherheitskritische Funktion: Es darf nicht den Anschein einer vollständigen Antwort erzeugen, wenn die relevanteste Quelle gesperrt ist."),

q("M04-01",4,"Im Writer.com-Fall (Dezember 2023) steuerte weißer Text auf weißem Hintergrund die AI-Zusammenfassung. Um welche Art von Angriff handelte es sich?","Indirekte Prompt Injection, bei der die Anweisung in einem Dokument versteckt war, das das System später verarbeitete",["Direkte Prompt Injection über die Chat-Eingabe des Angreifers","Ein reiner Denial-of-Service-Angriff auf die Server von Writer.com","Ein Fehler ausschließlich in der Verschlüsselung der Datenbank"],"Indirekte Prompt Injection ist für RAG-Systeme das größere Risiko, weil verarbeitete Dokumente nicht zuverlässig von echten Nutzeranweisungen unterschieden werden, sofern das System nicht explizit dafür gebaut wurde."),
q("M04-02",4,"Im Writer.com-Fall wurden „die mittleren 50 Zeichen aller Quelldateien“ über welchen Kanal exfiltriert?","Als Parameter an eine Bild-URL angehängt, wodurch die Daten beim Laden des Bildes über eine CloudFront-URL abflossen",["Per direkter Chat-Nachricht an einen zweiten Nutzer-Account","Über eine manuell versendete E-Mail des Angreifers","Durch Änderung der Datenbank-Zugriffsrechte des Systems"],"Der Datenabfluss geschah über einen Kanal, der für legitime Funktionalität (Bild-Rendering) vorgesehen war und deshalb nicht standardmäßig blockiert wurde."),
q("M04-03",4,"Was ist laut Modul 04 der Zweck von Output Validation, im Unterschied zu Data Loss Prevention (DLP)?","Output Validation prüft generierte Antworten vor der Auslieferung auf verdächtige Strukturen wie automatisch geladene externe Bild-URLs mit ungewöhnlich langen Parametern",["Output Validation ersetzt die Notwendigkeit von DLP vollständig","DLP prüft ausschließlich eingehende E-Mails, nie generierte Antworten","Output Validation und DLP sind exakt dieselbe Kontrolle mit unterschiedlichem Namen"],"DLP erkennt und blockiert das Abfließen sensibler Muster; Output Validation prüft ergänzend die generierte Antwort selbst vor der Auslieferung — zwei sich ergänzende Kontrollschichten."),
q("M04-04",4,"Welches Prinzip aus dem Web-Browser überträgt Modul 04 auf AI-generierte Antworten?","Externe Bilder und Links sollten nicht automatisch und ungeprüft geladen werden, analog zu einer Content Security Policy",["Jede generierte Antwort sollte automatisch in einem neuen Tab geöffnet werden","AI-Antworten benötigen keinerlei Sandboxing, da sie reinen Text enthalten","Cookies aus AI-Antworten sollten immer automatisch akzeptiert werden"],"Sobald ein RAG-System Inhalte rendert, die technisch von außen beeinflussbar sind, gelten dieselben Sandboxing-Grundsätze wie im Web-Browser — etwa Domain-Allowlists für eingebettete Links."),

q("M05-01",5,"Im Fall Mata v. Avianca erfand ChatGPT Gerichtsentscheidungen samt Aktenzeichen. Wer wurde im Mai 2023 sanktioniert und wie?","Die beteiligten Anwälte durch US-Bundesrichter P. Kevin Castel, mit 5.000 USD Bußgeld und der Feststellung von „subjective bad faith“",["Der KI-Anbieter selbst wurde direkt zu einer Geldstrafe verurteilt","Der Kläger Avianca wurde für die Nutzung von ChatGPT bestraft","Es gab keinerlei disziplinarische oder finanzielle Konsequenzen"],"Der eigentliche Fehler war nicht, dass das Modell halluzinierte, sondern dass niemand die Existenz der zitierten Fälle unabhängig verifizierte, bevor sie beim Gericht eingereicht wurden."),
q("M05-02",5,"Welche drei Prüfungen umfasst Citation Correctness laut Modul 05?","Existence Check, Entailment Check und Fundstellen-Check",["Nur eine einzige Prüfung: ob die Quelle existiert","Rechtschreibprüfung, Layout-Prüfung und Übersetzungsprüfung","Ausschließlich die Prüfung der Dateigröße des zitierten Dokuments"],"Alle drei Prüfungen sind notwendig — eine Quelle kann existieren und trotzdem an der falschen Stelle oder für die falsche Aussage zitiert werden."),
q("M05-03",5,"Welche RAGAS-Metrik prüft, ob die generierte Antwort tatsächlich durch den abgerufenen Kontext gedeckt ist?","Faithfulness",["Context Precision","Response Relevancy","Context Recall"],"RAGAS trennt bewusst Retrieval-Bewertung (Context Precision/Recall) von Generation-Bewertung (Faithfulness/Relevancy) — ein System kann bei perfektem Retrieval trotzdem unfaithful antworten."),
q("M05-04",5,"Wozu dient ein Golden Set laut Modul 05?","Es ist eine kuratierte Sammlung realistischer Fragen mit bekannten, geprüften korrekten Antworten, gegen die jede Änderung an der Pipeline vor dem produktiven Einsatz erneut ausgewertet wird",["Es ersetzt die Notwendigkeit von Human-in-the-loop Review vollständig","Es enthält ausschließlich fehlerhafte Beispielantworten zu Trainingszwecken","Es wird einmalig erstellt und danach nie wieder verändert"],"Ein Golden Set, das nie erweitert wird, veraltet genauso wie ein Wissensindex ohne Freshness-Management — Regressionen sollen erkannt werden, bevor Nutzer sie erleben."),

q("M06-01",6,"Im Fall Moffatt v. Air Canada entschied das British Columbia Civil Resolution Tribunal am 19. Februar 2024. Was war die zentrale Aussage des Urteils?","Air Canada haftet für die Aussagen seines Chatbots genauso wie für Aussagen eines menschlichen Mitarbeiters oder den Inhalt der eigenen Webseite",["Der Chatbot wurde als eigenständige juristische Person anerkannt","Air Canada musste keinerlei Erstattung leisten, da der Kunde die Richtlinienseite hätte prüfen müssen","Chatbot-Aussagen sind grundsätzlich rechtlich unverbindlich"],"Das Tribunal wies das Argument, der Chatbot sei eine separate juristische Person, vollständig zurück und sprach Moffatt 650,88 CAD Erstattung zuzüglich Zinsen und Kosten zu."),
q("M06-02",6,"Was unterscheidet Source Freshness von Index Drift im laufenden Monitoring?","Source Freshness prüft, ob referenzierte Quelldokumente seit dem letzten Index-Update geändert wurden; Index Drift prüft per Stichprobe, ob häufig genutzte Antworten noch mit der aktuellen Quelle übereinstimmen",["Beide Begriffe bezeichnen exakt denselben Vorgang","Source Freshness betrifft nur Kosten, Index Drift nur Latenz","Index Drift ist nur bei Multi-Tenant-Systemen relevant"],"Beides sollte alarmieren, bevor eine veraltete Antwort produktiv an Kunden ausgeliefert wird — nicht erst, nachdem ein Kunde sich beschwert oder klagt."),
q("M06-03",6,"Welche drei Dimensionen müssen laut Modul 06 im laufenden Betrieb gemeinsam überwacht werden?","Antwortqualität, Kosten und Latenz",["Ausschließlich die Serverauslastung in Prozent","Nur die Anzahl der registrierten Nutzerkonten","Ausschließlich die Anzahl der Programmiersprachen im Backend"],"Ein System, das billig und schnell, aber inhaltlich unzuverlässig ist, ist ebenso ein Betriebsrisiko wie eines, das korrekt, aber zu teuer oder zu langsam für den Praxiseinsatz ist."),
q("M06-04",6,"Im Abschlussszenario aus Modul 06 wurde eine Homeoffice-Richtlinie geändert, das Quelldokument aber nie erneut indexiert. Was war der fehlende Mechanismus?","Eine automatisierte Prüfung (Source-Freshness-Monitoring), ob referenzierte Dokumente seit dem letzten Index-Lauf geändert wurden",["Ein zusätzliches Re-Ranking-Modell für die Suchergebnisse","Eine höhere Anzahl an Top-k-Ergebnissen pro Anfrage","Eine zusätzliche Verschlüsselungsstufe für das Quelldokument"],"Der richtige nächste Schritt ist die Kennzeichnung der betroffenen Antwort als möglicherweise veraltet, ein manueller Re-Index und die Einführung einer laufenden Freshness-Prüfung.")
];

const shuffle=array=>{const x=[...array];for(let i=x.length-1;i>0;i--){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);const j=bytes[0]%(i+1);[x[i],x[j]]=[x[j],x[i]];}return x;};

const DYNAMIC_EXPLANATIONS={
  1:"Grounding-Qualität entscheidet sich an Retrieval, Hybrid Search und einem sauberen No-Answer-Gate — nicht am Vertrauen in ein einzelnes, selbstsicher klingendes Modell.",
  2:"Chunking, Metadaten und Position im Kontext bestimmen gemeinsam, ob eine korrekt gefundene Information auch tatsächlich genutzt und später sauber wieder gelöscht werden kann.",
  3:"Relevanz und Berechtigung sind zwei getrennte Prüfungen; Pre-Filtering vor dem Retrieval verhindert, dass zulässige Treffer durch Top-k-Begrenzung verloren gehen.",
  4:"Jede von einem RAG-System verarbeitete externe Quelle ist ein potenzieller Angriffsvektor für indirekte Prompt Injection und Datenexfiltration — DLP und Output Validation wirken auf unterschiedlichen Seiten dieses Kanals.",
  5:"Eine Quellenangabe beweist keine korrekte Antwort — Existenz, Entailment und Fundstelle müssen einzeln geprüft werden, RAGAS macht das systematisch messbar.",
  6:"Monitoring nach Go-Live ist kein optionaler Zusatz: Quellen, Berechtigungen und Nutzungsmuster verschieben sich laufend, und ein Unternehmen haftet für eine falsche Chatbot-Aussage wie für jede andere Aussage."
};

function dynamicCandidates(module){
  if(module===1){
    const cases=[
      ["threshold-low","RAG-Retrieval liefert für eine Nutzeranfrage nur sehr schwache Relevanz-Scores unterhalb des definierten Context-Budget-Schwellenwerts. Was sollte das System tun?","Über das No-Answer-Gate signalisieren, dass keine ausreichende Quelle vorliegt, statt eine unsichere Antwort zu erzeugen",["Trotzdem die bestmögliche Antwort aus den schwachen Treffern generieren","Automatisch auf reines Trainingswissen ohne Quellenangabe zurückgreifen","Die Anfrage ungeprüft an alle verfügbaren Dokumente im Index weiterleiten"]],
      ["exact-code","Eine Nutzeranfrage enthält eine exakte Artikelnummer (z. B. „ART-88213“). Welches Suchverfahren findet diesen Treffer am zuverlässigsten?","Keyword Search (z. B. BM25), da sie exakte Begriffstreffer zuverlässiger erkennt als reine semantische Ähnlichkeit",["Reine Vector Search, da sie exakte Zeichenketten immer bevorzugt","Query Transformation allein, ganz ohne anschließende Suche","HyDE, weil hypothetische Dokumente Artikelnummern automatisch enthalten"]],
      ["hyde-case","Ein Team möchte, dass das System zunächst eine hypothetische Antwort generiert und danach nach ähnlichen Dokumenten sucht. Welche Query-Transformation-Technik beschreibt das?","HyDE (Hypothetical Document Embeddings)",["Multi-Query","Query Rewriting","Re-Ranking"]],
      ["rerank-budget","Ein Retrieval liefert 40 thematisch passende Chunks, das Context Budget erlaubt aber nur 6 im finalen Prompt. Was ist der sinnvollste nächste Schritt?","Einen Re-Ranker einsetzen, der die 40 Kandidaten nach einem präziseren Relevanzmodell auf die relevantesten Chunks reduziert",["Alle 40 Chunks unverändert in den Prompt aufnehmen","Das Context Budget vollständig ignorieren und beliebig erweitern","Nur den zuerst gefundenen Chunk verwenden, unabhängig von der Relevanz"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D01-"+code,1,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[1]));
  }
  if(module===2){
    const cases=[
      ["fixed-size","Ein Dokument wird nach einer festen Zeichenanzahl pro Chunk zerlegt, ohne Rücksicht auf Satzgrenzen. Welche Chunking-Strategie wird hier beschrieben — und was ist ihr Hauptrisiko?","Fixed-Size Chunking; das Risiko ist, dass Sätze und Zusammenhänge mitten durchtrennt werden",["Semantic Chunking; das Risiko ist ein zu geringer Speicherverbrauch","Overlap Chunking; das Risiko ist eine zu hohe Suchgeschwindigkeit","Es handelt sich um kein bekanntes Chunking-Verfahren"]],
      ["middle-position","Ein besonders relevanter Chunk wird laut Retrieval-Score in die exakte Mitte eines langen zusammengestellten Kontexts einsortiert. Was ist laut „Lost in the Middle“ zu erwarten?","Das Modell nutzt diese Information tendenziell weniger zuverlässig, als wenn sie am Anfang oder Ende des Kontexts stünde",["Die Position im Kontext hat keinerlei nachgewiesenen Effekt","Chunks in der Mitte werden immer bevorzugt korrekt genutzt","Der Effekt gilt ausschließlich für Bilddaten, nicht für Text"]],
      ["deletion-request","Eine betroffene Person stellt eine Löschanfrage, und das Team entfernt nur die ursprüngliche PDF-Datei aus dem Dateisystem. Was fehlt in diesem Löschkonzept?","Die zugehörigen Chunks, Embeddings und Caches im Index wurden nicht mitentfernt",["Die Löschanfrage hätte grundsätzlich abgelehnt werden müssen","Nichts, das Entfernen der Originaldatei ist bereits vollständig ausreichend","Löschanfragen betreffen ausschließlich strukturierte Datenbankfelder"]],
      ["dedupe-vs-fresh","Zwei nahezu identische Chunks aus einer alten und einer neuen Dokumentversion liegen beide im Index und konkurrieren im Retrieval. Welches Konzept adressiert dieses konkrete Problem?","Deduplizierung in Kombination mit Freshness-Tracking der veralteten Version",["Ausschließlich Query Transformation der Nutzeranfrage","Ein zusätzliches No-Answer-Gate ohne weitere Maßnahmen","Eine Erhöhung der Chunk-Größe auf das Doppelte"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D02-"+code,2,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[2]));
  }
  if(module===3){
    const cases=[
      ["post-filter-risk","Ein System sucht zunächst Top-20-Treffer und entfernt danach unzulässige Treffer per Berechtigungsprüfung, wodurch am Ende nur 2 zulässige Treffer übrig bleiben, obwohl 15 zulässige existiert hätten. Welches Muster liegt hier vor?","Post-Filtering nach Retrieval, das durch die Top-k-Begrenzung zulässige Treffer verdrängen kann",["Pre-Filtering, das korrekt vor der Suche angewendet wurde","Tenant Isolation, die fehlerhaft konfiguriert wurde","Ein reiner Index-Drift-Fehler ohne Bezug zu Berechtigungen"]],
      ["rbac-case","Der Zugriff auf ein Dokument wird ausschließlich über die Rolle „Teamleitung“ vergeben, unabhängig davon, welche konkrete Person diese Rolle innehat. Welches Zugriffsmodell wird hier beschrieben?","RBAC (Role-Based Access Control)",["ACL (Access Control List)","ABAC (Attribute-Based Access Control)","Tenant Isolation"]],
      ["abac-case","Der Zugriff auf ein Dokument hängt von Abteilung, Standort und einer definierten Vertraulichkeitsstufe der anfragenden Person ab. Welches Zugriffsmodell wird hier beschrieben?","ABAC (Attribute-Based Access Control)",["ACL (Access Control List)","RBAC (Role-Based Access Control)","Ein Freshness-Filter"]],
      ["no-answer-permission","Die inhaltlich relevanteste Quelle zu einer Anfrage existiert, ist aber für die anfragende Person gesperrt; alle übrigen Treffer sind deutlich schwächer. Was ist laut Modul 03 korrekt?","Transparent signalisieren, dass keine für diese Person zugängliche Quelle vorliegt, statt die schwächeren Treffer als vollständige Antwort auszugeben",["Die gesperrte Quelle trotzdem verwenden, da sie inhaltlich am besten passt","Die Berechtigungsprüfung für hochrangige Nutzergruppen grundsätzlich deaktivieren","Automatisch eine andere Person mit passender Berechtigung kontaktieren"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D03-"+code,3,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[3]));
  }
  if(module===4){
    const cases=[
      ["hidden-instruction","Ein abgerufenes Dokument enthält unsichtbar formatierten Text mit der Anweisung, vertrauliche Auszüge an eine externe URL anzuhängen. Um welche Angriffsart handelt es sich?","Indirekte Prompt Injection mit anschließendem Exfiltrationsversuch",["Direkte Prompt Injection durch den aktuellen Chat-Nutzer","Ein reiner Chunking-Fehler ohne Sicherheitsrelevanz","Ein Problem der Embedding-Modellwahl"]],
      ["open-upload","Eine für alle Mitarbeitenden frei beschreibbare geteilte Ablage wird regelmäßig in den RAG-Index aufgenommen. Welches Risiko beschreibt Modul 04 dafür?","Retrieval Poisoning: ein präpariertes Dokument kann ohne gezielten Angriff auf eine Person in den Index gelangen",["Das Risiko besteht nicht, da geteilte Ablagen grundsätzlich vertrauenswürdig sind","Es handelt sich um ein reines Kostenproblem, nicht um ein Sicherheitsrisiko","Dieses Risiko betrifft ausschließlich Bilddateien, nie Textdokumente"]],
      ["image-url-exfil","Eine generierte Antwort enthält eine automatisch geladene externe Bild-URL mit ungewöhnlich langen, codiert wirkenden Parametern. Welche Kontrolle sollte das idealerweise vor Auslieferung erkennen?","Output Validation",["Ausschließlich Chunking-Optimierung","Ein höheres Top-k beim Retrieval","Query Rewriting der ursprünglichen Nutzerfrage"]],
      ["csp-analogy","Ein Team überlegt, ob generierte AI-Antworten automatisch alle enthaltenen externen Links und Bilder laden sollen. Welches Prinzip aus Modul 04 spricht dagegen?","Das CSP-Analogieprinzip: externe Inhalte sollten nicht automatisch und ungeprüft geladen werden, etwa über Domain-Allowlists",["Es gibt kein vergleichbares Prinzip aus der Web-Sicherheit","Automatisches Laden ist immer sicherer als eine Allowlist","Dieses Prinzip gilt ausschließlich für Video-Inhalte"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D04-"+code,4,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[4]));
  }
  if(module===5){
    const cases=[
      ["fabrication","Ein zitiertes Gerichtsurteil mit Aktenzeichen lässt sich in keiner echten Datenbank auffinden. Welcher der drei Zitationsfehlertypen liegt vor?","Fabrikation — das zitierte Dokument existiert überhaupt nicht",["Attributionsfehler — die Fundstelle ist nur leicht ungenau","Entailment-Fehler — das Dokument existiert, sagt aber etwas anderes aus","Ein reiner Formatierungsfehler ohne inhaltliche Relevanz"]],
      ["entailment-case","Ein zitiertes Dokument existiert tatsächlich, die damit belegte Aussage steht darin aber so nicht. Welcher Fehlertyp liegt vor?","Entailment-Fehler",["Fabrikation","Attributionsfehler","Ein Context-Precision-Fehler beim Retrieval"]],
      ["ragas-metric","Ein RAGAS-Report zeigt eine niedrige Context Recall, aber eine hohe Faithfulness. Wie ist das am ehesten einzuordnen?","Das Retrieval hat relevante Informationen möglicherweise nicht vollständig erfasst, die Generierung hält sich aber treu an das, was gefunden wurde",["Die Generierung ist grundsätzlich fehlerhaft, das Retrieval ist irrelevant","Beide Werte messen exakt dasselbe und widersprechen sich daher nie","Ein niedriger Context-Recall-Wert bedeutet immer einen Systemausfall"]],
      ["golden-set-update","Ein Golden Set wurde vor zwei Jahren erstellt und seitdem nie erweitert, obwohl sich Produkte und Richtlinien mehrfach geändert haben. Was folgt daraus laut Modul 05?","Das Golden Set veraltet wie ein Wissensindex ohne Freshness-Management und sollte laufend erweitert werden",["Ein einmal erstelltes Golden Set benötigt grundsätzlich keine weitere Pflege","Golden Sets verlieren nach sechs Monaten automatisch ihre technische Gültigkeit","Nur RAGAS-Metriken selbst müssen aktualisiert werden, nicht das Golden Set"]]
    ];
    return cases.map(([code,prompt,correct,wrong])=>q("D05-"+code,5,prompt,correct,wrong,DYNAMIC_EXPLANATIONS[5]));
  }
  if(module===6){
    const cases=[
      ["freshness-gap","Eine häufig abgefragte Richtlinie wurde vor drei Monaten geändert, das Quelldokument aber nie erneut indexiert. Welcher Monitoring-Mechanismus hätte das laut Modul 06 auffangen sollen?","Source-Freshness-Monitoring, das prüft, ob referenzierte Quelldokumente seit dem letzten Index-Update geändert wurden",["Ausschließlich Latenz-Monitoring der Antwortzeiten","Eine höhere Verschlüsselungsstufe der Datenbank","Ein zusätzliches Re-Ranking-Modell beim Retrieval"]],
      ["liability-case","Ein Unternehmen argumentiert, sein Chatbot sei eine „separate juristische Person“ und für dessen falsche Auskunft hafte das Unternehmen nicht. Wie hat ein Gericht diese Argumentation im Fall Moffatt v. Air Canada bewertet?","Vollständig zurückgewiesen — ein Unternehmen haftet für Chatbot-Aussagen wie für jeden anderen Kommunikationskanal",["Der Argumentation vollständig zugestimmt","Die Frage wurde als nicht entscheidungsrelevant offengelassen","Es wurde nur für Kunden außerhalb Kanadas anders entschieden"]],
      ["cost-quality","Ein RAG-System liefert sehr schnelle und günstige Antworten, aber Stichproben zeigen sinkende Faithfulness-Werte. Was ist laut Modul 06 die richtige Einordnung?","Ein Betriebsrisiko — niedrige Kosten und Latenz rechtfertigen keine sinkende inhaltliche Zuverlässigkeit",["Unkritisch, solange die Latenz niedrig bleibt","Ein reines Kostenproblem ohne Bezug zur Antwortqualität","Ein Zeichen, dass das Monitoring zu häufig läuft und reduziert werden sollte"]],
      ["security-anomaly","Innerhalb weniger Stunden häufen sich ungewöhnlich viele Anfragen, die versuchen, das System zur Preisgabe seiner Systemanweisungen zu bewegen. Was sollte laut Modul 06 geschehen?","Die Anfragen protokollieren, alarmieren und mit einem dokumentierten Audit Trail auswerten",["Die Anfragen ignorieren, da Systemanweisungen ohnehin nicht sensibel sind","Das gesamte Monitoring für diesen Zeitraum deaktivieren","Automatisch alle Nutzerkonten löschen, ohne weitere Prüfung"]]
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für Secure AI & RAG besteht keine aktive Anmeldung.");
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
  if(!enrollment)throw new ApiError(404,"enrollment_not_found","Für Secure AI & RAG besteht keine aktive Anmeldung.");
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
   await db.prepare("INSERT INTO assessments(id,enrollment_id,score,status,evidence_ref,assessed_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),row.enrollment_id,score,status,"secure-ai-rag-final-exam:"+row.id,nowIso).run();
   let certificate=null;
   if(passed)certificate=await issueCertificate(db,user.user_id,enrollment.course_id,enrollment.course_title,nowIso);
   await db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.user_id,"academy.final_exam.completed","assessment",row.id,JSON.stringify({score,grade,passed,certificateCode:certificate?.public_code||null}),nowIso).run();
   return json({ok:true,attemptId:row.id,score,correct,total:questions.length,grade,passed,passScore:PASS_SCORE,review,certificate:certificate?{code:certificate.public_code,title:certificate.title,issuedAt:certificate.issued_at,verificationUrl:"/zertifikat/?code="+encodeURIComponent(certificate.public_code)}:null});
  }
  throw new ApiError(422,"action_invalid","Ungültige Prüfungsaktion.");
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
