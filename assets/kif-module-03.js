(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js. This file only drives the
 // Prompt-Bausteine-Analyzer lab UI and reports a correctly completed lab
 // case via the shared "bais:lab-case" event.
 const input=document.querySelector("[data-struct-input]"),output=document.querySelector("[data-struct-output]"),run=document.querySelector("[data-struct-run]"),nodes=[...document.querySelectorAll("[data-kif3-node]")],presets=[...document.querySelectorAll("[data-struct-preset]")];
 let activeCase="";

 const samples={
  vollstaendig:"Antworte als erfahrene Marketing-Managerin. Fasse die drei Kampagnen-Ideen für das Vertriebsteam in einer Tabelle mit maximal 5 Zeilen zusammen. Vermeide Fachjargon.",
  teilweise:"Fasse die Kampagnen-Ideen für das Team zusammen.",
  unzureichend:"Schreib was zu Marketing."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.structPreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Prompt geladen. Sage vor dem Start voraus, wie viele der fünf Bausteine erkannt werden.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kifFlow3")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function animate(ok=true){
  connector.reset();
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i];
   if(i>0)connector.lines[i-1]?.classList.add("active");
   n.classList.add("active");
   await wait(180);
   n.classList.remove("active");
   const stepOk=ok||i<1;
   n.classList.add(stepOk?"ok":"error");
   if(i>0){connector.lines[i-1]?.classList.remove("active");if(stepOk)connector.lines[i-1]?.classList.add("done");}
  }
 }

 run?.addEventListener("click",async()=>{
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
  const prompt=input.value;
  run.disabled=true;run.textContent="Analyse läuft…";output.textContent="Prompt-Bausteine-Analyzer wird aufgerufen…";
  try{
   const response=await fetch("/api/kif-module-03",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({prompt})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const vollOk=activeCase==="vollstaendig"&&response.ok&&body.route==="vollstaendig";
   const teilOk=activeCase==="teilweise"&&response.ok&&body.route==="teilweise";
   const unzOk=activeCase==="unzureichend"&&response.status===422&&body.route==="unzureichend";
   if(vollOk||teilOk||unzOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Struktur analysieren";}
 });
})();
