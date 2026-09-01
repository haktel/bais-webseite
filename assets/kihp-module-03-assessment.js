(()=> {
  const STORAGE={
    last:"bais-kihp-m03-last",
    weak:"bais-kihp-m03-weak",
    attempt:"bais-kihp-m03-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHP301","muster","Was kann ein KI-Muster-Hinweis laut Modul leisten?","Eine Häufung von Beobachtungen sichtbar machen, die sonst leicht übersehen wird",["Die Ursache der Häufung verbindlich benennen","Eine Diagnose anstelle der Fachperson stellen","Die notwendige Sofortmaßnahme selbstständig auslösen"],"Ein Muster-Hinweis zeigt eine Häufung, die Einordnung der Ursache bleibt Aufgabe der Fachperson."),
    q("KIHP302","redflag","Was gilt laut Modul als Red Flag, die sofortiges Handeln erfordert?","Plötzliche Verwirrtheit oder Bewusstseinsveränderung",["Ein routinemäßig geplanter Kontrolltermin","Eine unveränderte Dokumentationslage über mehrere Tage","Eine geplante Medikamentenumstellung laut Verordnung"],"Plötzliche Bewusstseinsveränderungen zählen zu den Warnzeichen, die sofortige ärztliche Abklärung erfordern."),
    q("KIHP303","reihenfolge","Was hat laut Modul bei einem akuten Warnzeichen immer Vorrang?","Die unmittelbare fachliche Reaktion über den bekannten Meldeweg",["Eine ausführliche KI-Analyse vor jeder weiteren Handlung","Das Warten auf die nächste geplante Routineprüfung","Die Rücksprache mit der IT-Abteilung"],"Bei einem klaren Warnzeichen hat die sofortige fachliche Reaktion immer Vorrang vor jeder weiteren Analyse."),
    q("KIHP304","grenze","Was darf ein KI-Hinweis laut Modul niemals bewirken?","Eine notwendige Sofortmaßnahme verzögern",["Bei der nachträglichen Dokumentation unterstützen","Eine Häufung von Einträgen sichtbar machen","An ein bekanntes Warnzeichen erinnern"],"Ein KI-Hinweis darf im Nachgang bei der Dokumentation helfen, aber nie eine Sofortmaßnahme aufschieben."),
    q("KIHP305","vorgehen","Wie ist laut Modul bei einem akuten Sturz mit Verletzungsverdacht vorzugehen?","Sofort Fachkraft bzw. Arzt informieren, ohne eine Bewertung abzuwarten",["Zunächst eine KI-Zusammenfassung der Situation erstellen lassen","Bis zur nächsten Übergabe warten","Die Einschätzung der KI als ausreichend betrachten"],"Bei einem akuten Warnzeichen wird sofort die zuständige Fachperson informiert, unabhängig von jeder KI-Auswertung."),
    q("KIHP306","verantwortung","Wer ordnet laut Modul letztlich einen KI-Muster-Hinweis fachlich ein?","Die zuständige Pflegefachkraft oder das ärztliche Personal",["Die KI selbst, sobald genug Daten vorliegen","Die Einrichtungsleitung ohne fachliche Prüfung","Der Hersteller des KI-Tools"],"Die fachliche Einordnung eines Hinweises bleibt durchgehend Aufgabe der verantwortlichen Fachperson."),
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
