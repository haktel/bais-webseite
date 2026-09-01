(()=> {
  const STORAGE={
    last:"bais-kihp-m01-last",
    weak:"bais-kihp-m01-weak",
    attempt:"bais-kihp-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHP101","einsatzfeld","Warum gilt Pflegedokumentation laut Modul als geeigneter Einsatzfall für KI-Unterstützung?","Weil ein Entwurf vor Verwendung vollständig gegengelesen und korrigiert werden kann",["Weil die KI die Beobachtung der Pflegefachkraft ersetzt","Weil Dokumentation keiner fachlichen Prüfung mehr bedarf","Weil KI-Entwürfe automatisch fehlerfrei sind"],"Ein prüfbarer Entwurf vor Verwendung macht Dokumentation zu einem risikoärmeren Einsatzfall als direkt wirksame Handlungen."),
    q("KIHP102","struktur","Welches Feld gehört laut Modul zur empfohlenen Vier-Felder-Struktur der Übergabe?","Empfehlung: Was die nächste Schicht beachten oder tun sollte",["Die private Telefonnummer der Bewohnerin oder des Bewohners","Die Arbeitszeiten der aktuellen Schicht","Der Name des verwendeten KI-Tools"],"Situation, Hintergrund, Einschätzung und Empfehlung sind die vier Felder, die eine vollständige Übergabe absichern."),
    q("KIHP103","pruefung","Was ist laut Modul die unterschätzte Fehlerquelle bei KI-Entwürfen für die Übergabe?","Stillschweigende Auslassungen, die erst später auffallen",["Zu lange Bearbeitungszeit der KI","Zu kurze Übergabenotizen im Allgemeinen","Die Schriftart des Dokuments"],"Ein sichtbar falscher Wert fällt meist auf; eine fehlende Beobachtung wird dagegen leicht übersehen."),
    q("KIHP104","grundregel","Was gilt laut Modul für fehlende Informationen in einem KI-Prompt zur Dokumentation?","Sie sollten offen bleiben und von der Pflegefachkraft ergänzt werden",["Die KI soll plausible Werte selbst ergänzen","Fehlende Informationen können ignoriert werden","Die KI markiert Lücken automatisch als Diagnose"],"Erfundene Angaben sind eine der größten Risikoquellen — Lücken bleiben sichtbar und werden von Menschen geschlossen."),
    q("KIHP105","freigabe","Wer entscheidet laut Modul, ob ein KI-Entwurf für die Übergabe freigegeben wird?","Die zuständige Pflegefachkraft nach fachlicher Prüfung",["Die KI selbst, sobald der Text vollständig wirkt","Die IT-Abteilung der Einrichtung","Die nächste Schicht ohne weitere Prüfung"],"Die fachliche Freigabe bleibt durchgehend Aufgabe der zuständigen Pflegefachkraft."),
    q("KIHP106","check","Welche der drei Prüffragen gehört laut Modul zum Check vor der Übernahme eines KI-Entwurfs?","Ist der Ton für die jeweilige Zielgruppe passend?",["Wie schnell wurde der Entwurf erstellt?","Wie lang ist der Entwurf insgesamt?","Welches KI-Modell wurde verwendet?"],"Fakten, Vollständigkeit und passender Ton sind die drei zentralen Prüffragen vor jeder Übernahme."),
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
