(()=> {
 const out=document.querySelector("[data-db-output]"),
   analysis=document.querySelector("[data-db-analysis]"),
   run=document.querySelector("[data-db-run]"),
   presets=[...document.querySelectorAll("[data-db-preset]")],
   nodes=[...document.querySelectorAll("[data-m07-node]")];
 let active="create";

 const key=()=>crypto.randomUUID().replace(/-/g,"").slice(0,20);
 const customerKeyName="bais-m07-customer-key",eventKeyName="bais-m07-event-key",customerRowName="bais-m07-customer-row";
 if(!localStorage.getItem(customerKeyName))localStorage.setItem(customerKeyName,key());
 if(!localStorage.getItem(eventKeyName))localStorage.setItem(eventKeyName,key());

 const labels={
  create:"A · Customer first state",
  update:"B · Same customer upsert",
  "event-first":"C · Event first delivery",
  "event-repeat":"D · Duplicate event replay"
 };
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const pretty=v=>JSON.stringify(v,null,2);
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module7Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));

 function choose(id){
   active=id;
   if(id==="create"){
     localStorage.setItem(customerKeyName,key());
     localStorage.removeItem(customerRowName);
   }
   if(id==="event-first"){
     localStorage.setItem(eventKeyName,key());
   }
   presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.dbPreset===id)));
   analysis.hidden=true;analysis.innerHTML="";
   out.textContent=labels[id]+" geladen. Sage voraus: INSERT, UPDATE oder DEDUPE?";
   nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }
 presets.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.dbPreset)));

 function currentLabKey(){
   return active==="create"||active==="update"
    ? localStorage.getItem(customerKeyName)
    : localStorage.getItem(eventKeyName);
 }

 async function animate(){
   connector.reset();
   for(let i=0;i<nodes.length;i++){
    const n=nodes[i];
    if(i>0)connector.lines[i-1]?.classList.add("active");
    n.classList.add("active");await wait(170);n.classList.remove("active");n.classList.add("ok");
    if(i>0){connector.lines[i-1]?.classList.remove("active");connector.lines[i-1]?.classList.add("done");}
   }
 }

 function renderCustomer(body){
   const row=body.row||{};
   const firstId=localStorage.getItem(customerRowName)||"";
   const sameRow=active==="update"&&firstId&&String(row.id)===firstId;
   if(active==="create"&&row.id)localStorage.setItem(customerRowName,String(row.id));
   analysis.hidden=false;
   analysis.innerHTML='<div class="ey">PERSISTED CUSTOMER STATE</div>'+
    '<div class="dbStateGrid">'+
      '<section><span>SYSTEM ROW ID</span><strong>'+esc(row.id??"—")+'</strong></section>'+
      '<section><span>DOMAIN KEY</span><code>'+esc(row.customerId??"—")+'</code></section>'+
      '<section><span>STATUS</span><strong>'+esc(row.status??"—")+'</strong></section>'+
      '<section><span>SCORE</span><strong>'+esc(row.score??"—")+'</strong></section>'+
    '</div>'+
    '<div class="persistCompare">'+
      '<div><b>createdAt</b><code>'+esc(row.createdAt??"—")+'</code></div>'+
      '<div><b>updatedAt</b><code>'+esc(row.updatedAt??"—")+'</code></div>'+
    '</div>'+
    (active==="update"
      ? '<div class="stateProof '+(sameRow?"ok":"warn")+'"><strong>'+(sameRow?"✓ SAME ROW":"⚠ ROW CHECK")+'</strong><p>'+(sameRow?"Aynı Data Table row ID korundu; customerId eşleşti ve Upsert mevcut state’i güncelledi.":"Önce A senaryosunu çalıştır; sonra aynı browser anahtarıyla B gerçekten update olduğunu ispatlar.")+'</p></div>'
      : '<div class="stateProof ok"><strong>✓ STATE WRITTEN</strong><p>Bu row artık bu execution bittikten sonra da n8n Data Table içinde kalıcıdır.</p></div>');
   return sameRow||active==="create";
 }

 function renderEvent(body){
   analysis.hidden=false;
   analysis.innerHTML='<div class="ey">IDEMPOTENCY / DEDUPE TRACE</div>'+
    '<div class="dedupeProof">'+
      '<section><span>EVENT ID</span><code>'+esc(body.eventId??"—")+'</code></section>'+
      '<section><span>DUPLICATE?</span><strong>'+esc(body.duplicate)+'</strong></section>'+
      '<section><span>INSERTED?</span><strong>'+esc(body.inserted)+'</strong></section>'+
      '<section><span>OPERATION</span><strong>'+esc(body.operation??"—")+'</strong></section>'+
    '</div>'+
    '<div class="stateProof '+(body.duplicate?"warn":"ok")+'"><strong>'+(body.duplicate?"DUPLICATE BLOCKED":"FIRST EVENT STORED")+'</strong><p>'+esc(body.lesson||"")+'</p></div>';
   return active==="event-first"?body.duplicate===false:body.duplicate===true;
 }

 run?.addEventListener("click",async()=>{
   run.disabled=true;run.textContent="Data Table läuft…";
   analysis.hidden=true;analysis.innerHTML="";
   nodes.forEach(n=>n.classList.remove("active","ok","error"));
   try{
    const response=await fetch("/api/n8n-module-07",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario:active,labKey:currentLabKey()})});
    const body=await response.json().catch(()=>({}));
    await animate();out.textContent=pretty(body);
    let proof=false;
    if(response.ok&&body.operation==="upsert")proof=renderCustomer(body);
    else if(response.ok&&String(body.operation||"").startsWith("dedupe_"))proof=renderEvent(body);
    if(proof){
      window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:active}}));
      out.textContent+="\n\n✓ Persistenz-Lernfall korrekt durchgeführt und gespeichert.";
    }else{
      out.textContent+="\n\nDieser Lernfall ist noch nicht nachgewiesen. Führe die Reihenfolge A→B bzw. C→D aus.";
    }
   }catch(e){
    nodes[0]?.classList.add("error");
    out.textContent="FEHLER: "+e.message+"\n\nDebugging: Table exists → domain key → operation → filter → persisted row.";
   }finally{run.disabled=false;run.textContent="Live Persistence Workflow starten";}
 });
 choose("create");
})();