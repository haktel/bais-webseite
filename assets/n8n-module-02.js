(()=> {
 const progressKey="bais-n8n-mod02-progress";
 const done=new Set(JSON.parse(localStorage.getItem(progressKey)||"[]"));
 const lessons=[...document.querySelectorAll("[data-lesson]")];
 const bar=document.querySelector("[data-progress-bar]"),text=document.querySelector("[data-progress-text]");
 async function sync(percent){try{await fetch("/api/academy/progress",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseSlug:"n8n-bootcamp",progressPercent:percent})});}catch{}}
 function refresh(doSync=false){
   lessons.forEach(l=>{const id=l.dataset.lesson,b=l.querySelector("[data-done]"),ok=done.has(id);b?.classList.toggle("done",ok);if(b)b.textContent=ok?"✓ Erledigt":"Als gelernt markieren";});
   const pct=lessons.length?Math.round(done.size/lessons.length*100):0;
   if(bar)bar.style.width=pct+"%";if(text)text.textContent=done.size+" von "+lessons.length+" Lerneinheiten · "+pct+"%";
   localStorage.setItem(progressKey,JSON.stringify([...done]));if(doSync)sync(pct);
 }
 lessons.forEach(l=>l.querySelector("[data-done]")?.addEventListener("click",()=>{const id=l.dataset.lesson;done.has(id)?done.delete(id):done.add(id);refresh(true);}));refresh();

 const input=document.querySelector("[data-json-input]"),output=document.querySelector("[data-json-output]"),run=document.querySelector("[data-json-run]"),nodes=[...document.querySelectorAll("[data-m02-node]")],presets=[...document.querySelectorAll("[data-json-preset]")];
 const samples={
  single:{source:" Website ",records:[{firstName:" Mina ",lastName:" Yilmaz ",email:" MINA@EXAMPLE.COM ",budget:"7500",tags:[" AI ","Automation","AI"]}]},
  batch:{source:" CRM Import ",records:[
    {firstName:" Mina ",lastName:" Yilmaz ",email:" MINA@EXAMPLE.COM ",budget:"7500",tags:[" AI ","Automation","AI"]},
    {firstName:"Jonas",lastName:" Weber ",email:" JONAS@example.com ",budget:3200,tags:["Support"," Support "]},
    {firstName:" Sara",lastName:"Klein",email:"sara@EXAMPLE.COM",budget:"5100",tags:["Data","AI"]}
  ]},
  invalid:{source:"Broken Input",records:[]}
 };
 const pretty=value=>JSON.stringify(value,null,2);
 presets.forEach(b=>b.addEventListener("click",()=>{input.value=pretty(samples[b.dataset.jsonPreset]);presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));output.textContent="Szenario geladen. Vor dem Start: Sage voraus, wie viele Items entstehen und welche Felder sich ändern.";nodes.forEach(n=>n.classList.remove("active","ok","error"));}));
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function animate(ok=true){for(let i=0;i<nodes.length;i++){const n=nodes[i];n.classList.add("active");await wait(220);n.classList.remove("active");n.classList.add(ok||i<2?"ok":"error");}}
 run?.addEventListener("click",async()=>{
   nodes.forEach(n=>n.classList.remove("active","ok","error"));let payload;
   try{payload=JSON.parse(input.value);}catch{output.textContent="JSON Syntaxfehler: Der Browser konnte deine Eingabe nicht parsen.";return;}
   run.disabled=true;run.textContent="n8n läuft…";output.textContent="Production Webhook wird aufgerufen…";
   try{
    const response=await fetch("/api/n8n-module-02",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
    const body=await response.json().catch(()=>({}));await animate(response.ok);output.textContent=pretty(body);
    if(response.ok)output.textContent+="\n\nBeobachtung: "+body.itemCount+" Item(s), "+body.validCount+" gültig. Prüfe Trim, Lowercase, Number-Konvertierung und Tag-Deduplizierung.";
    else output.textContent+="\n\nBeobachtung: Input wurde kontrolliert abgelehnt. Warum ist das besser als stilles Weiterarbeiten?";
   }catch(error){nodes[0]?.classList.add("error");output.textContent="FEHLER: "+error.message;}
   finally{run.disabled=false;run.textContent="Live Workflow starten";}
 });
})();