(()=> {
  const STORAGE={
    last:"bais-kil-m03-last",
    weak:"bais-kil-m03-weak",
    attempt:"bais-kil-m03-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KL301","rollen","Warum reicht \"die IT macht das schon\" als Rollenklärung nicht aus?","IT verantwortet typischerweise Infrastruktur/Sicherheit, nicht Geschäftsnutzen oder Risikoeinstufung",["Weil IT-Abteilungen grundsätzlich kein technisches Fachwissen zu AI haben","Weil gesetzlich vorgeschrieben ist, dass nur die Geschäftsführung IT-Themen entscheiden darf","Es reicht tatsächlich aus, jede andere Rollenklärung ist unnötiger Overhead"],"IT hat weder das Mandat noch die fachliche Perspektive, um Geschäftsnutzen oder rechtliches Risiko allein zu bewerten — dafür braucht es explizit benannte weitere Rollen."),
    q("KL302","rollen","Welche der fünf Kernrollen verantwortet die Datenqualität und Zugriffsrechte auf Kontextdaten?","Data Steward",["AI/Product Owner","End-User Champion","Security"],"Der Data Steward ist die Rolle, die spezifisch für Datenqualität, Herkunft und Zugriffsrechte zuständig ist."),
    q("KL303","betriebsmodell","Was ist ein typisches Risiko eines rein zentralen Betriebsmodells (Center of Excellence)?","Es kann zum Flaschenhals werden und den Bezug zur fachlichen Praxis verlieren",["Es führt zwangsläufig zu doppelter Arbeit in den Fachbereichen","Es ist in jedem Fall günstiger als ein föderiertes Modell","Es kann keine konsistenten Standards etablieren"],"Zentrale Modelle liefern Konsistenz, laufen aber Gefahr, zum Engpass zu werden und die Nähe zum Fachproblem zu verlieren — der Trade-off zum föderierten Modell."),
    q("KL304","raci","Was bedeutet 'Accountable' in einer RACI-Matrix im Unterschied zu 'Responsible'?","Accountable trägt die letzte Verantwortung für das Ergebnis, Responsible führt die Arbeit aus",["Beide Begriffe bedeuten exakt dasselbe","Accountable wird nur informiert, ohne Einfluss auf die Entscheidung","Responsible ist immer die Geschäftsführung"],"Responsible = wer die Arbeit tatsächlich ausführt; Accountable = wer am Ende für das Ergebnis geradesteht — diese Unterscheidung verhindert Verantwortungsdiffusion."),
    q("KL305","reife","Ab wann wird laut Faustregel ein zentrales Center of Excellence typischerweise sinnvoll?","Ab etwa 3-5 parallelen, unterschiedlichen AI-Initiativen",["Erst wenn mehr als 100 Initiativen gleichzeitig laufen","Sofort ab der allerersten Initiative, ohne Ausnahme","Nie — föderierte Modelle sind immer überlegen"],"Bei wenigen Initiativen ist ein zentrales Team oft Overhead; ab 3-5 parallelen, unterschiedlichen Initiativen wird fehlende Koordination spürbar."),
    q("KL306","eskalation","Welches Element gehört laut BAIS-Muster zwingend zu einem funktionierenden Eskalationspfad?","Eine maximale Bearbeitungszeit je Ebene und eine Pflicht zur schriftlichen Begründung der Entscheidung",["Die Entscheidung darf niemals dokumentiert werden, um Flexibilität zu erhalten","Jede Eskalation muss automatisch bis zur Geschäftsführung gehen, unabhängig vom Thema","Eskalationspfade sind nur in sehr großen Konzernen sinnvoll"],"Ohne Zeitlimit und Begründungspflicht drohen endlose Diskussionen ohne Ergebnis oder unkontrollierte Eskalation."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-03",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
