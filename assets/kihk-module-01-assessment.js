(()=> {
  const STORAGE={
    last:"bais-kihk-m01-last",
    weak:"bais-kihk-m01-weak",
    attempt:"bais-kihk-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHK101","einsatzfelder","Was kann ein KI-System der klinischen Entscheidungsunterstützung laut Modul leisten?","Muster, Literatur oder frühere Fallverläufe strukturiert als Hinweis aufbereiten",["Die vollständige Anamnese und körperliche Untersuchung ersetzen","Eine verbindliche Diagnose ohne fachliche Prüfung stellen","Die klinische Erfahrung der Fachperson vollständig ersetzen"],"Ein KI-Hinweis ist ein zusätzlicher Baustein zur fachlichen Bewertung, kein Ersatz für Anamnese, Untersuchung oder Erfahrung."),
    q("KIHK102","abgrenzung","Wovon hängt es laut Modul ab, ob eine KI-Ausgabe als Hinweis oder als unzulässige Entscheidung wirkt?","Von der Art der Nutzung im Alltag, insbesondere davon, ob sie noch eigenständig fachlich geprüft wird",["Ausschließlich vom eingesetzten KI-Modell","Von der Anzahl der pro Tag bearbeiteten Fälle","Von der Uhrzeit, zu der die Ausgabe erstellt wird"],"Dieselbe Ausgabe kann je nach Umgang ein Hinweis oder eine de-facto-Entscheidung sein — entscheidend ist, ob sie eigenständig geprüft wird."),
    q("KIHK103","beispiel","Wie wird laut Modul eine ungeprüft in die Akte übernommene KI-Ausgabe eingeordnet?","Als unzulässige De-facto-Entscheidung",["Als vollständig risikofreier Standardvorgang","Als reine Formatierungshilfe ohne Bedeutung","Als Ersatz für die Dokumentationspflicht"],"Wird eine KI-Ausgabe ohne eigenständige fachliche Prüfung übernommen, wirkt sie faktisch wie eine Entscheidung — das ist nicht zulässig."),
    q("KIHK104","risikosituation","Welche Situation erhöht laut Modul das Risiko, dass ein KI-Hinweis unbemerkt zur Entscheidung wird?","Hoher Zeitdruck in Kombination mit einer sehr sicher formulierten KI-Ausgabe",["Eine bewusst langsame, bedächtige Arbeitsweise","Eine KI-Ausgabe, die ihre eigene Unsicherheit deutlich benennt","Eine zusätzliche, unabhängige fachliche Zweitmeinung"],"Zeitdruck und eine überzeugend klingende Ausgabe senken die Wahrscheinlichkeit einer eigenständigen Prüfung, obwohl das Risiko gleich bleibt."),
    q("KIHK105","verantwortung","Wer trifft laut Modul die eigentliche klinische Entscheidung?","Ausschließlich die zuständige, verantwortliche Fachperson",["Das KI-System, sobald genügend Daten vorliegen","Die IT-Abteilung der Einrichtung","Der Hersteller des eingesetzten Systems"],"Die Entscheidung bleibt durchgehend bei der zuständigen Fachperson — das System liefert höchstens einen Hinweis."),
    q("KIHK106","grenzfall","Was empfiehlt das Modul gerade bei hohem Zeitdruck?","Die fachliche Prüfung eines KI-Hinweises nicht zu verkürzen, sondern besonders sorgfältig durchzuführen",["Die fachliche Prüfung bei Zeitdruck auszusetzen","KI-Hinweise bei Zeitdruck automatisch zu übernehmen","Zeitdruck als Rechtfertigung für fehlende Dokumentation zu nutzen"],"Gerade bei Zeitdruck steigt das Risiko unreflektierter Übernahme — die fachliche Prüfung bleibt deshalb unverzichtbar."),
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
