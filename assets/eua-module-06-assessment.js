(()=> {
  const STORAGE={
    last:"bais-eua-m06-last",
    weak:"bais-eua-m06-weak",
    attempt:"bais-eua-m06-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("EU601","synthese","In welcher Reihenfolge sollte der Entscheidungsweg für ein AI-System durchlaufen werden?","Rolle klären → Risikoklasse prüfen → Pflichten ableiten → Aufsicht & Dokumentation organisieren → laufend beobachten",["Erst Marketing-Materialien lesen, dann sofort produktiv gehen","Erst kaufen, danach irgendwann irgendwer prüfen lassen","Nur einmalig am Projektstart prüfen, danach nie wieder"],"Kein Schritt darf isoliert stehen — insbesondere die laufende Beobachtung nach dem Start ist Teil des Entscheidungswegs, nicht optional."),
    q("EU602","trigger","Welches der folgenden Signale ist ein klarer Eskalationstrigger?","Ein Use Case berührt einen Annex-III-Bereich und die Anbieter-Dokumentation dazu ist lückenhaft",["Das Tool hat eine neue Benutzeroberfläche bekommen","Der Anbieter hat den Firmennamen geändert","Die Lizenzkosten sind gesunken"],"Ein möglicher Annex-III-Bezug kombiniert mit lückenhafter Dokumentation ist ein klassischer, konkreter Eskalationstrigger."),
    q("EU603","weg","Was macht einen internen Eskalationsweg im Ernstfall wirksam?","Eine benannte, erreichbare Ansprechperson, ein bekannter Meldeweg und ein klarer Zeitrahmen für die erste Rückmeldung",["Ein möglichst kompliziertes, mehrstufiges Formular","Die Erwartung, dass Betroffene sich direkt an die Presse wenden","Keine feste Zuständigkeit, damit möglichst viele Personen mitentscheiden"],"Ein Eskalationsweg, den niemand kennt oder der zu langsam reagiert, existiert im Ernstfall faktisch nicht."),
    q("EU604","praxisfall_schnell","Was ermöglichte beim Ofqual-Algorithmus 2020 eine Rücknahme innerhalb weniger Tage?","Der Schaden war sichtbar, konkret benennbar und für viele Betroffene sofort spürbar, was schnell öffentlichen Druck erzeugte",["Ein Gericht hatte den Algorithmus Monate zuvor bereits verboten","Der Algorithmus wurde nie tatsächlich eingesetzt","Es gab keine betroffenen Schüler:innen, nur eine interne Testphase"],"Konkrete, unmittelbar sichtbare Schäden für viele Menschen erzeugten genug öffentlichen Druck für eine sehr schnelle politische Kehrtwende."),
    q("EU605","praxisfall_stillstand","Was unterschied die Toeslagenaffaire strukturell vom Ofqual-Fall?","Interne und externe Warnsignale blieben über Jahre folgenlos, bevor der Fall 2019 öffentlich aufgedeckt wurde",["Bei der Toeslagenaffaire gab es überhaupt keine Warnsignale im Vorfeld","Die Toeslagenaffaire wurde sofort nach Bekanntwerden korrigiert","Die Toeslagenaffaire betraf kein automatisiertes System"],"Anders als bei Ofqual führten frühe Warnsignale bei der Toeslagenaffaire nicht zu schneller Korrektur — der Schaden setzte sich über Jahre fort."),
    q("EU606","abschluss","Im Abschlussszenario bemerkt ein Teammitglied ein auffälliges Bewerbungsmuster bei lückenhafter Anbieter-Dokumentation. Was ist der richtige nächste Schritt?","Sofortige interne Eskalation und Aussetzung des automatisierten Ausschlusses, bis die Ursache geklärt ist",["Abwarten, bis sich das Muster von selbst wieder normalisiert","Die Beobachtung nur informell beim Mittagessen erwähnen","Das Tool ohne weitere Prüfung einfach weiterlaufen lassen, da es ja 'meistens' richtig liegt"],"Ein begründeter Verdacht reicht als Trigger — richtig ist sofortige, dokumentierte Eskalation statt stillem Weiterlaufenlassen."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-06",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
