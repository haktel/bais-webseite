(()=> {
  const STORAGE={
    last:"bais-kis-m06-last",
    weak:"bais-kis-m06-weak",
    attempt:"bais-kis-m06-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KS601","grundlage","Was unterscheidet einen 'Incident' von einem bloßen 'Alarm'?","Ein Incident ist ein durch menschliche Prüfung bestätigtes tatsächliches Problem, ein Alarm nur ein Hinweis",["Beide Begriffe bedeuten exakt dasselbe","Ein Alarm ist immer schwerwiegender als ein Incident","Ein Incident entsteht ausschließlich ohne vorherigen Alarm"],"Ein Alarm muss erst geprüft werden; erst nach Bestätigung wird daraus ein Incident — diese Unterscheidung verhindert sowohl Überreaktion als auch Verharmlosung."),
    q("KS602","ablauf","Welche Phase kommt im 5-Phasen-Incident-Response-Ablauf nach 'Eindämmen'?","Untersuchen (Ursache und Umfang klären)",["Sofortiges vollständiges Löschen aller Logs","Direkt Nachbereiten, ohne vorherige Untersuchung","Erneutes Erkennen desselben Alarms"],"Nach der Eindämmung folgt die Untersuchung der Ursache und des Umfangs, bevor dauerhaft behoben werden kann."),
    q("KS603","kommunikation","Innerhalb welcher Frist muss ein meldepflichtiger Datenschutzvorfall laut DSGVO grundsätzlich an die Aufsichtsbehörde gemeldet werden?","Binnen 72 Stunden nach Bekanntwerden",["Es gibt keine gesetzliche Frist, Unternehmen entscheiden frei","Binnen 30 Tagen nach vollständigem Abschluss der Untersuchung","Nur wenn die Presse bereits berichtet hat"],"Die DSGVO sieht grundsätzlich eine 72-Stunden-Frist zur Meldung an die zuständige Aufsichtsbehörde vor."),
    q("KS604","amazon","Wie reagierte Amazon, nachdem Bias im internen Recruiting-AI-Tool erkannt wurde?","Das Tool wurde für Einstellungsentscheidungen eingestellt, statt nur oberflächlich angepasst",["Das Tool wurde unverändert weiter für alle Einstellungen genutzt","Amazon bestritt öffentlich jede Form von Verzerrung im System","Es wurden lediglich die betroffenen Begriffe aus Lebensläufen entfernt, ohne Ursachenanalyse"],"Amazon identifizierte historische Trainingsdaten als Ursache und beendete die Nutzung des Tools für Entscheidungen — ein Beispiel für dauerhafte statt oberflächlicher Behebung."),
    q("KS605","nachbereitung","Woran erkennt man laut Modul ein wirksames Lessons-Learned-Dokument?","Es enthält mindestens eine konkrete, terminierte Maßnahme, nicht nur eine Beschreibung des Vorfalls",["Es ist besonders lang und detailliert formuliert","Es wird ausschließlich der Geschäftsführung vorgelegt, ohne weitere Verteilung","Es beschreibt den Vorfall, ohne eine Maßnahme festzulegen"],"Ohne konkrete, terminierte Maßnahme bleibt ein Lessons-Learned-Dokument reine Dokumentation ohne strukturelle Wirkung."),
    q("KS606","übung","Was ist der Zweck einer Tabletop-Übung im Incident-Response-Kontext?","Ein fiktives Szenario durchzuspielen, um Lücken im echten Prozess zu finden, bevor ein echter Vorfall eintritt",["Ein echtes System absichtlich anzugreifen und zu beschädigen","Sie ersetzt vollständig die Notwendigkeit eines dokumentierten Ablaufs","Tabletop-Übungen sind nur für sehr große Konzerne sinnvoll"],"Eine Tabletop-Übung simuliert einen Vorfall ohne reales Risiko und deckt so Schwächen im Prozess auf, bevor sie im Ernstfall teuer werden."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-06",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
