(()=> {
  const STORAGE={
    last:"bais-kis-m05-last",
    weak:"bais-kis-m05-weak",
    attempt:"bais-kis-m05-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KS501","logging","Warum ist Logging die Voraussetzung für Monitoring und Incident Response?","Ohne geloggte Rohdaten kann ein Vorfall im Nachhinein nicht rekonstruiert werden",["Logging ist nur für rechtliche Zwecke relevant, nicht für Sicherheit","Monitoring funktioniert vollständig unabhängig von jeglichem Logging","Logs werden ausschließlich zu Abrechnungszwecken benötigt"],"Ohne vorhandene Logs fehlen die Rohdaten, die Monitoring auswerten und ein Incident-Response-Team später untersuchen müsste."),
    q("KS502","monitoring","Was ist ein sinnvoller Auslöser für einen automatischen Anomalie-Alarm?","Eine Abweichung von der normalen Nutzungs-Baseline, z.B. ungewöhnlich viele Dokumentenabrufe",["Ausschließlich die Uhrzeit, unabhängig vom Nutzungsverhalten","Jede einzelne normale Nutzeranfrage ohne Ausnahme","Anomalie-Erkennung ist technisch nicht sinnvoll umsetzbar"],"Ein Alarm bei signifikanter Abweichung von der normalen Baseline (z.B. Datenmenge, Uhrzeit, Tool-Nutzung) ist der Kern von Anomalie-Erkennung."),
    q("KS503","redteam","Was ist das Ziel von Red-Teaming vor einem AI-Rollout?","Gezielt mit Angriffs-Prompts und Manipulationsversuchen testen, bevor ein echter Angreifer es tut",["Ausschließlich die Ladezeit des Systems zu messen","Red-Teaming bezeichnet nur die Beta-Testphase ohne Sicherheitsfokus","Es ersetzt vollständig die Notwendigkeit von Monitoring nach dem Launch"],"Red-Teaming simuliert bewusst Angriffe (Injection, vertrauliche Daten, Toxizität), um Schwachstellen vor dem echten Betrieb zu finden."),
    q("KS504","tay","Was war die zentrale Lehre aus dem Microsoft-Tay-Vorfall (2016)?","Ohne vorheriges Red-Teaming und wirksames Monitoring kann ein System durch koordinierte Manipulation schnell entgleisen",["Chatbots sollten grundsätzlich niemals von Nutzereingaben lernen können, in keinem Fall","Der Vorfall betraf ausschließlich einen technischen Serverausfall","Microsoft ließ Tay bewusst dauerhaft online, ohne Reaktion"],"Tay wurde durch koordinierte Manipulation zum Posten beleidigender Inhalte gebracht und musste nach unter 24 Stunden abgeschaltet werden — ein Lehrstück für fehlendes Vorab-Testing."),
    q("KS505","kontinuierlich","Warum reicht ein einmaliger Test vor dem ursprünglichen Rollout nicht aus?","Änderungen an Modell, Prompts oder Datenquellen können neue Schwachstellen einführen",["Ein bestandener Test gilt automatisch für die gesamte Lebensdauer des Systems","Tests müssen nur bei technischen Störungen wiederholt werden","Kontinuierliches Testen ist ausschließlich in regulierten Branchen vorgeschrieben"],"Jede wesentliche Änderung kann neue Risiken einführen — deshalb sollte sie einen erneuten, zumindest reduzierten Testlauf auslösen."),
    q("KS506","reaktion","Warum ist ein Monitoring-Alarm ohne benannte Zuständigkeit wirkungslos?","Ohne definierte Person/Team und Reaktionszeit wird ein Alarm im Zweifel schlicht nicht bearbeitet",["Alarme werden immer automatisch und ohne menschliches Zutun behoben","Monitoring-Systeme benötigen grundsätzlich keine menschliche Reaktion","Eine benannte Zuständigkeit ist nur bei Bürozeiten relevant"],"Ein Alarm ohne klar zuständige Person und Reaktionszeit bleibt im Ernstfall unbeantwortet, egal wie gut das Monitoring technisch ist."),
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
