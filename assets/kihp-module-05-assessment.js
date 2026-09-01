(()=> {
  const STORAGE={
    last:"bais-kihp-m05-last",
    weak:"bais-kihp-m05-weak",
    attempt:"bais-kihp-m05-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHP501","diagnose","Was darf KI laut Modul im Zusammenhang mit Diagnose oder Pflegeeinstufung tun?","Formulierungen oder Literaturhinweise liefern, aber keine eigenständige Entscheidung treffen",["Eine verbindliche Pflegeeinstufung eigenständig festlegen","Eine Diagnose stellen, wenn genug Daten vorliegen","Die fachliche Verantwortung von der Pflegefachkraft übernehmen"],"KI darf unterstützen und informieren, die Entscheidung bleibt bei der verantwortlichen Fachperson."),
    q("KIHP502","medikation","Welche Grenze gilt laut Modul für KI bei Medikamentengabe oder Dosierung?","KI darf niemals selbstständig eine Gabe empfehlen, bestätigen oder auslösen",["KI darf bei eindeutigen Fällen die Gabe selbstständig bestätigen","KI darf die Dosierung anpassen, wenn die Datenlage gut ist","KI darf die ärztliche Verordnung bei Zeitdruck ersetzen"],"Medikamentenentscheidungen folgen ausschließlich der ärztlichen Verordnung und den etablierten Kontrollmechanismen, unabhängig von KI-Ausgaben."),
    q("KIHP503","risikoskala","Welche Rolle spielt eine KI-gestützte Zusammenfassung laut Modul bei Risikoskalen wie Sturz- oder Dekubitusrisiko?","Sie kann die Erhebung unterstützen, ersetzt aber nicht die abschließende fachliche Bewertung",["Sie ersetzt die Risikoskala vollständig","Sie darf die Einstufung eigenständig festlegen","Sie ist für Risikoskalen nicht relevant"],"Risikoskalen bleiben ein Hilfsmittel für die Fachperson; die abschließende Bewertung trifft weiterhin der Mensch."),
    q("KIHP504","eskalation","Was ist laut Modul der richtige nächste Schritt, wenn ein KI-Hinweis von der eigenen fachlichen Einschätzung abweicht?","Rücksprache mit einer verantwortlichen Fachperson",["Den KI-Hinweis automatisch übernehmen","Den KI-Hinweis vollständig ignorieren","Die Entscheidung auf die nächste Schicht verschieben, ohne Rücksprache"],"Eine abweichende Einschätzung ist ein Signal zur Rücksprache, nicht zur eigenmächtigen Entscheidung in die eine oder andere Richtung."),
    q("KIHP505","verantwortung","Wer trägt laut Modul die fachliche und rechtliche Verantwortung für Diagnose- und Einstufungsentscheidungen?","Approbiertes bzw. qualifiziertes Fachpersonal",["Das verwendete KI-Tool","Die IT-Abteilung der Einrichtung","Der Hersteller der eingesetzten Software"],"Diese Verantwortung liegt unabhängig vom KI-Einsatz beim qualifizierten Fachpersonal."),
    q("KIHP506","grundhaltung","Welche Grundhaltung fassen die drei Grenzen dieses Moduls laut Modul zusammen?","KI unterstützt sichtbar und prüfbar, ohne der Fachperson die Entscheidung abzunehmen",["KI übernimmt zunehmend die Verantwortung der Fachperson","KI-Einsatz sollte im Pflegealltag grundsätzlich vermieden werden","Prüfbarkeit ist bei sensiblen Pflegeentscheidungen nicht relevant"],"Der rote Faden aller drei Grenzen ist sichtbare, prüfbare Unterstützung ohne Verantwortungsabgabe."),
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
