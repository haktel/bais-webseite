(()=> {
  const STORAGE={
    last:"bais-eua-m05-last",
    weak:"bais-eua-m05-weak",
    attempt:"bais-eua-m05-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("EU501","providerpflicht","Was gehört zur technischen Dokumentation eines Hochrisiko-Systems, die der Provider erstellen muss?","Zweck, Architektur, Trainingsdaten, Leistungskennzahlen und bekannte Grenzen des Systems",["Nur der Verkaufspreis des Systems","Nur eine Liste zukünftiger Marketingkampagnen","Nur der Name der Entwicklerfirma ohne weitere Details"],"Die technische Dokumentation muss das System über den gesamten Lebenszyklus nachvollziehbar machen, nicht nur oberflächliche Angaben enthalten."),
    q("EU502","deployerpflicht","Welche Pflicht kann speziell bestimmte Deployer (u. a. öffentliche Stellen) vor dem erstmaligen Einsatz eines Hochrisiko-Systems treffen?","Eine Grundrechte-Folgenabschätzung (Fundamental Rights Impact Assessment) durchzuführen",["Eine eigene technische Dokumentation komplett neu zu erstellen","Das System selbst neu zu programmieren","Eine eigene Konformitätsbewertung wie ein Provider durchzuführen"],"Bestimmte Deployer müssen vorab prüfen und dokumentieren, wie sich der Einsatz auf Grundrechte Betroffener auswirken kann."),
    q("EU503","aufsicht","Was unterscheidet formale von wirksamer menschlicher Aufsicht?","Wirksame Aufsicht bedeutet, ein Ergebnis tatsächlich verstehen, hinterfragen und ablehnen zu können",["Formale Aufsicht ist immer strenger als wirksame Aufsicht","Beide Begriffe bedeuten in der Praxis dasselbe","Wirksame Aufsicht erfordert immer eine zweite AI, die die erste kontrolliert"],"Ein Klick auf „Bestätigen” ohne echtes Verständnis ist reine Formalität, keine wirksame Kontrolle."),
    q("EU504","praxisfall","Warum stoppte ein niederländisches Gericht 2020 den Einsatz von SyRI?","Weil weder Betroffene noch Gerichte nachvollziehen konnten, wie die Risikoscores zustande kamen — ein Verstoß gegen das Recht auf Privatsphäre",["Weil SyRI technisch fehlerhaft programmiert war","Weil SyRI ausschließlich privatwirtschaftlich genutzt wurde","Weil SyRI keine Trainingsdaten verwendete"],"Das Bezirksgericht Den Haag stellte einen Verstoß gegen Art. 8 EMRK fest, unter anderem wegen fehlender Nachvollziehbarkeit der Risikoscores."),
    q("EU505","logging","Was gehört mindestens in ein aussagekräftiges Nutzungsprotokoll eines Hochrisiko-Systems?","Zeitpunkt der Nutzung, verwendete Eingabedaten, erzeugtes Ergebnis und verantwortliche Person",["Nur die IP-Adresse des Servers","Nur der Name des Softwareherstellers","Nur die Softwareversion ohne weitere Angaben"],"Nachvollziehbarkeit erfordert, dass man im Nachhinein rekonstruieren kann, was wann von wem verantwortet wurde."),
    q("EU506","register","Wofür dient ein internes AI-System-Register?","Als zentraler Überblick, welches AI-System wofür genutzt wird, mit welcher Risikoeinstufung und wer verantwortlich ist",["Als reine Marketingliste für Kund:innen","Als Ersatz für die technische Dokumentation des Providers","Als gesetzlich vorgeschriebenes öffentliches Verzeichnis für jedes Unternehmen"],"Ein Register ist die praktische Grundlage, um Dokumentations- und Aufsichtspflichten unternehmensweit konsistent zu erfüllen."),
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
