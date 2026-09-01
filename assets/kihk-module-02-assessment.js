(()=> {
  const STORAGE={
    last:"bais-kihk-m02-last",
    weak:"bais-kihk-m02-weak",
    attempt:"bais-kihk-m02-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHK201","recherche","Wie sollte eine KI-gestützte Literaturzusammenfassung laut Modul behandelt werden?","Als Ausgangspunkt der Recherche, der weiter geprüft werden muss",["Als bereits abgeschlossene, geprüfte Recherche","Als Ersatz für den Blick in die Originalquelle","Als automatisch aktuellste verfügbare Evidenz"],"Eine KI-Zusammenfassung liefert einen ersten Überblick, ersetzt aber nicht die weitere Prüfung der Quellen."),
    q("KIHK202","quellenpruefung","Warum reicht eine plausibel formatierte Quellenangabe laut Modul nicht aus?","Weil Sprachmodelle Quellenangaben plausibel klingen lassen können, auch wenn sie ungenau oder veraltet sind",["Weil Quellenangaben grundsätzlich nicht überprüfbar sind","Weil KI-Systeme keine Quellen nennen dürfen","Weil jede Quellenangabe automatisch korrekt ist, sobald sie ein Format hat"],"Eine überzeugend formatierte Angabe ist noch keine geprüfte Angabe — die Gegenprüfung bleibt notwendig."),
    q("KIHK203","pruefpfad","Welche Prüffrage gehört laut Modul zur Quellenprüfung?","Ist die Quelle aktuell und passt sie zur konkreten Fragestellung?",["Wie schnell wurde die Zusammenfassung erstellt?","Welche Schriftart wurde für die Quellenangabe verwendet?","Wie viele Quellen wurden insgesamt genannt?"],"Existenz, Aktualität und fachliche Passung der Quelle sind die zentralen Prüffragen, nicht Formalien wie Geschwindigkeit oder Formatierung."),
    q("KIHK204","evidenzgrad","Was bleibt laut Modul eine fachliche Aufgabe, auch wenn KI eine Studie zusammenfasst?","Die Einordnung des Evidenzgrads im Verhältnis zu bestehender Literatur und Leitlinien",["Das reine Vorlesen des Studientitels","Die Formatierung der Literaturliste","Die Übersetzung des Abstracts in eine andere Sprache"],"Studiendesign, Aussagekraft und Einordnung im Vergleich zu anderer Evidenz erfordern fachliche Bewertung."),
    q("KIHK205","risiko","Was ist laut Modul ein Risiko unkritisch übernommener KI-Literaturzusammenfassungen?","Dass veraltete oder unpassende Quellen unbemerkt in eine fachliche Überlegung einfließen",["Dass die Recherche dadurch grundsätzlich langsamer wird","Dass KI-Zusammenfassungen technisch nicht speicherbar sind","Dass keine Literatur mehr gefunden werden kann"],"Ohne Gegenprüfung können veraltete oder unpassende Quellen unbemerkt übernommen werden."),
    q("KIHK206","dokumentation","Was unterstützt laut Modul die Nachvollziehbarkeit einer KI-gestützten Recherche?","Die geprüften Quellen und den Prüfschritt selbst nachvollziehbar festzuhalten",["Auf jede Dokumentation der Recherche zu verzichten","Nur das Endergebnis ohne Quellenangabe zu notieren","Die KI-Ausgabe unverändert und ungeprüft zu übernehmen"],"Nachvollziehbarkeit entsteht, wenn geprüfte Quellen und der Prüfschritt dokumentiert werden, nicht durch ungeprüfte Übernahme."),
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
