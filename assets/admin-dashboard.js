const healthRoot=document.querySelector("[data-system-health]");
const healthChecked=document.querySelector("[data-health-checked]");
const sidebarToggle=document.querySelector("[data-sidebar-toggle]");
const tabs=[...document.querySelectorAll("[data-tab]")];

const labels={cloudflare:"Cloudflare",d1:"D1 Database",r2:"R2 Storage",dolibarr:"Dolibarr ERP",n8n:"n8n Automation",mail:"E-Mail"};
const statusLabels={healthy:"Online",configured:"Konfiguriert",degraded:"Prüfen",missing:"Fehlt",disabled:"Deaktiviert"};

function renderHealth(payload){
 if(!healthRoot)return;
 healthRoot.replaceChildren();
 const services=payload?.services||{};
 for(const key of ["cloudflare","d1","r2","dolibarr","n8n","mail"]){
  const data=services[key]||{status:"missing",detail:"Keine Statusdaten"};
  const card=document.createElement("article");
  card.className="baisHealthCard";
  const top=document.createElement("div");
  top.className="baisHealthTop";
  const name=document.createElement("strong");
  name.textContent=labels[key]||key;
  const badge=document.createElement("span");
  badge.className="baisHealthBadge status-"+String(data.status||"missing").replace(/[^a-z-]/g,"");
  badge.textContent=statusLabels[data.status]||data.status||"Unbekannt";
  const detail=document.createElement("small");
  detail.textContent=data.detail||"";
  top.append(name,badge);card.append(top,detail);healthRoot.append(card);
 }
 if(healthChecked&&payload?.checkedAt){
  healthChecked.textContent="Geprüft: "+new Intl.DateTimeFormat("de-DE",{dateStyle:"short",timeStyle:"medium"}).format(new Date(payload.checkedAt));
 }
}

async function loadHealth(){
 if(!healthRoot)return;
 try{
  const response=await fetch("/api/admin/system-health",{credentials:"same-origin",headers:{accept:"application/json"}});
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(payload?.error?.message||"Statusprüfung fehlgeschlagen.");
  renderHealth(payload);
 }catch(error){
  healthRoot.replaceChildren();
  const note=document.createElement("p");
  note.className="adminMessage error";
  note.textContent="Systemstatus nicht verfügbar: "+(error?.message||"Unbekannter Fehler");
  healthRoot.append(note);
 }
}

function setSidebar(open){
 document.body.classList.toggle("sidebar-open",open);
 sidebarToggle?.setAttribute("aria-expanded",String(open));
}
sidebarToggle?.addEventListener("click",()=>setSidebar(!document.body.classList.contains("sidebar-open")));
document.addEventListener("keydown",event=>{if(event.key==="Escape")setSidebar(false);});

tabs.forEach(tab=>tab.addEventListener("click",()=>{
 tabs.forEach(item=>item.classList.toggle("active",item===tab));
 if(matchMedia("(max-width: 991.98px)").matches)setSidebar(false);
}));

document.querySelector("[data-refresh]")?.addEventListener("click",loadHealth);
loadHealth();
