(()=> {
 const STORE={last:"bais-n8n-m02-last",weak:"bais-n8n-m02-weak",attempt:"bais-n8n-m02-attempt"};
 const q=(id,topic,prompt,correct,wrong,explanation)=>({id,topic,prompt,options:[correct,...wrong].map((text,i)=>({text,correct:i===0})),explanation});
 const BANK=[
  q("J01","json","Welcher JSON-Wert ist eine Zahl?","7500",["\"7500\"","true","[7500]"],"Zahlen stehen in JSON ohne Anführungszeichen."),
  q("J02","json","Welcher JSON-Wert ist ein String?","\"BAIS\"",["BAIS","true","7500"],"Strings stehen in doppelten Anführungszeichen."),
  q("J03","json","Welche Struktur ist ein Array?","[\"AI\",\"n8n\"]",["{\"AI\":true}","\"AI,n8n\"","(AI,n8n)"],"Arrays sind geordnete Listen in eckigen Klammern."),
  q("J04","json","Welche Struktur ist ein Object?","{\"name\":\"Mina\"}",["[\"name\",\"Mina\"]","\"name:Mina\"","name=Mina"],"JSON Objects verwenden geschweifte Klammern und Key-Value-Paare."),
  q("J05","json","Warum sind Datentypen wichtig?","Weil Vergleiche, Berechnungen und Validierung vom Typ abhängen",["Nur für die Farbe der Node","Nur für Dateinamen","Weil jeder Wert String sein muss"],"Zum Beispiel ist \"7500\" ein String und 7500 eine Zahl."),
  q("I01","items","Was ist ein n8n Item?","Eine einzelne Verarbeitungseinheit mit strukturierten Daten",["Ein Credential","Ein Workflow-Backup","Ein Benutzerkonto"],"Nodes verarbeiten typischerweise ein oder mehrere Items."),
  q("I02","items","Ein Node erhält 5 Items. Was bedeutet das?","Er erhält fünf Datensätze zur Verarbeitung",["Der Workflow startet fünfmal zwingend neu","Es gibt fünf Credentials","Es existieren fünf Webhooks"],"Mehrere Items laufen innerhalb derselben Execution durch Nodes."),
  q("I03","items","Was ist der Unterschied zwischen Array und mehreren n8n Items?","Ein Array ist ein Wert innerhalb von Daten; Items sind separate Verarbeitungseinheiten",["Es gibt keinen Unterschied","Items sind nur Strings","Arrays können nie in Items vorkommen"],"Diese Unterscheidung ist für Split und Aggregate zentral."),
  q("I04","items","Wann ist Split Out sinnvoll?","Wenn Elemente eines Arrays als einzelne Items weiterverarbeitet werden sollen",["Zum Speichern eines API Keys","Zum Aktivieren eines Webhooks","Nur für CSS"],"Split Out macht einzelne Array-Elemente separat verarbeitbar."),
  q("I05","items","Wann ist Aggregate sinnvoll?","Wenn mehrere Items wieder zu einer gemeinsamen Struktur zusammengeführt werden sollen",["Zum Löschen von Credentials","Nur für Trigger","Zum Ändern der HTTP-Methode"],"Aggregate führt mehrere Items zusammen."),
  q("E01","expressions","Was liefert {{$json.email}}?","Den Wert des Feldes email aus dem aktuellen Item",["Immer die E-Mail des Benutzers","Den Namen des Workflows","Ein Credential"],"$json referenziert die Daten des aktuellen Items."),
  q("E02","expressions","Eine Expression liefert undefined. Was prüfst du zuerst?","Ob das Feld im aktuellen Input tatsächlich existiert",["Den Browser neu installieren","Den Workflow löschen","Die Datenbank leeren"],"Expressions können nur vorhandene Pfade korrekt lesen."),
  q("E03","expressions","Warum sind Expressions nützlich?","Sie machen Node-Konfiguration dynamisch abhängig von eingehenden Daten",["Sie verschlüsseln automatisch alles","Sie ersetzen Trigger","Sie sind nur Kommentare"],"Expressions verbinden Datenfluss und Konfiguration."),
  q("E04","expressions","Was ist bei verschachtelten Feldern wichtig?","Der vollständige Datenpfad muss stimmen",["Nur die Node-Farbe","Nur der Dateiname","Der HTTP-Port muss 443 sein"],"Bei nested Objects muss der richtige Pfad referenziert werden."),
  q("E05","expressions","Wann ist ein fester Wert besser als eine Expression?","Wenn der Wert bewusst konstant sein soll",["Nie","Nur bei Fehlern","Nur im Test-Webhook"],"Nicht jede Konfiguration muss dynamisch sein."),
  q("N01","nodes","Wofür dient Edit Fields / Set typischerweise?","Felder gezielt erstellen, umbenennen oder neu strukturieren",["HTTP-Server installieren","Passwörter hashen","Backups starten"],"Der Node ist zentral für Mapping und Normalisierung."),
  q("N02","nodes","Wann ist ein Code Node sinnvoll?","Wenn Transformationen mit Standard-Nodes unnötig komplex werden",["Für jedes einzelne Feld zwingend","Nur für Webhooks","Als Credential Store"],"Code sollte gezielt eingesetzt werden."),
  q("N03","nodes","Warum nicht jede Transformation im Code Node lösen?","Standard-Nodes sind oft transparenter, wartbarer und leichter zu erklären",["Code Nodes sind verboten","JavaScript kann keine JSON-Daten lesen","Code Nodes laufen nur lokal"],"Wartbarkeit zählt im Betrieb."),
  q("N04","nodes","Was macht Merge konzeptionell?","Datenströme oder Items nach definierter Logik zusammenführen",["Secrets rotieren","E-Mail versenden","Webhook aktivieren"],"Merge kombiniert getrennte Pfade."),
  q("N05","nodes","Was sollte ein Transformations-Node idealerweise liefern?","Ein klar definiertes, konsistentes Output-Schema",["Beliebige Feldnamen bei jedem Lauf","Möglichst viele unbekannte Felder","Secrets im Output"],"Stabile Datenverträge reduzieren Folgefehler."),
  q("T01","transform","Was bedeutet Normalisierung?","Uneinheitliche Eingaben in ein konsistentes Schema überführen",["Alle Daten löschen","Nur Großbuchstaben verwenden","JSON in HTML umwandeln"],"Beispiele sind trim, lowercase, Typkonvertierung und Feldmapping."),
  q("T02","transform","Warum wird eine E-Mail oft getrimmt und kleingeschrieben?","Um unnötige Unterschiede und Vergleichsprobleme zu reduzieren",["Damit sie verschlüsselt ist","Damit SMTP schneller wird","Nur wegen CSS"],"Normalisierung verbessert Datenqualität."),
  q("T03","transform","Warum sollte \"7500\" vor Berechnungen in Number umgewandelt werden?","Weil es als String sonst unerwartetes Verhalten erzeugen kann",["Weil JSON keine Strings erlaubt","Weil n8n nur Zahlen speichert","Weil Webhooks Zahlen erzwingen"],"Typkonvertierung macht Business-Regeln verlässlich."),
  q("T04","transform","Warum können doppelte Tags entfernt werden?","Damit nachgelagerte Systeme ein sauberes, eindeutiges Set erhalten",["Weil Arrays verboten sind","Weil Items sonst verschwinden","Weil HTTP keine Duplikate erlaubt"],"Deduplizierung ist ein typischer Datenqualitäts-Schritt."),
  q("T05","transform","Was ist ein Datenvertrag?","Eine klare Erwartung an Felder, Typen und Bedeutung von Input und Output",["Ein Vertrag mit dem Hosting-Anbieter","Eine UI-Farbe","Ein Credential"],"Datenverträge machen Integrationen test- und wartbar."),
  q("D01","debug","Ein Budget kommt als \"7500\" an und der Vergleich verhält sich falsch. Erste Maßnahme?","Datentyp prüfen und kontrolliert in Number umwandeln",["Webhook löschen","Credential erneuern","Workflow umbenennen"],"Typfehler sind klassische Transformationsprobleme."),
  q("D02","debug","Nach Split Out entstehen 20 Items statt erwartet 2. Was prüfst du?","Welches Array tatsächlich gesplittet wird und wie viele Elemente es enthält",["DNS","OAuth Scope","Node-Farbe"],"Item-Anzahl folgt der tatsächlichen Datenstruktur."),
  q("D03","debug","Ein Feld verschwindet nach Edit Fields. Was prüfst du?","Welche Felder der Node beibehält oder explizit ausgibt",["TLS-Zertifikat","Browser-Zoom","Workflow-ID"],"Mapping-Nodes können bewusst nur ausgewählte Felder weitergeben."),
  q("D04","debug","Ein Code Node gibt keine Items zurück. Was ist kritisch?","Das Rückgabeformat des Code Nodes",["Die Footer-Farbe","Der Domainname","Der Webhook-Pfad des nächsten Moduls"],"Code Nodes müssen das von n8n erwartete Item-Format liefern."),
  q("D05","debug","Warum Input und Output jedes betroffenen Nodes vergleichen?","Damit sichtbar wird, an welcher Stelle die Datenstruktur kippt",["Weil Logs verboten sind","Weil n8n sonst stoppt","Nur für Screenshots"],"Debugging folgt dem Datenfluss.")
 ];
 const factories=[
  ()=>{const values=["  MINA@EXAMPLE.COM ","Jonas@Example.com "," SUPPORT@BAIS.DE"];const raw=values[Math.floor(Math.random()*values.length)];const normalized=raw.trim().toLowerCase();return q("GMAIL-"+normalized,"transform","Welche normalisierte E-Mail entsteht aus "+JSON.stringify(raw)+"?",normalized,[raw.trim(),raw.toLowerCase(),"undefined"],"trim() entfernt Rand-Leerzeichen, toLowerCase() vereinheitlicht die Schreibweise.");},
  ()=>{const values=[2,3,5,8];const n=values[Math.floor(Math.random()*values.length)];return q("GITEM-"+n,"items","Ein Array mit "+n+" Kundeneinträgen wird in einzelne Items aufgeteilt. Wie viele Items erwartest du?",String(n),[String(n+1),"1","0"],"Bei einer einfachen Aufteilung entsteht pro Array-Element ein Item.");},
  ()=>{const values=["2500","5000","7500"];const budget=values[Math.floor(Math.random()*values.length)];return q("GNUM-"+budget,"json","Der Input enthält budget: "+JSON.stringify(budget)+". Welcher Typ liegt zunächst vor?","String",["Number","Boolean","Array"],"Anführungszeichen machen den Wert zu einem String.");},
  ()=>{const fields=["email","budget","fullName"];const field=fields[Math.floor(Math.random()*fields.length)];return q("GEXP-"+field,"expressions","Welcher Ausdruck liest im aktuellen Item das Feld "+field+"?","{{$json."+field+"}}",["{{$json}}."+field,"{{"+field+"}}","$('"+field+"')"],"$json referenziert das aktuelle Item; anschließend wird das Feld adressiert.");},
  ()=>{const values=[1,4,7];const count=values[Math.floor(Math.random()*values.length)];return q("GAGG-"+count,"items","Nach einer Transformation liegen "+count+" Items vor. Du willst eine einzige Response mit einem records-Array. Welches Konzept passt?","Aggregate",["Split Out","Trigger","Credential"],"Aggregate führt mehrere Items wieder in eine gemeinsame Struktur zusammen.");}
 ];
 const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
 const weak=()=>JSON.parse(localStorage.getItem(STORE.weak)||"{}");
 const saveWeak=v=>localStorage.setItem(STORE.weak,JSON.stringify(v));
 function select(count=12){
   const prev=new Set(JSON.parse(localStorage.getItem(STORE.last)||"[]"));
   const pool=[...BANK,...factories.map(f=>f())];
   const fresh=pool.filter(x=>!prev.has(x.id));
   const source=fresh.length>=count?fresh:pool;
   const weakness=weak(),weighted=[];
   source.forEach(item=>{weighted.push(item);for(let i=0;i<Math.min(Number(weakness[item.topic]||0),3);i++)weighted.push(item);});
   const picked=[],used=new Set();
   for(const item of shuffle(weighted)){if(used.has(item.id))continue;used.add(item.id);picked.push(item);if(picked.length===count)break;}
   localStorage.setItem(STORE.last,JSON.stringify(picked.map(x=>x.id)));
   return shuffle(picked);
 }
 function init(){
   const root=document.querySelector("[data-assessment]");if(!root)return;
   const list=root.querySelector("[data-assessment-list]"),result=root.querySelector("[data-assessment-result]"),restart=root.querySelector("[data-assessment-restart]"),counter=root.querySelector("[data-assessment-counter]");
   let questions=[],answered=0,correct=0;
   const render=()=>{
     questions=select(12);answered=0;correct=0;
     const attempt=Number(localStorage.getItem(STORE.attempt)||0)+1;localStorage.setItem(STORE.attempt,String(attempt));
     counter.textContent="Versuch "+attempt+" · 12 wechselnde Fragen";result.hidden=true;result.innerHTML="";
     list.innerHTML=questions.map((item,index)=>"<article class=\"assessmentItem\" data-q=\""+item.id+"\" data-topic=\""+item.topic+"\"><div class=\"assessmentMeta\"><span>FRAGE "+(index+1)+"/12</span><span>"+item.topic.toUpperCase()+"</span></div><h3>"+item.prompt+"</h3><div class=\"assessmentOptions\">"+shuffle(item.options).map(o=>"<button type=\"button\" data-answer data-correct=\""+o.correct+"\">"+o.text+"</button>").join("")+"</div><div class=\"assessmentExplain\" data-explain hidden></div></article>").join("");
   };
   list.addEventListener("click",event=>{
     const b=event.target.closest("[data-answer]");if(!b||b.disabled)return;
     const card=b.closest(".assessmentItem"),item=questions.find(x=>x.id===card.dataset.q),buttons=[...card.querySelectorAll("[data-answer]")];
     buttons.forEach(x=>x.disabled=true);const ok=b.dataset.correct==="true";b.classList.add(ok?"correct":"wrong");const good=buttons.find(x=>x.dataset.correct==="true");if(good)good.classList.add("correct");
     const ex=card.querySelector("[data-explain]");ex.hidden=false;ex.innerHTML="<strong>"+(ok?"Richtig":"Nicht ganz")+"</strong><p>"+item.explanation+"</p>";
     answered++;if(ok)correct++;else{const w=weak();w[item.topic]=Number(w[item.topic]||0)+1;saveWeak(w);}
     if(answered===questions.length){const pct=Math.round(correct/questions.length*100);result.hidden=false;result.innerHTML="<strong>"+correct+"/"+questions.length+" richtig · "+pct+"%</strong><p>"+(pct>=80?"Bestanden. Ein neuer Versuch verwendet wieder andere Fragen und Varianten.":"Noch nicht bestanden. Der nächste Versuch gewichtet deine schwächeren Themen stärker und vermeidet möglichst die zuletzt gesehenen Fragen.")+"</p>";result.scrollIntoView({behavior:"smooth",block:"center"});}
   });
   restart.addEventListener("click",()=>{render();root.scrollIntoView({behavior:"smooth",block:"start"});});render();
 }
 document.addEventListener("DOMContentLoaded",init);
})();