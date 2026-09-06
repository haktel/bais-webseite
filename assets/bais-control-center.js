const $=selector=>document.querySelector(selector);
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const statusLabel=value=>({healthy:"Online",configured:"Konfiguriert",degraded:"Warnung",missing:"Fehlt",disabled:"Deaktiviert",active:"Aktiv",inactive:"Inaktiv",blocked:"Gesperrt",pending:"Ausstehend",approved:"Freigegeben",rejected:"Abgelehnt"}[value]||String(value||"Unbekannt"));
const badge=value=>`<span class="bais-status ${esc(value)}">${esc(statusLabel(value))}</span>`;

const api=async path=>{
 const response=await fetch(path,{credentials:"same-origin",headers:{accept:"application/json"}});
 const data=await response.json().catch(()=>({error:{message:"Ungültige Serverantwort."}}));
 if(response.status===401||response.status===403){
  location.replace("/admin-login/?continue=%2Fbais-control-center%2F");
  throw new Error("Administrator-Sitzung erforderlich.");
 }
 if(!response.ok)throw new Error(data.error?.message||"Daten konnten nicht geladen werden.");
 return data;
};

const setKpi=(name,value)=>{const target=$(`[data-kpi="${name}"]`);if(target)target.textContent=String(value??0);};

const renderHealth=data=>{
 const grid=$("[data-health-grid]");
 const services=data?.services||{};
 const labels={cloudflare:"Cloudflare Pages",d1:"D1 Database",r2:"R2 Storage",dolibarr:"Dolibarr ERP",n8n:"n8n Automation",mail:"E-Mail"};
 grid.innerHTML=Object.entries(labels).map(([key,label])=>{
  const item=services[key]||{status:"missing",detail:"Keine Statusinformation"};
  return `<article class="bais-health"><div class="bais-health-top"><strong>${esc(label)}</strong>${badge(item.status)}</div><p>${esc(item.detail)}</p></article>`;
 }).join("");
 const time=$("[data-health-time]");
 if(time&&data?.checkedAt){time.textContent="Letzte Prüfung: "+new Intl.DateTimeFormat("de-DE",{dateStyle:"short",timeStyle:"medium"}).format(new Date(data.checkedAt));}
};

const renderIntegrations=data=>{
 const target=$("[data-integrations]");
 const services=data?.services||{};
 const entries=[
  ["Dolibarr ERP","dolibarr","Kunden- und ERP-Synchronisation"],
  ["n8n Automation","n8n","Workflow- und Webhook-Automation"],
  ["R2 Documents","r2","Projekt- und Kundendokumente"],
  ["Transactional E-Mail","mail","System- und Account-Nachrichten"]
 ];
 target.innerHTML=entries.map(([label,key,hint])=>{
  const item=services[key]||{status:"missing",detail:"Keine Statusinformation"};
  return `<article class="bais-integration"><div><strong>${esc(label)}</strong><small>${esc(hint)} · ${esc(item.detail)}</small></div>${badge(item.status)}</article>`;
 }).join("");
};

const renderCustomers=data=>{
 const rows=$("[data-customer-rows]");
 const customers=Array.isArray(data?.customers)?data.customers:[];
 setKpi("customers",customers.length);
 rows.innerHTML=customers.length?customers.slice(0,10).map(customer=>`<tr><td><strong>${esc(customer.customer_number)}</strong></td><td>${esc(customer.organization_name)}<br><small>${esc(customer.billing_email||"")}</small></td><td>${badge(customer.account_status)}</td></tr>`).join(""):'<tr><td colspan="3" class="bais-empty">Noch keine Kundenkonten vorhanden.</td></tr>';
};

const renderProjects=data=>{
 const rows=$("[data-project-rows]");
 const projects=Array.isArray(data?.projects)?data.projects:[];
 setKpi("projects",projects.length);
 rows.innerHTML=projects.length?projects.slice(0,10).map(project=>`<tr><td><strong>${esc(project.project_number)}</strong><br><small>${esc(project.name)}</small></td><td>${esc(project.customer_number)}<br><small>${esc(project.organization_name)}</small></td><td>${badge("approved")}</td></tr>`).join(""):'<tr><td colspan="3" class="bais-empty">Noch kein signiertes Projekt vorhanden.</td></tr>';
};

const renderOverview=data=>{
 const metrics=data?.metrics||{};
 setKpi("enrollments",metrics.activeEnrollments||0);
 setKpi("contacts",metrics.newContacts||0);
};

const load=async()=>{
 const message=$("[data-global-message]");
 const refresh=$("[data-refresh]");
 if(refresh)refresh.disabled=true;
 message.className="bais-note";message.textContent="Live-Daten werden geladen …";
 const definitions=[
  ["overview","/api/admin/overview"],
  ["health","/api/admin/system-health"],
  ["customers","/api/admin/customer-access"],
  ["projects","/api/admin/project-approvals"]
 ];
 const results=await Promise.allSettled(definitions.map(([,path])=>api(path)));
 const failures=[];
 results.forEach((result,index)=>{
  const [key]=definitions[index];
  if(result.status!=="fulfilled"){failures.push(key);return;}
  if(key==="overview")renderOverview(result.value);
  if(key==="health"){renderHealth(result.value);renderIntegrations(result.value);}
  if(key==="customers")renderCustomers(result.value);
  if(key==="projects")renderProjects(result.value);
 });
 if(failures.length){message.className="bais-note bais-error";message.textContent=`${failures.length} Datenquelle(n) vorübergehend nicht verfügbar: ${failures.join(", ")}.`;}
 else{message.textContent="Alle Dashboard-Daten wurden erfolgreich aus den BAIS Production-APIs geladen.";}
 if(refresh)refresh.disabled=false;
};

$("[data-refresh]")?.addEventListener("click",load);
$("[data-sidebar-toggle]")?.addEventListener("click",event=>{
 const mobile=matchMedia("(max-width: 991.98px)").matches;
 document.body.classList.toggle(mobile?"sidebar-open":"sidebar-collapse");
 event.currentTarget.setAttribute("aria-expanded",String(!document.body.classList.contains(mobile?"sidebar-open":"sidebar-collapse")));
});

document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener("click",()=>{
 document.querySelectorAll(".bais-side-link").forEach(item=>item.classList.remove("active"));
 link.classList.add("active");
 if(matchMedia("(max-width: 991.98px)").matches)document.body.classList.remove("sidebar-open");
}));

load();