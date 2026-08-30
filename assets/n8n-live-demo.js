(()=>{"use strict";
const form=document.getElementById("n8nDemoForm");
if(!form)return;
const runButton=document.getElementById("runN8nDemo");
const state=document.getElementById("execState");
const status=document.getElementById("demoStatus");
const raw=document.getElementById("rawOutput");
const trace=document.getElementById("resultTrace");
const fields={
 score:document.getElementById("resultScore"),
 route:document.getElementById("resultRoute"),
 execution:document.getElementById("resultExecution"),
 latency:document.getElementById("resultLatency"),
 request:document.getElementById("resultRequest"),
 upstream:document.getElementById("resultUpstream"),
 inputHash:document.getElementById("resultInputHash"),
 resultHash:document.getElementById("resultHash"),
 auth:document.getElementById("resultAuth"),
 next:document.getElementById("resultNext"),
 audit:document.getElementById("resultAudit"),
 workflow:document.getElementById("resultWorkflow")
};
const nodes=[...document.querySelectorAll(".pipeNode")];
let lockedUntil=0;

function setState(kind,label){
 state.className="execState "+kind;
 state.textContent=label;
}
function setNodes(active){
 nodes.forEach((node,index)=>node.classList.toggle("active",active===true||index<=active));
}
function safe(value,fallback="—"){return value===null||value===undefined||value===""?fallback:String(value);}
function resetResult(){
 Object.values(fields).forEach(field=>{if(field)field.textContent="—";});
 fields.next.textContent="Workflow läuft …";
 fields.workflow.textContent="bais-lead-qualification";
 trace.innerHTML="<li><span>RUNNING</span> Request wurde gestartet.</li>";
 raw.textContent='{ "status": "running" }';
}
function renderTrace(items){
 trace.innerHTML="";
 (Array.isArray(items)?items:[]).forEach(item=>{
   const li=document.createElement("li");
   const badge=document.createElement("span");
   badge.textContent=safe(item.status,"unknown").toUpperCase();
   li.append(badge,document.createTextNode(" "+safe(item.step,"unknown")));
   trace.append(li);
 });
 if(!trace.children.length)trace.innerHTML="<li><span>UNKNOWN</span> Keine Trace-Daten zurückgegeben.</li>";
}
function render(data){
 fields.score.textContent=safe(data.score);
 fields.route.textContent=safe(data.route);
 fields.execution.textContent=safe(data.executionId);
 fields.latency.textContent=Number.isFinite(data.durationMs)?data.durationMs+" ms":"—";
 fields.request.textContent=safe(data.requestId);
 fields.upstream.textContent=Number.isFinite(data.upstreamStatus)?String(data.upstreamStatus):"—";
 fields.inputHash.textContent=safe(data.inputFingerprint);
 fields.resultHash.textContent=safe(data.resultFingerprint);
 fields.auth.textContent=safe(data.requestAuth);
 fields.next.textContent=safe(data.nextAction,"Keine Next Action zurückgegeben.");
 fields.audit.textContent=safe(data.auditStatus);
 fields.workflow.textContent=safe(data.workflow,"bais-lead-qualification");
 renderTrace(data.evidence);
 raw.textContent=JSON.stringify(data,null,2);
}
form.addEventListener("submit",async event=>{
 event.preventDefault();
 const now=Date.now();
 if(now<lockedUntil){
   const sec=Math.ceil((lockedUntil-now)/1000);
   status.textContent="Bitte "+sec+" Sekunden bis zum nächsten Live-Run warten.";
   return;
 }
 const data=new FormData(form);
 const payload={scenario:data.get("scenario"),urgency:data.get("urgency")};
 runButton.disabled=true;setState("running","RUNNING");setNodes(1);resetResult();
 status.textContent="BAIS API validiert die Demo-Anfrage und ruft den Live-n8n-Webhook auf.";
 const clientStart=performance.now();
 try{
   const response=await fetch("/api/n8n-demo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const result=await response.json().catch(()=>({ok:false,error:"Ungültige Serverantwort"}));
   render(result);
   if(!response.ok||result.ok!==true)throw new Error(result.error||"Live Workflow fehlgeschlagen");
   setNodes(true);setState("success","LIVE · VERIFIED");
   const browserMs=Math.round(performance.now()-clientStart);
   status.textContent="Verifizierte n8n-Ausführung abgeschlossen. Browser-End-to-End: "+browserMs+" ms; Server/n8n: "+safe(result.durationMs)+" ms.";
   lockedUntil=Date.now()+10000;
 }catch(error){
   setNodes(1);setState("error","LIVE · ERROR");
   if(fields.next.textContent==="—"||fields.next.textContent==="Workflow läuft …")fields.next.textContent=error instanceof Error?error.message:"Live Workflow fehlgeschlagen";
   status.textContent="Die Live-Ausführung wurde nicht als erfolgreich verifiziert. Es wird kein Ersatz-Ergebnis simuliert.";
 }finally{runButton.disabled=false;}
});
})();