(()=> {
  const STORAGE={
    last:"bais-eua-m04-last",
    weak:"bais-eua-m04-weak",
    attempt:"bais-eua-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("EU401","grundpflicht","Welche vier Faktoren nennt Artikel 4 ausdrücklich für das erforderliche Maß an AI-Kompetenz?","Technisches Wissen, Erfahrung, Bildung und Ausbildung sowie der Nutzungskontext",["Nur die Unternehmensgröße","Nur das Budget für Schulungen","Nur die Anzahl eingesetzter AI-Tools"],"Art. 4 nennt ausdrücklich diese vier Bemessungsfaktoren, nicht ein pauschales Kriterium wie Größe oder Budget."),
    q("EU402","differenzierung","Warum reicht ein einziges, identisches Schulungsformat für alle Rollen meist nicht aus?","Weil Führungskräfte, Fachbereiche und Compliance-Schnittstellen unterschiedliche Entscheidungen treffen und daher unterschiedliches Wissen brauchen",["Weil das AI-Act-Gesetz eine Mindestanzahl an Schulungsformaten pro Unternehmen vorschreibt","Weil jede Abteilung ein eigenes AI-System entwickeln muss","Weil sich Schulungsinhalte alle sechs Monate gesetzlich ändern müssen"],"Rollenbezogene Literacy bedeutet: Inhalte an die tatsächlichen Entscheidungen und Verantwortlichkeiten der jeweiligen Gruppe anpassen."),
    q("EU403","fuehrung","Welche Verantwortung tragen Führungskräfte im Kontext von AI-Literacy typischerweise?","Freigabe- und Investitionsentscheidungen so zu treffen, dass Risiko und Nutzen vorab geprüft wurden",["Jedes eingesetzte Modell im Detail selbst zu programmieren","Alle technischen Logs täglich persönlich zu kontrollieren","Ausschließlich die IT-Abteilung über AI-Themen entscheiden zu lassen"],"Führungskräfte müssen nicht jedes Modell technisch verstehen, aber wissen, wann eine Freigabeentscheidung vertiefte Prüfung braucht."),
    q("EU404","fachbereiche","Was unterscheidet reine Bedienkompetenz von echter Urteilskompetenz gegenüber einem AI-Tool?","Urteilskompetenz erkennt Muster, die auf Verzerrung oder Fehler hindeuten, und stellt Ergebnisse aktiv infrage",["Bedienkompetenz ist grundsätzlich wertvoller als Urteilskompetenz","Beide Begriffe meinen exakt dasselbe","Urteilskompetenz ist nur für Softwareentwickler relevant"],"Ein Tool technisch korrekt zu bedienen sagt nichts darüber aus, ob man seine Ergebnisse fachlich kritisch einordnen kann."),
    q("EU405","praxisfall","Was zeigte die ProPublica-Analyse des COMPAS-Systems 2016?","Dass das System schwarze Angeklagte systematisch häufiger fälschlich als Hochrisiko einstufte als weiße Angeklagte mit vergleichbarer Rückfallquote",["Dass COMPAS vollständig fehlerfrei arbeitete","Dass automatisierte Scoring-Systeme in der Justiz grundsätzlich verboten sind","Dass der Hersteller die Analyse sofort vollständig bestätigte"],"Die ProPublica-Analyse deckte eine Bias-Verzerrung auf, die über Jahre unentdeckt blieb, bevor sie öffentlich untersucht wurde."),
    q("EU406","nachweis","Was ist ein dokumentierter Lernpfad mit Assessmentnachweis im Kontext von Artikel 4?","Ein Beleg dafür, dass ein Unternehmen aktiv Maßnahmen zur AI-Kompetenz ergriffen hat — kein staatliches Zertifikat",["Eine automatische Bestätigung vollständiger regulatorischer Compliance","Ein rechtlich bindendes behördliches Prüfsiegel","Ein Ersatz für jede weitere interne Kontrolle"],"Ein Teilnahme- oder Assessmentnachweis dokumentiert transparent Lernziele und Umfang — er ist kein staatlicher Abschluss oder automatischer Compliance-Nachweis."),
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
