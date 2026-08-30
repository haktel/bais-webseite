(()=>{"use strict";
const form=document.getElementById("n8nDemoForm");
if(!form)return;
const runButton=document.getElementById("runN8nDemo");
const state=document.getElementById("execState");
const status=document.getElementById("demoStatus");
const raw=document.getElementById("rawOutput");
const fields={
 score:document.getElementById("resultScore"),
 route:document.getElementById("resultRoute"),
 execution:document.getElementById("resultExecution"),
 latency:document.getElementById("resultLatency"),
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
function resetResult(){
 fields.score.textContent="—";fields.route.textContent="—";fields.execution.textContent="—";
 fields.latency.textContent="—";fields.next.textContent="Workflow läuft …";fields.audit.textContent="—";
 raw.textContent='{ "status": "running" }';
}
function safe(value,fallback="—"){return value===null||value===undefined||value===""?fallback:String(value);}
function render(data){
 fields.score.textContent=safe(data.score);
 fields.route.textContent=safe(data.route);
 fields.execution.textContent=safe(data.executionId);
 fields.latency.textContent=Number.isFinite(data.durationMs)?data.durationMs+" ms":"—";
 fields.next.textContent=safe(data.nextAction,"Keine Next Action zurückgegeben.");
 fields.audit.textContent=safe(data.auditStatus);
 fields.workflow.textContent=safe(data.workflow,"bais-lead-qualification");
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
   if(!response.ok||result.ok!==true)throw new Error(result.error||"Live Workflow fehlgeschlagen");
   setNodes(true);render(result);setState("success","LIVE · OK");
   const browserMs=Math.round(performance.now()-clientStart);
   status.textContent="Verifizierte n8n-Ausführung abgeschlossen. Browser-End-to-End: "+browserMs+" ms.";
   lockedUntil=Date.now()+10000;
 }catch(error){
   setNodes(1);setState("error","ERROR");fields.next.textContent=error instanceof Error?error.message:"Live Workflow fehlgeschlagen";
   raw.textContent=JSON.stringify({ok:false,error:fields.next.textContent},null,2);
   status.textContent="Die Live-Ausführung konnte nicht erfolgreich verifiziert werden.";
 }finally{runButton.disabled=false;}
});
})();