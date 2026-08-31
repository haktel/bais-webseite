(()=> {
  const STORAGE={
    last:"bais-sar-m06-last",
    weak:"bais-sar-m06-weak",
    attempt:"bais-sar-m06-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("SAR601","weiterfuehrung","Warum reicht eine einmalige Qualitätsprüfung beim Go-Live nicht aus?","Weil sich Quellen, Berechtigungen, Angriffsversuche und Nutzungsmuster danach laufend weiterverändern",["Weil Sprachmodelle sich nach dem Start automatisch selbst neu trainieren","Weil jede Qualitätsprüfung nach spätestens 24 Stunden technisch ungültig wird","Weil Golden Sets nach dem Go-Live gelöscht werden müssen"],"Quelldokumente veralten, Berechtigungen verschieben sich, neue Angriffsmuster entstehen — ohne laufendes Monitoring bleiben diese Verschiebungen unbemerkt."),
    q("SAR602","aircanada","Welches zentrale Argument von Air Canada wies das Tribunal im Fall Moffatt v. Air Canada zurück?","Dass der Chatbot eine separate juristische Person sei, für deren Aussagen das Unternehmen nicht hafte",["Dass der Kunde die Buchung nie tatsächlich vorgenommen habe","Dass es sich um einen technischen Serverfehler ohne AI-Beteiligung gehandelt habe","Dass die Bereavement-Fare-Richtlinie zum Zeitpunkt der Anfrage noch gar nicht existiert habe"],"Das Tribunal entschied im Februar 2024, Air Canada könne nicht erklären, warum es für Chatbot-Aussagen anders haften solle als für menschliche Mitarbeiter oder die eigene Webseite."),
    q("SAR603","freshness","Was soll Source-Freshness-Monitoring konkret verhindern?","Dass eine unbemerkt veraltete oder geänderte Quelle weiterhin als aktuell ausgegeben wird",["Dass Nutzer außerhalb der Geschäftszeiten auf das System zugreifen","Dass mehr als ein Nutzer gleichzeitig eine Anfrage stellt","Dass Chunking-Strategien verändert werden dürfen"],"Source-Freshness-Monitoring prüft laufend, ob referenzierte Quellen sich geändert haben, damit veraltete Antworten nicht unbemerkt produktiv bleiben."),
    q("SAR604","betrieb","Warum müssen Antwortqualität, Kosten und Latenz gemeinsam überwacht werden?","Weil eine Verbesserung in einer Dimension unbemerkt zu Verschlechterungen in einer anderen führen kann",["Weil alle drei Metriken technisch identisch berechnet werden","Weil nur eine dieser drei Metriken tatsächlich messbar ist","Weil Kosten und Latenz bei RAG-Systemen keine Rolle spielen"],"Ein System kann billig und schnell, aber inhaltlich unzuverlässig sein — oder korrekt, aber zu teuer oder zu langsam für den Praxiseinsatz. Alle drei Dimensionen gehören zusammen überwacht."),
    q("SAR605","sicherheit","Welches Beispiel gehört zu einem wirksamen Security-Monitoring für RAG-Systeme?","Protokollierung auffälliger, automatisch generierter Bild- oder Link-URLs in Antworten",["Das vollständige Abschalten aller Protokollierung zur Kostenersparnis","Die Löschung aller Logs nach 24 Stunden ohne Auswertung","Der Verzicht auf jede Form von Audit Trail"],"Auffällige Bild- oder Link-URLs können auf Exfiltrationsversuche wie im Writer.com-Fall hindeuten und sollten protokolliert, alarmiert und ausgewertet werden."),
    q("SAR606","abschluss","Was ist laut Abschlussszenario die richtige Reaktion auf eine erkannt veraltete, aber bereits ausgelieferte Antwort?","Die Antwort als möglicherweise veraltet kennzeichnen, die Quelle neu indexieren und laufende Freshness-Prüfung einführen",["Abwarten, bis der nächste reguläre Index-Lauf das Problem von selbst behebt","Das gesamte RAG-System dauerhaft abschalten","Die betroffene Richtlinie kommentarlos aus dem Index entfernen, ohne Ersatzquelle"],"Der richtige nächste Schritt ist aktives Handeln — Kennzeichnung, Re-Index und laufende Prüfung — statt passives Abwarten, wie das Abschlussszenario zeigt."),
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
