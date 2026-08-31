(()=> {
  const STORAGE={
    last:"bais-kil-m05-last",
    weak:"bais-kil-m05-weak",
    attempt:"bais-kil-m05-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KL501","purgatory","Was ist die häufigste organisatorische Ursache für 'Pilot-Purgatory'?","Es fehlt eine explizite Stop/Go-Entscheidung nach dem Piloten, also läuft er einfach weiter",["Piloten sind technisch grundsätzlich unmöglich zu skalieren","Budget ist in jedem Fall der einzige limitierende Faktor","Unternehmen starten grundsätzlich zu wenige Piloten"],"Einen Piloten zu starten ist einfach; ihn offiziell zu stoppen oder zu skalieren braucht eine explizite Entscheidung — fehlt sie, bleibt der Status quo."),
    q("KL502","kapazität","Welche Ressource wird laut Modul bei der Skalierung am häufigsten übersehen?","Die Aufmerksamkeit der Fachbereichsleitung, die von denselben wenigen Personen geteilt wird",["Das Budget, das fast immer der eigentliche Engpass ist","Bürofläche für zusätzliche Mitarbeitende","Die Anzahl verfügbarer Laptops im Unternehmen"],"Budget wird meist realistisch geplant, aber die begrenzte Aufmerksamkeit derselben Schlüsselpersonen für mehrere Initiativen wird oft übersehen."),
    q("KL503","abhängigkeiten","Warum lohnt sich eine Abhängigkeitsmatrix zwischen AI-Initiativen?","Sie deckt auf, wenn zwei Initiativen dieselbe Datenaufbereitung oder Infrastruktur benötigen",["Sie ersetzt vollständig die Notwendigkeit eines Scoring-Modells","Sie ist nur für Initiativen mit identischem Budget relevant","Sie zeigt ausschließlich rechtliche Risiken, keine organisatorischen"],"Scheinbar unabhängige Initiativen teilen sich oft Datenquellen, Personen oder Infrastruktur — eine Matrix macht das sichtbar und ermöglicht Bündelung."),
    q("KL504","review","Was unterscheidet einen echten Portfolio-Review von einem reinen Statusbericht?","Jede Initiative bekommt eine explizite Entscheidung: skalieren, anpassen oder stoppen",["Ein Review dient nur der Information, ohne Konsequenzen","Ein Statusbericht enthält immer mehr Details als ein Review","Beide Begriffe beschreiben exakt denselben Vorgang"],"Ohne die Möglichkeit und Pflicht, explizit zu entscheiden, bleibt ein Review reine Formsache — genau das befeuert Pilot-Purgatory."),
    q("KL505","studie","Was war laut der RAND-Studie 2024 eine der häufigsten Hauptursachen für gescheiterte AI-Projekte?","Unklare Geschäftsziele und fehlende Priorisierung, nicht in erster Linie mangelnde Modellqualität",["Ausschließlich zu geringe Rechenleistung der eingesetzten Modelle","Die Studie fand keine nennenswerten Scheiternsursachen","Zu hohe Erfolgsquote, die Erwartungen unrealistisch machte"],"Die RAND-Untersuchung nannte unklare Ziele, Datenqualität und fehlende Priorisierung als Hauptursachen — nicht primär die Modelltechnik."),
    q("KL506","anpassung","Wann sollte eine bestehende Priorisierung laut Modul neu bewertet werden?","Wenn sich externe Faktoren wie Regulierung, verfügbare Tools oder Marktumfeld wesentlich ändern",["Nie — eine einmal getroffene Priorisierung sollte unverändert bleiben","Nur alle fünf Jahre, unabhängig vom Marktgeschehen","Ausschließlich wenn ein neuer Mitarbeitender eingestellt wird"],"Priorisierung ist eine Momentaufnahme; wesentliche externe Veränderungen können sie ungültig machen und erfordern eine Neubewertung."),
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
