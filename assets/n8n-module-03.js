(()=> {
 const operation=document.querySelector("[data-http-operation]"),
   customerId=document.querySelector("[data-http-customer]"),
   name=document.querySelector("[data-http-name]"),
   email=document.querySelector("[data-http-email]"),
   run=document.querySelector("[data-http-run]"),
   output=document.querySelector("[data-http-output]"),
   breakdown=document.querySelector("[data-http-breakdown]"),
   presets=[...document.querySelectorAll("[data-http-preset]")],
   nodes=[...document.querySelectorAll("[data-m03-node]")];
 let activeCase="";

 const samples={
  get:{operation:"GET",customerId:"C-1042",name:"",email:""},
  post:{operation:"POST",customerId:"C-2048",name:"Mina Yilmaz",email:"mina@example.com"},
  invalid:{operation:"POST",customerId:"",name:"Mina Yilmaz",email:"keine-gueltige-mail"}
 };
 const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
 const pretty=value=>JSON.stringify(value,null,2);
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module3Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 function loadPreset(id){
   activeCase=id;
   const s=samples[id];
   operation.value=s.operation;customerId.value=s.customerId;name.value=s.name;email.value=s.email;
   presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.httpPreset===id)));
   output.textContent=id==="invalid"
     ?"Fehlerszenario geladen. Sage voraus, warum der Request nicht bis zum externen API-Call kommen darf."
     :"Szenario geladen. Formuliere zuerst Methode, URL-Bestandteile und erwarteten Response.";
   breakdown.hidden=true;breakdown.innerHTML="";
   nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }
 presets.forEach(b=>b.addEventListener("click",()=>loadPreset(b.dataset.httpPreset)));

 async function animate(ok=true){
   connector.reset();
   for(let i=0;i<nodes.length;i++){
     const n=nodes[i];
     if(i>0)connector.lines[i-1]?.classList.add("active");
     n.classList.add("active");await wait(220);n.classList.remove("active");
     const stepOk=ok||i<2;n.classList.add(stepOk?"ok":"error");
     if(i>0){connector.lines[i-1]?.classList.remove("active");if(stepOk)connector.lines[i-1]?.classList.add("done");}
   }
 }

 function renderBreakdown(body){
   if(!breakdown)return;
   breakdown.hidden=false;
   const req=body?.request||{},res=body?.response||{};
   const query=req.query?pretty(req.query):"—";
   const requestBody=req.body?pretty(req.body):"—";
   const headers=req.headers?pretty(req.headers):"—";
   const upstream=res.echoedJson??res.echoedArgs??res;
   breakdown.innerHTML='<div class="ey">REQUEST / RESPONSE BREAKDOWN</div><div class="httpBreakGrid">'+
     '<section><span>METHOD</span><strong>'+esc(req.method||"—")+'</strong></section>'+
     '<section><span>URL</span><code>'+esc(req.url||"—")+'</code></section>'+
     '<section><span>QUERY</span><pre>'+esc(query)+'</pre></section>'+
     '<section><span>HEADERS</span><pre>'+esc(headers)+'</pre></section>'+
     '<section><span>BODY</span><pre>'+esc(requestBody)+'</pre></section>'+
     '<section><span>UPSTREAM ECHO</span><pre>'+esc(pretty(upstream))+'</pre></section>'+
   '</div>';
 }

 run?.addEventListener("click",async()=>{
   run.disabled=true;run.textContent="HTTP Request läuft…";
   nodes.forEach(n=>n.classList.remove("active","ok","error"));
   breakdown.hidden=true;breakdown.innerHTML="";
   const payload={operation:operation.value,customerId:customerId.value,name:name.value,email:email.value};
   output.textContent="BAIS → n8n → externes HTTP-Test-API …";
   try{
     const response=await fetch("/api/n8n-module-03",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
     const body=await response.json().catch(()=>({}));
     await animate(response.ok);
     output.textContent=pretty(body);
     if(response.ok)renderBreakdown(body);

     const getOk=activeCase==="get"&&response.ok&&body.case==="get";
     const postOk=activeCase==="post"&&response.ok&&body.case==="post";
     const invalidOk=activeCase==="invalid"&&response.status===422&&body.case==="invalid";
     if(getOk||postOk||invalidOk){
       window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
       output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
     }else if(activeCase){
       output.textContent+="\n\nDieser Lauf zählt noch nicht. Prüfe Methode, Pflichtfelder, Query/Body und Ergebnis.";
     }
   }catch(error){
     nodes[0]?.classList.add("error");
     output.textContent="FEHLER: "+error.message+"\n\nDebugging: URL → Methode → Headers → Body → Statuscode → Execution.";
   }finally{run.disabled=false;run.textContent="Live HTTP Workflow starten";}
 });

 loadPreset("get");
})();