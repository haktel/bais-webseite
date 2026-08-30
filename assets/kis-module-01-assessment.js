(()=> {
  const STORAGE={
    last:"bais-kis-m01-assessment-last",
    weak:"bais-kis-m01-assessment-weak",
    attempt:"bais-kis-m01-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("ARC01","architektur","Was passiert technisch, wenn ein Nutzer eine Frage an ein KI-Tool stellt, das über eine Cloud-API arbeitet?","Der Prompt verlässt die eigene Infrastruktur und wird beim Anbieter verarbeitet",["Die Anfrage bleibt vollständig auf dem lokalen Gerät","Es findet grundsätzlich keine Datenübertragung statt","Die Anfrage wird nur an interne Server geschickt"],"Eine Cloud-API-Anfrage überschreitet per Definition die eigene Netzwerkgrenze."),
    q("ARC02","architektur","Was unterscheidet eine on-premise gehostete AI-Lösung von einer Cloud-API-Lösung?","Bei on-premise verlassen Daten die eigene Infrastruktur nicht",["On-premise-Lösungen benötigen keinerlei Wartung","Cloud-Lösungen sind immer schneller","Es gibt keinen relevanten Unterschied"],"Der zentrale Unterschied liegt darin, wo die Verarbeitung stattfindet und wessen Kontrolle sie unterliegt."),
    q("ARC03","architektur","Was ist eine 'Vertrauensgrenze' (Trust Boundary) im Kontext von AI-Systemen?","Der Punkt, an dem Daten von einem kontrollierten in einen weniger kontrollierten Bereich übergehen",["Eine rein rechtliche, technisch bedeutungslose Formalität","Die maximale Anzahl an Nutzenden eines Systems","Ein Synonym für Firewall"],"Jede Überschreitung einer Vertrauensgrenze verdient eine bewusste Prüfung."),
    q("ARC04","architektur","Warum reicht 'wir nutzen HTTPS' allein nicht als Sicherheitsnachweis für eine AI-Integration?","Weil HTTPS nur die Übertragung schützt, nicht was der Anbieter mit den Daten danach macht",["Weil HTTPS technisch nicht existiert","Weil HTTPS ausschließlich für E-Mails gilt","Weil HTTPS die Antwortzeit verlangsamt"],"Transportverschlüsselung und Datenverarbeitung beim Empfänger sind zwei unterschiedliche Fragen."),
    q("ARC05","architektur","Was ist ein sinnvoller erster Schritt bei der Bewertung einer neuen AI-Integration?","Den tatsächlichen Datenfluss von der Eingabe bis zur Antwort nachzeichnen",["Direkt mit der Implementierung beginnen","Die Bewertung komplett dem Anbieter überlassen","Nur die Benutzeroberfläche testen"],"Ohne den Datenfluss zu kennen, lässt sich das Risiko nicht einschätzen."),
    q("ARC06","architektur","Was bedeutet 'EU-Hosting' als Kontrollmaßnahme?","Die Datenverarbeitung findet nachweislich innerhalb der EU statt",["Der Anbieter hat seinen Firmensitz irgendwo in Europa","Alle Mitarbeitenden des Anbieters sprechen Deutsch","Das betrifft ausschließlich die Rechnungsstellung"],"EU-Hosting ist eine konkrete, prüfbare Aussage über den Verarbeitungsort."),
    q("ARC07","architektur","Warum ist die Unterscheidung zwischen Primär- und Drittanbieter bei AI-Tools sicherheitsrelevant?","Weil Daten oft an weitere Subunternehmer (Drittanbieter) weitergegeben werden können, die zusätzlich geprüft werden müssen",["Weil Drittanbieter grundsätzlich billiger sind","Weil das nur die Rechnungsstellung betrifft","Weil es keinen Unterschied macht"],"Eine vollständige Risikoprüfung schließt die gesamte Subprozessor-Kette ein."),
    q("ARC08","architektur","Was ist die zentrale Lehre aus Modul 1 für den Alltag?","Vor jeder AI-Integration den Datenfluss und jede überschrittene Vertrauensgrenze bewusst identifizieren",["AI-Tools sind grundsätzlich sicher, solange sie funktionieren","Architektur-Fragen sind ausschließlich Aufgabe der IT-Abteilung","Datenflüsse sind für den Alltag nicht relevant"],"Genau diese bewusste Prüfung soll durch den Live-Lab dieses Moduls zur Gewohnheit werden."),

    q("VER01","vertrauensgrenzen","Was zeigt der Fall des OpenAI-Bugs vom März 2023?","Ein Fehler in einer Zwischenkomponente (Redis) konnte kurzzeitig Chat-Titel und Zahlungsdaten anderer Nutzer sichtbar machen",["ChatGPT wurde daraufhin dauerhaft abgeschaltet","Es handelte sich um einen absichtlich eingebauten Werbe-Mechanismus","Der Fehler betraf ausschließlich die mobile App"],"OpenAI veröffentlichte einen öffentlichen Bericht zu dem Vorfall, der zeigt, wie Fehler in Zwischenkomponenten Vertrauensgrenzen unbeabsichtigt durchbrechen können."),
    q("VER02","vertrauensgrenzen","Was löste 2024 öffentliche Kritik an Slacks Datenschutzbestimmungen aus?","Eine Formulierung, nach der Kundennachrichten standardmäßig zum Trainieren von AI/ML-Modellen genutzt werden könnten, sofern nicht widersprochen wird",["Slack wurde komplett abgeschaltet","Es gab überhaupt keine öffentliche Reaktion","Die Kritik betraf ausschließlich die Optik der Benutzeroberfläche"],"Der Fall zeigt, wie wichtig es ist, genau zu prüfen, wofür Daten laut Anbieter-Richtlinie tatsächlich verwendet werden dürfen."),
    q("VER03","vertrauensgrenzen","Was ist das 'Oversharing'-Risiko, das im Zusammenhang mit Microsoft 365 Copilot diskutiert wurde?","Copilot kann Nutzern Inhalte anzeigen, für die zu weit gefasste interne Berechtigungen bereits vorher bestanden, aber nie genutzt wurden",["Copilot erstellt automatisch neue, zusätzliche Berechtigungen","Das Risiko betrifft ausschließlich E-Mail-Anhänge","Oversharing ist ein rein fiktives, nie beobachtetes Risiko"],"Copilot macht bestehende, zu weit gefasste Berechtigungen sichtbar nutzbar, die vorher kaum praktische Relevanz hatten."),
    q("VER04","vertrauensgrenzen","Was ist die gemeinsame Lehre aus dem Slack- und dem Copilot-Fall?","Bestehende Datenrichtlinien und Berechtigungen wirken durch AI-Tools plötzlich sichtbar bzw. relevant, die vorher kaum Beachtung fanden",["Beide Fälle betrafen ausschließlich Marketing-Abteilungen","Es gab in beiden Fällen keinerlei öffentliche Aufmerksamkeit","AI-Tools schaffen grundsätzlich neue Daten, statt bestehende offenzulegen"],"Neue AI-Funktionen machen oft sichtbar, was in bestehenden Datenstrukturen und Richtlinien bereits angelegt war."),
    q("VER05","vertrauensgrenzen","Was ist eine praktische Konsequenz aus dem OpenAI-Redis-Vorfall für eigene AI-Integrationen?","Auch scheinbar unabhängige Zwischenkomponenten (Caches, Queues) können Vertrauensgrenzen ungewollt durchbrechen und müssen mitgeprüft werden",["Zwischenkomponenten sind für die Sicherheit irrelevant","Nur die Datenbank selbst muss geprüft werden","Caching-Systeme werden nie für sensible Daten verwendet"],"Sicherheitsprüfungen müssen die gesamte technische Kette einschließen, nicht nur den sichtbaren Endpunkt."),
    q("VER06","vertrauensgrenzen","Warum reicht ein einmaliges Anbieter-Audit oft nicht aus?","Weil sich Datenverarbeitungspraktiken, Richtlinien und Subprozessoren eines Anbieters über Zeit ändern können",["Weil Audits grundsätzlich wertlos sind","Weil Anbieter ihre Praktiken nie ändern","Weil ein Audit ausschließlich einmalig gesetzlich vorgeschrieben ist"],"Kontinuierliche statt einmaliger Prüfung reduziert das Risiko unbemerkter Änderungen."),
    q("VER07","vertrauensgrenzen","Was zeigt der Vergleich zwischen dem Slack-Fall und dem OpenAI-Fall bezüglich Kommunikation?","Öffentlich nachvollziehbare Reaktion (Richtlinienänderung bzw. Postmortem) schafft mehr Vertrauen als Schweigen",["Beide Unternehmen reagierten identisch mit vollständigem Stillschweigen","Kommunikation nach einem Vorfall ist rechtlich irrelevant","Nur eines der beiden Unternehmen existiert noch"],"Transparente Aufarbeitung ist Teil einer verantwortungsvollen Reaktion auf einen Vertrauensvorfall."),
    q("VER08","vertrauensgrenzen","Was ist die zentrale Botschaft dieser drei Fälle für IT- und Security-Teams?","Vertrauensgrenzen sind nie 'ein für alle Mal' geprüft - sie brauchen wiederkehrende, konkrete Kontrolle",["Diese Fälle sind rein akademisch und ohne Praxisbezug","AI-Anbieter sind grundsätzlich vertrauenswürdiger als interne Systeme","Nach einem Vorfall besteht kein weiterer Handlungsbedarf"],"Reale Fälle bei großen, etablierten Anbietern zeigen: kontinuierliche Prüfung bleibt notwendig."),

    q("PRA01","praxis","Was gehört zu einer vollständigen Datenfluss-Dokumentation einer AI-Integration?","Ausgangspunkt, jede Zwischenstation, Zielsystem und beteiligte Drittanbieter",["Nur der Name des verwendeten Modells","Ausschließlich die Kosten pro Anfrage","Nur die Antwortzeit in Millisekunden"],"Eine vollständige Dokumentation macht jede überschrittene Grenze sichtbar und prüfbar."),
    q("PRA02","praxis","Was ist ein sinnvoller Prüfschritt vor der Einführung eines neuen AI-Tools mit Cloud-Anbindung?","Klären, welche Datenarten das Tool verarbeitet und welche Schutzmaßnahmen der Anbieter zusichert",["Das Tool sofort unternehmensweit ausrollen","Ausschließlich den Preis vergleichen","Nur die Benutzeroberfläche bewerten"],"Datenart und zugesicherte Schutzmaßnahmen bestimmen gemeinsam das tatsächliche Risiko."),
    q("PRA03","praxis","Was bedeutet es praktisch, wenn ein Live-Lab-Szenario als 'hochrisiko' eingestuft wird?","Es darf nicht ohne zusätzliche Prüfung/Freigabe in Betrieb gehen",["Es ist automatisch technisch nicht umsetzbar","Es bedeutet, dass das Tool grundsätzlich abgeschafft werden muss","Es hat keine praktische Konsequenz"],"Die Einstufung ist ein Signal für notwendige zusätzliche Kontrolle, kein automatisches Verbot des gesamten Vorhabens."),
    q("PRA04","praxis","Warum lohnt sich die Unterscheidung zwischen 'unkritisch' und 'prüfen' im Alltag?","Sie lenkt begrenzte Prüfkapazität gezielt auf die Fälle, die tatsächliches Risiko tragen",["Beide Stufen erfordern identischen Prüfaufwand","Die Unterscheidung ist rein kosmetisch","'Unkritisch' bedeutet, dass keinerlei Dokumentation nötig ist"],"Eine sinnvolle Klassifizierung spart Aufwand, ohne echte Risiken zu übersehen.")
  ];

  const dynamicFactories=[
    ()=>{
      const samples=[
        {text:"Ein internes Analyse-Tool läuft vollständig on-premise ohne Cloud-Anbindung.",route:"unkritisch"},
        {text:"Ein Cloud-Dienst fasst anonymisierte, allgemeine Markttrends zusammen.",route:"pruefen"},
        {text:"Gesundheitsdaten von Patienten werden unverschlüsselt an einen externen Cloud-Dienst übertragen.",route:"hochrisiko"}
      ];
      const s=samples[Math.floor(Math.random()*samples.length)];
      const labels={unkritisch:"Unkritisch - keine externe Vertrauensgrenze",pruefen:"Prüfen - externe Grenze, aber ohne sensible Daten ohne Schutz",hochrisiko:"Hochrisiko - sensible Daten ohne Schutzmaßnahme extern"};
      return q("D-FLOW-"+s.text.length,"architektur",`Wie würdest du dieses Szenario einstufen: "${s.text}"?`,labels[s.route],Object.entries(labels).filter(([k])=>k!==s.route).map(([,v])=>v),"Die Einstufung richtet sich danach, ob eine externe Grenze überschritten wird, ob sensible Daten betroffen sind und ob eine Schutzmaßnahme genannt wird.");
    },
    ()=>{
      const cases=[
        {who:"OpenAI",what:"ein Redis-Bug, der kurzzeitig Chat-Titel und Zahlungsdaten anderer Nutzer sichtbar machte (März 2023)"},
        {who:"Slack",what:"eine Datenschutzformulierung zur möglichen AI-Trainingsnutzung von Kundennachrichten (2024)"},
        {who:"Microsoft 365 Copilot",what:"das Sichtbarmachen bereits bestehender, zu weit gefasster interner Berechtigungen (2023/24)"}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("D-VERCASE-"+c.who.length,"vertrauensgrenzen",`Was ist die zentrale Lehre aus dem bekannt gewordenen Fall von ${c.who} (${c.what})?`,"Auch etablierte Anbieter/Tools können Vertrauensgrenzen unbeabsichtigt durchbrechen - kontinuierliche Prüfung bleibt notwendig",["Der Fall zeigt, dass große Anbieter grundsätzlich fehlerfrei arbeiten","Es gab dadurch keinerlei öffentliche oder unternehmensinterne Reaktion","Der Fall betraf ausschließlich die Marketingabteilung des jeweiligen Unternehmens"],"Alle drei Fälle zeigen reale, öffentlich bekannte Grenzüberschreitungen bei etablierten Anbietern.");
    },
    ()=>{
      const options=[
        {text:"eine vollständige Auflistung aller Subprozessoren eines Anbieters",relevant:true},
        {text:"die Schriftart der Anbieter-Website",relevant:false}
      ];
      const opt=options[Math.floor(Math.random()*options.length)];
      return q("D-SUB-"+opt.text.length,"architektur",`Ist "${opt.text}" für eine Sicherheitsprüfung einer AI-Integration relevant?`,opt.relevant?"Ja - Subprozessoren können ebenfalls Zugriff auf Daten erhalten":"Nein - das hat keinen Bezug zur Datensicherheit",[opt.relevant?"Nein - das hat keinen Bezug zur Datensicherheit":"Ja - Subprozessoren können ebenfalls Zugriff auf Daten erhalten","Beides ist gleich relevant","Das hängt ausschließlich vom Wochentag ab"],"Eine vollständige Prüfung schließt jede Stelle ein, die tatsächlich Datenzugriff erhalten könnte.");
    }
  ];

  const esc=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

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
        return `<article class="assessmentItem" data-q="${esc(item.id)}" data-topic="${esc(item.topic)}">
          <div class="assessmentMeta"><span>FRAGE ${index+1}/${questions.length}</span><span>${esc(item.topic.toUpperCase())}</span></div>
          <h3>${esc(item.prompt)}</h3>
          <div class="assessmentOptions">${options.map(option=>`<button type="button" data-answer data-correct="${option.correct}">${esc(option.text)}</button>`).join("")}</div>
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
      explain.innerHTML=`<strong>${ok?"Richtig":"Nicht ganz"}</strong><p>${esc(item.explanation)}</p>`;
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
        result.innerHTML=`<div class="gradeRow"><span class="gradeBadge grade-${esc(grade.note)}">Note ${esc(grade.note)}</span><div><strong>${correctCount}/${questions.length} richtig · ${percent}%</strong><span class="gradeLabel">${esc(grade.label)}${grade.passed?" · bestanden":" · nicht bestanden"}</span></div></div>
          <p>${esc(message)}</p>`;
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-01",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
