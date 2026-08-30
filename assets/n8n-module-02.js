(()=> {
 // Lesson tracking and progress rendering are handled generically by
 // n8n-module-study.js (shared with modul-01). This file only drives the
 // JSON lab UI, which is specific to modul-02's markup, and reports a
 // correctly-completed lab case as evidence via the "bais:lab-case" event.
 const input=document.querySelector("[data-json-input]"),output=document.querySelector("[data-json-output]"),analysis=document.querySelector("[data-json-analysis]"),run=document.querySelector("[data-json-run]"),nodes=[...document.querySelectorAll("[data-m02-node]")],presets=[...document.querySelectorAll("[data-json-preset]")];
 let activeCase="";
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
 const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
 const renderAnalysis=(raw,normalized)=>{
   if(!analysis)return;
   const rawRecords=Array.isArray(raw?.records)?raw.records:[];
   const normalizedRecords=Array.isArray(normalized?.records)?normalized.records:[];
   if(!normalizedRecords.length){analysis.hidden=true;analysis.innerHTML="";return;}
   analysis.hidden=false;
   analysis.innerHTML='<div class="ey">RAW → NORMALIZED ANALYSE</div><h3>Was hat der Workflow verändert?</h3>'+
     normalizedRecords.map((record,index)=>{
       const source=rawRecords[index]||{};
       const rows=[
         ["Name",[source.firstName,source.lastName].filter(Boolean).join(" "),record.fullName],
         ["E-Mail",source.email,record.email],
         ["Budget",source.budget,record.budget],
         ["Tags",JSON.stringify(source.tags??[]),JSON.stringify(record.tags??[])],
         ["Source",source.source??raw.source,record.source],
         ["Valid","—",String(record.valid)]
       ];
       return '<section class="transformRecord"><div class="transformRecordHead"><strong>Item '+(index+1)+'</strong><span>'+esc(record.email||"ohne E-Mail")+'</span></div><table><thead><tr><th>Feld</th><th>RAW</th><th>NORMALIZED</th></tr></thead><tbody>'+
         rows.map(([field,before,after])=>'<tr><td>'+esc(field)+'</td><td><code>'+esc(before)+'</code></td><td><code>'+esc(after)+'</code></td></tr>').join("")+
         '</tbody></table></section>';
     }).join("");
 };
 presets.forEach(b=>b.addEventListener("click",()=>{
  activeCase=b.dataset.jsonPreset;
  input.value=pretty(samples[activeCase]);
  presets.forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  output.textContent="Szenario geladen. Vor dem Start: Sage voraus, wie viele Items entstehen und welche Felder sich ändern.";
  if(analysis){analysis.hidden=true;analysis.innerHTML="";}
  nodes.forEach(n=>n.classList.remove("active","ok","error"));
 }));
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module2Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function animate(ok=true){
  connector.reset();
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i];
   if(i>0)connector.lines[i-1]?.classList.add("active");
   n.classList.add("active");
   await wait(220);
   n.classList.remove("active");
   const stepOk=ok||i<2;
   n.classList.add(stepOk?"ok":"error");
   if(i>0){connector.lines[i-1]?.classList.remove("active");if(stepOk)connector.lines[i-1]?.classList.add("done");}
  }
 }
 run?.addEventListener("click",async()=>{
   nodes.forEach(n=>n.classList.remove("active","ok","error"));let payload;
   try{payload=JSON.parse(input.value);}catch{output.textContent="JSON Syntaxfehler: Der Browser konnte deine Eingabe nicht parsen.";return;}
   run.disabled=true;run.textContent="n8n läuft…";output.textContent="Production Webhook wird aufgerufen…";
   try{
    const response=await fetch("/api/n8n-module-02",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
    const body=await response.json().catch(()=>({}));await animate(response.ok);output.textContent=pretty(body);
    if(response.ok)renderAnalysis(payload,body);else if(analysis){analysis.hidden=true;analysis.innerHTML="";}

    const recordCount=Array.isArray(payload.records)?payload.records.length:0;
    const singleOk=activeCase==="single"&&response.ok&&body.itemCount===1&&body.validCount===1;
    const batchOk=activeCase==="batch"&&response.ok&&body.itemCount===recordCount&&body.validCount===recordCount;
    const invalidOk=activeCase==="invalid"&&response.status===422&&body.ok===false;
    if(singleOk||batchOk||invalidOk){
      window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:activeCase}}));
      output.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
    }else if(activeCase){
      output.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe Erwartung, Input und Ergebnis.";
    }else{
      output.textContent+="\n\nBeobachtung: "+(body.itemCount??0)+" Item(s), "+(body.validCount??0)+" gültig. Prüfe Trim, Lowercase, Number-Konvertierung und Tag-Deduplizierung.";
    }
   }catch(error){nodes[0]?.classList.add("error");output.textContent="FEHLER: "+error.message;}
   finally{run.disabled=false;run.textContent="Live Workflow starten";}
 });
})();
