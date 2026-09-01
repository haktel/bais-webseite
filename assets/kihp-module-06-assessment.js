(()=> {
  const STORAGE={
    last:"bais-kihp-m06-last",
    weak:"bais-kihp-m06-weak",
    attempt:"bais-kihp-m06-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KIHP601","warnsignale","Welches der folgenden Muster gilt laut Modul als Warnsignal bei einer KI-gestützten Übergabenotiz?","Eine ungewöhnlich glatte, sehr sichere Formulierung zu einem eigentlich unsicheren Befund",["Eine kurze Antwortzeit der KI","Eine Antwort in einfacher Sprache","Eine Antwort mit mehreren Absätzen"],"Eine überzeugend klingende Formulierung zu einem unsicheren Befund ist ein typisches Warnsignal, das genauer geprüft werden sollte."),
    q("KIHP602","dokumentation","Welche drei Angaben sollten laut Modul bei der Dokumentation einer Auffälligkeit im Team mindestens enthalten sein?","Was aufgefallen ist, wann es aufgefallen ist und welche Situation zugrunde lag",["Nur der Name der verwendeten KI-Software","Nur das Datum, ohne weitere Angaben","Nur eine grobe Einschätzung, ohne konkrete Details"],"Was, wann und in welcher Situation sind die drei zentralen Angaben für eine nachvollziehbare Meldung im Team."),
    q("KIHP603","meldeweg","Wie wird der Meldeweg für KI-Auffälligkeiten in diesem Modul eingeordnet?","Als Teil der Qualitätssicherung, nicht als reine Bürokratie",["Als optionaler Schritt ohne praktischen Nutzen","Als Ersatz für die fachliche Prüfung von KI-Ausgaben","Als ausschließliche Aufgabe der Einrichtungsleitung"],"Der Meldeweg trägt aktiv zur Qualitätssicherung bei, indem wiederkehrende Probleme im Team sichtbar werden."),
    q("KIHP604","fehlerkultur","Was fördert laut Modul eine gesunde Fehlerkultur im Pflegeteam im Umgang mit KI?","Melden von Auffälligkeiten ohne Angst vor Schuldzuweisung",["Auffälligkeiten möglichst nicht zu erwähnen","Nur schwerwiegende Fehler zu dokumentieren","Meldungen ausschließlich anonym und ohne jede Nachverfolgung zuzulassen"],"Offenes Melden ohne Angst vor Schuldzuweisung verbessert die Qualität der KI-Nutzung im Team über die Zeit."),
    q("KIHP605","quelle","Welches Warnsignal betrifft fehlende Nachvollziehbarkeit einer KI-Aussage in der Dokumentation?","Ein Wert oder eine Beobachtung ohne erkennbare Grundlage in den Originalnotizen",["Eine Aussage, die auf die interne Übergabestruktur verweist","Eine Aussage mit Datum und Kontextangabe","Eine kurze, klar formulierte Übergabenotiz"],"Eine Aussage ohne erkennbare Grundlage in den Originalnotizen ist ein klassisches Warnsignal, das besondere Prüfung verdient."),
    q("KIHP606","lernen","Wozu dient das systematische Melden von Auffälligkeiten im Pflegeteam laut Modul langfristig?","Um wiederkehrende Probleme im KI-Einsatz systematisch zu erkennen und zu vermeiden",["Um einzelne Mitarbeitende für Fehler verantwortlich zu machen","Um die Nutzung von KI-Tools im Team grundsätzlich einzuschränken","Um die Meldung an eine externe Behörde weiterzuleiten"],"Ziel ist die kontinuierliche Verbesserung des KI-Einsatzes im Team, nicht die Zuweisung individueller Schuld."),
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
