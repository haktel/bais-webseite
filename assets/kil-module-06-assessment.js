(()=> {
  const STORAGE={
    last:"bais-kil-m06-last",
    weak:"bais-kil-m06-weak",
    attempt:"bais-kil-m06-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KL601","change","Warum reicht 'die Technik funktioniert' allein nicht für einen erfolgreichen Rollout?","Ohne Akzeptanz der Betroffenen entstehen Schatten-Workarounds statt echter Nutzung",["Technik, die funktioniert, wird automatisch von allen akzeptiert","Change-Management ist nur bei fehlerhafter Technik nötig","Akzeptanz ist irrelevant, solange das System läuft"],"Funktionierende Technik ohne Akzeptanz der Betroffenen führt zu Umgehung statt Nutzung — Change-Management ist unabhängig von der technischen Qualität nötig."),
    q("KL602","kpi","Was ist der Vorteil eines Leading Indicators gegenüber einem Lagging Indicator?","Er zeigt Probleme früh, bevor sich das Geschäftsergebnis (Lagging) sichtbar verschlechtert",["Leading Indicators sind grundsätzlich genauer als Lagging Indicators","Lagging Indicators werden in der Praxis nie verwendet","Es gibt keinen praktischen Unterschied zwischen beiden"],"Leading Indicators liefern eine Frühwarnung; Lagging Indicators bestätigen den tatsächlichen, aber verspäteten Geschäftsnutzen — beide werden gemeinsam gebraucht."),
    q("KL603","vanity","Woran erkennt man laut Modul eine Vanity Metric?","Eine Verdopplung der Zahl sagt nicht automatisch etwas über mehr Geschäftsnutzen aus",["Sie ist immer eine besonders hohe absolute Zahl","Sie wird ausschließlich von der IT-Abteilung gemeldet","Vanity Metrics existieren im AI-Kontext praktisch nicht"],"Der Test ist: Sagt eine Verdopplung der Kennzahl automatisch mehr Geschäftsnutzen aus? Wenn nein, ist es eine Vanity Metric wie reine Nutzungszahlen ohne Qualitätsbezug."),
    q("KL604","review","Was ist ein zentraler Vorteil eines 90-Tage-Reviews nach Rollout?","Genug Zeit für echte Nutzungsdaten, aber noch früh genug, um leicht nachzusteuern",["90 Tage sind gesetzlich für jede AI-Initiative vorgeschrieben","Ein Review vor Ablauf eines Jahres liefert grundsätzlich keine verwertbaren Daten","Der Zeitraum ist willkürlich und ohne praktischen Nutzen"],"90 Tage balancieren zwei Ziele: genug echte Daten sammeln, aber früh genug reagieren können, falls etwas nicht wie geplant läuft."),
    q("KL605","mcdonalds","Was zeigt der McDonald's/IBM-Fall (2024) im Kontext von Modul 06 vor allem?","Ein sauberer, öffentlicher Stopp nach sichtbaren Qualitätsproblemen ist ein gutes Governance-Ergebnis, kein Scheitern",["Dass AI-Systeme in der Gastronomie grundsätzlich nicht einsetzbar sind","Dass McDonald's das System bis heute unverändert weiter betreibt","Dass IBM die alleinige Verantwortung für die Entscheidung trug"],"Die eigentliche Lehre ist: eine ehrliche, öffentliche Entscheidung zu treffen statt trotz sichtbarer Probleme stillschweigend weiterzumachen, ist genau das gewünschte Verhalten."),
    q("KL606","dauerhaft","Warum sollte auch eine erfolgreich gestartete Initiative weiter periodisch geprüft werden?","Veränderte Daten, Nutzung oder Umfeld können den ursprünglichen Nutzen später verringern",["Ein einmal erfolgreicher Rollout bleibt per Definition immer erfolgreich","Weitere Prüfung ist nur bei technischen Störungen notwendig","Regelmäßige Prüfung ist ausschließlich für gescheiterte Projekte relevant"],"Erfolg zu einem Zeitpunkt garantiert keinen dauerhaften Erfolg — verändertes Umfeld kann frühere Ergebnisse ungültig machen, daher bleibt periodische Prüfung nötig."),
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
