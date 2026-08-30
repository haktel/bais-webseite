(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js (shared across every module/course).
 // This file only drives the Halluzinations- & Bias-Checker lab UI and
 // reports a correctly completed lab case via the shared "bais:lab-case"
 // event.
 const input=document.querySelector("[data-output-input]"),output=document.querySelector("[data-output-output]"),run=document.querySelector("[data-output-run]"),nodes=[...document.querySelectorAll("[data-kif2-node]")],presets=[...document.querySelectorAll("[data-output-preset]")];
 let activeCase="";

 const samples={
  verlaesslich:"Laut den mir vorliegenden Informationen könnte die Umsatzsteigerung bei etwa 8-10 % liegen; das solltest du vor der Veröffentlichung mit den aktuellen Quartalszahlen abgleichen.",
  pruefen:"Die Konversionsrate liegt bei 34,7 % und ist branchenweit der Höchstwert.",
  kritisch:"Das ist zu 100% korrekt und garantiert der offizielle Rekordwert von 2019 mit 47,8 Millionen verkauften Einheiten."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.outputPreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Text geladen. Sage vor dem Start voraus, ob er als verlässlich, prüfen oder kritisch eingestuft wird.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kifFlow2")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function animate(ok=true){
  connector.reset();
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i];
   if(i>0)connector.lines[i-1]?.classList.add("active");
   n.classList.add("active");
   await wait(220);
   n.classList.remove("active");
   const stepOk=ok||i<1;
   n.classList.add(stepOk?"ok":"error");
   if(i>0){connector.lines[i-1]?.classList.remove("active");if(stepOk)connector.lines[i-1]?.classList.add("done");}
  }
 }

 run?.addEventListener("click",async()=>{
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
  const text=input.value;
  run.disabled=true;run.textContent="Prüfung läuft…";output.textContent="Halluzinations- & Bias-Checker wird aufgerufen…";
  try{
   const response=await fetch("/api/kif-module-02",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({text})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const verlaesslichOk=activeCase==="verlaesslich"&&response.ok&&body.route==="verlaesslich";
   const pruefenOk=activeCase==="pruefen"&&response.ok&&body.route==="pruefen";
   const kritischOk=activeCase==="kritisch"&&response.status===422&&body.route==="kritisch";
   if(verlaesslichOk||pruefenOk||kritischOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Text prüfen";}
 });
})();
