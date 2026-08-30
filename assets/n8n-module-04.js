(()=> {
 const output=document.querySelector("[data-auth-output]"),
   breakdown=document.querySelector("[data-auth-breakdown]"),
   run=document.querySelector("[data-auth-run]"),
   scenario=document.querySelector("[data-auth-scenario]"),
   presets=[...document.querySelectorAll("[data-auth-preset]")],
   nodes=[...document.querySelectorAll("[data-m04-node]")];
 let activeCase="api-key";

 const cases={
  "api-key":{title:"API Key · gültig",expect:"200",meaning:"Credential gültig + benötigter Scope vorhanden."},
  "bearer":{title:"Bearer Token · gültig",expect:"200",meaning:"Token gültig + benötigter Scope vorhanden."},
  "forbidden":{title:"Bearer Token · Scope fehlt",expect:"403",meaning:"Identität bekannt, aber Berechtigung fehlt."},
  "expired":{title:"Bearer Token · abgelaufen",expect:"401",meaning:"Authentifizierung ist nicht mehr gültig."}
 };
 const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
 const pretty=value=>JSON.stringify(value,null,2);
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module4Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 function selectCase(id){
   activeCase=id;scenario.value=id;
   presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.authPreset===id)));
   const c=cases[id];
   output.textContent=c.title+" geladen. Erwartung: HTTP "+c.expect+". Erkläre zuerst warum.";
   breakdown.hidden=true;breakdown.innerHTML="";
   nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }
 presets.forEach(b=>b.addEventListener("click",()=>selectCase(b.dataset.authPreset)));
 scenario?.addEventListener("change",()=>selectCase(scenario.value));

 async function animate(){
   connector.reset();
   for(let i=0;i<nodes.length;i++){
    const n=nodes[i];
    if(i>0)connector.lines[i-1]?.classList.add("active");
    n.classList.add("active");await wait(220);n.classList.remove("active");n.classList.add("ok");
    if(i>0){connector.lines[i-1]?.classList.remove("active");connector.lines[i-1]?.classList.add("done");}
   }
 }

 function render(body){
   if(!breakdown)return;
   const resource=body?.protectedResource||{},auth=resource?.auth||{};
   breakdown.hidden=false;
   breakdown.innerHTML='<div class="ey">AUTHENTICATION / AUTHORIZATION BREAKDOWN</div>'+
    '<div class="authResultGrid">'+
     '<section><span>SCENARIO</span><strong>'+esc(body.case)+'</strong></section>'+
     '<section><span>AUTH TYPE</span><strong>'+esc(body.authType)+'</strong></section>'+
     '<section><span>EXPECTED</span><strong>HTTP '+esc(body.expectedStatus)+'</strong></section>'+
     '<section><span>OBSERVED</span><strong>HTTP '+esc(body.observedStatus)+'</strong></section>'+
     '<section><span>REQUIRED SCOPE</span><code>customer:read</code></section>'+
     '<section><span>GRANTED SCOPES</span><code>'+esc((auth.scopes||[]).join(", ")||"—")+'</code></section>'+
    '</div>'+
    '<div class="authLesson"><strong>Interpretation</strong><p>'+esc(body.lesson||body.expectedMeaning||"")+'</p></div>'+
    '<div class="demoSecretWarning"><strong>DEMO ONLY</strong><p>Der Lab verwendet absichtlich wertlose Demo-Credentials. Niemals echte API Keys, Access Tokens oder Client Secrets in Browser, Screenshots, Chat oder Git committen.</p></div>';
 }

 run?.addEventListener("click",async()=>{
   run.disabled=true;run.textContent="Auth Request läuft…";
   output.textContent="BAIS → n8n → Protected Resource …";breakdown.hidden=true;breakdown.innerHTML="";
   nodes.forEach(n=>n.classList.remove("active","ok","error"));
   try{
    const response=await fetch("/api/n8n-module-04",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario:activeCase})});
    const body=await response.json().catch(()=>({}));
    await animate();output.textContent=pretty(body);render(body);
    const expected=Number(cases[activeCase].expect),correct=response.ok&&Number(body.observedStatus)===expected&&body.case===activeCase;
    if(correct){
      window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
      output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
    }else output.textContent+="\n\nDieser Lauf zählt noch nicht. Vergleiche erwarteten und beobachteten Status.";
   }catch(error){
    nodes[0]?.classList.add("error");output.textContent="FEHLER: "+error.message+"\n\nDebugging: Credential-Typ → Header → Tokenzustand → Scope → Statuscode.";
   }finally{run.disabled=false;run.textContent="Live Auth Workflow starten";}
 });

 selectCase("api-key");
})();