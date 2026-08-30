(()=> {
 const out=document.querySelector("[data-file-output]"),analysis=document.querySelector("[data-file-analysis]"),run=document.querySelector("[data-file-run]"),presets=[...document.querySelectorAll("[data-file-preset]")],nodes=[...document.querySelectorAll("[data-m08-node]")];
 let active="csv";
 const meta={
  csv:{title:"CSV Roundtrip",expect:"3 Rows"},
  unicode:{title:"UTF-8 / Unicode",expect:"3 Rows + Umlaute/Türkçe"},
  json:{title:"JSON Binary File",expect:"2 Records"},
  unsafe:{title:"Spreadsheet Formula Safety",expect:"2 sanitierte Rows"},
  invalid:{title:"Invalid Empty File Request",expect:"422"}
 };
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const pretty=v=>JSON.stringify(v,null,2);
 const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".module8Flow")):{lines:[],reset(){}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function choose(id){active=id;presets.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filePreset===id)));analysis.hidden=true;analysis.innerHTML="";out.textContent=meta[id].title+" geladen. Vorhersage: "+meta[id].expect+".";nodes.forEach(n=>n.classList.remove("active","ok","error"));}
 presets.forEach(b=>b.addEventListener("click",()=>choose(b.dataset.filePreset)));
 async function animate(ok=true){connector.reset();for(let i=0;i<nodes.length;i++){const n=nodes[i];if(i>0)connector.lines[i-1]?.classList.add("active");n.classList.add("active");await wait(180);n.classList.remove("active");const good=ok||i<2;n.classList.add(good?"ok":"error");if(i>0){connector.lines[i-1]?.classList.remove("active");if(good)connector.lines[i-1]?.classList.add("done");}}}
 function render(body){
  if(!analysis||!body.ok)return;
  const b=body.binary||{},ex=body.extracted||{},security=body.security||{};
  analysis.hidden=false;
  analysis.innerHTML='<div class="ey">BINARY FILE TRACE</div>'+
   '<div class="fileMetaGrid">'+
    '<section><span>FORMAT</span><strong>'+esc(body.format)+'</strong></section>'+
    '<section><span>FILE NAME</span><code>'+esc(b.fileName||"—")+'</code></section>'+
    '<section><span>MIME TYPE</span><code>'+esc(b.mimeType||"—")+'</code></section>'+
    '<section><span>FILE SIZE</span><strong>'+esc(b.fileSize??"—")+'</strong></section>'+
    '<section><span>BINARY FIELD</span><code>'+esc(b.property||"data")+'</code></section>'+
    '<section><span>PARSED RECORDS</span><strong>'+esc(ex.rowCount??0)+'</strong></section>'+
   '</div>'+
   '<div class="roundtripDiagram"><b>JSON Items</b><span>→ Convert to File →</span><b>Binary '+esc((b.fileExtension||body.format).toUpperCase())+'</b><span>→ Extract from File →</span><b>JSON Data</b></div>'+
   (body.format==="csv"?'<div class="parsedTable">'+renderRows(ex.rows||[])+'</div>':'<pre class="parsedJson">'+esc(pretty(ex.records||[]))+'</pre>')+
   (security.formulaSanitizedRows!==undefined?'<div class="formulaGuard"><strong>Spreadsheet Safety</strong><p>Sanitized rows: '+esc(security.formulaSanitizedRows)+'</p><code>'+esc(security.rule||"")+'</code></div>':'')+
   '<div class="stateProof ok"><strong>✓ REAL BINARY ROUNDTRIP</strong><p>'+esc(body.lesson||"")+'</p></div>';
 }
 function renderRows(rows){
  if(!rows.length)return "<p>Keine Rows.</p>";
  const keys=Object.keys(rows[0]);
  return '<table><thead><tr>'+keys.map(k=>'<th>'+esc(k)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+keys.map(k=>'<td>'+esc(row[k])+'</td>').join("")+'</tr>').join("")+'</tbody></table>';
 }
 run?.addEventListener("click",async()=>{
  run.disabled=true;run.textContent="Binary Workflow läuft…";analysis.hidden=true;nodes.forEach(n=>n.classList.remove("active","ok","error"));
  try{
   const response=await fetch("/api/n8n-module-08",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({scenario:active})});
   const body=await response.json().catch(()=>({}));
   await animate(response.ok);out.textContent=pretty(body);if(response.ok)render(body);
   const csvOk=active==="csv"&&response.ok&&body.extracted?.rowCount===3;
   const unicodeOk=active==="unicode"&&response.ok&&body.extracted?.rowCount===3&&String(body.extracted?.rows?.[0]?.name||"").includes("ü");
   const jsonOk=active==="json"&&response.ok&&body.format==="json"&&body.extracted?.rowCount===2;
   const unsafeOk=active==="unsafe"&&response.ok&&Number(body.security?.formulaSanitizedRows)>=2;
   const invalidOk=active==="invalid"&&response.status===422&&body.case==="invalid";
   if(csvOk||unicodeOk||jsonOk||unsafeOk||invalidOk){window.dispatchEvent(new CustomEvent("bais:lab-case",{detail:{caseId:active}}));out.textContent+="\n\n✓ Datei-Lernfall korrekt durchgeführt und gespeichert.";}else out.textContent+="\n\nDieser Fall zählt noch nicht. Prüfe Binary Field, Encoding, Parser und Security-Ergebnis.";
  }catch(e){nodes[0]?.classList.add("error");out.textContent="FEHLER: "+e.message+"\n\nDebugging: JSON → Binary Field → File Metadata → Parser → Encoding → Output.";}finally{run.disabled=false;run.textContent="Live Binary Workflow starten";}
 });
 choose("csv");
})();