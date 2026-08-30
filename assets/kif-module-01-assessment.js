(()=> {
  const STORAGE={
    last:"bais-kif-m01-assessment-last",
    weak:"bais-kif-m01-assessment-weak",
    attempt:"bais-kif-m01-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("G01","grundlagen","Was beschreibt generative AI am treffendsten?","Ein Modell, das die statistisch wahrscheinlichste Fortsetzung von Inhalten erzeugt",["Eine Datenbank mit geprüften Fakten","Ein reiner Suchmaschinen-Index","Ein Verschlüsselungsverfahren"],"Generative Modelle optimieren Wahrscheinlichkeiten, nicht geprüfte Wahrheit."),
    q("G02","grundlagen","Warum kann ein KI-Modell überzeugend falsche Antworten geben?","Weil es Wahrscheinlichkeiten optimiert, statt Fakten zu verifizieren",["Weil es absichtlich täuscht","Weil es zu langsam rechnet","Weil es keine Sprache verarbeiten kann"],"Ohne eingebaute Faktenprüfung wirken falsche Aussagen genauso flüssig wie richtige."),
    q("G03","grundlagen","Was ist eine „Halluzination” im KI-Kontext?","Eine plausibel klingende, aber erfundene oder falsche Aussage",["Ein Systemabsturz","Ein Sicherheitsupdate","Ein Übersetzungsfehler"],"Halluzinationen entstehen, weil das Modell Lücken plausibel auffüllt."),
    q("G04","grundlagen","Welche Aussage zu generativer AI ist korrekt?","Sie kann Inhalte in Text, Bild, Code und weiteren Formaten erzeugen",["Sie speichert alle Anfragen dauerhaft öffentlich sichtbar","Sie ersetzt automatisch jede Fachkraft","Sie funktioniert grundsätzlich nur offline"],"Generative Modelle sind vielseitig einsetzbare Werkzeuge, keine Ersatzentscheider."),
    q("G05","grundlagen","Was unterscheidet ein KI-Modell von einer klassischen Suchmaschine?","Es generiert neue Formulierungen, statt nur auf bestehende Quellen zu verlinken",["Es hat immer aktuellere Daten als jede Suchmaschine","Es benötigt keinerlei Trainingsdaten","Es kann grundsätzlich nicht mit Sprache umgehen"],"Suchmaschinen verweisen auf Quellen, generative Modelle erzeugen neuen Text."),
    q("G06","grundlagen","Warum ist „KI-Führerschein” eine passende Metapher?","Weil sichere Nutzung Wissen, Regeln und Übung erfordert - wie beim Autofahren",["Weil dafür ein amtlicher Ausweis nötig ist","Weil KI nur im Straßenverkehr eingesetzt wird","Weil es dabei keine Regeln gibt"],"Kompetenter Umgang mit AI ist erlernbar und regelbasiert, nicht intuitiv gegeben."),
    q("G07","grundlagen","Was bedeutet „Trainingsdaten” bei einem KI-Modell?","Die Texte und Beispiele, aus denen das Modell statistische Muster gelernt hat",["Ein Test, den jede Nutzerin bestehen muss","Ein Wartungsprogramm für Server","Ein Ordner mit Zugangsdaten"],"Das Modellverhalten entsteht aus Mustern in den Trainingsdaten."),
    q("G08","grundlagen","Welche grundsätzliche Grenze hat generative AI?","Sie kann Fakten nicht zuverlässig von plausibel klingender Fiktion unterscheiden",["Sie kann nur eine einzige Sprache verarbeiten","Sie kann grundsätzlich keine Fragen beantworten","Sie benötigt zwingend Internetzugang zur Laufzeit"],"Deshalb bleibt Prüfung durch Menschen bei Fakten notwendig."),

    q("P01","prompting","Was gehört zu einem gut formulierten Prompt?","Eine klare Aufgabe, Kontext und ein gewünschtes Format",["Möglichst viele Fachbegriffe","Ein einzelnes Wort","Immer eine reine Ja/Nein-Frage"],"Aufgabe, Kontext und Format zusammen reduzieren Interpretationsspielraum."),
    q("P02","prompting","Warum verbessert Kontext („für wen, wofür”) die Antwortqualität?","Weil das Modell die Erwartung sonst selbst erraten muss",["Weil Kontext die Antwortzeit verkürzt","Weil Kontext Kosten einspart","Weil Kontext ein Pflichtfeld im Browser ist"],"Ohne Kontext füllt das Modell Lücken mit eigenen Annahmen."),
    q("P03","prompting","Was bewirkt eine Formatvorgabe wie „als Tabelle, maximal 5 Zeilen”?","Sie macht die Antwort strukturiert und vergleichbar",["Sie verhindert Halluzinationen vollständig","Sie macht die Antwort automatisch korrekt","Sie ist nur bei Bildgenerierung relevant"],"Formatvorgaben steuern die Struktur, nicht automatisch die Richtigkeit."),
    q("P04","prompting","Welche Formulierung ist präziser?","„Fasse den Text in 3 Stichpunkten für eine Kundenmail zusammen.”",["„Mach was mit dem Text.”","„Text.”","„Hilfe.”"],"Konkrete Aufgabe, Format und Zweck ergeben ein eindeutiges Ziel."),
    q("P05","prompting","Wofür steht eine Rollenvorgabe wie „Antworte als erfahrene Supportkraft”?","Sie steuert Tonfall und Perspektive der Antwort",["Sie tauscht das zugrunde liegende Modell aus","Sie verschlüsselt die Antwort","Sie ist reine Dekoration ohne Wirkung"],"Rollen beeinflussen Stil und Blickwinkel der generierten Antwort."),
    q("P06","prompting","Was ist iteratives Prompten?","Die Antwort schrittweise durch Rückfragen und Präzisierung verbessern",["Denselben Prompt beliebig oft identisch wiederholen","Nur einen einzigen Versuch zulassen","Ausschließlich englischsprachige Prompts verwenden"],"Verfeinern in mehreren Schritten liefert meist bessere Ergebnisse als ein Einzelversuch."),
    q("P07","prompting","Warum sollte man Länge oder Umfang explizit vorgeben?","Weil die Antwortlänge sonst stark variieren kann",["Weil das Modell sonst abstürzt","Weil kurze Antworten grundsätzlich falsch sind","Weil lange Antworten technisch verboten sind"],"Ohne Vorgabe entscheidet das Modell die Länge nach eigenem Ermessen."),
    q("P08","prompting","Was passiert häufig bei einem sehr vagen Prompt?","Das Modell füllt fehlenden Kontext mit Annahmen, die nicht passen müssen",["Das Modell verweigert grundsätzlich jede Antwort","Das Modell fragt immer zuerst aktiv zurück","Das Modell liefert automatisch die kürzestmögliche Antwort"],"Vage Prompts erhöhen das Risiko einer unpassenden oder generischen Antwort."),

    q("D01","datenschutz","Was passierte 2023 im bekannt gewordenen Fall bei Samsung mit ChatGPT?","Mitarbeitende fügten vertraulichen Quellcode und Notizen ein; Samsung untersagte danach öffentliche KI-Tools intern",["Samsung übernahm daraufhin OpenAI","Samsung entwickelte ein eigenes, offline laufendes Modell","Es gab keinen bekannt gewordenen Vorfall"],"Der Fall zeigt, wie schnell vertrauliche Daten unbeabsichtigt in externe Tools gelangen können."),
    q("D02","datenschutz","Warum ist Vorsicht bei öffentlichen KI-Tools mit Kundendaten geboten?","Eingaben können je nach Anbieter und Einstellungen gespeichert oder weiterverarbeitet werden",["Öffentliche Tools löschen grundsätzlich sofort jede Eingabe","Kundendaten sind unabhängig vom Tool gesetzlich automatisch geschützt","Das betrifft ausschließlich Bilddaten"],"Speicher- und Nutzungsregeln unterscheiden sich stark zwischen Anbietern und Tarifen."),
    q("D03","datenschutz","Welche Daten gehören grundsätzlich nicht in ein ungeprüftes KI-Tool?","Kundennummern, IBANs, Gesundheits- oder Personaldaten",["Allgemeine, öffentlich bekannte Markttrends","Öffentlich zugängliche Produktinformationen","Anonymisierte Beispieltexte ohne Personenbezug"],"Personenbezogene und vertrauliche Daten benötigen eine geprüfte Grundlage, bevor sie in ein KI-Tool gelangen."),
    q("D04","datenschutz","Was unterscheidet eine Unternehmens-KI-Lösung mit Datenschutzvereinbarung von einem kostenlosen Consumer-Tool?","Sie bietet in der Regel vertragliche Zusicherungen zu Datennutzung und Aufbewahrung",["Sie ist immer vollständig kostenlos","Sie funktioniert ausschließlich offline","Es gibt keinerlei Unterschiede"],"Vertragliche Grundlagen regeln, wie Eingaben verarbeitet und gespeichert werden dürfen."),
    q("D05","datenschutz","Was ist sinnvoll, wenn unklar ist, ob ein KI-Tool freigegeben ist?","Vor der Nutzung mit sensiblen Daten bei IT oder Datenschutz nachfragen",["Die Daten einfach eingeben und abwarten","Das Tool ungefragt unternehmensweit einführen","Die Frage ignorieren"],"Im Zweifel klärt eine kurze Rückfrage die Freigabe, bevor Daten geteilt werden."),
    q("D06","datenschutz","Warum sollten Screenshots von KI-Antworten mit Kundendaten nicht ungeprüft weitergeleitet werden?","Weil dabei personenbezogene Daten unkontrolliert verteilt werden können",["Weil Screenshots technisch nicht möglich sind","Weil das ausschließlich für PDF-Dateien gilt","Weil KI-Antworten grundsätzlich keine Daten enthalten"],"Ein Screenshot verbreitet enthaltene Daten genauso wie der Originaltext."),
    q("D07","datenschutz","Was bedeutet das Prinzip „Need to know” beim Formulieren von KI-Eingaben?","Nur die Informationen eingeben, die für die konkrete Aufgabe wirklich nötig sind",["Grundsätzlich alle verfügbaren Daten eingeben","Nur der IT-Abteilung Zugriff auf das Tool geben","Für jede Anfrage ein neues Passwort vergeben"],"Datensparsamkeit reduziert das Risiko bei jeder einzelnen Eingabe."),
    q("D08","datenschutz","Welche Rolle spielt eine interne KI-Nutzungsrichtlinie?","Sie legt verbindlich fest, welche Tools und Daten erlaubt sind",["Sie ist rein optional und unverbindlich","Sie betrifft ausschließlich die IT-Abteilung","Dafür besteht gesetzlich nie eine Notwendigkeit"],"Eine klare Richtlinie schafft einheitliche Regeln statt individueller Grauzonen."),

    q("Q01","qualitaet","Was entschied ein kanadisches Gericht 2024 im Fall eines Chatbots von Air Canada, der eine falsche Kulanzzusage machte?","Das Unternehmen haftet für die Aussage seines eigenen Chatbots",["Der Kunde trägt die volle Verantwortung","KI-Aussagen sind grundsätzlich unverbindlich","Der Fall wurde abgewiesen, da KI keine Rechtsperson ist"],"Das Unternehmen konnte sich nicht darauf berufen, der Chatbot habe eigenständig gehandelt."),
    q("Q02","qualitaet","Was ist die wichtigste erste Prüfung bei einer KI-Antwort mit konkreten Fakten (Zahlen, Namen, Daten)?","Diese gegen eine verlässliche Quelle gegenprüfen",["Die Antwort ungeprüft übernehmen, wenn sie selbstsicher klingt","Die Antwort grundsätzlich ignorieren","Die verwendete Schriftart prüfen"],"Selbstsicherer Tonfall ist kein Beleg für inhaltliche Richtigkeit."),
    q("Q03","qualitaet","Woran erkennt man häufig eine mögliche Halluzination?","An überzeugend klingenden, aber nicht verifizierbaren Details wie erfundenen Quellen",["An besonders kurzen Antworten","An Rechtschreibfehlern","An der reinen Antwortzeit"],"Nicht auffindbare Belege sind ein typisches Warnsignal."),
    q("Q04","qualitaet","Was ist ein sinnvoller Schritt bei Zweifeln an einer KI-Antwort?","Nach Quellen fragen und diese eigenständig verifizieren",["Die Antwort mehrfach kopieren","Das Gerät neu starten","Die Frage auf Englisch wiederholen"],"Nachprüfbare Quellen sind der zuverlässigste Weg, Zweifel aufzulösen."),
    q("Q05","qualitaet","Warum sind KI-Antworten bei Zahlen und Berechnungen besonders sorgfältig zu prüfen?","Weil Modelle Zahlen plausibel, aber nicht immer korrekt verarbeiten",["Weil Zahlen technisch nicht verarbeitet werden können","Weil Berechnungen immer separat serverseitig laufen","Das ist grundsätzlich kein Risiko"],"Plausibel klingende Zahlen können trotzdem falsch sein."),
    q("Q06","qualitaet","Was bedeutet „Overconfidence” bei KI-Antworten?","Das Modell formuliert unsichere Aussagen genauso selbstsicher wie gesicherte",["Das Modell warnt immer proaktiv vor eigenen Fehlern","Das Modell antwortet nur bei hoher Sicherheit","Das betrifft ausschließlich Bildgenerierung"],"Der Tonfall einer Antwort sagt nichts über ihre tatsächliche Zuverlässigkeit aus."),
    q("Q07","qualitaet","Welche Praxis reduziert das Risiko unentdeckter Fehler bei wichtigen KI-Ergebnissen?","Ein Vier-Augen-Prinzip vor der Veröffentlichung",["Möglichst schnelle Veröffentlichung ohne Review","Ergebnisse grundsätzlich nicht dokumentieren","Nur einen einzigen Promptversuch zulassen"],"Eine zweite Prüfinstanz fängt Fehler ab, die im ersten Durchgang übersehen wurden."),
    q("Q08","qualitaet","Was gilt für unterschiedliche KI-Antworten auf dieselbe Frage zu verschiedenen Zeitpunkten?","Modelle können bei gleichem Prompt leicht unterschiedliche Antworten liefern - Konsistenz ist keine Korrektheitsgarantie",["Das ist technisch unmöglich","Das bedeutet immer einen Systemfehler","Nur die zuerst erhaltene Antwort zählt automatisch als richtig"],"Variabilität ist normal und ersetzt nicht die inhaltliche Prüfung."),

    q("V01","verantwortung","Wer trägt die Verantwortung für eine veröffentlichte KI-generierte Aussage eines Unternehmens?","Das Unternehmen selbst, unabhängig vom eingesetzten Tool",["Ausschließlich der KI-Anbieter","Niemand, da die KI autonom gehandelt hat","Nur die IT-Abteilung"],"Verantwortung bleibt beim Unternehmen, das die Aussage veröffentlicht."),
    q("V02","verantwortung","Wann ist eine KI-Antwort als persönlicher Entwurf ausreichend, aber noch nicht kundenfähig?","Wenn sie ungeprüfte Fakten, keine Freigabe oder unklaren Ton enthält",["Wenn sie länger als 100 Wörter ist","Wenn sie auf Deutsch verfasst ist","Jede KI-Antwort ist sofort kundenfähig"],"Der Reifegrad hängt von Prüfung und Freigabe ab, nicht von Länge oder Sprache."),
    q("V03","verantwortung","Was gehört zu einer verantwortungsvollen KI-Nutzung im Unternehmen?","Klare Regeln, Schulung, Kennzeichnung und Kontrolle der Ergebnisse",["Vollständiger Verzicht auf jede Kontrolle","Nutzung ausschließlich ohne jede Dokumentation","Es braucht grundsätzlich keine Regeln"],"Struktur und Nachvollziehbarkeit reduzieren Risiken im Alltag."),
    q("V04","verantwortung","Warum sollte KI-generierter Text bei sensiblen Themen (z. B. rechtlich, medizinisch) besonders geprüft werden?","Weil Fehleinschätzungen dort besonders hohe Folgen haben können",["Weil KI solche Themen technisch nicht verarbeiten kann","Weil das grundsätzlich gesetzlich verboten ist","Das ist in diesen Bereichen nie relevant"],"Je höher das Risiko eines Fehlers, desto wichtiger die menschliche Prüfung."),
    q("V05","verantwortung","Was bedeutet Transparenz beim Umgang mit KI-Nutzung gegenüber Kolleg:innen oder Kund:innen?","Offen kommunizieren, wenn Inhalte KI-unterstützt entstanden sind, sofern relevant",["KI-Nutzung grundsätzlich verheimlichen","Nur bei direkter Nachfrage zugeben","Das ist rechtlich nie relevant"],"Offenheit schafft Vertrauen und vermeidet Missverständnisse."),
    q("V06","verantwortung","Welche Rolle spielt „Human in the loop” bei kritischen Entscheidungen?","Ein Mensch prüft und verantwortet die finale Entscheidung, KI liefert nur Vorschläge",["Der Mensch greift grundsätzlich nie ein","Die KI trifft die finale Entscheidung allein","Das betrifft ausschließlich rein technische Systeme"],"Kritische Entscheidungen behalten eine menschliche Prüf- und Verantwortungsinstanz."),
    q("V07","verantwortung","Was ist ein sinnvoller Umgang mit KI-generiertem Code vor dem produktiven Einsatz?","Code Review, Tests und Sicherheitsprüfung wie bei menschlich geschriebenem Code",["Ungeprüft direkt in Produktion einspielen","Code-Review ist bei KI-Code grundsätzlich nicht nötig","Es reicht, nur die Kommentare zu lesen"],"KI-generierter Code unterliegt denselben Qualitätsanforderungen wie jeder andere Code."),
    q("V08","verantwortung","Warum ist eine klare interne KI-Nutzungsrichtlinie wichtig?","Sie schafft einheitliche, nachvollziehbare Regeln statt Grauzonen im Alltag",["Sie ist nur für große Konzerne relevant","Sie ersetzt vollständig technische Sicherheitsmaßnahmen","Sie ist gesetzlich irrelevant"],"Ohne klare Richtlinie entscheidet jede Person individuell und uneinheitlich.")
  ];

  const dynamicFactories=[
    ()=>{
      const options=[
        {text:"Fasse den Bericht in 5 Stichpunkten für das Führungsteam zusammen, Ton: sachlich.",good:true},
        {text:"Schreib was zu dem Thema.",good:false},
        {text:"Erkläre den Unterschied zwischen Brutto und Netto für neue Auszubildende in maximal 100 Wörtern.",good:true},
        {text:"Mach das besser.",good:false}
      ];
      const pick=options[Math.floor(Math.random()*options.length)];
      return q("G-PROMPT-"+pick.text.length,"prompting",`Wie würdest du diesen Prompt einordnen: "${pick.text}"?`,pick.good?"Klar formuliert - Aufgabe, Kontext und Format sind erkennbar":"Zu vage - Aufgabe, Kontext oder Format fehlen",[pick.good?"Zu vage - Aufgabe, Kontext oder Format fehlen":"Klar formuliert - Aufgabe, Kontext und Format sind erkennbar","Grundsätzlich technisch nicht ausführbar","Das lässt sich ohne das Modell nie beurteilen"],pick.good?"Konkrete Aufgabe, Zielgruppe/Kontext und eine Formatvorgabe sind vorhanden.":"Ohne Aufgabe, Kontext oder Format muss das Modell zu viel selbst annehmen.");
    },
    ()=>{
      const items=[
        {text:"eine allgemeine Produktbeschreibung",safe:true},
        {text:"die IBAN und Kundennummer eines Kunden",safe:false},
        {text:"einen anonymisierten Beispieltext ohne Namen",safe:true},
        {text:"den vollständigen Namen und die Gesundheitsdaten einer Person",safe:false}
      ];
      const item=items[Math.floor(Math.random()*items.length)];
      return q("G-DATA-"+item.text.length,"datenschutz",`Darfst du "${item.text}" ohne Weiteres in ein ungeprüftes, öffentliches KI-Tool eingeben?`,item.safe?"Ja, das enthält keine sensiblen personenbezogenen Daten":"Nein, das sind sensible bzw. personenbezogene Daten",[item.safe?"Nein, das sind sensible bzw. personenbezogene Daten":"Ja, das enthält keine sensiblen personenbezogenen Daten","Nur mit Erlaubnis des KI-Anbieters","Das ist technisch ohnehin nicht möglich"],item.safe?"Ohne Personenbezug oder Vertraulichkeit besteht kein grundsätzliches Risiko.":"Personenbezogene oder vertrauliche Daten benötigen vorab eine geprüfte Grundlage.");
    },
    ()=>{
      const levels=[
        {text:"ein erster persönlicher Entwurf für die eigene Notiz",review:"Keine Freigabe nötig, aber vor Weitergabe prüfen"},
        {text:"ein interner Team-Newsletter",review:"Review durch eine zweite Person vor Versand"},
        {text:"eine kundenseitig sichtbare Antwort im Support",review:"Vollständige Prüfung und Freigabe vor Veröffentlichung"}
      ];
      const level=levels[Math.floor(Math.random()*levels.length)];
      return q("G-MATURITY-"+level.text.length,"verantwortung",`Welcher Prüfaufwand passt zu "${level.text}"?`,level.review,levels.filter(l=>l!==level).map(l=>l.review),"Je höher die Reichweite und Wirkung, desto höher der nötige Prüfaufwand vor Nutzung.");
    },
    ()=>{
      const n=[2,3,4,5][Math.floor(Math.random()*4)];
      return q("G-ITER-"+n,"prompting",`Eine erste KI-Antwort trifft nicht genau das Gewünschte. Was ist der sinnvollste nächste Schritt, bevor man ${n} komplett neue Prompts ausprobiert?`,"Die bestehende Antwort gezielt präzisieren (Feedback, fehlender Kontext, gewünschtes Format)",["Sofort das Thema wechseln","Die Anfrage identisch wiederholen","Das Tool wechseln, ohne den Prompt anzupassen"],"Gezieltes Nachschärfen ist meist effizienter als komplett neu zu beginnen.");
    },
    ()=>{
      const cases=[
        {who:"ein Anwalt",what:"erfundene Gerichtsurteile in einem Schriftsatz",year:"2023"},
        {who:"ein Chatbot eines Unternehmens",what:"eine falsche Kulanzzusage an einen Kunden",year:"2024"}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("G-CASE-"+c.year,"qualitaet",`In einem bekannt gewordenen Fall von ${c.year} verursachte ${c.who} Probleme durch ${c.what}. Was ist die zentrale Lehre daraus?`,"KI-Ausgaben müssen vor Verwendung geprüft werden - die Verantwortung bleibt beim Menschen bzw. Unternehmen",["KI darf seitdem in diesem Bereich gar nicht mehr eingesetzt werden","Der Fall zeigt, dass KI-Tools grundsätzlich fehlerfrei sein müssen","Es gab dadurch keine Konsequenzen"],"Beide Fälle zeigen: ungeprüfte KI-Ausgaben können reale rechtliche und finanzielle Folgen haben.");
    }
  ];

  const shuffle=array=>{
    const copy=[...array];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  };

  const weak=()=>JSON.parse(localStorage.getItem(STORAGE.weak)||"{}");
  const saveWeak=value=>localStorage.setItem(STORAGE.weak,JSON.stringify(value));

  function selectQuestions(count=12){
    const previous=new Set(JSON.parse(localStorage.getItem(STORAGE.last)||"[]"));
    const weakness=weak();
    const dynamic=dynamicFactories.map(factory=>factory());
    const pool=[...BANK,...dynamic];
    const fresh=pool.filter(item=>!previous.has(item.id));
    const source=fresh.length>=count?fresh:pool;
    const weighted=[];
    source.forEach(item=>{
      weighted.push(item);
      const bonus=Math.min(Number(weakness[item.topic]||0),3);
      for(let i=0;i<bonus;i++)weighted.push(item);
    });
    const picked=[];
    const used=new Set();
    for(const item of shuffle(weighted)){
      if(used.has(item.id))continue;
      used.add(item.id);picked.push(item);
      if(picked.length===count)break;
    }
    if(picked.length<count){
      for(const item of shuffle(pool)){
        if(used.has(item.id))continue;
        used.add(item.id);picked.push(item);
        if(picked.length===count)break;
      }
    }
    localStorage.setItem(STORAGE.last,JSON.stringify(picked.map(x=>x.id)));
    return shuffle(picked);
  }

  function init(){
    const root=document.querySelector("[data-assessment]");
    if(!root)return;
    const list=root.querySelector("[data-assessment-list]");
    const result=root.querySelector("[data-assessment-result]");
    const restart=root.querySelector("[data-assessment-restart]");
    const counter=root.querySelector("[data-assessment-counter]");
    let questions=[],answered=0,correctCount=0;

    const render=()=>{
      questions=selectQuestions(12);answered=0;correctCount=0;
      const attempt=Number(localStorage.getItem(STORAGE.attempt)||0)+1;
      localStorage.setItem(STORAGE.attempt,String(attempt));
      counter.textContent=`Versuch ${attempt} · 12 Fragen aus einem rotierenden Pool`;
      result.hidden=true;result.innerHTML="";
      list.innerHTML=questions.map((item,index)=>{
        const options=shuffle(item.options);
        return `<article class="assessmentItem" data-q="${item.id}" data-topic="${item.topic}">
          <div class="assessmentMeta"><span>FRAGE ${index+1}/${questions.length}</span><span>${item.topic.toUpperCase()}</span></div>
          <h3>${item.prompt}</h3>
          <div class="assessmentOptions">${options.map(option=>`<button type="button" data-answer data-correct="${option.correct}">${option.text}</button>`).join("")}</div>
          <div class="assessmentExplain" data-explain hidden></div>
        </article>`;
      }).join("");
    };

    list.addEventListener("click",event=>{
      const button=event.target.closest("[data-answer]");
      if(!button||button.disabled)return;
      const card=button.closest(".assessmentItem");
      const item=questions.find(q=>q.id===card.dataset.q);
      const buttons=[...card.querySelectorAll("[data-answer]")];
      buttons.forEach(b=>b.disabled=true);
      const ok=button.dataset.correct==="true";
      button.classList.add(ok?"correct":"wrong");
      const correctButton=buttons.find(b=>b.dataset.correct==="true");
      if(correctButton)correctButton.classList.add("correct");
      const explain=card.querySelector("[data-explain]");
      explain.hidden=false;
      explain.innerHTML=`<strong>${ok?"Richtig":"Nicht ganz"}</strong><p>${item.explanation}</p>`;
      answered++;
      if(ok)correctCount++;
      else{
        const current=weak();current[item.topic]=Number(current[item.topic]||0)+1;saveWeak(current);
      }
      if(answered===questions.length){
        const percent=Math.round(correctCount/questions.length*100);
        const grade=window.percentToNote?window.percentToNote(percent):{note:percent>=50?4:5,label:percent>=50?"ausreichend":"nicht ausreichend",passed:percent>=50};
        const credited=percent>=81;
        let message;
        if(credited)message="Modul-Testat erreicht — ausgezeichnete Leistung. Ein neuer Versuch verbessert deine Note weiter.";
        else if(grade.passed)message="Akademisch bestanden, aber für den BAIS Modul-Nachweis ist mindestens Note 2 („gut“, ≥81%) erforderlich. Wiederhole die Prüfung — der nächste Versuch verwendet andere Fragen.";
        else message="Noch nicht bestanden (mind. 50% erforderlich). Der nächste Versuch priorisiert zusätzlich deine schwächeren Themen und verwendet möglichst andere Fragen.";
        result.hidden=false;
        result.innerHTML=`<div class="gradeRow"><span class="gradeBadge grade-${grade.note}">Note ${grade.note}</span><div><strong>${correctCount}/${questions.length} richtig · ${percent}%</strong><span class="gradeLabel">${grade.label}${grade.passed?" · bestanden":" · nicht bestanden"}</span></div></div>
          <p>${message}</p>`;
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-01",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
