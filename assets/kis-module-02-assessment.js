(()=> {
  const STORAGE={
    last:"bais-kis-m02-last",
    weak:"bais-kis-m02-weak",
    attempt:"bais-kis-m02-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KS201","identit\u00e4t","Warum sollte ein AI-Agent eine eigene Service-Identit\u00e4t statt der eines Menschen nutzen?","Damit im Audit-Log nachvollziehbar bleibt, ob der Agent oder der Mensch gehandelt hat",["Weil Service-Identit\u00e4ten grunds\u00e4tzlich schneller sind","Weil menschliche Logins technisch nicht mit AI-Systemen kompatibel sind","Es gibt keinen praktischen Unterschied, beide Varianten sind gleichwertig"],"Geteilte Identit\u00e4ten machen im Nachhinein unm\u00f6glich zu unterscheiden, ob eine Aktion vom Menschen oder vom Agenten ausgef\u00fchrt wurde."),
    q("KS202","privilege","Was ist das Hauptrisiko von 'Vollzugriff, um sicherzugehen' bei einem AI-Agenten?","Der potenzielle Schaden bei Fehlverhalten oder Manipulation ist maximal statt begrenzt",["Vollzugriff ist technisch gar nicht umsetzbar","Es gibt kein Risiko, solange der Agent 'gut trainiert' ist","Vollzugriff verlangsamt die Antwortzeit erheblich"],"Least Privilege begrenzt den Schaden im Missbrauchsfall \u2014 Vollzugriff maximiert ihn, unabh\u00e4ngig von der Ursache des Fehlverhaltens."),
    q("KS203","oauth","Warum reicht es nicht, eine OAuth-Scope-Anfrage nur oberfl\u00e4chlich zu best\u00e4tigen?","Eine grob gefasste Anfrage wie 'mail.readwrite' kann weit mehr erlauben als der eigentliche Anwendungsfall braucht",["OAuth-Scopes sind rein kosmetisch und ohne technische Wirkung","Jede Scope-Anfrage ist automatisch auf das Minimum begrenzt","Scopes betreffen ausschlie\u00dflich die Benutzeroberfl\u00e4che, nicht den Datenzugriff"],"Grobe Scopes gew\u00e4hren oft deutlich mehr Zugriff (alle Postf\u00e4cher, alle Ordner) als f\u00fcr den konkreten Anwendungsfall n\u00f6tig w\u00e4re."),
    q("KS204","copilot","Was war die eigentliche Ursache des Microsoft-365-Copilot-Oversharing-Problems?","Bereits bestehende, zu gro\u00dfz\u00fcgige Dateiberechtigungen wurden durch Copilots Suchfunktion erstmals praktisch auffindbar",["Eine neu entdeckte technische Sicherheitsl\u00fccke in Copilot selbst","Ein gezielter externer Hackerangriff auf Microsoft-Server","Copilot erstellte eigenst\u00e4ndig neue, nicht autorisierte Zugriffsrechte"],"Das Tool nutzte lediglich bereits vorhandene, oft vergessene Berechtigungen aus \u2014 es musste nichts 'hacken'."),
    q("KS205","vorbereitung","Wann sollten laut Modul Berechtigungen vor einem AI-Rollout bereinigt werden?","Vor dem Rollout, als expliziter Vorbereitungsschritt",["Erst nachdem ein konkreter Vorfall aufgetreten ist","Bereinigung ist grunds\u00e4tzlich nicht notwendig","Nur einmalig bei Unternehmensgr\u00fcndung"],"Ein AI-Rollout ist der ideale Anlass, bestehende \u00dcberberechtigung aufzudecken und zu bereinigen, bevor sie durch ein AI-Tool sichtbar/nutzbar wird."),
    q("KS206","governance","Warum braucht die Vergabe neuer Agenten-Berechtigungen einen definierten Freigabeprozess?","Ohne Prozess entstehen neue Berechtigungen informell, oft unter Zeitdruck, ohne Pr\u00fcfung",["Ein Prozess ist nur bei sehr gro\u00dfen Konzernen sinnvoll","Freigabeprozesse verhindern jegliche Nutzung von AI-Tools","Es ist ausreichend, wenn die IT-Abteilung informell zustimmt"],"Ohne klaren Prozess (Pr\u00fcfung + Freigabe + Dokumentation) entstehen Berechtigungen genau dort informell, wo Kontrolle am wichtigsten w\u00e4re."),
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
      counter.textContent=`Versuch ${attempt} \u00b7 6 Fragen aus einem rotierenden Pool`;
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
        if(credited)message="Modul-Testat erreicht \u2014 ausgezeichnete Leistung. Ein neuer Versuch verbessert deine Note weiter.";
        else if(grade.passed)message="Akademisch bestanden, aber f\u00fcr den BAIS Modul-Nachweis ist mindestens Note 2 (\u201egut\u201c, \u226581%) erforderlich. Wiederhole die Pr\u00fcfung \u2014 der n\u00e4chste Versuch verwendet andere Fragen.";
        else message="Noch nicht bestanden (mind. 50% erforderlich). Der n\u00e4chste Versuch priorisiert zus\u00e4tzlich deine schw\u00e4cheren Themen und verwendet m\u00f6glichst andere Fragen.";
        result.hidden=false;
        result.innerHTML=`<div class="gradeRow"><span class="gradeBadge grade-${grade.note}">Note ${grade.note}</span><div><strong>${correctCount}/${questions.length} richtig \u00b7 ${percent}%</strong><span class="gradeLabel">${grade.label}${grade.passed?" \u00b7 bestanden":" \u00b7 nicht bestanden"}</span></div></div>
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
