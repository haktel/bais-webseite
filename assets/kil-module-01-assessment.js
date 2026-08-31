(()=> {
  const STORAGE={
    last:"bais-kil-m01-last",
    weak:"bais-kil-m01-weak",
    attempt:"bais-kil-m01-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KL101","strategie","Was unterscheidet eine belastbare AI-Strategie von reinem Tool-Enthusiasmus?","Sie verknüpft konkrete Geschäftsziele mit messbarem Nutzen, Aufwand und Risiko",["Sie listet möglichst viele KI-Tools auf, die im Markt verfügbar sind","Sie wird ausschließlich von der IT-Abteilung entschieden","Sie verzichtet bewusst auf Kennzahlen, um Innovation nicht zu bremsen"],"Strategische Einordnung heißt: nicht 'Was ist möglich?', sondern 'Welches Geschäftsproblem wird mit welchem Aufwand und Risiko gelöst?'"),
    q("KL102","reifegrad","Ein Pilotprojekt läuft seit drei Monaten ohne definierte Erfolgskriterien. Was ist das Kernproblem?","Ohne Stop/Go-Kriterien lässt sich weder Erfolg noch Misserfolg objektiv bewerten",["Drei Monate sind für ein Pilotprojekt grundsätzlich zu kurz","Das Projekt sollte sofort unternehmensweit ausgerollt werden","Pilotprojekte benötigen keine Erfolgskriterien, nur Enthusiasmus im Team"],"Portfolio-Entscheidungen brauchen vorab festgelegte, messbare Kriterien — sonst wird aus dem Piloten ein Dauerzustand."),
    q("KL103","value","Ein Use Case verspricht hohen Nutzen, aber die Datengrundlage ist unvollständig und ungeprüft. In welches Feld gehört er im Portfolio?","Pilotieren — mit klar definierten Kriterien, die die Evidenz erst schaffen",["Sofort skalieren, da der Nutzen im Vordergrund steht","Stoppen, da jede Unsicherheit ein Ausschlusskriterium ist","Beobachten, ohne dass jemand aktiv daran arbeitet"],"Hoher plausibler Nutzen bei offener Evidenz ist der klassische Pilot-Fall."),
    q("KL104","governance","Wer sollte die endgültige Freigabe für den unternehmensweiten Rollout geben?","Die Führungsebene, gestützt auf Kennzahlen aus dem Piloten und eine Risikobewertung",["Ausschließlich die Mitarbeitenden, die den Piloten technisch umgesetzt haben","Der KI-Anbieter, da er die Tool-Fähigkeiten am besten kennt","Niemand — der Rollout ergibt sich automatisch aus positivem Feedback"],"Verantwortung bleibt bei der Führung: Evidenz plus Risikoabwägung, nicht Stimmung oder Tool-Marketing."),
    q("KL105","widerstand","Ein Bereich lehnt AI-Einführung mit 'das nimmt uns die Arbeit weg' ab. Was ist der sinnvollste erste Schritt?","Konkret klären, welche Teilaufgaben betroffen sind und wie sich Rollen verändern statt verschwinden",["Die Einführung ohne weitere Diskussion sofort erzwingen","Das Thema komplett fallen lassen, um Konflikte zu vermeiden","Nur den lautesten Kritiker versetzen"],"Change-Widerstand ernst nehmen heißt: konkretisieren statt pauschalisieren."),
    q("KL106","skalierung","Ein Pilot hat die Kriterien erfüllt. Was gehört zwingend zum nächsten Schritt?","Ein Rollout-Plan mit KPIs, Verantwortlichkeiten und einem Review-Zeitpunkt",["Sofortiger Rollout ohne weitere Planung, da die Kriterien ja erfüllt sind","Ein weiterer, inhaltlich identischer Pilot zur Sicherheit","Die Entscheidung wird an den nächsten Piloten-Owner delegiert, ohne Dokumentation"],"Erfolgreich pilotiert ist nicht gleich fertig skaliert — ohne KPIs, Owner und Review fehlt die Steuerungsgrundlage."),
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
