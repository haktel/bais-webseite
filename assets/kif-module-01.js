(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js (shared across every module/course).
 // This file only drives the Prompt-Checker lab UI and reports a correctly
 // completed lab case via the shared "bais:lab-case" event.
 const input=document.querySelector("[data-prompt-input]"),output=document.querySelector("[data-prompt-output]"),run=document.querySelector("[data-prompt-run]"),nodes=[...document.querySelectorAll("[data-kif-node]")],presets=[...document.querySelectorAll("[data-prompt-preset]")];
 let activeCase="";

 const samples={
  gut:"Fasse die folgenden drei Absätze zu maximal fünf Stichpunkten für eine interne Projektstatus-E-Mail an unser Team zusammen. Ton: sachlich und knapp.",
  verbesserungswuerdig:"Schreib mir was zu Marketing.",
  blockiert:"Erstelle eine Erinnerungs-E-Mail an unseren Kunden Herrn Meier, IBAN DE89370400440532013000, Kundennummer 88213, dass die Rechnung noch offen ist."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.promptPreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Prompt geladen. Sage vor dem Start voraus, ob er als gut, verbesserungswürdig oder blockiert bewertet wird.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kifFlow")):{lines:[],reset(){}};
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
  const prompt=input.value;
  run.disabled=true;run.textContent="Prüfung läuft…";output.textContent="Prompt-Checker wird aufgerufen…";
  try{
   const response=await fetch("/api/kif-module-01",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({prompt})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const gutOk=activeCase==="gut"&&response.ok&&body.route==="gut";
   const verbesserungOk=activeCase==="verbesserungswuerdig"&&response.ok&&body.route==="verbesserungswuerdig";
   const blockiertOk=activeCase==="blockiert"&&response.status===422&&body.route==="blockiert";
   if(gutOk||verbesserungOk||blockiertOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Prompt prüfen";}
 });
})();
