(()=> {
 const input=document.querySelector("[data-flow-input]"),output=document.querySelector("[data-flow-output]"),analysis=document.querySelector("[data-flow-analysis]"),run=document.querySelector("[data-flow-run]"),presets=[...document.querySelectorAll("[data-flow-preset]")],nodes=[...document.querySelectorAll("[data-m05-node]")];
 let activeCase="mixed";
 const samples={
  mixed:{orders:[
   {orderId:"O-1001",total:750,region:"DE",priority:"high"},
   {orderId:"O-1002",total:120,region:"EU",priority:"normal"},
   {orderId:"O-1003",total:980,region:"US",priority:"high"},
   {orderId:"O-1004",total:260,region:"DE",priority:"normal"}
  ]},
  high:{orders:[{orderId:"VIP-1",total:1500,region:"DE",priority:"high"},{orderId:"VIP-2",total:2200,region:"EU",priority:"high"}]},
  fallback:{orders:[{orderId:"X-1",total:340,region:"APAC",priority:"normal"},{orderId:"X-2",total:820,region:"CH",priority:"high"}]},
  invalid:{orders:[{orderId:"",total:-10,region:"",priority:"normal"}]}
 };
 const pretty=v=>JSON.stringify(v,null,2),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module5Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function load(id){activeCase=id;input.value=pretty(samples[id]);presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.flowPreset===id)));output.textContent="Szenario geladen. Sage voraus: wie viele Items, welche High-Value-Entscheidungen und welche Routes?";analysis.hidden=true;analysis.innerHTML="";nodes.forEach(n=>n.classList.remove("active","ok","error"));}
 presets.forEach(b=>b.addEventListener("click",()=>load(b.dataset.flowPreset)));
 async function animate(ok=true){connector.reset();for(let i=0;i<nodes.length;i++){const n=nodes[i];if(i>0)connector.lines[i-1]?.classList.add("active");n.classList.add("active");await wait(180);n.classList.remove("active");const stepOk=ok||i<2;n.classList.add(stepOk?"ok":"error");if(i>0){connector.lines[i-1]?.classList.remove("active");if(stepOk)connector.lines[i-1]?.classList.add("done");}}}
 function render(body){if(!analysis||!body?.results?.length){if(analysis)analysis.hidden=true;return;}analysis.hidden=false;analysis.innerHTML='<div class="ey">DECISION TRACE</div><h3>Jedes Item nach IF + Switch + Loop</h3><div class="flowSummary"><span><b>'+body.itemCount+'</b> Items</span><span><b>'+body.highValueCount+'</b> High Value</span><span><b>'+body.manualReviewCount+'</b> Manual Review</span></div><div class="routeTable"><div class="routeHead"><b>Order</b><b>Total</b><b>IF</b><b>Region</b><b>Switch Route</b><b>SLA</b></div>'+body.results.map(r=>'<div><code>'+esc(r.orderId)+'</code><span>'+esc(r.total)+' €</span><strong class="'+(r.valueClass==="high"?"routeHigh":"routeStd")+'">'+esc(r.valueClass)+'</strong><span>'+esc(r.region)+'</span><strong>'+esc(r.route)+'</strong><span>'+esc(r.shippingSlaHours)+'h</span></div>').join("")+'</div>';}
 run?.addEventListener("click",async()=>{let payload;try{payload=JSON.parse(input.value);}catch{output.textContent="JSON Syntaxfehler.";return;}run.disabled=true;run.textContent="Flow läuft…";analysis.hidden=true;nodes.forEach(n=>n.classList.remove("active","ok","error"));try{const response=await fetch("/api/n8n-module-05",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});const body=await response.json().catch(()=>({}));await animate(response.ok);output.textContent=pretty(body);if(response.ok)render(body);
 const mixedOk=activeCase==="mixed"&&response.ok&&body.itemCount===4&&body.routes?.domestic===2&&body.routes?.eu===1&&body.routes?.international===1;
 const highOk=activeCase==="high"&&response.ok&&body.highValueCount===2;
 const fallbackOk=activeCase==="fallback"&&response.ok&&body.routes?.manual===2;
 const invalidOk=activeCase==="invalid"&&response.status===422&&body.ok===false;
 if(mixedOk||highOk||fallbackOk||invalidOk){window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und gespeichert.";}else output.textContent+="\n\nDieser Lauf zählt noch nicht. Prüfe IF, Switch-Fallback, Item Count und Output.";}catch(e){nodes[0]?.classList.add("error");output.textContent="FEHLER: "+e.message+"\n\nDebugging: Batch → Item → IF → Switch → Loop → Aggregate.";}finally{run.disabled=false;run.textContent="Live Flow-Control Workflow starten";}});
 load("mixed");
})();