(()=> {
  const STORAGE={
    last:"bais-sar-m04-last",
    weak:"bais-sar-m04-weak",
    attempt:"bais-sar-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("SAR401","grundlagen","Was unterscheidet indirekte von direkter Prompt Injection?","Die manipulative Anweisung steckt in einem Dokument oder einer Webseite, die das System später verarbeitet, statt direkt im Chat eingegeben zu werden",["Indirekte Prompt Injection ist rein theoretisch und wurde nie real beobachtet","Direkte Prompt Injection kann nur bei Sprachmodellen mit Internetzugriff auftreten","Indirekte Prompt Injection betrifft ausschließlich Bilddateien"],"Bei indirekter Prompt Injection versteckt der Angreifer die Anweisung in einer später vom System gelesenen Quelle, statt sie selbst im Chat einzugeben."),
    q("SAR402","poisoning","Wie kann Retrieval Poisoning ein System kompromittieren, ohne dass ein Mensch das manipulierte Dokument bewusst öffnet?","Ein präpariertes Dokument gelangt in den Index und wird bei passendem Retrieval automatisch abgerufen und verarbeitet",["Der Angreifer muss zwingend Administratorzugriff auf das System haben","Retrieval Poisoning erfordert immer physischen Zugang zum Server","Es funktioniert ausschließlich bei Systemen ohne jede Chunking-Strategie"],"Sobald ein manipuliertes Dokument im Index liegt, kann es automatisch beim nächsten passenden Retrieval abgerufen werden — ganz ohne bewusste menschliche Interaktion."),
    q("SAR403","writer","Wie funktionierte der dokumentierte Angriff auf Writer.com im Dezember 2023?","Versteckter weißer Text auf weißem Hintergrund steuerte die Zusammenfassung und ließ Daten über eine Bild-URL abfließen",["Ein Mitarbeiter von Writer.com gab die Kundendaten absichtlich weiter","Der Angriff nutzte eine SQL-Injection in der Login-Maske","Es handelte sich um einen reinen Phishing-Angriff per E-Mail ohne AI-Beteiligung"],"Die versteckte Anweisung ließ das System die mittleren 50 Zeichen von Quelldateien als Parameter an eine Bild-URL anhängen — beim Laden des Bildes flossen die Daten ab."),
    q("SAR404","exfiltration","Was haben Markdown-Bild-URLs, automatische Tool-Aufrufe und codierte Linkparameter als Exfiltrationsvektoren gemeinsam?","Der Datenabfluss nutzt einen für legitime Funktionalität vorgesehenen Kanal, der deshalb nicht standardmäßig blockiert wird",["Sie funktionieren ausschließlich in E-Mail-Clients","Sie erfordern alle physischen Zugriff auf die Servereinstellungen","Sie sind nur bei Systemen ohne Internetverbindung ein Risiko"],"Alle drei Vektoren missbrauchen einen eigentlich legitimen Funktionskanal — deshalb werden sie von Standardschutzmechanismen oft nicht automatisch erkannt."),
    q("SAR405","dlp","Was leistet Output Validation zusätzlich zu DLP?","Sie prüft generierte Antworten vor der Auslieferung auf verdächtige Strukturen wie automatisch geladene Bild-URLs mit ungewöhnlichen Parametern",["Sie ersetzt die Notwendigkeit jeglicher Zugriffskontrolle","Sie verhindert ausschließlich Rechtschreibfehler in Antworten","Sie funktioniert nur bei Anfragen in englischer Sprache"],"Output Validation prüft die fertige Antwort vor der Auslieferung und kann verdächtige, automatisch geladene externe Inhalte blockieren oder entschärfen."),
    q("SAR406","csp","Welches Prinzip überträgt eine Content-Security-Policy für AI-Antworten aus dem Web-Browser-Kontext?","Externe Bilder und Links sollten nicht automatisch und ungeprüft geladen werden",["Alle Antworten müssen zwingend verschlüsselt gespeichert werden","Jede Antwort darf maximal einen Satz enthalten","Externe Inhalte dürfen nur nachts geladen werden"],"Analog zu einer Content Security Policy im Browser sollten AI-Oberflächen externe Bilder und Links nicht automatisch und ungeprüft rendern."),
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
