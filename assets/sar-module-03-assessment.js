(()=> {
  const STORAGE={
    last:"bais-sar-m03-last",
    weak:"bais-sar-m03-weak",
    attempt:"bais-sar-m03-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("SAR301","relevanz","Was ist der zentrale Unterschied zwischen Relevanz- und Berechtigungsprüfung?","Relevanz beantwortet, ob ein Treffer inhaltlich passt; Berechtigung beantwortet, ob die Person ihn sehen darf",["Es handelt sich um zwei Bezeichnungen für denselben technischen Vorgang","Berechtigungsprüfung ersetzt Relevanzprüfung in modernen Systemen vollständig","Relevanzprüfung ist nur bei Keyword Search relevant"],"Ein technisch perfekt relevanter Treffer kann trotzdem ein Fehler sein, wenn die anfragende Person keine Berechtigung für die Quelle hat — beide Prüfungen sind unabhängig nötig."),
    q("SAR302","zugriffsmodelle","Wodurch unterscheidet sich ABAC von RBAC?","ABAC vergibt Zugriff anhand von Attributen wie Abteilung oder Vertraulichkeitsstufe, RBAC anhand von Rollen",["ABAC funktioniert nur bei weniger als zehn Nutzern","RBAC berücksichtigt niemals Abteilungszugehörigkeit","ABAC und RBAC schließen sich gegenseitig technisch aus"],"RBAC bindet Zugriff an Rollen, ABAC an flexible Attribute wie Abteilung, Standort oder Vertraulichkeitsstufe — beide Modelle lösen unterschiedliche Anforderungen."),
    q("SAR303","copilot","Was war die eigentliche Ursache des dokumentierten Microsoft-365-Copilot-Oversharing-Risikos?","Über Jahre angesammelte, nie überprüfte, zu weit gefasste Berechtigungen, die Copilot erstmals praktisch auffindbar machte",["Copilot vergibt eigenständig neue, nicht autorisierte Zugriffsrechte","Microsoft speichert alle Copilot-Anfragen unverschlüsselt","Copilot funktioniert ausschließlich außerhalb der EU"],"Copilot vergibt selbst keine neuen Rechte — es macht längst bestehende, zu weit gefasste Freigaben durch einfache Sprachanfragen erstmals praktisch auffindbar."),
    q("SAR304","isolation","Was muss Tenant Isolation in einem mandantenfähigen RAG-System technisch garantieren?","Dass Retrieval niemals Treffer über Mandantengrenzen hinweg liefert, unabhängig von semantischer Ähnlichkeit",["Dass alle Mandanten dieselben Embeddings verwenden","Dass jeder Mandant eine eigene Programmiersprache für seine Anwendung nutzt","Dass Chunking bei allen Mandanten exakt gleich groß ausfällt"],"Tenant Isolation muss verhindern, dass ein Retrieval-Treffer aus Mandant A jemals bei einer Anfrage von Mandant B erscheint — unabhängig von inhaltlicher Ähnlichkeit."),
    q("SAR305","filterung","Warum sollte Berechtigungsprüfung idealerweise als Pre-Filtering statt Post-Filtering erfolgen?","Weil sonst durch Top-k-Begrenzung zulässige Treffer verloren gehen können, obwohl sie existiert hätten",["Weil Post-Filtering technisch nicht implementierbar ist","Weil Pre-Filtering grundsätzlich schneller ist als jede andere Suchmethode","Weil Post-Filtering nur bei Keyword Search überhaupt möglich ist"],"Bei Post-Filtering kann die Top-k-Begrenzung dazu führen, dass am Ende zu wenige oder keine zulässigen Treffer übrig bleiben — Pre-Filtering vermeidet das."),
    q("SAR306","audit","Was gehört zu einem wirksamen Least-Privilege-Audit?","Regelmäßige Prüfung, ob Freigaben, organisationsweite Berechtigungen und anonyme Links noch dem tatsächlichen Bedarf entsprechen",["Ein einmaliges Audit direkt nach dem Produktivstart, danach keine weitere Prüfung","Ausschließlich die Prüfung neu erstellter Dokumente","Der vollständige Verzicht auf jede Form von Zugriffsbeschränkung"],"Ein Least-Privilege-Audit ist ein laufender Prozess, der Freigaben, organisationsweite Berechtigungen, anonyme Links und verwaiste Sites regelmäßig überprüft."),
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
