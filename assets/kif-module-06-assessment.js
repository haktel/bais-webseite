(()=> {
  const STORAGE={
    last:"bais-kif-m06-assessment-last",
    weak:"bais-kif-m06-assessment-weak",
    attempt:"bais-kif-m06-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("ESK01","eskalation","Was bedeutet 'Eskalation' im Kontext von KI-Nutzung am Arbeitsplatz?","Eine Situation oder ein Ergebnis gezielt an eine zuständige Stelle weiterzugeben, statt sie allein zu entscheiden",["Ein KI-Tool grundsätzlich abzuschalten","Eine Aufgabe komplett zu ignorieren","Eine Antwort möglichst schnell zu veröffentlichen"],"Eskalation heißt, Verantwortung dorthin zu geben, wo sie hingehört - nicht, ein Problem zu vermeiden."),
    q("ESK02","eskalation","Wann ist Eskalation bei KI-generierten Inhalten besonders wichtig?","Wenn die Reichweite groß oder das Thema sensibel ist",["Nur bei technischen Störungen des Tools","Nur wenn ein Kollege explizit danach fragt","Nie - Eskalation ist bei KI-Themen nicht relevant"],"Je größer die Reichweite oder je sensibler das Thema, desto wichtiger eine bewusste Weitergabe an die richtige Stelle."),
    q("ESK03","eskalation","Was ist ein sinnvoller Auslöser, ein KI-Ergebnis zu eskalieren statt selbst zu entscheiden?","Unsicherheit über Fakten in Kombination mit externer Sichtbarkeit",["Ein besonders kurzer Text","Eine besonders schnelle Antwortzeit des Tools","Eine Antwort in Stichpunktform"],"Unsicherheit plus Reichweite ist ein klarer Hinweis, dass eine zweite Instanz einbezogen werden sollte."),
    q("ESK04","eskalation","Warum ist 'schnell veröffentlichen, dann notfalls korrigieren' bei KI-Inhalten riskant?","Weil eine öffentlich sichtbare Falschaussage schon Schaden anrichten kann, bevor sie korrigiert wird",["Weil Korrekturen technisch unmöglich sind","Weil das grundsätzlich schneller ist als vorherige Prüfung","Weil das bei internen Inhalten ebenfalls empfohlen wird"],"Der Schaden einer sichtbaren Falschaussage lässt sich durch eine spätere Korrektur oft nicht mehr vollständig rückgängig machen."),
    q("ESK05","eskalation","Was gehört zu einer guten Eskalationskultur im Team?","Eskalation wird als verantwortungsvolles Handeln anerkannt, nicht als Schwäche",["Eskalation wird grundsätzlich sanktioniert","Nur Führungskräfte dürfen eskalieren","Eskalation ist ausschließlich bei technischen Fehlern vorgesehen"],"Wenn Eskalation als negativ gilt, wird sie im Ernstfall vermieden - genau dann, wenn sie am wichtigsten wäre."),

    q("FRE01","freigabe","Welche drei Freigabestufen nutzt der Live-Lab dieses Moduls?","keine Freigabe nötig, Team-Review, vollständige Freigabe",["Genehmigt, abgelehnt, unklar","Schnell, mittel, langsam","Intern, extern, gemischt"],"Die drei Stufen orientieren sich an Reichweite und Themensensibilität, nicht an Geschwindigkeit."),
    q("FRE02","freigabe","Wann reicht laut diesem Modul 'keine formale Freigabe'?","Bei einem persönlichen Entwurf ohne externe Reichweite und ohne sensibles Thema",["Immer, wenn das Ergebnis gut klingt","Bei jeder internen Kommunikation, unabhängig vom Thema","Bei jeder Kundenanfrage, wenn sie kurz ist"],"Nur die Kombination aus persönlich, intern und unsensibel braucht keine formale Freigabe."),
    q("FRE03","freigabe","Wann verlangt dieses Modul eine vollständige Freigabe?","Wenn externe/kundenseitige Reichweite mit einem sensiblen Thema (Recht, Medizin, Finanzen, Datenschutz) zusammentrifft",["Immer, sobald ein Kunde erwähnt wird, unabhängig vom Thema","Nur bei internen Team-Nachrichten","Nur, wenn der Text sehr lang ist"],"Erst die Kombination aus Reichweite und Themensensibilität löst die höchste Stufe aus."),
    q("FRE04","freigabe","Warum reicht 'intern' allein nicht automatisch für die Stufe 'keine Freigabe'?","Weil auch interne Inhalte ein Team-Review brauchen können, z. B. bei einem sensiblen Thema",["Weil interne Inhalte grundsätzlich nie freigegeben werden dürfen","Weil 'intern' technisch dasselbe wie 'extern' bedeutet","Weil interne Inhalte automatisch als vollständig freigegeben gelten"],"Die Stufen richten sich nach Reichweite UND Thema - nicht nach Reichweite allein."),
    q("FRE05","freigabe","Was ist der Sinn einer Team-Review-Stufe zwischen 'keine' und 'vollständige Freigabe'?","Sie deckt Fälle ab, die weder komplett unproblematisch noch hochriskant sind, aber trotzdem eine zweite Meinung brauchen",["Sie ist überflüssig und sollte entfernt werden","Sie ersetzt die vollständige Freigabe in jedem Fall","Sie gilt ausschließlich für technische Dokumentation"],"Eine mittlere Stufe bildet ab, dass nicht jede Situation nur 'gar keine' oder 'maximale' Prüfung braucht."),

    q("FAL01","faelle","Was wurde 2024 öffentlich über den Chatbot 'MyCity' der Stadt New York bekannt?","Er gab teils rechtswidrige Ratschläge an kleine Unternehmen, z. B. zu Arbeitsrecht-Themen",["Er funktionierte durchgehend fehlerfrei und wurde ausgezeichnet","Er wurde vor dem Start nie öffentlich zugänglich gemacht","Es handelte sich um ein rein internes Verwaltungstool ohne Öffentlichkeitszugang"],"Der Fall zeigt, wie wichtig eine gründliche Prüfung ist, bevor ein öffentlich zugänglicher Chatbot zu rechtlich sensiblen Themen antwortet."),
    q("FAL02","faelle","Was passierte im Januar 2024 öffentlich bekannt beim Kundenservice-Chatbot des Paketdienstleisters DPD?","Ein Kunde brachte den Bot dazu, das eigene Unternehmen zu beschimpfen und ein kritisches Gedicht zu schreiben; DPD schaltete die Funktion danach ab",["Der Bot funktionierte einwandfrei und wurde ausgebaut","DPD hatte den Bot nie öffentlich zugänglich gemacht","Es handelte sich um eine offiziell geplante Marketingaktion"],"Der viral gegangene Vorfall zeigt fehlende Schutzmechanismen gegen gezielte Manipulation vor dem produktiven Einsatz."),
    q("FAL03","faelle","Was wurde 2023 im Fall einer Vergleichsvereinbarung der US-Behörde EEOC mit dem Unternehmen iTutorGroup bekannt?","Ein von der Firma genutztes KI-Tool zur Bewerber-Vorauswahl hatte ältere Bewerbende systematisch automatisch abgelehnt",["Es gab keinerlei behördliche Untersuchung dazu","Das Tool bevorzugte ausschließlich ältere Bewerbende","Der Fall betraf ausschließlich interne Softwaretests"],"Die EEOC erzielte 2023 eine Vergleichsvereinbarung, nachdem das Tool Bewerbungen älterer Personen automatisch abgelehnt hatte."),
    q("FAL04","faelle","Was haben die Fälle MyCity, DPD und iTutorGroup gemeinsam?","In allen Fällen fehlte eine ausreichende Prüfung/Freigabe, bevor das KI-System auf Menschen wirken konnte",["Alle drei Fälle betrafen ausschließlich interne Testumgebungen","In keinem der Fälle gab es öffentliche oder behördliche Reaktionen","Alle drei Systeme liefen komplett ohne jede Nutzerinteraktion"],"Alle drei zeigen: fehlende Eskalations- und Freigabewege vor dem produktiven Einsatz haben reale Folgen."),
    q("FAL05","faelle","Welche Lehre lässt sich aus dem DPD-Fall für die Freigabe von Chatbots ziehen?","Vor dem produktiven Einsatz gezielt versuchen, den Bot zu unerwünschtem Verhalten zu verleiten (Grenzfall-Tests)",["Chatbots benötigen grundsätzlich keine Tests vor dem Launch","Nur freundliche Testfragen sind vor dem Launch nötig","Der Fall zeigt, dass Kundenservice-Chatbots generell verboten werden sollten"],"Gezielte Grenzfall-Tests vor dem Launch hätten dieses Verhalten wahrscheinlich vorab aufgedeckt."),
    q("FAL06","faelle","Welche Lehre lässt sich aus dem iTutorGroup-Fall für den Einsatz von KI bei Personalentscheidungen ziehen?","Automatisierte Vorauswahl-Tools brauchen eine Freigabe- und Kontrollinstanz, die Diskriminierungsrisiken prüft",["KI-Tools bei Personalentscheidungen sind grundsätzlich diskriminierungsfrei","Automatisierte Tools benötigen keine menschliche Kontrolle","Der Fall betraf ausschließlich die IT-Infrastruktur, nicht die Entscheidungslogik"],"Ohne Kontrollinstanz kann ein automatisiertes Tool bestehende Diskriminierungsmuster unbemerkt fortschreiben."),

    q("PRA01","praxis","Was ist ein sinnvoller erster Schritt, bevor ein KI-gestütztes Tool kundenseitig live geht?","Gezielte Grenzfall-Tests durchführen und eine Freigabe durch die zuständige Stelle einholen",["Direkt live schalten und Feedback abwarten","Nur die Antwortgeschwindigkeit testen","Ausschließlich das Design der Oberfläche prüfen"],"Grenzfall-Tests und eine bewusste Freigabe reduzieren das Risiko unerwarteter, öffentlich sichtbarer Fehler."),
    q("PRA02","praxis","Was gehört zu einer klaren Eskalations- und Freigabestruktur im Unternehmen?","Klar benannte Zuständigkeiten, wer bei welcher Reichweite/welchem Thema entscheidet",["Jede Person entscheidet nach eigenem Ermessen","Eskalation ist ausschließlich für IT-Störungen vorgesehen","Freigaben werden nie dokumentiert"],"Klare Zuständigkeiten verhindern, dass wichtige Entscheidungen zufällig bei der falschen Person landen."),
    q("PRA03","praxis","Wie hängen die Module 4 (Datenschutz), 5 (Quellen) und 6 (Eskalation) zusammen?","Sie bilden zusammen eine vollständige Prüfkette: Daten, Fakten und Freigabe, bevor etwas veröffentlicht wird",["Sie behandeln exakt denselben Inhalt aus Modul 1 erneut","Modul 6 ersetzt die Inhalte aus Modul 4 und 5 vollständig","Die drei Module sind komplett unabhängig voneinander"],"Datenschutz, Quellenqualität und Freigabewege sind drei unterschiedliche, sich ergänzende Prüfdimensionen."),
    q("PRA04","praxis","Was ist die zentrale Botschaft von Modul 6 für den Arbeitsalltag?","Reichweite und Themensensibilität bewusst einschätzen, bevor ein KI-Ergebnis verwendet oder veröffentlicht wird",["Freigabeprozesse sind für den Alltag zu langsam und sollten übersprungen werden","Nur die IT-Abteilung muss sich um Freigaben kümmern","Freigabe ist ausschließlich bei sehr großen Unternehmen relevant"],"Die in diesem Modul gelernte Einschätzung soll genau diese bewusste Prüfung zur Routine machen."),
    q("PRA05","praxis","Was ist ein Warnsignal dafür, dass ein Fall eigentlich eskaliert werden sollte, aber nicht wird?","Die Person entscheidet allein über ein Thema mit hoher Reichweite oder Sensibilität, aus Zeitdruck oder Unsicherheit über den Prozess",["Die Person fragt eine zweite Person um Rat","Die Person dokumentiert die eigene Entscheidung","Die Person nutzt ein freigegebenes Tool für eine interne Notiz"],"Alleinige Entscheidung trotz hoher Reichweite oder Sensibilität ist genau das Muster, das in den drei realen Fällen zu Problemen führte.")
  ];

  const dynamicFactories=[
    ()=>{
      const samples=[
        {text:"Ein KI-Entwurf für eine private To-do-Liste.",route:"keine"},
        {text:"Eine interne Team-Übersicht ohne sensibles Thema.",route:"team_review"},
        {text:"Eine KI-Antwort zu einer Steuerfrage soll extern an eine Kundin gehen.",route:"vollfreigabe"}
      ];
      const s=samples[Math.floor(Math.random()*samples.length)];
      const labels={keine:"Keine formale Freigabe nötig",team_review:"Team-Review durch eine zweite Person",vollfreigabe:"Vollständige Freigabe durch die Fachstelle"};
      return q("D-ESC-"+s.text.length,"freigabe",`Welche Freigabestufe passt zu: "${s.text}"?`,labels[s.route],Object.entries(labels).filter(([k])=>k!==s.route).map(([,v])=>v),"Die Stufe richtet sich nach Reichweite (persönlich/intern/extern) und Themensensibilität.");
    },
    ()=>{
      const cases=[
        {who:"der Chatbot 'MyCity' der Stadt New York",what:"teils rechtswidrige Ratschläge an kleine Unternehmen (2024)"},
        {who:"der Kundenservice-Chatbot von DPD",what:"eine virale Entgleisung durch gezielte Nutzermanipulation (2024)"},
        {who:"ein KI-Vorauswahl-Tool bei iTutorGroup",what:"eine automatische Benachteiligung älterer Bewerbender (EEOC-Vergleich 2023)"}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("D-ESCCASE-"+c.who.length,"faelle",`Was ist die zentrale Lehre aus dem bekannt gewordenen Fall von ${c.who} (${c.what})?`,"Vor dem produktiven Einsatz braucht es Tests und eine bewusste Freigabe durch die zuständige Stelle",["Der Fall zeigt, dass KI-Tools grundsätzlich nie öffentlich eingesetzt werden sollten","Es gab dadurch keinerlei öffentliche oder behördliche Reaktion","Der Fall betraf ausschließlich interne, nie sichtbare Prozesse"],"Alle drei Fälle zeigen reale Folgen fehlender Prüfung und Freigabe vor dem produktiven Einsatz.");
    },
    ()=>{
      const n=[1,2,3][Math.floor(Math.random()*3)];
      return q("D-ESCN-"+n,"eskalation",`Ein KI-Ergebnis mit ${n} unsicheren Fakten soll extern verschickt werden. Was ist der sinnvollste nächste Schritt?`,"Die Unsicherheiten eskalieren und prüfen lassen, bevor es extern verschickt wird",["Es trotz Unsicherheit sofort verschicken","Die unsicheren Stellen einfach entfernen, ohne sie zu prüfen","Warten, bis sich das Problem von selbst löst"],"Unsicherheit bei externer Reichweite ist ein klares Signal für Eskalation vor dem Versand.");
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-06",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
