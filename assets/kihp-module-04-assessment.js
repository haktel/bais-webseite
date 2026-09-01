(()=> {
  const STORAGE={
    last:"bais-kihp-m04-last",
    weak:"bais-kihp-m04-weak",
    attempt:"bais-kihp-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHP401","rechtsrahmen","Welche zwei Schutzebenen gelten laut Modul gleichzeitig für Bewohner- und Patientendaten?","Die berufliche Schweigepflicht und der besondere Schutz nach Art. 9 DSGVO",["Nur die Hausordnung der Einrichtung","Nur eine freiwillige interne Vereinbarung","Nur die Regeln des jeweiligen KI-Anbieters"],"Schweigepflicht und Art. 9 DSGVO gelten unabhängig vom verwendeten Werkzeug gemeinsam für diese Daten."),
    q("KIHP402","toolwahl","Was gilt laut Modul für echte, identifizierbare Bewohner- oder Patientendaten?","Sie gehören nur in ein von der Einrichtung freigegebenes System",["Sie dürfen in jedes gut bewertete öffentliche KI-Tool eingegeben werden","Sie dürfen nur mündlich weitergegeben werden","Sie unterliegen keinen besonderen Anforderungen an das Tool"],"Öffentliche, nicht freigegebene Tools sind für echte Bewohner- oder Patientendaten in aller Regel nicht geeignet."),
    q("KIHP403","risikoquelle","Was ist laut Modul die häufigste Ursache für Datenschutzvorfälle im KI-Kontext?","Die einfache Eingabe echter Daten in ein nicht dafür vorgesehenes, öffentliches Tool",["Komplexe, gezielte Cyberangriffe auf KI-Anbieter","Fehler in der KI-Modellarchitektur selbst","Zu lange Wartezeiten bei der Dateneingabe"],"Die meisten Vorfälle entstehen durch die Eingabe echter Daten in ungeeignete Tools, nicht durch komplexe Angriffe."),
    q("KIHP404","minimierung","Was bedeutet Datensparsamkeit im Umgang mit KI-Tools laut diesem Modul?","Nur so viele Daten einzugeben, wie für die konkrete Aufgabe tatsächlich nötig sind",["Grundsätzlich alle verfügbaren Daten einzugeben, um bessere Ergebnisse zu erhalten","Daten nur einmal jährlich zu verarbeiten","Auf jede Dokumentation vollständig zu verzichten"],"Datensparsamkeit bedeutet, nur die für die Aufgabe notwendigen Daten zu verwenden und identifizierende Angaben wegzulassen, wenn sie nicht gebraucht werden."),
    q("KIHP405","unsicherheit","Was sollte laut Modul geschehen, wenn unklar ist, ob ein Tool für Bewohner- oder Patientendaten freigegeben ist?","Vor der Nutzung bei der zuständigen Stelle in der Einrichtung nachfragen",["Das Tool einfach ausprobieren und die Ergebnisse bewerten","Die Daten sicherheitshalber doppelt eingeben","Die Entscheidung der KI selbst überlassen"],"Im Zweifel gilt: vor der Nutzung klären, statt eigenmächtig zu entscheiden."),
    q("KIHP406","beispiel","Welches Beispiel für Datensparsamkeit nennt das Modul?","Einen Übungsfall ohne echten Namen und ohne Zimmer- oder Wohnbereichsnummer zu formulieren, wenn nur eine allgemeine Formulierungshilfe benötigt wird",["Immer den vollständigen echten Namen zu verwenden","Datensparsamkeit ist laut Modul in der Praxis nicht umsetzbar","Nur die Einrichtungsleitung darf über Datensparsamkeit entscheiden"],"Wenn eine Aufgabe keine echten Identifikationsdaten erfordert, sollten diese testweise weggelassen werden."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-04",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
