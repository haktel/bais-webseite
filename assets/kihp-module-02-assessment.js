(()=> {
  const STORAGE={
    last:"bais-kihp-m02-last",
    weak:"bais-kihp-m02-weak",
    attempt:"bais-kihp-m02-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHP201","vereinfachen","Was ist beim Vereinfachen eines Aufklärungstextes mit KI erlaubt?","Die Sprache zu vereinfachen, ohne neue medizinische Inhalte hinzuzufügen",["Fehlende medizinische Details selbstständig zu ergänzen","Eine neue Handlungsempfehlung einzufügen","Den Text ohne erneute fachliche Prüfung direkt weiterzugeben"],"Vereinfachen darf die Sprache ändern, aber niemals medizinischen Inhalt hinzufügen oder verändern."),
    q("KIHP202","uebersetzung","Was sollte laut Modul vor der Weitergabe einer übersetzten Patienteninformation geschehen?","Eine Prüfung der übersetzten Fassung gegen das Original",["Nichts, da Übersetzung als risikofrei gilt","Nur eine Rechtschreibprüfung ist notwendig","Die Freigabe kann vollständig automatisiert erfolgen"],"Eine flüssig wirkende Übersetzung ist kein Beleg für inhaltliche Richtigkeit — der Abgleich mit dem Original bleibt notwendig."),
    q("KIHP203","komplexitaet","Was empfiehlt das Modul bei einem komplexen oder kritischen mehrsprachigen Sachverhalt?","Eine qualifizierte Übersetzung oder Dolmetschung statt eines reinen KI-Entwurfs einzuholen",["Grundsätzlich auf jede Übersetzung zu verzichten","Den KI-Entwurf ungeprüft zu verwenden, wenn er lang genug ist","Die Patientin oder den Patienten selbst übersetzen zu lassen"],"Bei komplexen oder kritischen Inhalten reicht ein reiner KI-Entwurf nicht aus; qualifizierte Übersetzung ist vorzuziehen."),
    q("KIHP204","gespraech","Wer führt laut Modul das persönliche Gespräch in emotional belastenden Situationen, etwa bei schweren Diagnosen?","Die zuständige Fachperson, nicht die KI",["Die KI, sofern das Gespräch vorbereitet wurde","Eine beliebige verfügbare Person im Team","Ein automatisiertes Sprachsystem"],"KI darf Gesprächspunkte vorbereiten, das eigentliche Gespräch mit Zuwendung und spontaner Reaktion bleibt beim Menschen."),
    q("KIHP205","vorbereitung","Wofür darf KI laut Modul bei Gesprächen mit Patientinnen und Patienten genutzt werden?","Zur Vorbereitung von Gesprächspunkten und verständlichen Formulierungen",["Zur eigenständigen Durchführung schwieriger Gespräche","Zur endgültigen Entscheidung über den Gesprächsinhalt ohne Fachperson","Zum Ersatz der Reaktion auf die Patientin oder den Patienten im Gespräch"],"KI unterstützt die Vorbereitung; die Durchführung des Gesprächs bleibt zwischenmenschlich."),
    q("KIHP206","grenze","Wann ist beim Vereinfachen eines Textes laut Modul die Grenze überschritten?","Sobald ein neuer Fakt oder eine veränderte Handlungsempfehlung entsteht",["Sobald ein Fachbegriff erklärt wird","Sobald ein Satz gekürzt wird","Sobald die Lesbarkeit verbessert wird"],"Erklären und kürzen ist erlaubt, sobald aber neue Fakten oder veränderte Empfehlungen entstehen, ist die Grenze überschritten."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-02",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
