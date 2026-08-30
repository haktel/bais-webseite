(()=> {
  const STORAGE={
    last:"bais-n8n-m01-assessment-last",
    weak:"bais-n8n-m01-assessment-weak",
    attempt:"bais-n8n-m01-assessment-attempt"
  };

  const q=(id,topic,prompt,correct,wrong,explanation)=>({
    id,topic,prompt,
    options:[correct,...wrong].map((text,index)=>({text,correct:index===0})),
    explanation
  });

  const BANK=[
    q("B01","grundlagen","Was beschreibt n8n am treffendsten?","Eine Workflow-Automation- und Integrationsplattform",["Ein relationales Datenbanksystem","Ein reines Frontend-Framework","Ein Passwortmanager"],"n8n orchestriert Ereignisse, Daten und externe Systeme in Workflows."),
    q("B02","grundlagen","Welche Aussage zu einem Workflow ist korrekt?","Er bildet eine Folge von Verarbeitungsschritten mit definiertem Start und Ergebnis ab",["Er besteht immer aus genau zwei Nodes","Er darf keine Entscheidungen enthalten","Er funktioniert nur manuell"],"Workflows modellieren Trigger, Verarbeitung, Entscheidungen, Aktionen und Ergebnisse."),
    q("B03","grundlagen","Welche Komponente startet einen Workflow normalerweise?","Ein Trigger",["Ein Credential","Eine Expression","Ein Output-Panel"],"Trigger reagieren auf ein Ereignis oder einen Zeitplan."),
    q("B04","grundlagen","Was ist ein Node?","Ein einzelner Verarbeitungsschritt innerhalb eines Workflows",["Ein Benutzerkonto","Ein Backup des Workflows","Ein ausschließlich visueller Kommentar"],"Nodes empfangen Daten, verarbeiten sie und geben Daten weiter."),
    q("B05","grundlagen","Welche Aussage zu Actions ist richtig?","Sie führen eine konkrete Aufgabe aus",["Sie speichern ausschließlich Passwörter","Sie ersetzen immer den Trigger","Sie dürfen keine Daten erhalten"],"Beispiele sind HTTP Request, E-Mail, Datenbankzugriff oder Dateioperation."),
    q("B06","grundlagen","Was bedeutet Orchestrierung im n8n-Kontext?","Mehrere Systeme und Verarbeitungsschritte kontrolliert koordinieren",["Nur Daten lokal speichern","Alle Anwendungen durch n8n ersetzen","Jeden Prozess vollständig ohne Menschen ausführen"],"n8n sitzt häufig zwischen bestehenden Systemen und koordiniert deren Zusammenspiel."),
    q("B07","grundlagen","Welche Reihenfolge ist als mentales Modell sinnvoll?","Ereignis → Trigger → Daten → Verarbeitung → Aktion → Ergebnis",["Aktion → Passwort → Browser → Trigger","Datenbank → CSS → Trigger → Benutzer","Ergebnis → Trigger → Ereignis → Aktion"],"Dieses Modell hilft, Workflows unabhängig von konkreten Nodes zu verstehen."),
    q("B08","grundlagen","Was sollte vor dem Bau eines Workflows zuerst klar sein?","Prozessziel, Eingaben, Regeln, Ergebnis und Verantwortlichkeit",["Die Farbe der Nodes","Die maximale Zahl an Nodes","Der Name des Browsers"],"Automation beginnt mit Prozessverständnis, nicht mit Drag-and-drop."),

    q("D01","daten","Was ist JSON?","Ein textbasiertes Format zur strukturierten Darstellung von Daten",["Ein Verschlüsselungsalgorithmus","Ein Netzwerkprotokoll","Ein Dateisystem"],"JSON nutzt Objekte, Arrays und Key-Value-Strukturen."),
    q("D02","daten","Was ist in { \"name\": \"Anna\" } der Key?","name",["Anna","{ }","String"],"Der Key bezeichnet das Feld, der Value ist hier Anna."),
    q("D03","daten","Welcher JSON-Wert ist ein Boolean?","true",["\"true\"","42","[true]"],"true ohne Anführungszeichen ist ein Boolean."),
    q("D04","daten","Welcher Ausdruck liest im aktuellen Item das Feld name?","{{$json.name}}",["{{$name.json}}","{{json->name}}","{{$item=name}}"],"$json referenziert die JSON-Daten des aktuellen Items."),
    q("D05","daten","Warum sind Items wichtig?","Weil n8n Datensätze als einzelne Verarbeitungseinheiten durch Nodes führen kann",["Weil jeder Workflow nur ein Item besitzen darf","Weil Items Credentials ersetzen","Weil Items nur Dateien enthalten"],"Ein Node kann ein oder viele Items erhalten und weiterverarbeiten."),
    q("D06","daten","Was ist Daten-Normalisierung?","Eingabedaten in ein konsistentes internes Schema überführen",["Daten immer löschen","Jede Zahl in Text umwandeln","Nur das Layout verändern"],"Normalisierung reduziert Abhängigkeiten von uneinheitlichen Quellsystemen."),
    q("D07","daten","Warum sollte man den Input eines Nodes vor Debugging prüfen?","Weil Fehler oft durch unerwartete Datenstrukturen entstehen",["Weil der Node sonst seine Farbe ändert","Weil n8n ohne Input keine Credentials kennt","Weil nur der erste Node Daten besitzt"],"Input → Verarbeitung → Output ist die wichtigste Debugging-Kette."),
    q("D08","daten","Welche Struktur ist ein Array?","[\"AI\",\"Automation\"]",["{\"AI\":true}","\"AI, Automation\"","42"],"Arrays sind geordnete Listen von Werten."),

    q("W01","webhook","Was ist ein Webhook?","Ein HTTP-Endpunkt, der ein Ereignis oder Daten entgegennimmt",["Ein Datenbankindex","Ein lokales Passwort","Ein CSS-Selektor"],"Webhooks erlauben ereignisgesteuerte Kommunikation zwischen Systemen."),
    q("W02","webhook","Welche HTTP-Methode wird häufig verwendet, wenn ein Formular JSON sendet?","POST",["TRACE","CONNECT","HEAD"],"POST wird häufig für das Übermitteln neuer Daten genutzt."),
    q("W03","webhook","Welche URL ist typischerweise für den produktiven n8n-Webhook gedacht?","/webhook/...",["/webhook-test/...","/manual-only/...","/credential/..."],"Der Test-Webhook ist für Entwicklung, der Production-Webhook für aktive Workflows."),
    q("W04","webhook","Warum funktioniert ein Test-Webhook oft nicht dauerhaft?","Weil er für den temporären Testmodus gedacht ist",["Weil HTTP in n8n nur einmal funktioniert","Weil JSON danach gesperrt wird","Weil Test-Webhooks keine Daten annehmen"],"Test-Webhooks sind kein Ersatz für einen aktivierten Production-Endpunkt."),
    q("W05","webhook","Was ist eine Execution?","Eine konkrete Ausführung eines Workflows",["Eine Kopie eines Credentials","Ein statisches Diagramm","Ein Benutzerrecht"],"Jeder Triggerlauf erzeugt typischerweise eine eigene Execution."),
    q("W06","webhook","Welche Information hilft bei einem fehlgeschlagenen Webhook zuerst?","HTTP-Status, eingegangene Daten und Execution-Verlauf",["Logo-Größe","Browser-Zoom","Node-Farbe"],"Debugging braucht beobachtbare Signale statt Vermutungen."),
    q("W07","webhook","Was bedeutet Response in einem Webhook-Workflow?","Die HTTP-Antwort, die an den aufrufenden Client zurückgeht",["Das Passwort des Clients","Die grafische Node-Position","Nur ein interner Kommentar"],"Ein Response kann Statuscode und strukturierte Daten enthalten."),
    q("W08","webhook","Warum sollte ein öffentlicher Webhook Eingaben validieren?","Weil externe Eingaben grundsätzlich nicht vertrauenswürdig sind",["Weil jeder Request automatisch falsch ist","Nur damit der Workflow schneller aussieht","Weil n8n sonst keine Nodes laden kann"],"Validierung schützt Business-Logik und nachgelagerte Systeme."),

    q("P01","production","Welche Aussage beschreibt einen Proof of Concept am besten?","Er prüft, ob eine technische Idee grundsätzlich funktioniert",["Er ist automatisch produktionsreif","Er ersetzt Monitoring","Er ist immer ein fertiges Kundenprodukt"],"Ein PoC beantwortet Machbarkeit, nicht vollständige Betriebsreife."),
    q("P02","production","Was fehlt einem Workflow typischerweise noch, wenn er nur einmal erfolgreich gelaufen ist?","Betriebskontrollen wie Error Handling, Monitoring und Recovery",["Mehr Farben","Ein zweiter Browser","Ein PDF-Logo"],"Ein grüner Einzellauf beweist keine Zuverlässigkeit im Betrieb."),
    q("P03","production","Welche Reihenfolge passt zum professionellen Lifecycle?","Design → Build → Test → Secure → Deploy → Monitor → Maintain",["Deploy → Idee → Test → Löschen","Monitor → Build → Trigger → CSS","Secure → Passwort veröffentlichen → Deploy"],"Produktionsbetrieb ist ein Lifecycle, kein einmaliger Klick."),
    q("P04","production","Was ist Monitoring?","Das systematische Beobachten von Zustand, Fehlern und Leistungskennzahlen",["Nur die manuelle Ausführung","Das Speichern eines API Keys","Das Umbenennen von Nodes"],"Monitoring macht Störungen und Trends sichtbar."),
    q("P05","production","Warum braucht ein Workflow einen Owner?","Damit Verantwortung für Betrieb, Änderungen und Störungen klar ist",["Damit der Workflow mehr Nodes hat","Damit JSON gültig wird","Damit Webhooks GET verwenden"],"Technik ohne Verantwortlichkeit ist organisatorisch nicht betreibbar."),
    q("P06","production","Was ist ein Runbook?","Eine Betriebsanleitung für typische Abläufe, Fehler und Wiederherstellung",["Ein Passwortformat","Ein HTTP-Header","Eine Node-Lizenz"],"Runbooks reduzieren Reaktionszeit und Wissensabhängigkeit."),
    q("P07","production","Was ist ein Smoke Test?","Ein kurzer Test, ob die wichtigsten Funktionen nach Deployment grundsätzlich laufen",["Ein vollständiger Penetrationstest","Eine Backup-Löschung","Ein UI-Theme-Test"],"Smoke Tests prüfen kritische Pfade schnell nach Änderungen."),
    q("P08","production","Welche Aussage ist korrekt?","Demo, PoC und Production haben unterschiedliche Qualitäts- und Betriebsanforderungen",["Jede Demo ist Production","PoC und Production sind identisch","Production benötigt weniger Kontrollen"],"Die Reifegrade dürfen nicht vermischt werden."),

    q("S01","security","Wo sollten API Keys bevorzugt gespeichert werden?","In einem geeigneten Credential Store oder Secret-Mechanismus",["Im öffentlichen HTML","Als Klartext im Git-Repository","Im Namen des Workflows"],"Secrets gehören außerhalb öffentlich einsehbarer Konfiguration."),
    q("S02","security","Was bedeutet Least Privilege?","Nur die minimal notwendigen Rechte vergeben",["Jeder Integration Admin-Rechte geben","Credentials gemeinsam nutzen","Alle Scopes aktivieren"],"Kleinere Berechtigungsflächen reduzieren Schaden bei Missbrauch."),
    q("S03","security","Was ist eine Security Boundary?","Eine Vertrauensgrenze, an der Eingaben, Identität oder Rechte geprüft werden",["Eine Farbe im Workflow","Ein Backup-Zeitpunkt","Ein Datenbankfeld"],"Grenzen markieren Übergänge zwischen unterschiedlich vertrauenswürdigen Bereichen."),
    q("S04","security","Wie sollten externe Eingaben behandelt werden?","Als untrusted, bis sie validiert und autorisiert wurden",["Immer als korrekt","Immer als Admin-Anfrage","Nur nach Dateigröße beurteilt"],"Externe Daten dürfen interne Systeme nicht ungeprüft steuern."),
    q("S05","security","Warum sind Environment Variables nützlich?","Sie trennen Konfiguration und Secrets vom eigentlichen Workflow oder Code",["Sie ersetzen alle Credentials","Sie machen jede API öffentlich","Sie verhindern Logging automatisch"],"Umgebungsabhängige Werte lassen sich so sauberer verwalten."),
    q("S06","security","Welche Architektur ist sicherer?","Browser → Backend/Validation → n8n",["Browser → beliebige interne Systeme ohne Prüfung","Öffentlicher Client → Datenbankpasswort","Browser → Secret Store direkt"],"Ein Backend kann Eingaben, Bot-Schutz und Policies vor n8n durchsetzen."),
    q("S07","security","Warum sollte man Secrets nicht in Logs schreiben?","Logs können breit zugänglich sein und lange aufbewahrt werden",["Weil Logs keine Texte speichern können","Weil Secrets sonst langsamer werden","Nur wegen der Node-Farbe"],"Logs sind häufig ein eigener Angriffs- und Datenschutzbereich."),
    q("S08","security","Was ist Credential Rotation?","Ein altes Secret kontrolliert durch ein neues ersetzen",["Ein Credential umbenennen","Eine Node verschieben","Den Workflow neu laden"],"Rotation reduziert Langzeitrisiken und unterstützt Incident-Reaktion."),

    q("X01","debugging","Was ist die beste erste Debugging-Reihenfolge?","Input → Trigger → Execution → Node → Output",["Output → Logo → Browser → Passwort","Node-Farbe → CSS → Trigger","Credential löschen → neu bauen"],"Systematisches Debugging folgt dem Datenfluss."),
    q("X02","debugging","Ein Workflow läuft im Editor, aber die Website löst ihn nicht aus. Was prüfst du zuerst?","Ob die Website die korrekte Production-Webhook-URL und HTTP-Methode nutzt",["Ob der Workflow einen längeren Namen braucht","Ob der Browser Dark Mode nutzt","Ob der letzte Node links steht"],"Fehler liegen häufig an Endpoint, Methode oder Aktivierungsstatus."),
    q("X03","debugging","Eine Expression liefert undefined. Was ist die wahrscheinlichste erste Prüfung?","Ob das erwartete Feld im Input des aktuellen Nodes existiert",["Ob n8n neu installiert werden muss","Ob HTTP auf FTP gewechselt wird","Ob der Node eine andere Farbe hat"],"Expressions können nur Werte lesen, die im referenzierten Kontext vorhanden sind."),
    q("X04","debugging","Ein externer API-Call liefert HTTP 401. Was bedeutet das typischerweise?","Authentifizierung fehlt oder ist ungültig",["Der Request war sicher erfolgreich","Die Ressource wurde erstellt","Das JSON ist immer falsch"],"401 weist primär auf fehlende/ungültige Authentifizierung hin."),
    q("X05","debugging","Ein Request liefert HTTP 422 nach Input Validation. Was ist sinnvoll?","Payload und Validierungsregeln vergleichen",["Sofort die Datenbank löschen","Den Workflownamen ändern","Den Monitor ausschalten"],"422 steht häufig für semantisch ungültige Eingaben."),
    q("X06","debugging","Warum ist eine Execution-ID hilfreich?","Sie erlaubt die Zuordnung eines konkreten Laufes zu Logs und Fehlern",["Sie ist ein API Key","Sie ersetzt die E-Mail-Adresse","Sie ist immer ein HTTP-Status"],"Traceability ist zentral für reproduzierbares Debugging."),
    q("X07","debugging","Ein Workflow hat keine Execution, obwohl ein Client angeblich gesendet hat. Wo liegt der Fehler wahrscheinlich?","Vor oder am Trigger/Endpoint",["Sicher im letzten Node","Sicher in der Datenbank","Immer im Credential Store"],"Wenn keine Execution entsteht, hat n8n den Trigger meist nicht erreicht."),
    q("X08","debugging","Warum sollte man Fehler absichtlich reproduzieren können?","Damit Ursache und Fix überprüfbar werden",["Damit Production häufiger ausfällt","Damit Logs größer werden","Damit Credentials sichtbar werden"],"Reproduzierbarkeit trennt Diagnose von Zufall.")
  ];

  const dynamicFactories=[
    ()=>{
      const budget=[2500,3200,4999,5000,7500,12000][Math.floor(Math.random()*6)];
      const route=budget>=5000?"qualified":"standard";
      return q("G-BUDGET-"+budget,"debugging",`Ein Lead hat budget=${budget}. Die Regel lautet budget >= 5000. Welche Route ist korrekt?`,route,[route==="qualified"?"standard":"qualified","rejected","manual-only"],"Die IF-Regel wird exakt am Grenzwert ausgewertet: 5000 gehört bereits zu qualified.");
    },
    ()=>{
      const field=["name","email","company","budget"][Math.floor(Math.random()*4)];
      const sample={name:"Mina",email:"mina@example.com",company:"Nord GmbH",budget:8400};
      const answer=String(sample[field]);
      return q("G-JSON-"+field,"daten",`Gegeben ist {"name":"Mina","email":"mina@example.com","company":"Nord GmbH","budget":8400}. Was liefert {{$json.${field}}}?`,answer,["undefined",field,"${"+field+"}"],"Die Expression liest den Wert des angegebenen Keys aus dem aktuellen Item.");
    },
    ()=>{
      const prod=Math.random()>.5;
      return q("G-WEBHOOK-"+(prod?"P":"T"),"webhook",prod?"Du baust die URL für den echten Website-Betrieb. Welche Variante wählst du?":"Du testest gerade manuell im Editor. Welche Variante ist dafür gedacht?",prod?"/webhook/...":"/webhook-test/...",[prod?"/webhook-test/...":"/webhook/...","/credential/...","/execution/..."],prod?"Production verwendet den aktiven Webhook-Endpunkt.":"Der Test-Webhook ist für Entwicklungs- und Testläufe.");
    },
    ()=>{
      const scenario=Math.random()>.5;
      return q("G-SEC-"+(scenario?"A":"B"),"security",scenario?"Ein öffentlicher Browser soll Kundendaten an eine Automation senden. Welche Architektur ist vorzuziehen?":"Ein Workflow benötigt einen API Key. Wo sollte er liegen?",scenario?"Browser → Backend/Validation → n8n":"Credential Store / Secret",[scenario?"Browser → Datenbank direkt":"Öffentliches HTML",scenario?"Browser → Secret Store direkt":"Git-Repository als Klartext","Beliebiger öffentlicher Kommentar"],scenario?"Das Backend bildet eine Kontroll- und Vertrauensgrenze.":"Secrets gehören in dafür vorgesehene sichere Speicher.");
    },
    ()=>{
      const hasExecution=Math.random()>.5;
      return q("G-DEBUG-"+(hasExecution?"E":"N"),"debugging",hasExecution?"Es gibt eine Execution, aber Node 4 ist rot. Wo suchst du zuerst?":"Es gibt überhaupt keine Execution. Wo suchst du zuerst?",hasExecution?"Input/Output und Fehler von Node 4":"Trigger, Endpoint und Request",[hasExecution?"DNS des Benutzers":"Letzten Node löschen","Workflow umbenennen","CSS prüfen"],hasExecution?"Die Execution zeigt den konkreten Fehlerpfad.":"Ohne Execution wurde der Trigger wahrscheinlich nicht erreicht.");
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
        result.hidden=false;
        result.innerHTML=`<strong>${correctCount}/${questions.length} richtig · ${percent}%</strong>
          <p>${percent>=80?"Bestanden. Starte trotzdem einen neuen Versuch – die Fragen und Reihenfolge ändern sich.":"Noch nicht bestanden. Der nächste Versuch priorisiert zusätzlich deine schwächeren Themen und verwendet möglichst andere Fragen."}</p>`;
        window.dispatchEvent(new CustomEvent("bais:assessment-result",{detail:{moduleSlug:"modul-01",score:percent,passed:percent>=80}}));
        result.scrollIntoView({behavior:"smooth",block:"center"});
      }
    });

    restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});
    render();
  }

  document.addEventListener("DOMContentLoaded",init);
})();