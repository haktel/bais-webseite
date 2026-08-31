(()=> {
  const STORAGE={
    last:"bais-kil-m02-last",
    weak:"bais-kil-m02-weak",
    attempt:"bais-kil-m02-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KL201","value","Was unterscheidet einen harten von einem weichen Value-Indikator?","Harte Indikatoren sind direkt messbar (z.B. Zeit, Kosten), weiche nur über Proxys wie Umfragen",["Weiche Indikatoren sind grundsätzlich wichtiger","Harte Indikatoren zählen nicht in einem Scoring-Modell","Es gibt keinen Unterschied, beide sind gleich zu behandeln"],"Value hat eine direkt messbare und eine schwerer messbare, aber nicht unwichtige Seite — beide gehören ins Modell, aber unterschiedlich behandelt."),
    q("KL202","aufwand","Welcher Kostenblock wird bei AI-Initiativen laut Modul am häufigsten unterschätzt?","Datenaufbereitung, Integration und laufender Support",["Die Tool-Lizenzkosten","Die Kosten für die erste Demo","Es gibt keine versteckten Kosten bei Cloud-Tools"],"Die sichtbare Lizenz ist selten der größte Posten — Datenaufbereitung, Integration und laufender Betrieb werden regelmäßig unterschätzt (siehe Zillow Offers)."),
    q("KL203","risiko","Warum wird rechtliches, operatives und reputatives Risiko getrennt bewertet?","Weil sie unterschiedlicher Logik folgen und unterschiedliche Gegenmaßnahmen brauchen",["Weil nur eine der drei Kategorien in der Praxis relevant ist","Um die Gesamtbewertung künstlich niedriger erscheinen zu lassen","Weil Gesetze das exakt so vorschreiben, unabhängig vom Fall"],"Ein rechtliches Risiko braucht Compliance-Maßnahmen, ein operatives einen Fallback-Prozess, ein reputatives Kommunikationsvorbereitung — vermischt man sie, verschwinden die richtigen Gegenmaßnahmen."),
    q("KL204","modell","Was ist an einer Gewichtung wie 'Value × 2' im Scoring-Modell entscheidend?","Sie ist eine bewusste, dokumentierte Führungsentscheidung, keine objektive Wahrheit",["Sie ist mathematisch die einzig korrekte Gewichtung","Jedes Unternehmen muss exakt diese Gewichtung übernehmen","Die Gewichtung darf nie verändert werden, sobald sie einmal festgelegt ist"],"Die Gewichtung spiegelt Unternehmenspriorität wider (z.B. Risikoaversion in regulierten Branchen) — sie muss transparent begründet, nicht als Naturgesetz behandelt werden."),
    q("KL205","bias","Was ist Sunk-Cost-Bias im Kontext eines Scoring-Modells?","Ein bereits gestartetes Projekt wird künstlich hochbewertet, um frühere Investitionen zu rechtfertigen",["Die Tendenz, neue Projekte immer niedriger zu bewerten als alte","Ein Fehler, der nur bei Risiko-Scores auftritt, nie bei Value","Die korrekte Berücksichtigung bereits getätigter Investitionen"],"Sunk-Cost-Bias färbt die Bewertung durch vergangene Investitionen statt durch den tatsächlichen zukünftigen Nutzen — ein Klassiker, den unabhängige Zweitschätzung aufdeckt."),
    q("KL206","modell","Wozu dient der Vergleich unabhängiger Scores von zwei Personen?","Große Abweichungen zeigen, wo Annahmen unterschiedlich sind und Diskussion nötig ist",["Um am Ende einfach den Mittelwert zu bilden, ohne die Abweichung zu betrachten","Um die schnellere Person als allein maßgeblich zu bestimmen","Er ist reine Formsache ohne inhaltlichen Nutzen"],"Der eigentliche Wert liegt nicht im Durchschnittswert, sondern in der sichtbaren Abweichung zweier unabhängiger Einschätzungen — dort liegt Diskussionsbedarf."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-02",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
