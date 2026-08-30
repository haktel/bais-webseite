(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js. This file only drives the
 // Trust-Boundary-Analyzer lab UI and reports a correctly completed lab
 // case via the shared "bais:lab-case" event.
 const input=document.querySelector("[data-flow-input]"),output=document.querySelector("[data-flow-output]"),run=document.querySelector("[data-flow-run]"),nodes=[...document.querySelectorAll("[data-kis1-node]")],presets=[...document.querySelectorAll("[data-flow-preset]")];
 let activeCase="";

 const samples={
  unkritisch:"Ein Chatbot beantwortet intern Fragen zu unserer öffentlichen Produktdokumentation, vollständig on-premise gehostet ohne Internetzugriff.",
  pruefen:"Wir nutzen einen Cloud-Anbieter, um interne Meeting-Notizen zusammenzufassen.",
  hochrisiko:"Wir senden Kundendaten inklusive Zahlungsdaten an einen externen Cloud-Anbieter zur automatischen Auswertung."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.flowPreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Szenario geladen. Sage vor dem Start voraus, wie es eingestuft wird.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kisFlow1")):{lines:[],reset(){}};
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
  const scenario=input.value;
  run.disabled=true;run.textContent="Analyse läuft…";output.textContent="Trust-Boundary-Analyzer wird aufgerufen…";
  try{
   const response=await fetch("/api/kis-module-01",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const unkOk=activeCase==="unkritisch"&&response.ok&&body.route==="unkritisch";
   const pruOk=activeCase==="pruefen"&&response.ok&&body.route==="pruefen";
   const hocOk=activeCase==="hochrisiko"&&response.status===422&&body.route==="hochrisiko";
   if(unkOk||pruOk||hocOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Datenfluss analysieren";}
 });
})();
