(()=> {
 const out=document.querySelector("[data-rag-output]"),analysis=document.querySelector("[data-rag-analysis]"),run=document.querySelector("[data-rag-run]"),presets=[...document.querySelectorAll("[data-rag-preset]")],nodes=[...document.querySelectorAll("[data-m09-node]")];
 let active="grounded";
 const meta={
  grounded:{title:"Grounded Answer",expect:"retrieval + grounded"},
  unknown:{title:"Unknown Question",expect:"abstain"},
  injection:{title:"Prompt Injection",expect:"blocked before retrieval"},
  cost:{title:"Cost-Aware Prompt",expect:"grounded + token estimate"}
 };
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const pretty=v=>JSON.stringify(v,null,2);
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module9Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function choose(id){active=id;presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.ragPreset===id)));analysis.hidden=true;analysis.innerHTML="";out.textContent=meta[id].title+" geladen. Erwartung: "+meta[id].expect+".";nodes.forEach(n=>n.classList.remove("active","ok","error"));}
 presets.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.ragPreset)));
 async function animate(){connector.reset();for(let i=0;i<nodes.length;i++){const n=nodes[i];if(i>0)connector.lines[i-1]?.classList.add("active");n.classList.add("active");await wait(180);n.classList.remove("active");n.classList.add("ok");if(i>0){connector.lines[i-1]?.classList.remove("active");connector.lines[i-1]?.classList.add("done");}}}
 function render(body){
  if(!analysis)return;analysis.hidden=false;
  const retrieval=body.retrieval||{},answer=body.answer||{},cost=body.cost||{},guard=body.guard||{};
  analysis.innerHTML='<div class="ey">RAG / SAFETY TRACE</div>'+
   '<div class="ragStatusGrid">'+
    '<section><span>CASE</span><strong>'+esc(body.case)+'</strong></section>'+
    '<section><span>GUARD</span><strong>'+esc(guard.blocked?"BLOCKED":"PASS")+'</strong></section>'+
    '<section><span>ANSWER STATUS</span><strong>'+esc(answer.status||"—")+'</strong></section>'+
    '<section><span>MAX SCORE</span><strong>'+esc(retrieval.maxScore??"—")+'</strong></section>'+
   '</div>'+
   (Array.isArray(retrieval.topK)?'<div class="retrievalList"><h3>Top-K Evidence</h3>'+retrieval.topK.map((r,i)=>'<article><b>#'+(i+1)+' · '+esc(r.id)+' · '+esc(r.topic)+'</b><span>score '+esc(r.score)+'</span><p>'+esc(r.text)+'</p><code>'+esc((r.matchedTerms||[]).join(", "))+'</code></article>').join("")+'</div>':'')+
   '<div class="answerCard '+(answer.status==="blocked"?"blocked":answer.status==="abstain"?"abstain":"grounded")+'"><strong>'+esc(answer.status||"result")+'</strong><p>'+esc(answer.text||"")+'</p></div>'+
   (body.prompt?'<details class="promptTrace"><summary>Grounded Prompt anzeigen</summary><pre>'+esc(pretty(body.prompt))+'</pre></details>':'')+
   (cost.inputTokenEstimate?'<div class="costTrace"><span>Input Token Estimate</span><strong>'+esc(cost.inputTokenEstimate)+'</strong><span>Output Budget</span><strong>'+esc(cost.outputTokenBudget)+'</strong><span>Demo Cost</span><strong>$'+esc(cost.estimatedExampleCostUSD)+'</strong><small>Pricing example is illustrative only.</small></div>':'')+
   '<div class="stateProof ok"><strong>POLICY RESULT</strong><p>'+(guard.blocked?'Request was stopped before retrieval/model generation.':answer.status==="abstain"?'Weak evidence caused an explicit no-answer.':'Answer is tied to retrieved evidence, not free-form guessing.')+'</p></div>';
 }
 run?.addEventListener("click",async()=>{run.disabled=true;run.textContent="RAG Pipeline läuft…";analysis.hidden=true;nodes.forEach(n=>n.classList.remove("active","ok","error"));try{const response=await fetch("/api/n8n-module-09",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario:active})});const body=await response.json().catch(()=>({}));await animate();out.textContent=pretty(body);if(response.ok)render(body);
 const ok=(active==="grounded"&&body.answer?.status==="grounded")||(active==="unknown"&&body.answer?.status==="abstain")||(active==="injection"&&body.answer?.status==="blocked")||(active==="cost"&&body.answer?.status==="grounded"&&Number(body.cost?.inputTokenEstimate)>0);
 if(response.ok&&ok){window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:active}}));out.textContent+="\n\n✓ AI/RAG-Lernfall korrekt durchgeführt und gespeichert.";}else out.textContent+="\n\nDieser Fall zählt noch nicht. Prüfe Guard, Evidence Threshold und Answer Policy.";
 }catch(e){nodes[0]?.classList.add("error");out.textContent="FEHLER: "+e.message+"\n\nDebugging: input → guard → retrieval → threshold → prompt → answer policy.";}finally{run.disabled=false;run.textContent="Live RAG Workflow starten";}});
 choose("grounded");
})();