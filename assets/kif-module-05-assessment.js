(()=> {
  const STORAGE={
    last:"bais-kif-m05-assessment-last",
    weak:"bais-kif-m05-assessment-weak",
    attempt:"bais-kif-m05-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("QUE01","quellen","Was zeichnet eine konkrete Quellenangabe aus?","Ein benannter Autor bzw. eine benannte Studie mit Jahr, die sich nachprüfen lässt",["Ein möglichst selbstsicherer Tonfall","Eine besonders lange Antwort","Die Verwendung von Fachbegriffen"],"Nur eine konkret benannte, auffindbare Quelle erlaubt eine echte Überprüfung."),
    q("QUE02","quellen","Warum ist 'Studien zeigen...' ohne weitere Angabe problematisch?","Weil sich ohne konkrete Studie nicht überprüfen lässt, ob die Aussage stimmt",["Weil das grammatikalisch falsch ist","Weil das technisch nicht verarbeitet werden kann","Weil es sich um eine verbotene Formulierung handelt"],"Eine vage Quellenangabe klingt nach Beleg, ist aber nicht überprüfbar."),
    q("QUE03","quellen","Was ist der Unterschied zwischen 'belegt' und 'vage' im Live-Lab dieses Moduls?","'Belegt' nennt Autor und Jahr konkret, 'vage' nennt nur einen pauschalen Sammelbegriff wie 'Experten'",["Es gibt keinen inhaltlichen Unterschied","'Vage' ist immer falsch, 'belegt' immer richtig","'Belegt' bedeutet automatisch geprüfte Richtigkeit"],"Eine konkrete Quellenangabe ist die Voraussetzung für eine echte Überprüfung - ihre bloße Existenz macht die Aussage aber noch nicht automatisch wahr."),
    q("QUE04","quellen","Was ist der sinnvollste nächste Schritt bei einer vagen Quellenangabe wie 'Experten zufolge'?","Konkret nachfragen oder recherchieren, welche Quelle genau gemeint ist",["Die Aussage automatisch als falsch verwerfen","Die Aussage ungeprüft übernehmen","Die Formulierung einfach umformulieren, ohne den Inhalt zu prüfen"],"Erst die konkrete Quelle erlaubt eine echte Prüfung der Aussage."),
    q("QUE05","quellen","Warum reicht eine vorhandene Quellenangabe allein nicht als Garantie für Richtigkeit?","Weil auch eine genannte Quelle falsch zitiert, veraltet oder von einem KI-Modell erfunden sein kann",["Weil Quellenangaben grundsätzlich immer falsch sind","Weil das nur bei mündlichen Quellen gilt","Weil Zitate technisch nicht möglich sind"],"Eine Quellenangabe macht eine Aussage prüfbar - die Prüfung selbst muss trotzdem stattfinden."),
    q("QUE06","quellen","Was ist ein 'konfabuliertes Zitat'?","Ein von einem KI-Modell plausibel erfundenes, aber tatsächlich nicht existierendes Zitat oder Quellenangabe",["Ein besonders gut belegtes Zitat","Ein Zitat aus einer Primärquelle","Ein Zitat, das mehrfach überprüft wurde"],"Ein Modell kann eine Quellenangabe erzeugen, die genauso aussieht wie eine echte, aber frei erfunden ist."),
    q("QUE07","quellen","Was ist ein sinnvoller Testschritt bei einer KI-genannten Quelle?","Die genannte Quelle aktiv suchen und prüfen, ob sie tatsächlich existiert und die Aussage stützt",["Der Quellenangabe automatisch vertrauen, weil sie konkret aussieht","Die Quelle ignorieren, wenn der Text plausibel klingt","Nur die Formatierung der Quellenangabe prüfen"],"Erst die aktive Suche zeigt, ob eine plausibel klingende Quelle real ist."),
    q("QUE08","quellen","Was ist die zentrale Lehre aus diesem Modul zu KI-generierten Quellenangaben?","Eine Quellenangabe ist ein Ausgangspunkt für Prüfung, kein automatischer Beweis",["Quellenangaben sind bei KI-Texten grundsätzlich überflüssig","Jede genannte Quelle ist automatisch korrekt","Nur handschriftliche Quellen zählen als verlässlich"],"Prüfbarkeit ist der Wert einer Quellenangabe - nicht ihre bloße Existenz."),

    q("PRI01","primaersekundaer","Was ist eine Primärquelle?","Die ursprüngliche Quelle einer Information, z. B. die Original-Studie selbst",["Eine Zusammenfassung einer Zusammenfassung","Ein Social-Media-Post über ein Thema","Eine KI-generierte Interpretation eines Themas"],"Primärquellen liegen am nächsten am eigentlichen Ursprung einer Information."),
    q("PRI02","primaersekundaer","Was ist eine Sekundärquelle?","Eine Quelle, die eine Primärquelle beschreibt, interpretiert oder zusammenfasst",["Eine Quelle, die immer falscher ist als die Primärquelle","Eine Quelle, die nie verwendet werden darf","Eine Quelle ausschließlich aus sozialen Medien"],"Sekundärquellen können nützlich sein, sollten aber im Zweifel gegen die Primärquelle geprüft werden."),
    q("PRI03","primaersekundaer","Warum lohnt sich bei einer wichtigen Aussage der Blick in die Primärquelle?","Weil Sekundärquellen (auch KI-Zusammenfassungen) Inhalte verzerren oder falsch wiedergeben können",["Weil Primärquellen immer kürzer sind","Weil Sekundärquellen gesetzlich verboten sind","Weil das keinen praktischen Unterschied macht"],"Jede Zwischenstufe der Wiedergabe ist eine zusätzliche Fehlerquelle."),
    q("PRI04","primaersekundaer","Was ist ein Risiko, wenn man ausschließlich KI-Zusammenfassungen von Studien liest?","Man übernimmt automatisch auch mögliche Verzerrungen oder Fehler der Zusammenfassung",["Es gibt dabei kein zusätzliches Risiko","KI-Zusammenfassungen sind immer präziser als die Originalstudie","Das betrifft nur naturwissenschaftliche Studien"],"Eine Zusammenfassung ist immer eine Interpretation - mit dem Risiko, etwas Wichtiges zu verändern oder wegzulassen."),
    q("PRI05","primaersekundaer","Wann ist eine Sekundärquelle als alleinige Grundlage besonders riskant?","Bei folgenreichen Entscheidungen, bei denen Details der Primärquelle entscheidend sein könnten",["Bei rein privaten, folgenlosen Alltagsfragen","Nie - Sekundärquellen sind immer ausreichend","Nur bei historischen Themen"],"Je höher die Konsequenz einer Entscheidung, desto wichtiger die Prüfung an der Primärquelle."),
    q("PRI06","primaersekundaer","Was gehört zu einer guten Recherchegewohnheit im Umgang mit KI-Antworten?","Bei wichtigen Aussagen zur Primärquelle zurückverfolgen, nicht bei der KI-Zusammenfassung stehen bleiben",["Ausschließlich der ersten gefundenen Quelle vertrauen","Primärquellen grundsätzlich ignorieren","Nur Quellen auf Deutsch akzeptieren"],"Das Zurückverfolgen zur Primärquelle ist der zuverlässigste Weg, eine Aussage wirklich zu prüfen."),

    q("MED01","medien","Was geschah 2023 öffentlich bekannt bei CNET im Zusammenhang mit KI-generierten Finanzartikeln?","Mehrere Artikel enthielten sachliche und rechnerische Fehler und mussten korrigiert werden",["CNET gewann dafür einen Journalismus-Preis","Es gab keinerlei Fehler in den Artikeln","CNET stellte den Einsatz von KI komplett ohne Anlass ein"],"Der Fall zeigt, dass auch etablierte Medienhäuser KI-generierte Inhalte sorgfältig gegenprüfen müssen."),
    q("MED02","medien","Was wurde bei Sports Illustrated Ende 2023 öffentlich bekannt?","Das Magazin veröffentlichte Artikel unter KI-generierten Autorenprofilen mit KI-generierten Porträtfotos",["Das Magazin stellte den Betrieb komplett ein","Es handelte sich um eine offiziell angekündigte, transparente Testreihe","Alle Artikel waren vollständig von echten Journalist:innen verfasst"],"Der Fall wurde von Lesern und Fachmedien aufgedeckt und führte zu Konsequenzen für Verantwortliche."),
    q("MED03","medien","Was war das Problem bei Googles AI-Overviews-Funktion im Mai 2024?","Die automatisierte Zusammenfassung gab teils absurde, teils gefährliche Empfehlungen wieder, die aus unzuverlässigen Quellen (z. B. Satire-Beiträgen) stammten",["Die Funktion funktionierte fehlerfrei und wurde ausgebaut","Es gab keinerlei öffentliche Berichterstattung darüber","Die Funktion betraf ausschließlich Bildersuche"],"Der Fall zeigt, dass automatisiert zusammengefasste Web-Inhalte die Zuverlässigkeit ihrer Quellen nicht automatisch mitprüfen."),
    q("MED04","medien","Was haben die Fälle CNET, Sports Illustrated und Google AI Overviews gemeinsam?","In allen Fällen fehlte eine ausreichende menschliche Qualitätsprüfung vor der Veröffentlichung",["Alle drei Fälle betrafen ausschließlich Bildinhalte","In keinem der Fälle gab es öffentliche Kritik","Alle drei Fälle wurden nie korrigiert"],"Alle drei zeigen: Automatisierung ersetzt nicht die redaktionelle Prüfung vor Veröffentlichung."),
    q("MED05","medien","Welche Lehre lässt sich aus dem CNET-Fall für den eigenen Umgang mit KI-Texten ziehen?","Auch scheinbar fertige, professionell wirkende KI-Texte brauchen eine inhaltliche Prüfung vor Veröffentlichung",["Finanzthemen sind für KI-Texte besonders unproblematisch","Redaktionelle Prüfung ist bei KI-Texten überflüssig","Fehler in KI-Texten sind ausgeschlossen, wenn der Stil professionell wirkt"],"Professioneller Stil ist kein Indikator für inhaltliche Richtigkeit."),
    q("MED06","medien","Was zeigt der Google-AI-Overviews-Fall zum Thema Quellenqualität?","Eine automatisierte Zusammenfassung ist nur so gut wie die Zuverlässigkeit ihrer zugrunde liegenden Quellen",["Zusammenfassungen sind grundsätzlich unabhängig von ihren Quellen korrekt","Das Problem betraf ausschließlich eine einzelne Suchanfrage","Automatisierte Web-Zusammenfassungen benötigen keine Qualitätsprüfung"],"Wenn die zugrunde liegenden Quellen unzuverlässig sind, wird auch die automatisierte Zusammenfassung unzuverlässig."),

    q("PRA01","praxis","Was ist ein sinnvoller erster Prüfschritt bei einer KI-Antwort mit einer konkreten Studienangabe?","Nachschauen, ob die genannte Studie tatsächlich existiert und die Aussage stützt",["Der Angabe automatisch vertrauen","Die Studie ignorieren, wenn der Rest des Textes plausibel klingt","Nur die Jahreszahl der Studie merken"],"Nur eine aktive Prüfung zeigt, ob eine genannte Quelle real und passend ist."),
    q("PRA02","praxis","Was gehört zu einer professionellen Qualitätsprüfung vor Veröffentlichung eines KI-unterstützten Textes?","Fakten-Check, Quellenprüfung und eine zweite unabhängige Durchsicht",["Ausschließlich Rechtschreibprüfung","Nur eine automatische Formatierung","Veröffentlichung ohne weitere Prüfung, wenn der Text gut klingt"],"Sprachliche Qualität allein sagt nichts über inhaltliche Richtigkeit aus."),
    q("PRA03","praxis","Warum ist die Kombination aus Modul 2 (Warnsignal-Muster) und Modul 5 (Quellenprüfung) besonders wirksam?","Beide zusammen prüfen sowohl Formulierung (Sicherheitssprache) als auch Beleglage (Quellen) einer Aussage",["Beide Module behandeln exakt denselben Inhalt doppelt","Modul 5 ersetzt Modul 2 vollständig","Die Kombination ist für den Alltag nicht relevant"],"Formulierung und Beleglage sind zwei unabhängige Signale, die sich sinnvoll ergänzen."),
    q("PRA04","praxis","Was ist eine gute Gewohnheit beim Lesen eines KI-generierten Textes mit mehreren Fakten?","Jede einzelne konkrete Zahl oder Quellenangabe gezielt markieren und einzeln prüfen",["Nur den ersten Satz des Textes prüfen","Dem gesamten Text pauschal vertrauen oder pauschal misstrauen","Ausschließlich die Länge des Textes bewerten"],"Einzelprüfung jeder konkreten Aussage ist gründlicher als ein pauschales Urteil über den ganzen Text."),
    q("PRA05","praxis","Was ist die zentrale Botschaft von Modul 5 für den Arbeitsalltag?","Sourcing-Qualität aktiv einschätzen, bevor ein KI-Text weiterverwendet oder veröffentlicht wird",["Quellenprüfung ist ausschließlich Aufgabe von Journalist:innen","Ein professionell klingender Text braucht keine weitere Prüfung","Quellenangaben sind bei internen Texten grundsätzlich irrelevant"],"Die in diesem Modul gelernte Klassifizierung soll genau diese Prüfung zur Routine machen.")
  ];

  const dynamicFactories=[
    ()=>{
      const samples=[
        {text:"Laut Weber (2020) sank die Fehlerquote im Testzeitraum deutlich.",route:"belegt"},
        {text:"Experten zufolge verbessert sich die Effizienz durch Automatisierung spürbar.",route:"vage"},
        {text:"Die Rücklaufquote lag bei 47,3 % im letzten Quartal.",route:"unbelegt"}
      ];
      const s=samples[Math.floor(Math.random()*samples.length)];
      const labels={belegt:"Belegt - konkrete Quellenangabe vorhanden",vage:"Vage - nur pauschale Quelle genannt",unbelegt:"Unbelegt - konkrete Zahl ganz ohne Quelle"};
      return q("D-CITE-"+s.text.length,"quellen",`Wie würdest du diese Aussage einordnen: "${s.text}"?`,labels[s.route],Object.entries(labels).filter(([k])=>k!==s.route).map(([,v])=>v),"Die Einstufung richtet sich danach, ob eine konkrete, eine nur vage oder gar keine Quelle genannt wird.");
    },
    ()=>{
      const cases=[
        {who:"CNET",what:"mehrere KI-generierte Finanzartikel mit sachlichen und rechnerischen Fehlern (2023)"},
        {who:"Sports Illustrated",what:"Artikel unter KI-generierten Autorenprofilen mit erfundenen Porträtfotos (2023)"},
        {who:"Googles AI-Overviews-Funktion",what:"absurde bis riskante automatisierte Zusammenfassungen aus unzuverlässigen Quellen (2024)"}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("D-MEDCASE-"+c.who.length,"medien",`Was ist die zentrale Lehre aus dem bekannt gewordenen Fall von ${c.who} (${c.what})?`,"Automatisiert erzeugte oder zusammengefasste Inhalte brauchen eine menschliche Qualitätsprüfung vor Veröffentlichung",["Der Fall zeigt, dass automatisierte Inhalte grundsätzlich keine Prüfung benötigen","Es gab dadurch keinerlei öffentliche Reaktion","Der Fall betraf ausschließlich interne, nie veröffentlichte Inhalte"],"Alle drei Fälle zeigen reale Konsequenzen fehlender redaktioneller Prüfung vor Veröffentlichung.");
    },
    ()=>{
      const options=[
        {text:"die Original-Studie selbst lesen",primary:true},
        {text:"nur eine KI-Zusammenfassung der Studie lesen",primary:false}
      ];
      const opt=options[Math.floor(Math.random()*options.length)];
      return q("D-PRIMARY-"+opt.text.length,"primaersekundaer",`Ist "${opt.text}" der zuverlässigere Weg, eine wichtige Aussage zu prüfen?`,opt.primary?"Ja - die Primärquelle enthält keine zusätzliche Verzerrung durch Zusammenfassung":"Nein - eine Zusammenfassung kann Details verändern oder weglassen",[opt.primary?"Nein - eine Zusammenfassung kann Details verändern oder weglassen":"Ja - die Primärquelle enthält keine zusätzliche Verzerrung durch Zusammenfassung","Beide Wege sind immer gleich zuverlässig","Das hängt ausschließlich von der Textlänge ab"],"Jede Zwischenstufe der Wiedergabe (auch eine KI-Zusammenfassung) ist eine zusätzliche mögliche Fehlerquelle.");
    }
  ];

  const shuffle=array=>{
    const copy=[...array];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  };

  const weak=()=>JSON.parse(localStorage.getItem(STORAGE.weak)||"{}");
  const saveWeak=value=>localStorage.setItem(STORAGE.weak,JSON.stringify(value));

  function selectQuestions(count=12){
    const previous=new Set(JSON.parse(localStorage.getItem(STORAGE.last)||"[]"));
    const weakness=weak();
    const dynamic=dynamicFactories.map(factory=>factory());
    const pool=[...BANK,...dynamic];
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
      questions=selectQuestions(12);answered=0;correctCount=0;
      const attempt=Number(localStorage.getItem(STORAGE.attempt)||0)+1;
      localStorage.setItem(STORAGE.attempt,String(attempt));
      counter.textContent=`Versuch ${attempt} · 12 Fragen aus einem rotierenden Pool`;
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-05",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
