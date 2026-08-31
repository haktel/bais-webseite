(()=> {
  const STORAGE={
    last:"bais-kis-m03-last",
    weak:"bais-kis-m03-weak",
    attempt:"bais-kis-m03-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KS301","grundlagen","Was unterscheidet indirekte von direkter Prompt Injection?","Bei indirekter Injection steckt die manipulative Anweisung in einer verarbeiteten Quelle, nicht in der Nutzereingabe selbst",["Indirekte Injection ist technisch überhaupt nicht möglich","Bei direkter Injection weiß der Nutzer nie, was er eingibt","Beide Begriffe beschreiben exakt denselben Angriff"],"Direkt: der Nutzer selbst formuliert die Manipulation. Indirekt: die Anweisung ist in einer vom System verarbeiteten externen Quelle versteckt."),
    q("KS302","chevrolet","Was zeigte der Chevrolet-Chatbot-Fall (Dezember 2023) konkret?","Ein Nutzer brachte den Chatbot per Prompt dazu, einem 1-Dollar-Verkauf 'rechtsverbindlich' zuzustimmen",["Der Chatbot verkaufte tatsächlich ein echtes Fahrzeug für 1 Dollar","Der Fall bezog sich auf eine Sicherheitslücke in der Serverinfrastruktur","Chevrolet hatte den Test bewusst selbst inszeniert"],"Ein Nutzer provozierte per direkter Prompt Injection eine unzulässige, viral geteilte 'Zusage' des Chatbots."),
    q("KS303","slack","Was war das Besondere am Slack-AI-Fall (PromptArmor, 2024)?","Der Angreifer brauchte keinen direkten Zugriff auf den privaten Kanal, aus dem Daten letztlich sichtbar wurden",["Der Angreifer hatte von Anfang an vollen Administratorzugriff","Es handelte sich um einen rein theoretischen Fall ohne echte Untersuchung","Slack AI war zum Zeitpunkt des Vorfalls komplett offline"],"Die präparierte Nachricht in einem öffentlichen Kanal reichte aus, um bei einer späteren Anfrage private Daten in die sichtbare Antwort einzuschleusen — ganz ohne Direktzugriff."),
    q("KS304","hierarchie","Wie sollten Inhalte aus Dokumenten, Webseiten oder Tool-Ergebnissen im Kontextfenster behandelt werden?","Immer als reine Information, niemals als Anweisung, der das System folgt",["Als gleichrangig mit den Systemregeln des Betreibers","Als grundsätzlich vertrauenswürdiger als Nutzereingaben","Sie sollten komplett ignoriert werden und dürfen nie verarbeitet werden"],"Die Instruktionshierarchie verlangt: externe Inhalte sind Daten, keine Anweisungen — unabhängig davon, wie sie formuliert sind."),
    q("KS305","exfiltration","Was ist eine bekannte Methode der Markdown-Bild-Exfiltration?","Eine Antwort enthält ein Bild, dessen URL beim Laden Daten an einen Angreifer-Server überträgt",["Daten werden ausschließlich per Fax exportiert","Ein Bild kann grundsätzlich keine Daten übertragen","Diese Methode betrifft nur gedruckte Dokumente"],"Das Laden eines Bildes mit präparierter URL kann Daten unbemerkt an einen externen Server senden — ein bekannter Exfiltrationskanal."),
    q("KS306","verteidigung","Warum reicht laut Modul keine einzelne Schutzmaßnahme gegen Prompt Injection?","Weil sich Injection technisch nicht vollständig ausschließen lässt — mehrere unabhängige Schichten sind nötig",["Weil eine einzelne Maßnahme technisch nicht implementierbar ist","Weil Prompt Injection in der Praxis inzwischen unmöglich geworden ist","Weil eine Schicht ausreicht, sobald Least Privilege eingerichtet ist"],"Da kein Einzelschutz Injection zuverlässig verhindert, kombiniert eine wirksame Verteidigung Eingabe-, Verarbeitungs-, Ausgabe- und Erkennungsschicht."),
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
