(()=> {
  const STORAGE={
    last:"bais-kil-m04-last",
    weak:"bais-kil-m04-weak",
    attempt:"bais-kil-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KL401","aufsicht","Was macht menschliche Aufsicht über eine AI-Entscheidung wirksam statt nur formal?","Genug Information, Zeit zur Prüfung und eine reale Möglichkeit zu widersprechen",["Ein einzelner Klick auf 'Bestätigen', unabhängig vom Kontext","Die reine Existenz eines Freigabe-Buttons im System","Eine nachträgliche, nicht dokumentierte mündliche Erlaubnis"],"Ohne Information, Zeit und reale Widerspruchsmöglichkeit ist eine Freigabe nur ein Feigenblatt, keine echte Aufsicht."),
    q("KL402","modelle","Was beschreibt 'Human-on-the-loop' im Unterschied zu 'Human-in-the-loop'?","Der Mensch überwacht laufend und kann eingreifen, entscheidet aber nicht jeden Einzelfall aktiv",["Der Mensch ist komplett aus dem Prozess ausgeschlossen","Der Mensch entscheidet zwingend jeden einzelnen Fall aktiv mit","Es gibt keinen inhaltlichen Unterschied zwischen beiden Begriffen"],"In-the-loop = aktive Einzelfallentscheidung, on-the-loop = laufende Überwachung mit Eingriffsmöglichkeit, aber nicht bei jedem Einzelfall."),
    q("KL403","risikobasiert","Welcher Faktor bestimmt laut Modul, wie streng das Aufsichtsmodell sein muss?","Wie stark Personen betroffen sind, wie reversibel die Entscheidung ist und die regulatorische Risikoeinstufung",["Ausschließlich die Kosten des eingesetzten AI-Systems","Wie lange das Projekt schon läuft, unabhängig vom Inhalt","Die Anzahl der beteiligten IT-Mitarbeitenden"],"Betroffenheit, Reversibilität und regulatorische Einstufung bestimmen gemeinsam, wie streng die Aufsicht ausfallen muss — nicht Kosten oder Projektlaufzeit."),
    q("KL404","audit","Welches Element gehört zwingend in einen Audit-Trail für AI-gestützte Entscheidungen?","Die menschliche Entscheidung (bestätigt/korrigiert/abgelehnt) mit Zeitstempel und verantwortlicher Person",["Nur die technische Modellversion, ohne menschliche Reaktion","Ausschließlich das Enddatum des Projekts","Ein informelles Gedächtnisprotokoll ohne Zeitstempel"],"Ohne dokumentierte menschliche Reaktion, Zeitstempel und Verantwortlichkeit ist die Aufsicht im Streitfall nicht nachweisbar."),
    q("KL405","compas","Was war der zentrale Kritikpunkt der ProPublica-Untersuchung zu COMPAS (2016)?","Das System sagte bei Schwarzen Angeklagten überproportional häufig ein zu hohes Rückfallrisiko voraus",["Das System war technisch vollständig fehlerfrei und unumstritten","Die Untersuchung fand keinerlei Unterschiede zwischen Gruppen","COMPAS wurde nie in echten Gerichtsverfahren eingesetzt"],"Die vielzitierte ProPublica-Analyse fand eine überproportionale Falsch-Hoch-Einstufung bei Schwarzen Angeklagten — ein bis heute diskutierter Fairness-Fall."),
    q("KL406","governance","Was unterscheidet ein wirksames Governance-Board von einer reinen Informationsveranstaltung?","Es hat ein Mandat, Initiativen tatsächlich zu stoppen, und trifft dokumentierte Entscheidungen",["Es tagt möglichst selten, um Aufwand zu sparen","Es nimmt Berichte nur zur Kenntnis, ohne Entscheidungsbefugnis","Es besteht ausschließlich aus IT-Mitarbeitenden"],"Ohne echtes Stopp-Mandat und dokumentierte Entscheidungen bleibt ein Board wirkungslos, egal wie oft es tagt."),
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
