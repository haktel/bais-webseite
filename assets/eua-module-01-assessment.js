(()=> {
  const STORAGE={
    last:"bais-eua-m01-last",
    weak:"bais-eua-m01-weak",
    attempt:"bais-eua-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("EU101","rationale","Warum hat die EU den AI Act überhaupt eingeführt?","Weil automatisierte Systeme ohne ausreichende Kontrolle in realen Fällen bereits erheblichen Schaden verursacht haben","Weil alle AI-Nutzung grundsätzlich verboten werden sollte","Weil nur große Technologiekonzerne reguliert werden sollten","Weil AI-Systeme technisch nicht mehr weiterentwickelt werden sollten","Der risikobasierte Ansatz reagiert auf reale Vorfälle wie die niederländische Toeslagenaffaire, nicht auf pauschale Technikskepsis."),
    q("EU102","zeitplan","Seit welchem Datum gelten die verbotenen Praktiken und die AI-Literacy-Pflicht (Art. 4)?","Seit dem 2. Februar 2025",["Erst seit dem 2. August 2026","Erst seit dem 2. Dezember 2027","Bereits seit Verabschiedung 2021"],"Der AI Act trat am 1. August 2024 in Kraft; Verbote und Art. 4 wurden aber erst zum 2. Februar 2025 anwendbar."),
    q("EU103","begriffe","Ein Unternehmen kauft ein AI-Tool ein und nutzt es im eigenen Bewerbungsprozess, ohne es zu verändern. Welche Rolle nimmt es ein?","Deployer",["Provider","Bevollmächtigter","Keine der genannten Rollen, da es das Tool nicht selbst entwickelt hat"],"Wer ein AI-System beruflich in eigener Verantwortung nutzt, ist Deployer — unabhängig davon, wer es entwickelt hat."),
    q("EU104","risikologik","Welche der folgenden vier Kategorien ist KEINE der Risikostufen des AI Act?","Bedingtes Risiko",["Unzulässig","Hochrisiko","Minimales Risiko"],"Die vier Stufen sind unzulässig, Hochrisiko, begrenztes Risiko und minimales Risiko — „bedingtes Risiko“ existiert nicht als eigene Kategorie."),
    q("EU105","artikel4","Wovon hängt laut Artikel 4 das erforderliche Maß an AI-Kompetenz ab?","Von technischem Wissen, Erfahrung, Bildung und dem konkreten Nutzungskontext der Person",["Von einem für alle Unternehmen identischen Mindeststundenumfang","Ausschließlich von der Unternehmensgröße","Nur vom Sitzland des Unternehmens innerhalb der EU"],"Art. 4 nennt ausdrücklich diese vier Bemessungsfaktoren statt eines pauschalen Minimums."),
    q("EU106","sanktionen","Welcher Bußgeldrahmen gilt für Verstöße gegen die verbotenen Praktiken nach Artikel 5?","Bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes",["Bis zu 15 Mio. € oder 3 % des weltweiten Jahresumsatzes","Bis zu 7,5 Mio. € oder 1 % des weltweiten Jahresumsatzes","Es gibt für verbotene Praktiken keine spezifischen Bußgelder"],"Verbotene Praktiken bilden die höchste der drei Bußgeldstufen — bis zu 35 Mio. € oder 7 % des weltweiten Jahresumsatzes."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-01",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
