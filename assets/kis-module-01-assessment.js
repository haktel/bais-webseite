(()=> {
  const STORAGE={
    last:"bais-kis-m01-last",
    weak:"bais-kis-m01-weak",
    attempt:"bais-kis-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KS101","architektur","Woher bezieht ein Sprachmodell das, was es in einer Antwort verwendet?","Aus statischen Trainingsdaten und dem aktuellen Kontextfenster (Prompt, Dokumente, Tool-Ergebnisse)",["Es greift live auf beliebige externe Datenbanken zu, wie eine Suchmaschine","Es hat grundsätzlich Zugriff auf alle Dateien des Nutzer-Rechners","Es 'weiß' nur, was der Hersteller nachträglich manuell eingibt"],"Ein Modell hat keinen klassischen Datenbank-Zugriff — es nutzt Trainingsdaten und alles, was aktuell im Kontextfenster steht."),
    q("KS102","datenfluss","An welchem der drei genannten Punkte überschritt der Samsung-Vorfall die Vertrauensgrenze?","Am Eingabepunkt (Prompt) — vertraulicher Code wurde ins öffentliche Chat-Interface eingegeben",["Ausschließlich bei der Modell-Verarbeitung selbst, unabhängig von der Eingabe","Nur beim Tool-Aufruf am Ende der Ausgabe","Der Fall betraf keinen der drei Datenfluss-Punkte"],"Die Daten verließen die Vertrauensgrenze bereits am Eingabepunkt, als sie ins öffentliche Interface eingegeben wurden."),
    q("KS103","betriebsmodell","Was bedeutet 'self-hosted' in Bezug auf Sicherheit korrekt?","Volle Kontrolle über die Daten, aber auch volle eigene Verantwortung für Patches und Absicherung",["Automatisch vollständige Sicherheit ohne weiteren Aufwand","Es ist rechtlich identisch mit einem Consumer-SaaS-Zugang","Self-hosted-Modelle können prinzipiell nicht kompromittiert werden"],"Self-hosted verschiebt die Verantwortung vollständig zum Betreiber — es ist keine automatische Sicherheitsgarantie, sondern eine andere Verantwortungsverteilung."),
    q("KS104","rag","Welche zusätzliche Sicherheitsfrage entsteht speziell durch eine RAG-Architektur?","Ob die Dokumentensuche bestehende Zugriffsrechte respektiert oder sie umgeht",["RAG-Systeme haben grundsätzlich keine zusätzlichen Sicherheitsfragen","RAG betrifft ausschließlich die Trainingsdaten des Basismodells","RAG macht ein System automatisch sicherer als ohne Retrieval"],"RAG holt bei jeder Anfrage Dokumente aus einem Index — ohne korrekte Zugriffsrechteprüfung könnte ein Nutzer so Dokumente 'sehen', auf die er eigentlich keinen Zugriff hat."),
    q("KS105","samsung","Was war die unternehmensseitige Konsequenz aus dem Samsung-Vorfall?","Internes Verbot der Nutzung öffentlicher generativer KI-Tools auf Firmengeräten",["Samsung stellte daraufhin komplett die Entwicklung eigener Chips ein","Es gab keinerlei interne Reaktion oder Konsequenz","Samsung verklagte den KI-Anbieter erfolgreich auf Schadenersatz"],"Samsung untersagte intern die Nutzung öffentlicher generativer KI-Tools auf Firmengeräten als direkte Reaktion."),
    q("KS106","vertrauensgrenze","Wozu dient das Zeichnen einer Vertrauensgrenze für ein reales AI-System?","Es macht sichtbar, was implizit als 'intern' vs. 'extern' angenommen wird, und deckt blinde Flecken auf",["Es ist eine reine Formalität ohne praktischen Nutzen","Es ersetzt vollständig die Notwendigkeit technischer Kontrollen","Es ist nur für Systeme mit RAG-Architektur relevant"],"Ein Team, das die Grenze nicht zeichnen kann, hat wahrscheinlich auch keine gemeinsame, geprüfte Vorstellung davon, wo Daten tatsächlich hinfließen."),
  ];

  const shuffle=array=>{
    const copy=[...array];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  };

  const weak=()=>JSON.parse(localStorage.getItem(STORAGE.weak)||"{}");
  const saveWeak=value=>localStorage.setItem(STORAGE.weak,JSON.stringify(value));

  function selectQuestions(count=6){
    const previous=new Set(JSON.parse(localStorage.getItem(STORAGE.last)||"[]"));
    const weakness=weak();
    const pool=[...BANK];
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
      questions=selectQuestions(6);answered=0;correctCount=0;
      const attempt=Number(localStorage.getItem(STORAGE.attempt)||0)+1;
      localStorage.setItem(STORAGE.attempt,String(attempt));
      counter.textContent=`Versuch ${attempt} · 6 Fragen aus einem rotierenden Pool`;
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
