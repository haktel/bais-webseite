(()=> {
  const STORAGE={
    last:"bais-sar-m02-last",
    weak:"bais-sar-m02-weak",
    attempt:"bais-sar-m02-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("SAR201","parsing","Warum sind Fehler beim PDF- oder Tabellen-Parsing besonders tückisch?","Sie pflanzen sich unsichtbar durch die gesamte Pipeline fort und sehen im Endergebnis wie plausible Antworten aus",["Sie werden von jedem modernen Sprachmodell automatisch korrigiert","Sie betreffen ausschließlich gescannte Dokumente, nie native PDFs","Sie treten nur bei Dokumenten in nicht-lateinischer Schrift auf"],"Ein falsch geparster Tabellenwert erscheint im Endergebnis wie eine plausible, aber grundlegend falsche Antwort — der Fehler ist später kaum noch erkennbar."),
    q("SAR202","chunking","Was ist der Hauptvorteil von semantischem Chunking gegenüber Fixed-Size Chunking?","Chunk-Grenzen folgen inhaltlichen Absätzen statt Sätze willkürlich mitten durchzutrennen",["Es benötigt keinerlei Rechenleistung","Es funktioniert ausschließlich bei englischsprachigen Dokumenten","Es macht Overlap zwischen Chunks überflüssig"],"Semantisches Chunking orientiert sich an inhaltlichen Grenzen und vermeidet dadurch, dass Sätze oder Zusammenhänge willkürlich zerschnitten werden."),
    q("SAR203","metadaten","Welche Information sollte laut Modul mit jedem Chunk zwingend mitgeführt werden, weil sie in Modul 03 (Berechtigungen) entscheidend wird?","Die zugehörigen Zugriffsberechtigungen des Quelldokuments",["Die Bildschirmauflösung des Erstellers","Die Anzahl der Wörter im gesamten Ursprungsdokument","Der verwendete Texteditor beim Erstellen des Dokuments"],"Ohne mitgeführte Zugriffsberechtigungen kann später nicht geprüft werden, ob eine abfragende Person überhaupt Zugriff auf den Inhalt haben durfte."),
    q("SAR204","longcontext","Was fand die Studie „Lost in the Middle“ (Liu et al., 2023) heraus?","Sprachmodelle nutzen Informationen am Anfang und Ende eines Kontexts zuverlässiger als in der Mitte platzierte Informationen",["Längere Kontextfenster verschlechtern grundsätzlich jede Antwortqualität","Sprachmodelle ignorieren generell alle Informationen außerhalb der ersten 100 Wörter","Die Position von Informationen im Kontext hat keinerlei Einfluss auf die Modellleistung"],"Die Studie zeigte einen U-förmigen Leistungsverlauf: Information in der Mitte eines langen Kontexts wird deutlich unzuverlässiger genutzt als am Rand platzierte Information."),
    q("SAR205","freshness","Welches Risiko entsteht, wenn Deduplizierung und Freshness-Tracking fehlen?","Veraltete oder nahezu identische Chunks können aktuelle, korrekte Inhalte im Retrieval verdrängen oder ihnen widersprechen",["Der Vektorindex wird dadurch automatisch kleiner","Die Kosten pro Anfrage sinken dadurch spürbar","Chunking-Strategien werden dadurch überflüssig"],"Ohne aktives Freshness-Management altert ein Index unsichtbar — veraltete Chunks können mit aktuellen konkurrieren und fälschlich bevorzugt werden."),
    q("SAR206","loeschung","Warum reicht es bei einer Löschanfrage nicht, nur das Ursprungsdokument zu entfernen?","Weil daraus abgeleitete Chunks, Embeddings und Caches sonst weiterhin im Index verbleiben",["Weil Löschanfragen grundsätzlich rechtlich unwirksam sind","Weil jedes Dokument automatisch mehrfach im System gespeichert wird","Weil Embeddings nie aus einem Dokument abgeleitet werden können"],"Ein vollständiges Löschkonzept muss auch abgeleitete Vektor-Repräsentationen und Caches erfassen, nicht nur die Originaldatei."),
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
