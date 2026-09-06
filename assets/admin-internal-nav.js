const internalWorkspace=document.querySelector("[data-internal-workspace]");
const standardWorkspace=document.querySelector("[data-standard-workspace]");
const internalBody=document.querySelector("[data-internal-body]");
const internalTitle=document.querySelector("[data-internal-title]");
const internalDescription=document.querySelector("[data-internal-description]");
const pageTitle=document.querySelector("[data-admin-page-title]");
const pageDescription=document.querySelector("[data-admin-page-description]");
const quickButtons=[...document.querySelectorAll("[data-internal-view]")];
const standardTabs=[...document.querySelectorAll("[data-tab]")];

const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const date=value=>value?new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"–";
const badge=(value,label=value)=>`<span class="baisModuleBadge status-${esc(String(value||"missing").replace(/[^a-z_-]/gi,""))}">${esc(label||"–")}</span>`;
const table=(head,rows)=>`<div class="adminTableWrap"><table class="adminTable"><thead><tr>${head.map(item=>`<th>${esc(item)}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${head.length}" class="adminEmpty">Keine Einträge vorhanden.</td></tr>`}</tbody></table></div>`;

const api=async path=>{
 const response=await fetch(path,{credentials:"same-origin",headers:{accept:"application/json"}});
 const data=await response.json().catch(()=>({error:{message:"Ungültige Serverantwort."}}));
 if(response.status===401||response.status===403){
  location.replace("/admin-login/?continue=%2Fadmin%2F");
  throw new Error("Administrator-Sitzung erforderlich.");
 }
 if(!response.ok)throw new Error(data.error?.message||"Daten konnten nicht geladen werden.");
 return data;
};

const modules={
 runbook:{title:"Runbook",description:"Betrieb, Recovery, Datenschutz und operative BAIS-Prozesse direkt im Control Center."},
 billing:{title:"Rechnung",description:"Kunden- und Projektbasis für die Rechnungsbearbeitung ohne das Control Center zu verlassen."},
 portal:{title:"Project Portal",description:"Kundenprojekte, Freigaben und Portal-Zugänge aus der Admin-Perspektive."},
 academy:{title:"Academy",description:"Studierende, Programme und Lernbetrieb in einer kompakten Administrationssicht."}
};

const moduleCard=(title,text,action,label)=>`<article class="baisModuleCard"><div><strong>${esc(title)}</strong><p>${esc(text)}</p></div>${action?`<button type="button" class="baisModuleAction" data-jump-tab="${esc(action)}">${esc(label)}</button>`:""}</article>`;

async function renderRunbook(){
 internalBody.innerHTML=`
  <div class="baisModuleGrid">
   ${moduleCard("Kundenbetrieb","Kundenkonten, Freigaben und Mandantenzugriffe verwalten.","customers","Kunden öffnen")}
   ${moduleCard("Projektfreigaben","Signierte Projekte und Kundenentscheidungen prüfen.","approvals","Freigaben öffnen")}
   ${moduleCard("ERP / Integrationen","Dolibarr-Synchronisation und technische Integrationen kontrollieren.","erp","ERP Sync öffnen")}
   ${moduleCard("Datenschutz","DSGVO-Anfragen und Bearbeitungsstatus verwalten.","privacy","Datenschutz öffnen")}
  </div>
  <div class="baisInternalToolbar"><span>Das vollständige Betriebs-Runbook bleibt als Referenz verfügbar.</span><a class="baisLaunch" href="/admin/runbook/" target="_blank" rel="noopener">Vollständiges Runbook in neuem Tab ↗</a></div>`;
}

async function renderPortal(){
 const [approvals,access]=await Promise.all([api("/api/admin/project-approvals"),api("/api/admin/customer-access")]);
 const projects=Array.isArray(approvals.projects)?approvals.projects:[];
 const customers=Array.isArray(access.customers)?access.customers:[];
 const activeGrants=(access.grants||[]).filter(item=>item.effective).length;
 internalBody.innerHTML=`
  <div class="baisModuleStats">
   <article><span>Portal-Kunden</span><strong>${customers.length}</strong></article>
   <article><span>Signierte Projekte</span><strong>${projects.length}</strong></article>
   <article><span>Aktive Freigaben</span><strong>${activeGrants}</strong></article>
  </div>
  ${table(["Projekt","Kunde","Organisation"],projects.map(project=>`<tr><td><strong>${esc(project.project_number)}</strong><br><small>${esc(project.name)}</small></td><td>${esc(project.customer_number)}</td><td>${esc(project.organization_name)}</td></tr>`).join(""))}
  <div class="baisInternalToolbar"><span>Kundenansicht nur bei Bedarf separat öffnen.</span><a class="baisLaunch" href="/project-portal/" target="_blank" rel="noopener">Project Portal in neuem Tab ↗</a></div>`;
}

