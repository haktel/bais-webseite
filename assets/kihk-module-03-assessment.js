(()=> {
  const STORAGE={
    last:"bais-kihk-m03-last",
    weak:"bais-kihk-m03-weak",
    attempt:"bais-kihk-m03-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHK301","verantwortung","Warum kann laut Modul die Verantwortung für eine Diagnose- oder Therapieentscheidung nicht an ein KI-System delegiert werden?","Weil Verantwortung voraussetzt, dass eine Person für die Entscheidung einsteht und dafür zur Rechenschaft gezogen werden kann",["Weil KI-Systeme technisch keine Texte ausgeben können","Weil Verantwortung gesetzlich nicht definiert ist","Weil nur Pflegekräfte, nie Ärztinnen und Ärzte, Verantwortung tragen"],"Ein System kann keine Verantwortung im Sinne von Rechenschaftspflicht übernehmen — das bleibt an eine Person gebunden."),
    q("KIHK302","konfidenz","Was gilt laut Modul für eine besonders sicher formulierte KI-Ausgabe?","Sie ist deshalb nicht automatisch inhaltlich richtig",["Sie kann ohne weitere Prüfung übernommen werden","Sie ist grundsätzlich zuverlässiger als eine vorsichtig formulierte Ausgabe","Sie ersetzt die fachliche Bewertung, wenn sie Quellen nennt"],"Tonfall und Selbstbewusstsein einer Ausgabe sagen nichts über deren inhaltliche Richtigkeit aus."),
    q("KIHK303","eskalation","Was ist laut Modul der richtige nächste Schritt bei einem widersprüchlichen oder unklaren KI-Hinweis?","Rücksprache über den bekannten Eskalationsweg der Einrichtung",["Den Hinweis trotz Unklarheit direkt übernehmen","Den Hinweis vollständig ignorieren, ohne ihn zu dokumentieren","Warten, bis sich die Unsicherheit von selbst klärt"],"Eskalation an eine erfahrenere Fachperson ist der vorgesehene, sichere Weg bei Unsicherheit."),
    q("KIHK304","grenze","Was ist laut Modul die zentrale Grenze im Umgang mit klinischer KI-Unterstützung?","KI liefert Hinweise, trifft aber niemals selbst die Diagnose- oder Therapieentscheidung",["KI darf entscheiden, wenn die Fallzahl hoch genug ist","Die Grenze gilt nur bei seltenen Erkrankungen","Ab einem bestimmten Konfidenzwert darf KI entscheiden"],"Diese Grenze ist nicht verhandelbar und unabhängig von Fallzahl oder Konfidenzwert gültig."),
    q("KIHK305","risiko","Warum ist Zeitdruck laut Modul im klinischen Kontext besonders riskant für den Umgang mit KI-Hinweisen?","Weil eine selbstbewusst formulierte, aber falsche Ausgabe unter Zeitdruck eher unkritisch übernommen wird",["Weil KI-Systeme unter Zeitdruck automatisch genauer werden","Weil Zeitdruck die Ausgabequalität der KI technisch verbessert","Weil unter Zeitdruck keine Dokumentation mehr nötig ist"],"Zeitdruck erhöht das Risiko, eine überzeugend klingende, aber falsche Ausgabe ungeprüft zu übernehmen."),
    q("KIHK306","kultur","Wie sollte Eskalation bei unsicheren KI-Hinweisen laut Modul verstanden werden?","Als vorgesehener, sicherer Bestandteil des Standardvorgehens",["Als Zeichen mangelnder fachlicher Kompetenz","Als letztes Mittel, das nach Möglichkeit vermieden werden sollte","Als optionaler Schritt ohne Einfluss auf die Patientensicherheit"],"Eskalation ist ein regulärer, sicherer Bestandteil des Umgangs mit unsicheren KI-Hinweisen."),
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
