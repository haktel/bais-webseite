(()=> {
  const STORAGE={
    last:"bais-eua-m03-last",
    weak:"bais-eua-m03-weak",
    attempt:"bais-eua-m03-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("EU301","artikel5","Welche der folgenden Praktiken zählt der AI Act zu den unzulässigen (verbotenen) Praktiken nach Artikel 5?","Social Scoring von Personen mit unverhältnismäßigen nachteiligen Folgen",["Ein interner Chatbot für FAQ-Antworten","Eine Rechtschreibkorrektur in einer Textverarbeitung","Ein Empfehlungsalgorithmus für interne Wissensdatenbanken"],"Social Scoring ist eine der ausdrücklich in Artikel 5 verbotenen Praktiken, unabhängig vom behaupteten Nutzen."),
    q("EU302","annexiii","Welcher der folgenden Bereiche gehört zur Annex-III-Liste der Hochrisiko-Bereiche?","Beschäftigung, z. B. Bewerbungsauswahl",["Interne Rechtschreibkorrektur","Automatische E-Mail-Zusammenfassungen","Code-Vervollständigung in der Entwicklungsumgebung"],"Annex III listet u. a. Beschäftigung, Bildung, kritische Infrastruktur, Strafverfolgung, Migration und Rechtspflege als Hochrisiko-Bereiche."),
    q("EU303","transparenz","Was verlangt der AI Act bei einem Chatbot mit begrenztem Risiko typischerweise?","Dass für Nutzende erkennbar gemacht wird, dass keine Person antwortet",["Eine vollständige technische Dokumentation wie bei Hochrisiko-Systemen","Eine vorherige Konformitätsbewertung durch eine notifizierte Stelle","Ein generelles Verbot des Einsatzes ohne behördliche Genehmigung"],"Bei begrenztem Risiko stehen Transparenzpflichten im Vordergrund — z. B. die Kennzeichnungspflicht, dass ein Chatbot kein Mensch ist."),
    q("EU304","minimal","Was gilt für ein AI-Tool mit minimalem Risiko, z. B. eine interne Rechtschreibkorrektur?","Der AI Act schreibt keine spezifischen Pflichten vor, aber Artikel 4 (AI-Literacy) gilt trotzdem",["Es gelten dieselben Pflichten wie bei Hochrisiko-Systemen","Es ist automatisch vom gesamten AI Act ausgenommen, inklusive Artikel 4","Es muss trotzdem CE-gekennzeichnet werden"],"Minimales Risiko bedeutet keine AI-Act-spezifischen Zusatzpflichten — Artikel 4 gilt aber unabhängig von der Risikostufe für jedes AI-System."),
    q("EU305","praxisfall","Warum ist der Fall Clearview AI ein Lehrbuchbeispiel für eine verbotene Praktik?","Weil das ungezielte Scraping von Gesichtsbildern zum Aufbau einer Gesichtserkennungsdatenbank genau der in Art. 5 genannten verbotenen Praktik entspricht",["Weil Clearview AI ausschließlich Hochrisiko-Systeme entwickelt hat","Weil das Unternehmen keine Deployer hatte","Weil der Fall ausschließlich GPAI-Pflichten betraf"],"Das ungezielte Auslesen von Gesichtsbildern aus dem Internet zum Aufbau einer Erkennungsdatenbank ist eine der ausdrücklich verbotenen Praktiken nach Art. 5."),
    q("EU306","pruefprozess","Wonach richtet sich die Risikoklasse eines AI-Systems in erster Linie?","Nach dem konkreten Einsatzzweck und den betroffenen Personen",["Nach dem Marketingnamen des Produkts","Nach dem Preis der Softwarelizenz","Nach der verwendeten Programmiersprache"],"Die Einstufung folgt immer aus dem konkreten Use Case — niemals aus Produktnamen oder Marketing-Versprechen eines Anbieters."),
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
