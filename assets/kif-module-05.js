(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js. This file only drives the
 // Quellen- und Zitat-Checker lab UI and reports a correctly completed
 // lab case via the shared "bais:lab-case" event.
 const input=document.querySelector("[data-cite-input]"),output=document.querySelector("[data-cite-output]"),run=document.querySelector("[data-cite-run]"),nodes=[...document.querySelectorAll("[data-kif5-node]")],presets=[...document.querySelectorAll("[data-cite-preset]")];
 let activeCase="";

 const samples={
  belegt:"Laut einer Analyse von Müller et al. (2021) stieg die Konversionsrate im untersuchten Zeitraum um rund 12 %.",
  vage:"Studien zeigen, dass automatisierte Workflows die Bearbeitungszeit deutlich verkürzen.",
  unbelegt:"Die Fehlerquote liegt bei 3,2 % und ist damit branchenweit die niedrigste."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.citePreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Text geladen. Sage vor dem Start voraus, wie er eingestuft wird.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kifFlow5")):{lines:[],reset(){}};
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
  run.disabled=true;run.textContent="Prüfung läuft…";output.textContent="Quellen- und Zitat-Checker wird aufgerufen…";
  try{
   const response=await fetch("/api/kif-module-05",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({text})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const belOk=activeCase==="belegt"&&response.ok&&body.route==="belegt";
   const vagOk=activeCase==="vage"&&response.ok&&body.route==="vage";
   const unbOk=activeCase==="unbelegt"&&response.status===422&&body.route==="unbelegt";
   if(belOk||vagOk||unbOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Quelle prüfen";}
 });
})();
