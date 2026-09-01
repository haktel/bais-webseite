(()=> {
  const STORAGE={
    last:"bais-kihk-m04-last",
    weak:"bais-kihk-m04-weak",
    attempt:"bais-kihk-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHK401","kontext","Was verbessert laut Modul die Qualität eines KI-Entwurfs für einen Arztbrief am meisten?","Ausreichender Kontext: vorliegende Befunde, Verlauf, Zweck und Empfängerkreis",["Ein möglichst kurzer, kontextfreier Prompt","Das bewusste Weglassen des Empfängerkreises","Eine zufällig gewählte Formulierung ohne Bezug zum Fall"],"Ohne ausreichenden Kontext ergänzt die KI Lücken mit Vermutungen — klare Angaben verhindern das."),
    q("KIHK402","vollstaendigkeit","Warum gelten Auslassungen laut Modul als unterschätzte Fehlerquelle bei Arztbrief-Entwürfen?","Weil eine fehlende Angabe oft erst später auffällt als ein offensichtlich falscher Wert",["Weil Auslassungen in KI-Entwürfen technisch unmöglich sind","Weil jede Auslassung automatisch markiert wird","Weil Auslassungen keinen Einfluss auf die Behandlung haben können"],"Ein sichtbarer Fehler fällt meist sofort auf; eine stillschweigende Auslassung wird leicht übersehen."),
    q("KIHK403","pruefung","Welche Prüffrage gehört laut Modul zum empfohlenen Check vor der Übernahme eines Arztbrief-Entwurfs?","Stimmen alle genannten Befunde und Werte mit den Originalunterlagen überein?",["Wie viele Wörter enthält der Entwurf insgesamt?","Welches KI-Modell wurde für den Entwurf verwendet?","Wie schnell wurde der Entwurf erstellt?"],"Die inhaltliche Übereinstimmung mit den Originalunterlagen ist die zentrale Prüffrage, nicht Länge, Modellwahl oder Geschwindigkeit."),
    q("KIHK404","freigabe","Wann wird laut Modul aus einem KI-Entwurf ein verbindliches Dokument?","Erst durch die fachliche Freigabe der verantwortlichen Person",["Sobald der Entwurf vollständig und fehlerfrei aussieht","Sobald die KI eine hohe Konfidenz meldet","Automatisch nach einer festgelegten Wartezeit"],"Ein Entwurf bleibt ein Entwurf, bis eine verantwortliche Fachperson ihn geprüft und freigegeben hat."),
    q("KIHK405","empfaenger","Was sollte laut Modul bei einem Arztbrief-Entwurf an den Empfänger angepasst werden?","Ton und Detailtiefe des Textes",["Die zugrunde liegenden Befunde selbst","Die Reihenfolge der tatsächlichen Behandlungsschritte","Die fachliche Verantwortung für den Inhalt"],"Ton und Detailtiefe dürfen an den Empfänger angepasst werden, die fachlichen Inhalte und die Verantwortung bleiben unverändert."),
    q("KIHK406","grundregel","Welche Grundregel gilt laut Modul für fehlende Angaben in einem Arztbrief-Prompt?","Fehlende Angaben bleiben offen und werden von der Fachperson ergänzt, statt sie erfinden zu lassen",["Die KI soll plausible Werte selbst ergänzen","Fehlende Angaben können ohne Kennzeichnung bleiben","Die KI kennzeichnet fehlende Angaben automatisch als unkritisch"],"Erfundene Angaben sind eines der größten Risiken bei KI-Entwürfen — Lücken bleiben sichtbar und werden von Menschen geschlossen."),
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
