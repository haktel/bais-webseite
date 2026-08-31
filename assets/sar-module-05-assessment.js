(()=> {
  const STORAGE={
    last:"bais-sar-m05-last",
    weak:"bais-sar-m05-weak",
    attempt:"bais-sar-m05-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("SAR501","grundannahme","Warum beweist eine Quellenangabe allein keine korrekte Antwort?","Ein zitiertes Dokument kann existieren, ohne dass die zitierte Aussage tatsächlich darin steht",["Quellenangaben sind bei Sprachmodellen technisch nicht möglich","Jede Quellenangabe ist per Definition korrekt, wenn das Dokument existiert","Zitate sind nur bei juristischen Anwendungsfällen relevant"],"Ein Zitat kann existieren, aber falsch zugeordnet sein (Entailment-Fehler) oder schlicht erfunden sein (Fabrikation) — die Existenz einer Quellenangabe reicht als Beweis nicht aus."),
    q("SAR502","avianca","Was war die Kernursache der gerichtlichen Sanktionen im Fall Mata v. Avianca?","Von ChatGPT erfundene Gerichtsurteile wurden ohne unabhängige Verifikation bei Gericht eingereicht",["Die Anwälte hatten die Klage grundsätzlich zu spät eingereicht","Avianca hatte selbst gefälschte Dokumente vorgelegt","Das Gericht lehnte den Einsatz von Software in Gerichtsverfahren generell ab"],"Die Anwälte reichten von ChatGPT erfundene Präzedenzfälle ein und bestätigten deren Existenz sogar erneut, ohne sie unabhängig zu verifizieren — das Gericht sanktionierte dies im Mai 2023 als „subjective bad faith“."),
    q("SAR503","pruefung","Was prüft ein „Entailment Check“ bei der Zitationsprüfung?","Ob der zitierte Text tatsächlich die damit belegte Aussage stützt",["Ob das Dokument in der richtigen Dateisprache vorliegt","Ob der zitierte Text kürzer als 500 Zeichen ist","Ob das Dokument öffentlich zugänglich ist"],"Der Entailment Check prüft inhaltlich, ob der zitierte Textabschnitt die damit belegte Aussage wirklich stützt — unabhängig davon, ob das Dokument existiert."),
    q("SAR504","ragas","Welche RAGAS-Metrik bewertet primär die Qualität des Retrievals statt der Generierung?","Context Precision",["Faithfulness","Response Relevancy","Es gibt bei RAGAS keine Unterscheidung zwischen Retrieval- und Generation-Metriken"],"Context Precision und Context Recall bewerten das Retrieval; Faithfulness und Response Relevancy bewerten die Generierung — RAGAS trennt diese bewusst."),
    q("SAR505","goldenset","Wofür wird ein Golden Set in der RAG-Evaluierung eingesetzt?","Um Änderungen an Chunking, Retrieval oder Modell vor dem Produktiveinsatz gegen bekannte, geprüfte Antworten zu testen",["Um die Trainingsdaten des Sprachmodells vollständig zu ersetzen","Um automatisch neue Chunking-Strategien zu erfinden","Um die Kosten pro Anfrage direkt zu senken"],"Ein Golden Set enthält kuratierte Fragen mit geprüften korrekten Antworten und dient dazu, Regressionen vor dem Produktiveinsatz zu erkennen."),
    q("SAR506","review","Wann bleibt Human-in-the-loop Review laut Modul zwingend erforderlich?","Bei rechtlich, finanziell oder gesundheitlich riskanten Anwendungsfällen, wie im Mata-v.-Avianca-Fall gezeigt",["Nur während der ersten Woche nach Produktivstart","Ausschließlich bei Anfragen außerhalb der Geschäftszeiten","Nie, wenn RAGAS-Metriken oberhalb von 90 % liegen"],"Automatisierte Metriken priorisieren, wo Prüfung am nötigsten ist — bei hohem rechtlichem, finanziellem oder gesundheitlichem Risiko bleibt menschliche Gegenprüfung zwingend."),
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