async function renderAcademy(){
 const [overview,students,courses]=await Promise.all([api("/api/admin/overview"),api("/api/admin/students"),api("/api/admin/courses")]);
 const metrics=overview.metrics||{};
 const studentRows=(students.students||[]).slice(0,12).map(student=>`<tr><td><strong>${esc(student.display_name)}</strong><br><small>${esc(student.email)}</small></td><td>${student.enrollments}</td><td>${student.average_progress}%</td><td>${student.completed}</td></tr>`).join("");
 const courseRows=(courses.courses||[]).slice(0,12).map(course=>`<tr><td><strong>${esc(course.title)}</strong><br><small>${esc(course.slug)}</small></td><td>${esc(course.status)}</td><td>${course.enrollments}</td><td>${course.average_progress}%</td></tr>`).join("");
 internalBody.innerHTML=`
  <div class="baisModuleStats">
   <article><span>Studierende</span><strong>${metrics.students||0}</strong></article>
   <article><span>Aktive Anmeldungen</span><strong>${metrics.activeEnrollments||0}</strong></article>
   <article><span>Programme</span><strong>${metrics.publishedCourses||0}</strong></article>
   <article><span>Abschlüsse</span><strong>${metrics.completedCourses||0}</strong></article>
  </div>
  <div class="baisModuleSplit">
   <section><div class="adminPanelHead"><h3>Studierende</h3></div>${table(["Person","Programme","Ø Fortschritt","Abgeschlossen"],studentRows)}</section>
   <section><div class="adminPanelHead"><h3>Programme</h3></div>${table(["Programm","Status","Anmeldungen","Ø Fortschritt"],courseRows)}</section>
  </div>
  <div class="baisInternalToolbar"><span>Öffentliche Academy nur zur visuellen Kontrolle separat öffnen.</span><a class="baisLaunch" href="/academy/" target="_blank" rel="noopener">Academy in neuem Tab ↗</a></div>`;
}

async function renderBilling(){
 const [customers,health]=await Promise.all([api("/api/admin/customers"),api("/api/admin/system-health")]);
 const customerList=Array.isArray(customers.customers)?customers.customers:[];
 const projects=Array.isArray(customers.projects)?customers.projects:[];
 const dolibarr=health.services?.dolibarr||{status:"missing",detail:"Keine Statusdaten"};
 const rows=customerList.map(customer=>{
  const count=projects.filter(project=>project.organization_id===customer.organization_id).length;
  return `<tr><td><strong>${esc(customer.customer_number)}</strong></td><td>${esc(customer.organization_name)}<br><small>${esc(customer.billing_email||customer.contact_email||"")}</small></td><td>${count}</td><td>${badge(customer.account_status,customer.account_status)}</td></tr>`;
 }).join("");
 internalBody.innerHTML=`
  <div class="baisModuleStats">
   <article><span>Rechnungskunden</span><strong>${customerList.length}</strong></article>
   <article><span>Projekte</span><strong>${projects.length}</strong></article>
   <article><span>Dolibarr ERP</span><strong class="baisModuleStatusText">${esc(dolibarr.status||"–")}</strong><small>${esc(dolibarr.detail||"")}</small></article>
  </div>
  ${table(["Kunden-Nr.","Kunde","Projekte","Status"],rows)}
  <div class="baisInternalToolbar"><span>Rechnungsdaten werden im Control Center vorbereitet; der Druck-/Dokumentenbereich bleibt separat verfügbar.</span><a class="baisLaunch" href="/admin/rechnung/" target="_blank" rel="noopener">Rechnungsbereich in neuem Tab ↗</a></div>`;
}

const renderers={runbook:renderRunbook,billing:renderBilling,portal:renderPortal,academy:renderAcademy};

function setQuickActive(view){
 quickButtons.forEach(button=>{
  const active=button.dataset.internalView===view;
  button.classList.toggle("active",active);
  button.setAttribute("aria-pressed",String(active));
 });
 standardTabs.forEach(tab=>tab.classList.remove("active"));
}

function restoreStandardHeader(){
 pageTitle.textContent="Dashboard";
 pageDescription.textContent="Kunden, Academy, Integrationen und Systemstatus in einer Oberfläche.";
 quickButtons.forEach(button=>{button.classList.remove("active");button.setAttribute("aria-pressed","false");});
}

async function openInternal(view){
 const config=modules[view];
 if(!config||!renderers[view])return;
 standardWorkspace.hidden=true;
 internalWorkspace.hidden=false;
 internalTitle.textContent=config.title;
 internalDescription.textContent=config.description;
 pageTitle.textContent=config.title;
 pageDescription.textContent=config.description;
 setQuickActive(view);
 internalBody.innerHTML='<p class="adminMessage">Modul wird geladen …</p>';
 if(matchMedia("(max-width: 991.98px)").matches)document.body.classList.remove("sidebar-open");
 try{await renderers[view]();}
 catch(error){internalBody.innerHTML=`<p class="adminMessage error">${esc(error?.message||"Modul konnte nicht geladen werden.")}</p>`;}
}

function closeInternal(){
 internalWorkspace.hidden=true;
 standardWorkspace.hidden=false;
 restoreStandardHeader();
 const selected=standardTabs.find(tab=>tab.getAttribute("aria-selected")==="true")||standardTabs[0];
 selected?.classList.add("active");
}

quickButtons.forEach(button=>button.addEventListener("click",()=>openInternal(button.dataset.internalView)));
standardTabs.forEach(tab=>tab.addEventListener("click",()=>{
 if(!internalWorkspace.hidden){internalWorkspace.hidden=true;standardWorkspace.hidden=false;restoreStandardHeader();}
}));
document.querySelector("[data-internal-close]")?.addEventListener("click",closeInternal);
internalBody?.addEventListener("click",event=>{
 const jump=event.target.closest("[data-jump-tab]");
 if(!jump)return;
 closeInternal();
 document.querySelector(`[data-tab="${CSS.escape(jump.dataset.jumpTab)}"]`)?.click();
});
