(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js. This file only drives the
 // Datenklassifizierungs-Checker lab UI and reports a correctly completed
 // lab case via the shared "bais:lab-case" event.
 const input=document.querySelector("[data-data-input]"),output=document.querySelector("[data-data-output]"),run=document.querySelector("[data-data-run]"),nodes=[...document.querySelectorAll("[data-kif4-node]")],presets=[...document.querySelectorAll("[data-data-preset]")];
 let activeCase="";

 const samples={
  unbedenklich:"Erstelle eine allgemeine Produktbeschreibung für unseren neuen Newsletter-Anmeldeprozess.",
  personenbezogen:"Fasse die Kundenanfrage von Herrn Weber (Kundennummer 88213, geboren am 3. Mai 1985) zusammen.",
  besondere_kategorie:"Erstelle eine interne Notiz zur Schwerbehinderung und den Medikamenten von Frau Klein für die Personalakte."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.dataPreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Text geladen. Sage vor dem Start voraus, wie er eingestuft wird.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kifFlow4")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function animate(ok=true){
  connector.reset();
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i];
   if(i>0)connector.lines[i-1]?.classList.add("active");
   n.classList.add("active");
   await wait(200);
   n.classList.remove("active");
   const stepOk=ok||i<1;
   n.classList.add(stepOk?"ok":"error");
   if(i>0){connector.lines[i-1]?.classList.remove("active");if(stepOk)connector.lines[i-1]?.classList.add("done");}
  }
 }

 run?.addEventListener("click",async()=>{
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
  const text=input.value;
  run.disabled=true;run.textContent="Klassifizierung läuft…";output.textContent="Datenklassifizierungs-Checker wird aufgerufen…";
  try{
   const response=await fetch("/api/kif-module-04",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({text})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const unbOk=activeCase==="unbedenklich"&&response.ok&&body.route==="unbedenklich";
   const perOk=activeCase==="personenbezogen"&&response.ok&&body.route==="personenbezogen";
   const besOk=activeCase==="besondere_kategorie"&&response.status===422&&body.route==="besondere_kategorie";
   if(unbOk||perOk||besOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Daten klassifizieren";}
 });
})();
