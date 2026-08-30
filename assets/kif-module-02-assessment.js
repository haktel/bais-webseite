(()=> {
  const STORAGE={
    last:"bais-kif-m02-assessment-last",
    weak:"bais-kif-m02-assessment-weak",
    attempt:"bais-kif-m02-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("H01","halluzination","Was ist eine Halluzination im technischen Sinn - nicht als Absicht des Modells?","Eine statistisch plausible, aber sachlich falsche oder erfundene Fortsetzung",["Ein bewusster Täuschungsversuch des Modells","Ein reiner Übersetzungsfehler","Ein Absturz der Serverinfrastruktur"],"Das Modell 'lügt' nicht - es füllt Lücken mit der wahrscheinlichsten Formulierung, ohne einen Wahrheitsbegriff zu haben."),
    q("H02","halluzination","Bei welcher Art von Anfrage halluzinieren Modelle besonders häufig?","Bei sehr spezifischen, seltenen Fakten (genaue Zahlen, Quellen, Randthemen)",["Bei sehr allgemeinen, weit verbreiteten Themen","Nur bei Anfragen in Fremdsprachen","Nur bei sehr kurzen Prompts"],"Je seltener ein exaktes Detail in den Trainingsdaten vorkam, desto eher wird plausibel geraten statt zitiert."),
    q("H03","halluzination","Was passierte im Februar 2023 bei der öffentlichen Demo von Googles Chatbot Bard?","Er behauptete fälschlich, das James-Webb-Teleskop habe das erste Foto eines Exoplaneten gemacht",["Er verweigerte jede Antwort auf Fragen zur Raumfahrt","Er gab ausschließlich korrekte, mit Quellen belegte Antworten","Der Auftritt wurde wegen eines Serverausfalls abgesagt"],"Die falsche, aber selbstsicher formulierte Behauptung wurde breit berichtet und zeigte, wie überzeugend Halluzinationen wirken können."),
    q("H04","halluzination","Woran erkennt man ein typisches Halluzinations-Warnsignal in einem KI-Text?","An präzise wirkenden Details (Zahl, Jahr, Zitat), die sich nicht verifizieren lassen",["An besonders kurzen Sätzen","An der verwendeten Sprache","An der Antwortzeit des Modells"],"Nicht auffindbare, aber genau klingende Details sind ein klassisches Muster erfundener Inhalte."),
    q("H05","halluzination","Warum ist selbstsicherer Tonfall kein Beleg für Richtigkeit?","Weil Modelle unsichere und gesicherte Aussagen sprachlich gleich selbstsicher formulieren können",["Weil Modelle bei Unsicherheit immer automatisch warnen","Weil selbstsicherer Tonfall technisch unmöglich ist","Weil nur falsche Aussagen selbstsicher klingen"],"Die sprachliche Form einer Antwort sagt nichts über ihre inhaltliche Zuverlässigkeit aus."),
    q("H06","halluzination","Was ist der sicherste erste Schritt bei einer KI-Aussage mit konkreten Fakten?","Sie gegen eine unabhängige, verlässliche Quelle prüfen",["Sie ungeprüft übernehmen, wenn sie plausibel klingt","Sie ignorieren, wenn sie kompliziert klingt","Die Formulierung nur sprachlich glätten lassen"],"Nur ein unabhängiger Abgleich zeigt, ob ein Detail tatsächlich stimmt."),
    q("H07","halluzination","Was bedeutet der Begriff 'Wissensstichtag' (Cutoff-Date) eines Modells?","Der Zeitpunkt, bis zu dem Trainingsdaten vorliegen - danach fehlt aktuelles Wissen",["Das Datum, an dem ein Modell endgültig abgeschaltet wird","Der Tag, an dem ein Nutzerkonto abläuft","Ein rein rechtlicher Begriff ohne technische Bedeutung"],"Fragen zu Ereignissen nach dem Stichtag sind ein besonders hohes Halluzinationsrisiko."),
    q("H08","halluzination","Warum sind exakte Berechnungen (z. B. komplexe Zahlen) ein Risikobereich für Sprachmodelle?","Weil sie Text als wahrscheinlichste Zeichenfolge vorhersagen, nicht wie ein Taschenrechner exakt rechnen",["Weil Zahlen technisch nicht dargestellt werden können","Weil Berechnungen grundsätzlich verboten sind","Weil das nur bei sehr kleinen Zahlen ein Problem ist"],"Ohne angebundenes Rechenwerkzeug bleibt jede Berechnung eine Vorhersage, kein garantiertes Ergebnis."),

    q("B01","bias","Was bedeutet 'Bias' bei einem KI-Modell am treffendsten?","Das Modell spiegelt systematische Muster und Schieflagen seiner Trainingsdaten wider",["Das Modell hat einen technischen Defekt","Das Modell arbeitet grundsätzlich langsamer","Das Modell wurde absichtlich sabotiert"],"Bias entsteht aus den Daten, mit denen ein Modell trainiert wurde - nicht aus bewusster Absicht."),
    q("B02","bias","Was geschah bei Amazons intern getestetem KI-Recruiting-Tool, über das 2018 berichtet wurde?","Es benachteiligte Bewerbungen mit Hinweisen auf 'weiblich' systematisch, weil es auf überwiegend männlichen Lebensläufen trainiert war",["Es bevorzugte ausschließlich Berufseinsteiger:innen","Es wurde nie eingesetzt, weil es zu teuer war","Es wählte Kandidat:innen komplett zufällig aus"],"Amazon stellte das Tool ein, nachdem die erlernte Schieflage aus historischen Einstellungsdaten bekannt wurde."),
    q("B03","bias","Wie kann sich Bias in einem alltäglichen KI-generierten Beispieltext zeigen?","Durch stereotype Rollenbilder, z. B. bei Berufen oder Namen in generierten Beispielen",["Nur durch fehlerhafte Rechtschreibung","Nur durch zu lange Antworten","Nur bei der Generierung von Bildern, nie bei Text"],"Auch reine Textbeispiele können unbewusst gelernte Stereotype reproduzieren."),
    q("B04","bias","Was zeigte der Fall von Microsofts Chatbot Tay im Jahr 2016?","Ein Chatbot kann durch gezielte, koordinierte Nutzereingaben in kurzer Zeit zu diskriminierenden Aussagen verleitet werden",["Chatbots sind grundsätzlich immun gegen Manipulation","Der Vorfall hatte nichts mit den Trainings- bzw. Interaktionsdaten zu tun","Microsoft betrieb den Bot danach unverändert weiter"],"Tay wurde nach kurzer Zeit abgeschaltet, nachdem er durch gezielte Eingaben rassistische Aussagen übernahm."),
    q("B05","bias","Warum verschwindet Bias nicht automatisch bei einem neueren oder größeren Modell?","Weil auch neuere Modelle aus vorhandenen, gesellschaftlich geprägten Daten lernen",["Weil neuere Modelle grundsätzlich keine Trainingsdaten mehr benötigen","Weil Bias ausschließlich ein Problem sehr alter Modelle ist","Weil Modellgröße Bias vollständig verhindert"],"Größere Modelle können Muster präziser lernen - inklusive vorhandener Schieflagen in den Daten."),
    q("B06","bias","Was ist ein sinnvoller Umgang mit Bias-Risiko bei sensiblen Entscheidungen (z. B. Bewerbungen, Kreditvergabe)?","KI-Ausgaben als Vorschlag behandeln und durch Menschen mit klaren Kriterien prüfen lassen",["KI-Ausgaben bei sensiblen Entscheidungen automatisch final übernehmen","Auf jede Struktur oder Kriterien verzichten","Das Thema ignorieren, da es nur große Konzerne betrifft"],"Bei hoher Auswirkung auf Menschen bleibt eine kriteriengeleitete menschliche Prüfung notwendig."),
    q("B07","bias","Welche Aussage zu Bias in generativer AI ist korrekt?","Bias kann auch entstehen, ohne dass irgendjemand es beabsichtigt hat",["Bias entsteht ausschließlich durch böswillige Entwickler:innen","Bias betrifft nur Bildgenerierung, nie Text","Bias ist juristisch vollständig irrelevant"],"Unbeabsichtigte, aber real wirksame Schieflage ist der Regelfall, nicht die Ausnahme."),
    q("B08","bias","Was hilft dabei, Bias in eigenen KI-Ergebnissen zu bemerken?","Ergebnisse bei unterschiedlichen Gruppen/Varianten bewusst vergleichen",["Ausschließlich ein einziges Beispiel prüfen","Ergebnisse nie mit anderen besprechen","Grundsätzlich davon ausgehen, dass kein Bias vorliegt"],"Systematischer Vergleich macht wiederkehrende Muster sichtbar, ein Einzelfall meist nicht."),

    q("G01","grenzen","Was ist eine grundsätzliche Grenze generativer AI im Umgang mit sehr aktuellen Ereignissen?","Ohne Websuche/Anbindung kennt das Modell nur Informationen bis zu seinem Wissensstichtag",["Aktuelle Ereignisse sind für Modelle nie ein Problem","Das Modell aktualisiert sein Wissen automatisch in Echtzeit","Das betrifft ausschließlich technische Themen"],"Fragen zu 'was ist gerade passiert' sind ohne Zusatzwerkzeug ein hohes Risiko für veraltete oder erfundene Antworten."),
    q("G02","grenzen","Warum sind reine Rechenaufgaben ein bekannter Schwachpunkt vieler Sprachmodelle?","Weil Text-Vorhersage keine garantiert exakte Arithmetik ist",["Weil Zahlen im Modell technisch nicht gespeichert werden können","Weil Rechenaufgaben in Trainingsdaten grundsätzlich fehlen","Weil das nur bei sehr großen Zahlen auftritt"],"Ein separates Rechenwerkzeug liefert verlässlichere Ergebnisse als reine Textvorhersage."),
    q("G03","grenzen","Was bedeutet es, KI-generierte Kreativtexte anders zu behandeln als Faktenaussagen?","Bei Kreativaufgaben ist Erfindung erwünscht, bei Fakten ist sie ein Risiko",["Beide Fälle erfordern exakt dieselbe Prüftiefe","Kreativtexte müssen nie geprüft werden","Faktenaussagen benötigen grundsätzlich keine Prüfung"],"Das Vertrauen in eine Ausgabe sollte sich am Aufgabentyp orientieren, nicht pauschal gleich sein."),
    q("G04","grenzen","In welchen Themenfeldern ist besondere Vorsicht bei ungeprüften KI-Ausgaben angebracht?","Recht, Medizin und Finanzen, da Fehler dort besonders hohe Folgen haben können",["Nur bei rein internen Notizen ohne jede Wirkung","Ausschließlich bei Übersetzungen","Das betrifft praktisch keinen Themenbereich besonders"],"Je höher die möglichen Konsequenzen eines Fehlers, desto strenger sollte geprüft werden."),
    q("G05","grenzen","Was ist eine realistische Grenze bei der Quellenangabe generativer Modelle?","Genannte Quellen oder Zitate können erfunden wirken, obwohl sie plausibel klingen",["Genannte Quellen sind grundsätzlich immer korrekt","Modelle geben grundsätzlich nie Quellen an","Zitate sind technisch unmöglich zu erzeugen"],"Auch scheinbar konkrete Quellenangaben müssen eigenständig verifiziert werden."),
    q("G06","grenzen","Warum ist 'ich kenne die Antwort nicht' eine seltene Modellantwort, obwohl Unsicherheit häufig vorliegt?","Weil Modelle darauf trainiert sind, plausible Fortsetzungen zu liefern statt Unsicherheit aktiv zu signalisieren",["Weil Unsicherheit technisch nicht darstellbar ist","Weil das gesetzlich verboten ist","Weil das nur bei sehr kurzen Prompts vorkommt"],"Ein Modell füllt eher plausibel auf, als eine Antwort explizit zu verweigern."),
    q("G07","grenzen","Was gehört zu einer nüchternen Einschätzung der Fähigkeiten generativer AI?","Sie ist ein leistungsfähiges, aber fehleranfälliges Werkzeug - keine unfehlbare Instanz",["Sie trifft grundsätzlich bessere Entscheidungen als jeder Mensch","Sie hat keinerlei praktischen Nutzen","Sie ist ausschließlich für Programmierende geeignet"],"Realistische Erwartungen verhindern sowohl Über- als auch Unternutzung des Werkzeugs."),
    q("G08","grenzen","Was bedeutet Einsatzreife ('Ready to Teach/Use') im Kontext eines KI-Ergebnisses?","Das Ergebnis wurde geprüft, mit Quelle/Kontext abgeglichen und für den konkreten Zweck freigegeben",["Das Ergebnis wurde einmal generiert und ist automatisch fertig","Einsatzreife ist rein subjektiv und nicht greifbar","Einsatzreife betrifft nur die Textlänge"],"Erst Prüfung und bewusste Freigabe machen aus einem Entwurf ein einsatzreifes Ergebnis."),

    q("V01","verifikation","Was ist eine wirksame Strategie zur Verifikation einer KI-Faktenaussage?","Die Aussage mit einer zweiten, unabhängigen Quelle gegenprüfen",["Die Aussage einfach ein zweites Mal vom selben Modell bestätigen lassen","Die Formulierung nur sprachlich umformulieren lassen","Die Aussage grundsätzlich für richtig halten"],"Eine zweite, unabhängige Quelle deckt Fehler auf, die eine erneute Anfrage an dasselbe Modell nicht zeigt."),
    q("V02","verifikation","Warum reicht es nicht, dieselbe Frage einfach noch einmal an dasselbe Modell zu stellen?","Weil dieselbe zugrunde liegende Fehleinschätzung erneut auftreten kann",["Weil das technisch unmöglich ist","Weil Modelle nie zweimal dieselbe Frage beantworten","Weil das immer eine andere, zufällig korrekte Antwort liefert"],"Ein systematischer Fehler im gelernten Muster wiederholt sich oft, auch bei erneuter Anfrage."),
    q("V03","verifikation","Welches Signal in einer KI-Antwort spricht FÜR höhere Verlässlichkeit?","Ein Hinweis wie 'könnte', 'laut', 'sollte geprüft werden' oder eine genannte Quelle",["Möglichst viele exakte Zahlen ohne jede Einordnung","Ein besonders bestimmter, absoluter Tonfall","Eine sehr kurze, knappe Antwort ohne Kontext"],"Hedging-Formulierungen und Quellenangaben zeigen eine realistischere Einschätzung der eigenen Unsicherheit."),
    q("V04","verifikation","Was ist ein sinnvoller Umgang mit einer KI-Aussage, die 'garantiert' oder 'zu 100% sicher' formuliert ist?","Genau diese Formulierung als Anlass für zusätzliche Prüfung nehmen",["Solche Formulierungen automatisch als besonders verlässlich werten","Die Formulierung ignorieren, da sie bedeutungslos ist","Nur bei negativen Formulierungen zusätzlich prüfen"],"Absolute Sicherheitssprache ersetzt keinen Beleg - im Gegenteil, sie sollte besonders aufmerksam machen."),
    q("V05","verifikation","Was bedeutet das Vier-Augen-Prinzip bei wichtigen KI-Ergebnissen?","Eine zweite Person prüft das Ergebnis, bevor es verwendet oder veröffentlicht wird",["Das Ergebnis wird von zwei verschiedenen KI-Modellen erzeugt","Zwei Prompts werden gleichzeitig gesendet","Das betrifft ausschließlich rechtliche Dokumente"],"Eine unabhängige zweite Prüfung fängt Fehler ab, die im ersten Durchgang übersehen wurden."),
    q("V06","verifikation","Wie sollte man mit einer präzise wirkenden Zahl ohne genannte Quelle umgehen?","Sie vor Verwendung verifizieren oder klar als ungeprüft/geschätzt kennzeichnen",["Sie ungeprüft übernehmen, da sie präzise wirkt","Sie automatisch abrunden und dann verwenden","Präzise Zahlen benötigen nie eine Quelle"],"Präzision allein ist kein Beleg für Richtigkeit - eine Quelle oder Kennzeichnung schon eher."),
    q("V07","verifikation","Welche Kombination gilt in Modul 2 als besonders starkes Halluzinations-Warnsignal?","Absolute Sicherheitssprache zusammen mit einer unbelegten, präzisen Zahl oder Jahresangabe",["Eine höfliche Anrede am Anfang der Antwort","Eine Antwort in mehreren Absätzen","Die Verwendung von Fachbegriffen"],"Beide Signale zusammen deuten auf eine überzeugend klingende, aber nicht abgesicherte Aussage hin."),
    q("V08","verifikation","Was ist der Kern verantwortungsvoller KI-Nutzung im Umgang mit Unsicherheit?","Unsicherheit aktiv einplanen und Prüfschritte vor der Nutzung einbauen, statt ihr blind zu vertrauen",["Jede KI-Ausgabe ungeprüft als final behandeln","Unsicherheit existiert bei generativer AI praktisch nicht","Prüfschritte nur bei offensichtlichen Fehlern einbauen"],"Strukturierte Prüfung, nicht blindes Vertrauen, macht den Unterschied zwischen Werkzeug und Risiko.")
  ];

  const dynamicFactories=[
    ()=>{
      const samples=[
        {text:"Das ist zu 100% korrekt: Der Umsatz stieg 2019 um 47,8 Millionen Euro.",risky:true},
        {text:"Laut internem Reporting könnte der Umsatz 2019 um etwa 8-10 % gestiegen sein - das solltest du gegenprüfen.",risky:false},
        {text:"Garantiert die beste Lösung für jeden Anwendungsfall, ganz ohne Ausnahme.",risky:true},
        {text:"Vermutlich liegt die Fehlerquote bei ca. 3 %; das ist noch mit dem Reporting-Team abzugleichen.",risky:false}
      ];
      const s=samples[Math.floor(Math.random()*samples.length)];
      return q("D-OUT-"+s.text.length,"verifikation",`Wie würdest du diese KI-Ausgabe einordnen: "${s.text}"?`,s.risky?"Hohes Halluzinations-Warnsignal - absolute Sprache und/oder unbelegte Zahl":"Verantwortungsvoll formuliert - Hedging bzw. Prüfhinweis vorhanden",[s.risky?"Verantwortungsvoll formuliert - Hedging bzw. Prüfhinweis vorhanden":"Hohes Halluzinations-Warnsignal - absolute Sprache und/oder unbelegte Zahl","Technisch nicht bewertbar","Die Formulierung ist für die Bewertung irrelevant"],s.risky?"Absolute Sicherheitssprache und/oder eine unbelegte präzise Zahl sind klassische Warnsignale.":"Hedging-Wörter oder ein Prüfhinweis zeigen eine realistische Einschätzung der eigenen Unsicherheit.");
    },
    ()=>{
      const cases=[
        {who:"Googles Chatbot Bard",what:"eine falsche Behauptung zum James-Webb-Teleskop",year:"2023",topic:"halluzination"},
        {who:"Amazons internes Recruiting-Tool",what:"eine systematische Benachteiligung von Bewerbungen mit Hinweis auf 'weiblich'",year:"2018",topic:"bias"},
        {who:"Microsofts Chatbot Tay",what:"schnell erlernte diskriminierende Aussagen durch gezielte Nutzereingaben",year:"2016",topic:"bias"}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("D-CASE-"+c.year,c.topic,`Was ist die zentrale Lehre aus dem bekannt gewordenen Fall von ${c.who} (${c.year}, ${c.what})?`,"KI-Ergebnisse - egal ob durch Halluzination oder Bias verzerrt - benötigen Prüfung, bevor sie verwendet oder veröffentlicht werden",["Der Fall zeigt, dass generative AI seitdem grundsätzlich nicht mehr eingesetzt wird","Es gab dadurch keine öffentliche Aufmerksamkeit oder Konsequenzen","Der Fall betraf ausschließlich die technische Infrastruktur, nicht die Ausgaben"],"Beide Fehlerarten - erfundene Fakten wie auch gelernte Schieflagen - zeigen: menschliche Prüfung bleibt notwendig.");
    },
    ()=>{
      const topics=["ein sehr aktuelles Ereignis von heute","eine exakte mehrstellige Berechnung","eine allgemein bekannte, stabile Definition"];
      const risky=[true,true,false];
      const idx=Math.floor(Math.random()*topics.length);
      return q("D-RISK-"+idx,"grenzen",`Wie hoch ist das Halluzinationsrisiko bei einer KI-Anfrage zu "${topics[idx]}"?`,risky[idx]?"Erhöht - dieser Bereich zählt zu den bekannten Schwachpunkten generativer Modelle":"Vergleichsweise gering - stabile, breit bekannte Inhalte sind seltener betroffen",[risky[idx]?"Vergleichsweise gering - stabile, breit bekannte Inhalte sind seltener betroffen":"Erhöht - dieser Bereich zählt zu den bekannten Schwachpunkten generativer Modelle","Bei diesem Thema besteht überhaupt kein Unterschied","Das Risiko hängt ausschließlich von der Tageszeit ab"],"Aktuelle Ereignisse und exakte Berechnungen gehören zu den bekannten Grenzen generativer Modelle.");
    },
    ()=>{
      const n=[2,3,4][Math.floor(Math.random()*3)];
      return q("D-VERIFY-"+n,"verifikation",`Eine KI nennt dir ${n} konkrete Zahlen zu einem für dich wichtigen Thema, aber keine Quelle. Was ist der nächste sinnvolle Schritt?`,"Die Zahlen mit einer unabhängigen, verlässlichen Quelle abgleichen, bevor sie verwendet werden",["Die Zahlen direkt in ein wichtiges Dokument übernehmen","Nur die erste der genannten Zahlen für plausibel halten","Das Modell bitten, dieselben Zahlen zu wiederholen, und das als Bestätigung werten"],"Nur ein unabhängiger Abgleich zeigt, ob unbelegte Zahlen tatsächlich korrekt sind.");
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-02",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
