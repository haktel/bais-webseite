(()=> {
  const STORAGE={
    last:"bais-kis-m04-last",
    weak:"bais-kis-m04-weak",
    attempt:"bais-kis-m04-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("KS401","ausgangslage","Warum reicht eine überzeugende Produkt-Demo nicht als Anbieterprüfung?","Demo-Qualität sagt nichts über Datenverarbeitung, Vertragslage oder Sicherheitsarchitektur aus",["Eine gute Demo ist automatisch ein Beleg für sichere Datenverarbeitung","Demos sind grundsätzlich technisch nicht aussagekräftig und daher nutzlos","Anbieterprüfung ist nur bei kostenpflichtigen Tools nötig"],"Technische Beeindruckung und Datenschutz-/Vertragslage sind unabhängige Dimensionen — beide müssen separat geprüft werden."),
    q("KS402","checkliste","Was ist ein AVV/DPA im Kontext einer Anbieterprüfung?","Ein rechtlich verbindlicher Auftragsverarbeitungsvertrag, nicht nur ein Verweis auf Standard-AGB",["Ein rein technisches Dokument ohne rechtliche Bedeutung","Eine informelle E-Mail-Zusage des Vertriebs","Ein Werbematerial des Anbieters"],"Ein AVV/DPA ist ein eigenständiges, rechtlich bindendes Dokument zur Auftragsverarbeitung — eine bloße AGB-Zustimmung ersetzt es nicht."),
    q("KS403","garante","Was war ein zentraler Kritikpunkt der italienischen Behörde Garante an ChatGPT 2023?","Fehlende Rechtsgrundlage für die Datenverarbeitung und unzureichende Nutzerinformation",["Die Antwortzeiten des Dienstes waren zu langsam","ChatGPT verursachte technische Netzwerkausfälle in Italien","Der Dienst war zu diesem Zeitpunkt komplett kostenlos"],"Die Behörde bemängelte unter anderem fehlende Rechtsgrundlage, Altersverifikation und Transparenz — klassische Datenschutzthemen."),
    q("KS404","modelcards","Wofür ist eine Model Card / System Card in der Anbieterprüfung nützlich?","Sie dokumentiert bekannte Grenzen, Trainingsdatenherkunft und Sicherheitstests des Modells",["Sie ersetzt vollständig den Bedarf an einem AVV","Sie enthält ausschließlich Marketing-Aussagen ohne Prüfwert","Model Cards sind gesetzlich für jeden Anbieter identisch vorgeschrieben"],"Model/System Cards liefern strukturierte Informationen zu Grenzen und Tests — ihr Fehlen ist selbst ein relevanter Befund."),
    q("KS405","shadow","Was ist laut Modul die wirksamste Gegenmaßnahme gegen Shadow AI?","Ein spürbar schnellerer, klar kommunizierter offizieller Freigabeprozess",["Ein vollständiges technisches Verbot jeglicher AI-Nutzung","Ignorieren des Phänomens, da es ohnehin nicht kontrollierbar ist","Ausschließlich strengere disziplinarische Konsequenzen für Mitarbeitende"],"Shadow AI entsteht meist aus einem unbedienten echten Bedürfnis — ein schnellerer offizieller Prozess wirkt oft besser als reines Verbieten."),
    q("KS406","scorecard","Wozu dient eine standardisierte Scorecard bei der Tool-Freigabe?","Sie stellt sicher, dass jede Prüfung dieselben Kriterien konsistent abdeckt, statt bei null zu beginnen",["Sie ersetzt die Notwendigkeit einer rechtlichen Prüfung vollständig","Sie ist nur bei kostenlosen Tools relevant","Eine Scorecard darf pro Anbieter unterschiedliche Kriterien verwenden"],"Konsistente Kriterien verhindern, dass Prüfqualität von der Tagesform oder Erfahrung der prüfenden Person abhängt."),
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-04",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
