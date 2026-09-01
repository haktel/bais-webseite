(()=> {
  const STORAGE={
    last:"bais-kih-m01-last",
    weak:"bais-kih-m01-weak",
    attempt:"bais-kih-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIH101","einsatzfelder","Welcher Aufgabentyp gilt im Gesundheitswesen aktuell als der reifste KI-Einsatzfall?","Administrative Entlastung wie Dokumentation, Terminplanung und Übersetzung",["Eigenständige Diagnosestellung","Automatische Medikamentendosierung ohne Prüfung","Ersatz der ärztlichen Anamnese"],"Administrative Aufgaben lassen sich vor Verwendung leicht fachlich prüfen — das macht sie zum risikoärmsten und reifsten Einsatzfeld."),
    q("KIH102","risiko","Wovon hängt das Risiko eines KI-Einsatzfalls im Gesundheitswesen vor allem ab?","Von der Konsequenz, falls die KI-Ausgabe falsch ist und unbemerkt bleibt",["Ausschließlich vom verwendeten KI-Modell","Von der Anzahl der Nutzer, die die KI verwenden","Von der Geschwindigkeit der KI-Antwort"],"Dieselbe Technik kann je nach Kontext harmlos oder riskant sein — entscheidend ist, was im Fehlerfall passiert."),
    q("KIH103","grenze","Wer trifft laut diesem Modul die Diagnose- und Therapieentscheidung?","Ausschließlich approbiertes, verantwortliches Fachpersonal",["Die KI, sofern sie hohe Konfidenz meldet","Die Praxis- oder Klinikleitung pauschal","Das System, wenn keine Fachperson verfügbar ist"],"Diese Grenze ist nicht verhandelbar: Diagnose und Therapieentscheidung bleiben bei der verantwortlichen Fachperson."),
    q("KIH104","einordnung","In welche Kategorie fällt laut Modul ein Pflegebericht-Entwurf?","Dokumentation, mittleres Risiko",["Administrativ, geringes Risiko","Klinisch, hohes Risiko","Kein KI-relevanter Anwendungsfall"],"Ein Pflegebericht-Entwurf ist Dokumentation mit mittlerem Risiko: nützlich, aber vor Übernahme fachlich zu prüfen."),
    q("KIH105","pruefpfad","Was macht einen KI-Einsatzfall im Gesundheitswesen tendenziell risikoärmer?","Ein klarer Prüfpfad, bei dem ein Mensch das Ergebnis vor Verwendung liest und korrigiert",["Eine besonders kurze Antwortzeit der KI","Der vollständige Verzicht auf jede menschliche Prüfung","Eine möglichst lange, technische Formulierung der Ausgabe"],"Ein Ergebnis, das vor Verwendung geprüft werden kann, senkt das Risiko deutlich gegenüber direkt wirksamen Ausgaben."),
    q("KIH106","verantwortung","Was gilt laut diesem Modul für alle folgenden Module des Programms?","Die Grenze „KI liefert Hinweise, keine Entscheidungen“ zieht sich durch das gesamte Programm",["Jedes Modul definiert die Verantwortungsgrenze neu","Ab Modul 03 darf KI eigenständig entscheiden","Die Grenze gilt nur für ärztliches Personal"],"Die Trennung zwischen KI-Hinweis und menschlicher Entscheidung ist ein durchgängiges Prinzip des gesamten Programms."),
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
