(()=> {
  const STORAGE={
    last:"bais-kif-m04-assessment-last",
    weak:"bais-kif-m04-assessment-weak",
    attempt:"bais-kif-m04-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("DSG01","dsgvo","Was sind personenbezogene Daten im Sinne der DSGVO?","Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen",["Nur Daten, die ein Passwort enthalten","Ausschließlich Finanzdaten von Unternehmen","Nur Daten, die auf Papier gespeichert sind"],"Der Personenbezug - nicht das Format oder Medium - entscheidet, ob Daten unter die DSGVO fallen."),
    q("DSG02","dsgvo","Was bedeutet 'Datenminimierung' als DSGVO-Grundsatz?","Nur die Daten verarbeiten, die für den konkreten Zweck wirklich nötig sind",["Alle verfügbaren Daten immer vollständig verarbeiten","Daten nur einmal jährlich löschen","Datenminimierung betrifft ausschließlich Behörden"],"Je weniger personenbezogene Daten verarbeitet werden, desto geringer das Risiko bei einem Fehler oder Vorfall."),
    q("DSG03","dsgvo","Warum ist Datenminimierung auch bei der Nutzung von KI-Tools relevant?","Weil unnötig eingegebene personenbezogene Daten ein zusätzliches, vermeidbares Risiko darstellen",["Weil KI-Tools grundsätzlich keine Daten verarbeiten können","Weil das nur für interne Datenbanken gilt","Weil es die Antwortgeschwindigkeit erhöht"],"Wer nur die nötigen Daten eingibt, reduziert automatisch die Angriffsfläche und das Risikopotenzial."),
    q("DSG04","dsgvo","Was ist ein sinnvoller erster Schritt vor der Eingabe eines Textes mit Kundendaten in ein KI-Tool?","Prüfen, ob die personenbezogenen Daten für die Aufgabe wirklich nötig sind oder entfernt/anonymisiert werden können",["Die Daten unverändert und vollständig eingeben","Das Tool ungefragt unternehmensweit einführen","Die Frage komplett vermeiden, auch bei harmlosen Themen"],"Datenminimierung beginnt bei der bewussten Entscheidung, was überhaupt eingegeben werden muss."),
    q("DSG05","dsgvo","Was unterscheidet Anonymisierung von Pseudonymisierung?","Bei Anonymisierung ist ein Rückbezug auf die Person nicht mehr möglich, bei Pseudonymisierung mit Zusatzwissen schon",["Es gibt keinen Unterschied","Pseudonymisierung ist immer unwiderruflich","Anonymisierung betrifft nur Bilddaten"],"Pseudonymisierte Daten bleiben mit einem separaten Schlüssel re-identifizierbar - anonymisierte nicht."),
    q("DSG06","dsgvo","Welche Rolle spielt der Verarbeitungszweck bei personenbezogenen Daten?","Er bestimmt, welche Daten überhaupt verarbeitet werden dürfen und wie lange",["Der Zweck ist rechtlich irrelevant","Der Zweck bestimmt nur die Schriftfarbe von Formularen","Ein einmal festgelegter Zweck darf nie dokumentiert werden"],"Ohne festgelegten Zweck fehlt die Grundlage dafür, welche Datenverarbeitung überhaupt zulässig ist."),
    q("DSG07","dsgvo","Was ist ein sinnvoller Umgang mit einer internen KI-Nutzungsrichtlinie zu personenbezogenen Daten?","Sie verbindlich festlegen und regelmäßig an neue Tools/Situationen anpassen",["Sie einmalig verfassen und nie wieder anschauen","Sie nur mündlich weitergeben","Auf eine Richtlinie komplett verzichten"],"Eine aktuelle, verbindliche Richtlinie schafft einheitliche Regeln statt individueller Grauzonen."),
    q("DSG08","dsgvo","Warum reicht 'das Tool wird schon sicher sein' nicht als Entscheidungsgrundlage?","Weil ohne geprüfte Vereinbarung unklar ist, wie und wo Eingaben gespeichert/verarbeitet werden",["Weil alle KI-Tools identisch funktionieren","Weil Sicherheit ausschließlich Aufgabe der Nutzenden ist","Weil das rechtlich irrelevant ist"],"Ohne geprüfte Grundlage bleibt die tatsächliche Datenverarbeitung durch den Anbieter unklar."),

    q("KAT01","kategorien","Was sind 'besondere Kategorien personenbezogener Daten' nach Art. 9 DSGVO?","Besonders sensible Daten wie Gesundheit, Religion, Gewerkschaftszugehörigkeit oder biometrische Daten",["Alle Daten, die länger als ein Jahr gespeichert werden","Nur Daten von Führungskräften","Ausschließlich Finanzdaten"],"Diese Kategorien unterliegen einem deutlich strengeren rechtlichen Maßstab als gewöhnliche personenbezogene Daten."),
    q("KAT02","kategorien","Warum werden Gesundheitsdaten besonders streng behandelt?","Weil ihre Offenlegung für die betroffene Person besonders schwerwiegende Folgen haben kann",["Weil sie technisch schwerer zu speichern sind","Weil sie grundsätzlich am häufigsten vorkommen","Weil sie am wenigsten Speicherplatz benötigen"],"Der besondere Schutz orientiert sich am Schadenspotenzial für die betroffene Person."),
    q("KAT03","kategorien","Was gehört NICHT zu den besonderen Kategorien nach Art. 9 DSGVO?","Eine gewöhnliche Kundennummer",["Angaben zur Gewerkschaftszugehörigkeit","Gesundheitsdaten","Biometrische Daten zur eindeutigen Identifizierung"],"Eine Kundennummer ist ein gewöhnliches personenbezogenes Datum, keine besondere Kategorie."),
    q("KAT04","kategorien","Was ist die Konsequenz, wenn ein Text eine besondere Kategorie (z. B. Diagnose) enthält?","Er darf nicht ungeprüft in ein KI-Tool eingegeben werden, unabhängig vom sonstigen Kontext",["Er darf trotzdem bedenkenlos eingegeben werden, wenn der Ton höflich ist","Das gilt nur bei sehr langen Texten","Das betrifft nur die Speicherung, nicht die Eingabe"],"Die besondere Kategorie allein löst den strengeren Maßstab aus - unabhängig vom restlichen Text."),
    q("KAT05","kategorien","Welches Beispiel enthält eine besondere Kategorie personenbezogener Daten?","'Frau Klein ist aktuell wegen einer Diagnose in ärztlicher Behandlung.'",["'Herr Weber, Kundennummer 88213.'","'Bitte die Bestellung von Herrn Meier bestätigen.'","'Der Termin findet am Montag statt.'"],"Die genannte gesundheitliche Diagnose fällt unter Art. 9 DSGVO."),
    q("KAT06","kategorien","Warum zählt die politische oder gewerkschaftliche Zugehörigkeit einer Person zu den besonderen Kategorien?","Weil ihre Offenlegung zu Diskriminierung oder Benachteiligung führen könnte",["Weil sie am längsten gespeichert werden muss","Weil sie ausschließlich Behörden betrifft","Weil sie technisch am schwersten zu verarbeiten ist"],"Der besondere Schutz soll Diskriminierungsrisiken aufgrund dieser Merkmale verringern."),
    q("KAT07","kategorien","Was ist ein sinnvoller Umgang, wenn unklar ist, ob ein Text eine besondere Kategorie enthält?","Im Zweifel als besonders sensibel behandeln und vor Eingabe prüfen/entfernen",["Im Zweifel einfach eingeben und abwarten","Die Entscheidung dem KI-Tool selbst überlassen","Grundsätzlich davon ausgehen, dass nichts sensibel ist"],"Im Zweifel für den strengeren Schutz zu entscheiden reduziert das Risiko einer Fehleinschätzung."),
    q("KAT08","kategorien","Was unterscheidet 'personenbezogen' von 'besondere Kategorie' im Live-Lab dieses Moduls?","'Personenbezogen' braucht Prüfung/Minimierung, 'besondere Kategorie' wird automatisch blockiert",["Es gibt keinen Unterschied in der Behandlung","'Personenbezogen' wird immer blockiert, 'besondere Kategorie' nie","Beide Stufen erlauben uneingeschränkte Nutzung"],"Die höhere Sensibilität der besonderen Kategorie führt zu einer strengeren, automatischen Einstufung."),

    q("FAL01","faelle","Was war ein zentraler Punkt beim öffentlich bekannt gewordenen Datenschutzvorfall bei British Airways (Datenpanne 2018, Bußgeldentscheidung durch die britische Aufsichtsbehörde)?","Unzureichende technische Sicherheitsmaßnahmen führten zum Abfluss von Kundendaten in großem Umfang",["Es handelte sich um einen rein internen Buchhaltungsfehler ohne Kundendatenbezug","Die Aufsichtsbehörde verhängte keinerlei Sanktion","Der Vorfall betraf ausschließlich interne Mitarbeiterdaten"],"Der Fall zählt zu den bekanntesten DSGVO-relevanten Datenschutzvorfällen im Luftfahrtsektor."),
    q("FAL02","faelle","Was zeigte der öffentlich bekannt gewordene Datenschutzvorfall bei Marriott/Starwood (Offenlegung 2018, spätere Bußgeldentscheidung)?","Eine über Jahre unentdeckte Sicherheitslücke betraf Gästedaten in sehr großem Umfang",["Es waren ausschließlich weniger als 100 Personen betroffen","Der Vorfall wurde vor 2018 vollständig behoben, bevor Daten betroffen waren","Es handelte sich um einen Einzelfall ohne behördliche Konsequenzen"],"Der Fall zeigt, wie lange unentdeckte Sicherheitslücken zu sehr großflächigen Datenschutzvorfällen führen können."),
    q("FAL03","faelle","Weshalb wurde das Unternehmen Clearview AI von mehreren europäischen Datenschutzbehörden (u. a. 2022) mit Bußgeldern belegt?","Wegen unrechtmäßigen Sammelns/Scrapens biometrischer Gesichtsdaten ohne Rechtsgrundlage",["Weil es zu wenige Daten gesammelt hatte","Weil es ausschließlich anonymisierte Daten verarbeitete","Weil es keine KI-Technologie einsetzte"],"Der Fall zeigt, dass gerade biometrische (besondere Kategorie) Daten einem sehr hohen rechtlichen Maßstab unterliegen."),
    q("FAL04","faelle","Was haben die Fälle British Airways und Marriott/Starwood gemeinsam?","Beide zeigen die Folgen unzureichender technischer/organisatorischer Schutzmaßnahmen für personenbezogene Daten",["Beide betrafen ausschließlich Daten außerhalb der EU","In beiden Fällen gab es keine betroffenen Personen","Beide Fälle wurden nie öffentlich bekannt"],"Beide Fälle führten zu behördlichen Bußgeldentscheidungen wegen unzureichenden Datenschutzes."),
    q("FAL05","faelle","Welche Lehre lässt sich aus dem Clearview-AI-Fall für den Einsatz von KI-Tools ziehen?","Auch KI-gestützte Datenverarbeitung braucht eine geprüfte Rechtsgrundlage, besonders bei biometrischen Daten",["KI-Tools sind von der DSGVO grundsätzlich ausgenommen","Biometrische Daten benötigen keine besondere Prüfung","Der Fall betraf nur eine einzelne Person"],"Neue Technologie ändert nichts an der grundlegenden Pflicht, eine Rechtsgrundlage für die Verarbeitung zu haben."),
    q("FAL06","faelle","Was ist eine praktische Konsequenz aus allen drei Fällen für den Unternehmensalltag?","Technische Sicherheit, Rechtsgrundlage und Datenminimierung müssen aktiv sichergestellt werden - nicht vorausgesetzt",["Datenschutzvorfälle sind unvermeidbar und daher irrelevant für die Praxis","Nur sehr große Unternehmen müssen sich mit Datenschutz befassen","Bußgelder betreffen ausschließlich die IT-Abteilung"],"Alle drei Fälle zeigen: Datenschutz ist eine aktive, fortlaufende Aufgabe - kein einmaliger Haken."),
    q("FAL07","faelle","Warum werden Datenschutzvorfälle wie diese oft erst Jahre nach der eigentlichen Ursache öffentlich bekannt?","Weil Sicherheitslücken oder unrechtmäßige Verarbeitung oft lange unentdeckt bleiben können",["Weil Datenschutzbehörden grundsätzlich nicht aktiv werden","Weil Unternehmen solche Vorfälle gesetzlich nie melden müssen","Weil es sich technisch nicht nachverfolgen lässt"],"Genau diese Verzögerung unterstreicht, wie wichtig fortlaufende Prüfung statt einmaliger Kontrolle ist."),
    q("FAL08","faelle","Was ist die zentrale Botschaft von Modul 4 für den Alltag mit KI-Tools?","Personenbezogene und besonders sensible Daten verdienen bewusste, aktive Prüfung vor jeder Eingabe",["Datenschutz ist ausschließlich Aufgabe der Rechtsabteilung","Solange ein Tool bekannt ist, sind alle Eingaben automatisch unbedenklich","Datenklassifizierung ist für den Alltag nicht praktikabel"],"Die in diesem Modul gelernte Klassifizierung soll genau diese bewusste Prüfung zur Gewohnheit machen.")
  ];

  const dynamicFactories=[
    ()=>{
      const items=[
        {text:"eine allgemeine Marktanalyse ohne Namen",route:"unbedenklich"},
        {text:"eine Kundenanfrage mit Kundennummer und Geburtsdatum",route:"personenbezogen"},
        {text:"eine Personalnotiz mit Diagnose und Medikamenten",route:"besondere_kategorie"}
      ];
      const item=items[Math.floor(Math.random()*items.length)];
      const labels={unbedenklich:"Unbedenklich - keine personenbezogenen Daten",personenbezogen:"Personenbezogen - Prüfung/Minimierung nötig",besondere_kategorie:"Besondere Kategorie - automatisch blockiert"};
      return q("D-CLASS-"+item.text.length,"kategorien",`Wie würdest du "${item.text}" einstufen?`,labels[item.route],Object.entries(labels).filter(([k])=>k!==item.route).map(([,v])=>v),"Die Einstufung richtet sich danach, ob überhaupt Personenbezug besteht und ob eine besondere Kategorie nach Art. 9 DSGVO vorliegt.");
    },
    ()=>{
      const cases=[
        {who:"British Airways",what:"eine große Datenpanne (2018) mit unzureichenden Sicherheitsmaßnahmen"},
        {who:"Marriott/Starwood",what:"eine über Jahre unentdeckte Sicherheitslücke mit sehr vielen betroffenen Gästen"},
        {who:"Clearview AI",what:"das unrechtmäßige Sammeln biometrischer Gesichtsdaten ohne Rechtsgrundlage"}
      ];
      const c=cases[Math.floor(Math.random()*cases.length)];
      return q("D-CASE-"+c.who.length,"faelle",`Was ist die zentrale Lehre aus dem bekannt gewordenen Fall von ${c.who} (${c.what})?`,"Personenbezogene Daten brauchen aktiv sichergestellten Schutz und eine geprüfte Rechtsgrundlage - unabhängig von der eingesetzten Technologie",["Der Fall zeigt, dass Datenschutz nur für sehr kleine Unternehmen relevant ist","Es gab dadurch keinerlei behördliche oder öffentliche Reaktion","Der Fall betraf ausschließlich unternehmensinterne Prozesse ohne Kundenbezug"],"Alle drei Fälle zeigen reale, behördlich sanktionierte Konsequenzen unzureichenden Datenschutzes.");
    },
    ()=>{
      const n=[1,2,3][Math.floor(Math.random()*3)];
      return q("D-MIN-"+n,"dsgvo",`Ein Prompt an ein KI-Tool enthält ${n} personenbezogene Detail(s), die für die eigentliche Aufgabe nicht nötig wären. Was ist der sinnvollste nächste Schritt?`,"Die nicht benötigten Details vor dem Absenden entfernen (Datenminimierung)",["Die Details unverändert lassen, da sie ohnehin schon eingegeben wurden","Noch mehr zusätzliche Details ergänzen","Das Tool wechseln, ohne den Prompt anzupassen"],"Datenminimierung bedeutet, unnötige personenbezogene Angaben vor der Eingabe zu entfernen.");
    },
    ()=>{
      const options=[
        {text:"vollständiger Name und Kontodaten in einer öffentlich einsehbaren Präsentation",safe:false},
        {text:"eine anonymisierte Fallstudie ohne erkennbare Einzelpersonen",safe:true}
      ];
      const opt=options[Math.floor(Math.random()*options.length)];
      return q("D-ANON-"+opt.text.length,"dsgvo",`Ist "${opt.text}" datenschutzrechtlich unproblematisch?`,opt.safe?"Ja - ohne Personenbezug besteht kein grundsätzliches Risiko":"Nein - das enthält klar personenbezogene, sensible Daten",[opt.safe?"Nein - das enthält klar personenbezogene, sensible Daten":"Ja - ohne Personenbezug besteht kein grundsätzliches Risiko","Das hängt ausschließlich von der Dateigröße ab","Präsentationen sind grundsätzlich vom Datenschutz ausgenommen"],"Fehlender Personenbezug (echte Anonymisierung) reduziert das Risiko grundsätzlich - im Gegensatz zu offen sichtbaren echten Daten.");
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
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-04",score:percent,grade:grade.note,passed:grade.passed,credited}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();
