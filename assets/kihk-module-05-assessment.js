(()=> {
  const STORAGE={
    last:"bais-kihk-m05-last",
    weak:"bais-kihk-m05-weak",
    attempt:"bais-kihk-m05-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHK501","sorgfaltspflicht","Was gilt laut Modul für die fachliche Sorgfaltspflicht beim Einsatz von KI-Hilfsmitteln?","Sie bleibt unverändert bestehen, unabhängig vom genutzten Hilfsmittel",["Sie entfällt, sobald ein KI-System genutzt wird","Sie geht vollständig auf den Hersteller des Systems über","Sie gilt nur, wenn kein Hilfsmittel verwendet wird"],"Die Sorgfaltspflicht bezieht sich auf die getroffene Entscheidung und bleibt unabhängig von genutzten Hilfsmitteln bestehen."),
    q("KIHK502","dokumentation","Was sollte laut Modul dokumentiert werden, wenn ein KI-Hinweis in eine Entscheidung eingeflossen ist?","Welcher Hinweis vorlag, wie er bewertet wurde und welche Entscheidung daraus folgte",["Ausschließlich der Name des verwendeten KI-Systems","Nur das Ergebnis, ohne den Bewertungsschritt","Gar nichts, da dies keinen Mehrwert bietet"],"Hinweis, Bewertung und Entscheidung nachvollziehbar zu dokumentieren macht den eigenen Sorgfaltsprozess sichtbar."),
    q("KIHK503","abgrenzung","Trägt ein KI-System laut Modul Fachverantwortung, wenn es offiziell freigegeben wurde?","Nein, auch ein freigegebenes System trägt keine Fachverantwortung",["Ja, ab der offiziellen Freigabe durch die Einrichtung","Ja, sofern die Konfidenzwerte hoch genug sind","Ja, aber nur für administrative Aufgaben"],"Die Freigabe eines Tools betrifft dessen Eignung, nicht die persönliche fachliche Verantwortung der Person, die es nutzt."),
    q("KIHK504","werkzeug","Wie wird ein KI-System laut Modul im Verhältnis zur Sorgfaltspflicht eingeordnet?","Als Hilfsmittel zur Vorbereitung, das die eigentliche Verantwortung nicht übernimmt",["Als gleichwertiger Entscheidungsträger neben der Fachperson","Als Ersatz für die fachliche Qualifikation","Als Instanz, die im Streitfall allein verantwortlich gemacht werden kann"],"Ein KI-System bleibt Hilfsmittel; die Verantwortung für die Entscheidung bleibt bei der Fachperson."),
    q("KIHK505","nachvollziehbarkeit","Wofür ist eine nachvollziehbare Dokumentation des Umgangs mit einem KI-Hinweis laut Modul hilfreich?","Um zu zeigen, dass der Hinweis eigenständig fachlich geprüft und nicht unreflektiert übernommen wurde",["Um die Nutzung des KI-Systems technisch zu protokollieren","Um die Verantwortung formal auf das KI-System zu übertragen","Um die Dokumentationspflicht insgesamt zu verkürzen"],"Die Dokumentation macht die eigenständige fachliche Prüfung sichtbar und nachvollziehbar."),
    q("KIHK506","freigabe","Was ändert die organisatorische Freigabe eines KI-Systems durch eine Einrichtung laut Modul nicht?","Die persönliche fachliche Sorgfaltspflicht der einzelnen Fachperson",["Die technische Verfügbarkeit des Systems im Alltag","Die Zuständigkeit der IT-Abteilung für den Betrieb","Die Kostenverantwortung der Einrichtung"],"Eine Tool-Freigabe regelt organisatorische Eignung, nicht die persönliche Sorgfaltspflicht bei der Nutzung."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-05",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
