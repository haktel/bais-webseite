(()=> {
  const STORAGE={
    last:"bais-sar-m01-last",
    weak:"bais-sar-m01-weak",
    attempt:"bais-sar-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("SAR101","grounding","Was zeigt der Google-Bard-Fall aus dem Februar 2023 exemplarisch?","Wie ein einziger, öffentlich widerlegbarer Faktenfehler eines Sprachmodells reale finanzielle Folgen haben kann",["Dass Sprachmodelle grundsätzlich nicht für Unternehmenseinsatz geeignet sind","Dass nur sehr kleine Sprachmodelle zu Faktenfehlern neigen","Dass RAG-Systeme vor 2023 technisch nicht existierten"],"Bard behauptete fälschlich, das JWST habe das erste Foto eines Exoplaneten gemacht — der Fehler war öffentlich sofort widerlegbar und kostete Alphabet rund 100 Mrd. USD Marktkapitalisierung."),
    q("SAR102","pipeline","In welcher Reihenfolge laufen die vier Grundschritte der naiven RAG-Pipeline ab?","Embed & Index, Retrieve, Augment, Generate",["Generate, Retrieve, Embed & Index, Augment","Retrieve, Generate, Embed & Index, Augment","Augment, Generate, Retrieve, Embed & Index"],"Dokumente werden zunächst indexiert, dann werden bei einer Anfrage passende Chunks abgerufen, dem Prompt hinzugefügt und schließlich generiert das Modell die Antwort."),
    q("SAR103","query","Was leistet die Technik „HyDE“ (Hypothetical Document Embeddings)?","Das Modell erzeugt zunächst eine hypothetische Antwort und sucht dann nach ähnlichen Dokumenten",["Sie verschlüsselt die Nutzeranfrage vor dem Versand an die Suchmaschine","Sie ersetzt Vector Search vollständig durch Keyword Search","Sie generiert automatisch neue Trainingsdaten für das Modell"],"HyDE nutzt eine generierte hypothetische Antwort als Suchanker, um semantisch passendere Dokumente zu finden."),
    q("SAR104","hybrid","Warum reicht reine Vector Search in der Praxis oft nicht aus?","Sie erkennt exakte Begriffe wie Artikelnummern oder Fehlercodes oft schlechter als Keyword Search",["Sie ist immer langsamer als Keyword Search","Sie kann grundsätzlich keine Synonyme erkennen","Sie benötigt zwingend ein Re-Ranking-Modell, um überhaupt zu funktionieren"],"Vector Search ist stark bei semantischer Ähnlichkeit, aber schwächer bei exakten Begriffstreffern — deshalb wird sie oft mit Keyword Search zu Hybrid Search kombiniert."),
    q("SAR105","context","Wofür dient ein „No-Answer-Gate“?","Es erlaubt dem System, bei unzureichender Evidenz explizit keine Antwort zu geben, statt zu raten",["Es blockiert grundsätzlich alle Anfragen außerhalb der Geschäftszeiten","Es verhindert, dass mehr als ein Chunk pro Anfrage abgerufen wird","Es ersetzt die Notwendigkeit von Chunking vollständig"],"Ein No-Answer-Gate lässt das System ehrlich signalisieren, dass keine ausreichende Quelle vorliegt, statt eine unsichere Antwort ohne Grundlage zu erzeugen."),
    q("SAR106","grenzen","Was folgt korrekt aus der Aussage „Grounding ist keine Wahrheitsgarantie“?","Auch mit Retrieval kann ein Modell Quellen falsch zusammenfassen oder widersprüchliche Dokumente falsch gewichten",["RAG-Systeme sind für den Unternehmenseinsatz grundsätzlich ungeeignet","Retrieval macht Halluzination unmöglich, sobald es korrekt implementiert ist","Zitation ist bei RAG-Systemen technisch nicht mehr nötig"],"RAG reduziert Halluzinationsrisiko erheblich, beseitigt es aber nicht — Chunking, Berechtigungen, Injection-Schutz, Zitation und Monitoring bleiben notwendige Ergänzungen."),
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
