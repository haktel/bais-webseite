(()=> {
  const STORAGE={
    last:"bais-eua-m02-last",
    weak:"bais-eua-m02-weak",
    attempt:"bais-eua-m02-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("EU201","rollenkette","Welche Rolle bringt ein AI-System eines Nicht-EU-Providers erstmals auf den EU-Markt?","Der Importeur",["Der Bevollmächtigte","Der Händler","Der Deployer"],"Der Importeur ist speziell für das erstmalige Inverkehrbringen eines Systems aus einem Drittstaat auf dem EU-Markt zuständig."),
    q("EU202","rollenwechsel","Wann kann ein Deployer selbst zum Provider eines AI-Systems werden?","Wenn er das System durch eine wesentliche Änderung so umgestaltet, dass sich sein ursprünglicher Zweck grundlegend ändert",["Sobald er es länger als ein Jahr nutzt","Sobald mehr als 50 Mitarbeitende damit arbeiten","Niemals — die Rolle eines Deployers kann sich per Definition nicht ändern"],"Eine wesentliche Zweckänderung kann die Provider-Pflichten für das veränderte System auf den ursprünglichen Deployer verlagern."),
    q("EU203","gpai","Warum haben General-Purpose-AI-Modelle ein eigenes Pflichtenkapitel statt einer festen Risikostufe?","Weil sie für unzählige, dem Hersteller unbekannte Zwecke weiterverwendet werden und sich nicht sinnvoll vorab einer Stufe zuordnen lassen",["Weil GPAI-Modelle grundsätzlich vom AI Act ausgenommen sind","Weil GPAI-Modelle automatisch als minimales Risiko gelten","Weil GPAI-Modelle immer als verbotene Praktik gelten"],"Foundation Models werden vielseitig weiterverwendet, deshalb regelt der AI Act sie über ein eigenes GPAI-Kapitel statt über die vier Risikostufen."),
    q("EU204","pflichten","Welche Pflicht liegt typischerweise beim Deployer eines Hochrisiko-Systems, nicht beim Provider?","Wirksame menschliche Aufsicht im konkreten Einsatz organisieren",["Die technische Dokumentation vor Markteinführung erstellen","Die Konformitätsbewertung vor Markteinführung durchführen","Das System entwickeln und testen"],"Dokumentation und Konformitätsbewertung liegen vor Markteinführung beim Provider; die Aufsicht im laufenden Einsatz liegt beim Deployer."),
    q("EU205","praxisbeispiel","Was zeigte der Fall des internen Amazon-Recruiting-Tools besonders deutlich?","Dass ein Unternehmen gleichzeitig Provider und Deployer desselben Systems sein kann und trotzdem beide Rollenpflichten treffen",["Dass interne AI-Tools grundsätzlich vom AI Act ausgenommen sind","Dass Bias nur bei extern eingekauften Tools auftreten kann","Dass Recruiting-Tools nie als Hochrisiko gelten"],"Amazon entwickelte und nutzte das Tool selbst — ein Lehrbuchbeispiel dafür, dass Provider- und Deployer-Rolle in einer Organisation zusammenfallen können."),
    q("EU206","selbsteinordnung","Welche Frage hilft am meisten, die eigene Rolle zu einem AI-Tool zu klären?","Haben wir das System entwickelt oder wesentlich verändert, oder nur eingekauft und in eigener Verantwortung eingesetzt?",["Wie teuer war die Lizenz des Tools?","Wie viele Mitarbeitende kennen den Markennamen des Tools?","Ist das Tool in Deutschland oder im Ausland gehostet?"],"Die Rollenfrage hängt an Entwicklung/Veränderung versus Einsatz in eigener Verantwortung — nicht an Kosten oder Hosting-Standort."),
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
