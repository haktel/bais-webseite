(()=> {
  const STORAGE={
    last:"bais-kif-m03-assessment-last",
    weak:"bais-kif-m03-assessment-weak",
    attempt:"bais-kif-m03-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("BAU01","bausteine","Welche fünf Bausteine bilden ein vollständiges Prompt-Gerüst?","Rolle, Aufgabe, Kontext, Format, Einschränkung",["Nur Aufgabe und Format","Nur Rolle und Kontext","Sprache, Länge, Farbe, Ton und Zeit"],"Diese fünf Bausteine reduzieren zusammen den Interpretationsspielraum eines Prompts am stärksten."),
    q("BAU02","bausteine","Wofür sorgt der Baustein 'Rolle' in einem Prompt?","Er steuert Perspektive und Tonfall der Antwort",["Er ersetzt automatisch das zugrunde liegende Modell","Er verschlüsselt die Eingabe","Er ist rein dekorativ ohne Wirkung"],"Eine Rollenvorgabe wie 'Antworte als...' beeinflusst erkennbar Sprache und Blickwinkel der Antwort."),
    q("BAU03","bausteine","Was liefert der Baustein 'Kontext' zusätzlich zur reinen Aufgabe?","Zielgruppe und/oder Zweck der Antwort",["Die exakte Wortanzahl","Das verwendete KI-Modell","Das Ausgabeformat"],"Ohne Kontext muss das Modell Zielgruppe und Zweck selbst erraten."),
    q("BAU04","bausteine","Was bewirkt eine fehlende Formatvorgabe am ehesten?","Die Antwortstruktur variiert stark und ist schwer vergleichbar",["Die Antwort wird automatisch falsch","Das Modell verweigert die Antwort","Die Antwortlänge ist immer exakt gleich"],"Ohne Formatvorgabe entscheidet das Modell die Struktur nach eigenem Ermessen."),
    q("BAU05","bausteine","Was ist eine 'Einschränkung' (Constraint) in einem Prompt?","Eine explizite Begrenzung, z. B. Länge, Ton oder ausgeschlossene Inhalte",["Ein technischer Fehler im Prompt","Ein optionaler Rollenname","Eine reine Formsache ohne Wirkung"],"Einschränkungen wie 'ohne Fachjargon' oder 'maximal 5 Zeilen' grenzen den Ergebnisraum gezielt ein."),
    q("BAU06","bausteine","Warum reicht ein reiner Aufgaben-Verb ('Schreib etwas zu...') oft nicht aus?","Weil Rolle, Kontext, Format und Einschränkung fehlen und das Modell zu viel selbst annehmen muss",["Weil Verben von Modellen grundsätzlich nicht verstanden werden","Weil das technisch nicht ausführbar ist","Weil dafür ein Login nötig ist"],"Je weniger Bausteine vorhanden sind, desto mehr füllt das Modell mit eigenen Annahmen."),
    q("BAU07","bausteine","Was zeigt ein Prompt-Bausteine-Score von 2 von 5 am ehesten?","Ein brauchbarer Ausgangspunkt, der aber noch präzisiert werden sollte",["Einen technischen Fehler im Tool","Eine perfekte Prompt-Struktur","Einen automatisch blockierten Prompt"],"Zwei vorhandene Bausteine sind ein Anfang, aber noch keine vollständige Struktur."),
    q("BAU08","bausteine","Welche Aussage zu den fünf Bausteinen ist korrekt?","Sie ergänzen sich - je mehr vorhanden sind, desto eindeutiger wird die Aufgabe",["Es darf immer nur genau ein Baustein verwendet werden","Rolle und Format schließen sich gegenseitig aus","Die Reihenfolge der Bausteine ist gesetzlich vorgeschrieben"],"Die Bausteine sind unabhängig voneinander kombinierbar und wirken zusammen am stärksten."),

    q("ITE01","iteration","Was ist der sinnvollste erste Schritt, wenn eine KI-Antwort nicht passt?","Die bestehende Antwort gezielt nachschärfen (fehlender Kontext, Format, Ton)",["Sofort komplett neu und andersartig formulieren","Die Anfrage identisch wiederholen","Das Thema wechseln"],"Gezieltes Nachschärfen nutzt die bereits vorhandene Antwort als Ausgangspunkt."),
    q("ITE02","iteration","Was bedeutet iteratives Prompten im Kern?","Schrittweises Verbessern durch konkretes Feedback statt eines einzigen perfekten Versuchs",["Denselben Prompt beliebig oft unverändert wiederholen","Ausschließlich englischsprachige Prompts verwenden","Nur einen einzigen Versuch zulassen"],"Iteration verteilt die Präzisierung auf mehrere kleine, gezielte Schritte."),
    q("ITE03","iteration","Warum kann eine sehr lange, unstrukturierte Konversation mit einem Chatbot riskanter werden?","Der Kontext kann über viele Runden hinweg driften und zu inkonsistenten oder unpassenden Antworten führen",["Chatbots können grundsätzlich nur 5 Nachrichten verarbeiten","Lange Konversationen sind technisch unmöglich","Das betrifft ausschließlich Bildgenerierung"],"Ohne Re-Fokussierung kann sich eine lange Unterhaltung von der ursprünglichen Aufgabe entfernen."),
    q("ITE04","iteration","Was zeigte der öffentlich bekannt gewordene Fall von Bings Chatbot 'Sydney' (Februar 2023)?","In einer sehr langen, wenig begrenzten Konversation driftete der Chatbot zu unpassenden, unvorhersehbaren Aussagen ab",["Der Chatbot funktionierte in jeder Konversationslänge fehlerfrei","Es handelte sich um einen reinen Serverausfall","Microsoft hatte den Chatbot absichtlich so programmiert"],"Der Fall (berichtet u. a. von einem Journalisten der New York Times) zeigt, warum Kontextlänge und klare Grenzen wichtig sind."),
    q("ITE05","iteration","Was ist ein sinnvoller Umgang mit einer sehr langen KI-Konversation zu einem wichtigen Thema?","Den Kontext regelmäßig zusammenfassen oder neu fokussieren",["Die Konversation beliebig lange ohne Unterbrechung fortsetzen","Nach 3 Nachrichten immer neu beginnen, unabhängig vom Thema","Konversationslänge hat keinerlei Einfluss auf die Antwortqualität"],"Ein bewusster Reset oder eine Zusammenfassung hilft, die Aufgabe klar zu halten."),
    q("ITE06","iteration","Was war laut öffentlichen Berichten ein Erfolgsfaktor bei Klarnas 2024 vorgestelltem KI-Kundenservice-Assistenten?","Sorgfältig abgestimmte, iterativ verbesserte Prompts/Workflows für einen produktiven Einsatz im großen Maßstab",["Der Assistent wurde ganz ohne jede Vorbereitung eingeführt","Es handelte sich um ein rein internes Testprojekt ohne echte Nutzung","Klarna verzichtete komplett auf jede Qualitätsprüfung"],"Klarna berichtete öffentlich von einem produktiv im großen Maßstab eingesetzten, gut abgestimmten Assistenten."),
    q("ITE07","iteration","Warum ist 'einfach nochmal fragen' bei einem inhaltlichen Fehler oft nicht die beste Iteration?","Weil ohne konkretes Feedback derselbe Fehler erneut auftreten kann",["Weil das technisch unmöglich ist","Weil jede erneute Anfrage automatisch korrekt wird","Weil Modelle nie zweimal antworten"],"Erst konkretes Feedback zur Abweichung führt zu einer gezielt verbesserten Antwort."),
    q("ITE08","iteration","Was gehört zu einer guten zweiten Prompt-Runde nach einer unpassenden ersten Antwort?","Konkret benennen, was fehlt oder falsch ist, und das gezielt ergänzen",["Den gesamten bisherigen Verlauf ignorieren","Nur die Wortwahl kosmetisch ändern, ohne Inhalt zu präzisieren","Das Format bewusst weglassen"],"Konkretes, spezifisches Feedback ist der wirksamste Hebel für eine bessere zweite Antwort."),

    q("NEG01","negativ","Was ist eine 'negative Einschränkung' (negative Constraint) in einem Prompt?","Eine explizite Vorgabe, was die Antwort NICHT enthalten oder tun soll",["Eine besonders kurze Antwort","Eine Vorgabe zur Rolle","Ein technischer Fehlerbericht"],"Negative Constraints grenzen unerwünschte Inhalte oder Verhaltensweisen aktiv aus."),
    q("NEG02","negativ","Was zeigte der öffentlich bekannt gewordene Fall eines Autohaus-Chatbots (Dezember 2023), der einem Kunden ein Auto für 1 US-Dollar 'zusagte'?","Ohne explizite negative Einschränkung akzeptierte der Bot eine offensichtlich unseriöse, 'bindende' Formulierung",["Der Bot prüfte jede Zusage vorher mit einer zweiten Instanz","Das Auto wurde daraufhin tatsächlich für 1 US-Dollar verkauft","Es handelte sich um eine offizielle Marketingaktion des Herstellers"],"Der Fall zeigt, warum Prompts/Systemvorgaben explizit ausschließen sollten, rechtlich bindend klingende Zusagen zu machen."),
    q("NEG03","negativ","Warum reicht eine positive Aufgabenbeschreibung allein manchmal nicht aus?","Weil sie nicht automatisch ausschließt, was NICHT passieren soll",["Weil positive Formulierungen technisch nicht verarbeitet werden","Weil das grundsätzlich nie ein Problem ist","Weil negative Formulierungen gesetzlich vorgeschrieben sind"],"Erst eine explizite Grenze verhindert unerwünschte, aber naheliegende Interpretationen."),
    q("NEG04","negativ","Welches Beispiel ist eine sinnvolle negative Einschränkung für einen Kundenservice-Chatbot?","'Mache niemals rechtlich bindend klingende Zusagen ohne menschliche Freigabe.'",["'Beantworte jede Frage möglichst schnell.'","'Verwende einen freundlichen Ton.'","'Antworte auf Deutsch.'"],"Diese Einschränkung schließt genau das Risiko aus, das im Autohaus-Fall eintrat."),
    q("NEG05","negativ","Was ist ein Risiko, wenn ein Chatbot-Prompt keinerlei Ausschlüsse für ungewöhnliche Nutzeranfragen enthält?","Nutzende können den Bot gezielt zu unerwünschtem Verhalten verleiten",["Der Bot wird dadurch automatisch sicherer","Das ist technisch ausgeschlossen","Das betrifft ausschließlich Bildgenerierung"],"Ohne Grenzen kann ein Bot durch geschickte Formulierungen zu Aussagen gebracht werden, die er nicht machen sollte."),
    q("NEG06","negativ","Was gehört NICHT typischerweise zu einer negativen Einschränkung?","Eine Vorgabe zur gewünschten Rolle des Modells",["Ein Ausschluss bestimmter Themen","Ein Verbot bestimmter Formulierungen","Eine Begrenzung der maximalen Länge"],"Die Rollenvorgabe ist ein eigener, positiver Baustein - keine Einschränkung."),
    q("NEG07","negativ","Warum sollten negative Einschränkungen konkret statt vage formuliert werden?","Weil 'sei vorsichtig' weniger wirksam ist als eine konkret benannte Grenze",["Weil vage Formulierungen technisch nicht verarbeitet werden können","Weil konkrete Formulierungen immer länger sein müssen","Das spielt für die Wirkung keine Rolle"],"Konkrete Grenzen ('nie X ohne Y') sind eindeutiger umsetzbar als allgemeine Vorsicht."),
    q("NEG08","negativ","Was ist ein sinnvoller Testfall für einen Chatbot-Prompt mit negativen Einschränkungen?","Gezielt versuchen, den Bot zu einer ausgeschlossenen Aussage zu verleiten, bevor er live geht",["Den Bot nur mit erwarteten, freundlichen Fragen testen","Auf Tests komplett verzichten, da Einschränkungen automatisch wirken","Nur die Antwortzeit messen"],"Gezielte Grenzfall-Tests zeigen, ob die Einschränkungen tatsächlich wirken."),

    q("PRA01","praxis","Wofür eignet sich eine wiederverwendbare Prompt-Vorlage (Template) besonders?","Für wiederkehrende Aufgaben mit ähnlicher Struktur, aber wechselndem Inhalt",["Für einmalige, völlig einzigartige Anfragen","Ausschließlich für Bildgenerierung","Für Aufgaben ganz ohne jede Struktur"],"Eine Vorlage spart Zeit, weil Rolle, Format und Einschränkung nicht jedes Mal neu erfunden werden müssen."),
    q("PRA02","praxis","Was bedeutet 'Prompt-Reifegrad'?","Wie vollständig ein Prompt die relevanten Bausteine für seinen Zweck abdeckt",["Wie alt ein Prompt ist","Wie viele Wörter ein Prompt enthält","Welche Sprache verwendet wurde"],"Ein 'reifer' Prompt enthält alle für die Aufgabe nötigen Bausteine - nicht möglichst viele Wörter."),
    q("PRA03","praxis","Was ist ein Vorteil von Few-Shot-Beispielen in einem Prompt?","Sie zeigen dem Modell konkret, wie eine gewünschte Antwort aussehen soll",["Sie ersetzen die Aufgabenbeschreibung vollständig","Sie funktionieren nur bei Bildgenerierung","Sie sind ausschließlich bei Übersetzungen sinnvoll"],"Ein konkretes Beispiel ist oft eindeutiger als eine rein abstrakte Beschreibung."),
    q("PRA04","praxis","Wann ist ein Prompt für eine wiederkehrende Aufgabe 'fertig' im Sinne dieses Moduls?","Wenn er zuverlässig die gewünschte Struktur liefert, ohne jedes Mal neu angepasst werden zu müssen",["Sobald er einmal irgendeine Antwort geliefert hat","Sobald er länger als 200 Wörter ist","Nie - Prompts dürfen nie wiederverwendet werden"],"Zuverlässige Wiederverwendbarkeit ist das eigentliche Ziel einer guten Vorlage."),
    q("PRA05","praxis","Was ist ein sinnvoller erster Schritt beim Aufbau einer eigenen Prompt-Vorlage?","Die wiederkehrenden Bausteine (Rolle, Format, Einschränkung) identifizieren und fest einbauen",["Für jede Nutzung komplett neu improvisieren","Ausschließlich die Aufgabe, nie den Kontext benennen","Die Vorlage geheim halten und nie dokumentieren"],"Fest eingebaute, wiederkehrende Bausteine sind der Kern einer wiederverwendbaren Vorlage."),
    q("PRA06","praxis","Warum lohnt es sich, eine bewährte Prompt-Vorlage im Team zu teilen?","Andere profitieren von bereits getesteter Struktur statt bei null zu beginnen",["Geteilte Vorlagen funktionieren technisch schlechter","Das ist aus Datenschutzgründen grundsätzlich verboten","Vorlagen dürfen laut diesem Modul nie geteilt werden"],"Eine geteilte, bewährte Vorlage spart im Team wiederholten Aufwand."),
    q("PRA07","praxis","Was unterscheidet einen unreifen von einem reifen Prompt bei gleicher Aufgabe?","Der reife Prompt enthält zusätzlich Kontext, Format und Einschränkung statt nur die nackte Aufgabe",["Der reife Prompt ist immer in einer anderen Sprache verfasst","Der unreife Prompt enthält mehr Wörter","Es gibt keinen inhaltlichen Unterschied"],"Reife zeigt sich an struktureller Vollständigkeit, nicht an Wortanzahl."),
    q("PRA08","praxis","Was ist die zentrale Lehre aus Modul 3 für den Alltag?","Ein Prompt lohnt sich als kurzer, bewusster Konstruktionsprozess statt als spontaner Zufallsversuch",["Prompts sollten möglichst zufällig formuliert werden","Struktur spielt für die Antwortqualität keine Rolle","Nur die Länge eines Prompts zählt"],"Bewusst konstruierte Prompts liefern zuverlässiger die gewünschte Antwortstruktur.")
  ];

  const dynamicFactories=[
    ()=>{
      const samples=[
        {text:"Antworte als Steuerberater. Erkläre einer Auszubildenden in maximal 100 Wörtern den Unterschied zwischen Brutto und Netto, ohne Fachjargon.",score:5},
        {text:"Erkläre den Unterschied zwischen Brutto und Netto für eine Auszubildende.",score:2},
        {text:"Erklär mal was.",score:0}
      ];
      const s=samples[Math.floor(Math.random()*samples.length)];
      const label=s.score>=4?"vollstaendig":s.score>=2?"teilweise":"unzureichend";
      return q("D-STRUCT-"+s.text.length,"bausteine",`Wie würdest du diesen Prompt einordnen: "${s.text}"?`,label,["vollstaendig","teilweise","unzureichend"].filter(x=>x!==label),"Die Anzahl erkennbarer Bausteine (Rolle, Aufgabe, Kontext, Format, Einschränkung) bestimmt die Einordnung.");
    },
    ()=>{
      const n=[2,3,4][Math.floor(Math.random()*3)];
      return q("D-ITER-"+n,"iteration",`Eine KI-Antwort trifft nicht genau das Gewünschte. Was ist sinnvoller, als ${n} komplett neue, andersartige Prompts zu probieren?`,"Die bestehende Antwort mit konkretem Feedback gezielt nachschärfen",["Sofort das Thema wechseln","Die exakt gleiche Anfrage wiederholen","Die Antwort ungeprüft übernehmen"],"Gezieltes Nachschärfen nutzt den bereits erreichten Fortschritt statt bei null zu beginnen.");
    },
    ()=>{
      const cases=[
        {who:"ein Autohaus-Chatbot",what:"eine offensichtlich unseriöse 1-Dollar-Zusage für ein Auto",year:"2023",lesson:"Ohne explizite negative Einschränkung kann ein Chatbot zu unerwünschten Zusagen verleitet werden."},
        {who:"Microsofts Chatbot 'Sydney'",what:"unvorhersehbare Aussagen in einer sehr langen, wenig begrenzten Konversation",year:"2023",lesson:"Lange, unstrukturierte Konversationen ohne Re-Fokussierung erhöhen das Risiko für Kontext-Drift."}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("D-CASE-"+c.year+c.who.length,"negativ",`Was ist die zentrale Lehre aus dem bekannt gewordenen Fall von ${c.who} (${c.year}), bei dem ${c.what} auftrat?`,c.lesson,["Der Fall zeigt, dass Chatbots grundsätzlich nie produktiv eingesetzt werden sollten","Es gab dadurch keinerlei öffentliche Aufmerksamkeit","Der Fall betraf ausschließlich die Serverkapazität"],"Beide Fälle zeigen: fehlende Grenzen bzw. fehlende Struktur im Prompt-Design haben reale Konsequenzen.");
    },
    ()=>{
      const items=[
        {text:"eine einmalige, sehr spezifische Anfrage ohne Wiederholung",template:false},
        {text:"eine wöchentlich wiederkehrende Team-Statusmail mit gleichem Aufbau",template:true},
        {text:"eine tägliche Zusammenfassung eingehender Support-Tickets",template:true}
      ];
      const item=items[Math.floor(Math.random()*items.length)];
      return q("D-TEMPLATE-"+item.text.length,"praxis",`Lohnt sich eine wiederverwendbare Prompt-Vorlage für "${item.text}"?`,item.template?"Ja - die wiederkehrende Struktur spart bei jeder Wiederholung Zeit":"Eher nicht - die Aufgabe ist zu einmalig für eine wiederverwendbare Struktur",[item.template?"Eher nicht - die Aufgabe ist zu einmalig für eine wiederverwendbare Struktur":"Ja - die wiederkehrende Struktur spart bei jeder Wiederholung Zeit","Vorlagen sind grundsätzlich nie sinnvoll","Das hängt ausschließlich von der Tageszeit ab"],"Vorlagen lohnen sich vor allem bei wiederkehrenden, strukturell ähnlichen Aufgaben.");
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-03",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
