(()=> {
 const out=document.querySelector("[data-res-output]"),analysis=document.querySelector("[data-res-analysis]"),run=document.querySelector("[data-res-run]"),presets=[...document.querySelectorAll("[data-res-preset]")],nodes=[...document.querySelectorAll("[data-m06-node]")];
 let active="success";
 const cases={
  success:{status:200,action:"continue",title:"200 Success"},
  client:{status:400,action:"reject",title:"400 Client Error"},
  rate:{status:429,action:"retry_backoff",title:"429 Rate Limit"},
  server:{status:500,action:"retry_backoff",title:"500 Server Error"}
 };
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const pretty=v=>JSON.stringify(v,null,2);
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module6Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function select(id){active=id;presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.resPreset===id)));out.textContent=cases[id].title+" geladen. Sage voraus: retry oder reject?";analysis.hidden=true;analysis.innerHTML="";nodes.forEach(n=>n.classList.remove("active","ok","error"));}
 presets.forEach(b=>b.addEventListener("click",()=>select(b.dataset.resPreset)));
 async function animate(){connector.reset();for(let i=0;i<nodes.length;i++){const n=nodes[i];if(i>0)connector.lines[i-1]?.classList.add("active");n.classList.add("active");await wait(200);n.classList.remove("active");n.classList.add("ok");if(i>0){connector.lines[i-1]?.classList.remove("active");connector.lines[i-1]?.classList.add("done");}}}
 function render(body){if(!analysis)return;const c=body.classification||{},p=body.policy||{};analysis.hidden=false;analysis.innerHTML='<div class="ey">RESILIENCE DECISION</div><div class="resDecision"><section><span>STATUS</span><strong>'+esc(body.upstream?.status)+'</strong></section><section><span>CLASS</span><strong>'+esc(c.failureClass)+'</strong></section><section><span>RETRYABLE</span><strong>'+esc(c.retryable)+'</strong></section><section><span>ACTION</span><strong>'+esc(c.action)+'</strong></section></div><div class="resReason"><strong>Warum?</strong><p>'+esc(c.reason)+'</p></div><div class="backoffDisplay"><span>Retry Policy</span><div>'+((p.backoffExampleSeconds||[]).map((s,i)=>'<i>Try '+(i+1)+'<b>'+s+'s</b></i>').join(""))+'</div><p>'+esc(p.note||"")+'</p></div>';}
 run?.addEventListener("click",async()=>{run.disabled=true;run.textContent="Upstream wird getestet…";analysis.hidden=true;nodes.forEach(n=>n.classList.remove("active","ok","error"));try{const response=await fetch("/api/n8n-module-06",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario:active})});const body=await response.json().catch(()=>({}));await animate();out.textContent=pretty(body);render(body);const ok=response.ok&&body.case===active&&Number(body.upstream?.status)===cases[active].status&&body.classification?.action===cases[active].action;if(ok){window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:active}}));out.textContent+="\n\n✓ Lernfall korrekt durchgeführt und gespeichert.";}else out.textContent+="\n\nDieser Lauf zählt noch nicht. Prüfe Statusklasse und Policy.";}catch(e){nodes[0]?.classList.add("error");out.textContent="FEHLER: "+e.message;}finally{run.disabled=false;run.textContent="Live Resilience Workflow starten";}});
 select("success");
})();