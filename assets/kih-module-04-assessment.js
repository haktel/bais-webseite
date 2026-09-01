(()=> {
  const STORAGE={
    last:"bais-kih-m04-last",
    weak:"bais-kih-m04-weak",
    attempt:"bais-kih-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIH401","rolle","Welche Rolle darf KI laut Modul bei klinischen Entscheidungen einnehmen?","Sie darf Literatur, Leitlinien oder ähnliche Fälle strukturiert als Hinweis aufbereiten",["Sie darf eine verbindliche Diagnose stellen, wenn genug Daten vorliegen","Sie darf Therapieentscheidungen bei unklaren Fällen automatisch treffen","Sie ersetzt die fachliche Bewertung bei Zeitdruck"],"KI darf informieren und Hinweise geben, aber niemals selbst die klinische Entscheidung treffen."),
    q("KIH402","konfidenz","Warum ist eine selbstbewusst formulierte KI-Aussage kein Qualitätsbeweis?","Weil Sprachmodelle falsche und richtige Aussagen oft im gleichen sicheren Tonfall formulieren",["Weil KI-Aussagen grundsätzlich immer falsch sind","Weil nur unsicher formulierte Aussagen geprüft werden müssen","Weil Konfidenzwerte gesetzlich vorgeschrieben sind"],"Der Tonfall einer KI-Ausgabe sagt nichts über ihre inhaltliche Richtigkeit aus — deshalb ist unabhängige fachliche Prüfung nötig."),
    q("KIH403","eskalation","Was ist laut Modul der richtige nächste Schritt bei einem unsicheren KI-Hinweis?","Rücksprache mit einer verantwortlichen Fachperson über den bekannten Eskalationsweg",["Den Hinweis ohne weitere Prüfung übernehmen","Den Hinweis vollständig ignorieren","Die Entscheidung der KI selbst überlassen, bis mehr Daten vorliegen"],"Eskalation an eine verantwortliche Fachperson ist der vorgesehene und sichere Weg bei Unsicherheit."),
    q("KIH404","grenze","Wann ist laut Modul die Grenze zwischen Hinweis und unzulässiger Entscheidung überschritten?","Sobald aus einem allgemeinen Hinweis eine konkrete Diagnose- oder Therapieaussage für eine reale Person wird",["Sobald die KI mehr als einen Satz ausgibt","Sobald ein Hinweis auf Fachliteratur verweist","Sobald mehr als eine Fachperson beteiligt ist"],"Ein allgemeiner Hinweis darf informieren; sobald daraus eine konkrete Entscheidung für eine reale Person wird, ist die Grenze überschritten."),
    q("KIH405","verantwortung","Wer bewertet laut Modul letztlich einen KI-Hinweis und trifft die Entscheidung?","Immer die verantwortliche Fachperson",["Die KI selbst, wenn die Konfidenz hoch ist","Die IT-Abteilung der Einrichtung","Der Hersteller des KI-Tools"],"Die Bewertung von Hinweisen und die eigentliche Entscheidung bleiben durchgehend Aufgabe der verantwortlichen Fachperson."),
    q("KIH406","kultur","Wie sollte Eskalation bei unsicheren KI-Hinweisen laut Modul verstanden werden?","Als vorgesehener, sicherer Weg — nicht als Fehler oder Zeichen von Unsicherheit",["Als letztes Mittel, das möglichst vermieden werden sollte","Als Zeichen mangelnder Kompetenz der Fachperson","Als optionaler Schritt, der meist übersprungen werden kann"],"Eskalation ist der vorgesehene, sichere Weg bei Unsicherheit und sollte aktiv genutzt werden."),
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
