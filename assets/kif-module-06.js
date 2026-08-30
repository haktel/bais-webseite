(()=> {
 // Lesson tracking, reading-time gate and assessment sync are handled
 // generically by n8n-module-study.js. This file only drives the
 // Freigabe-Router lab UI and reports a correctly completed lab case via
 // the shared "bais:lab-case" event.
 const input=document.querySelector("[data-esc-input]"),output=document.querySelector("[data-esc-output]"),run=document.querySelector("[data-esc-run]"),nodes=[...document.querySelectorAll("[data-kif6-node]")],presets=[...document.querySelectorAll("[data-esc-preset]")];
 let activeCase="";

 const samples={
  keine:"Ich habe mir mit KI eine persönliche Gliederung für meine eigenen Meeting-Notizen erstellen lassen.",
  team_review:"Der interne Team-Newsletter mit einer KI-unterstützten Zusammenfassung soll an die gesamte Abteilung gehen.",
  vollfreigabe:"Eine KI-generierte Antwort zu einer rechtlichen Frage soll direkt an eine externe Kundin verschickt werden."
 };

 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.escPreset;
  input.value=samples[activeCase];
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Szenario geladen. Sage vor dem Start voraus, welche Freigabestufe zutrifft.";
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));

 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".kifFlow6")):{lines:[],reset(){}};
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
  run.disabled=true;run.textContent="Prüfung läuft…";output.textContent="Freigabe-Router wird aufgerufen…";
  try{
   const response=await fetch("/api/kif-module-06",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);
   output.textContent=JSON.stringify(body,null,2);

   const keineOk=activeCase==="keine"&&response.ok&&body.route==="keine";
   const teamOk=activeCase==="team_review"&&response.ok&&body.route==="team_review";
   const vollOk=activeCase==="vollfreigabe"&&response.status===422&&body.route==="vollfreigabe";
   if(keineOk||teamOk||vollOk){
    window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
    output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
   }else if(activeCase){
    output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe deine Erwartung gegen das tatsächliche Ergebnis.";
   }
  }catch(error){
   nodes[0]?.classList.add("error");
   output.textContent="FEHLER: "+error.message;
  }finally{run.disabled=false;run.textContent="Freigabestufe prüfen";}
 });
})();
