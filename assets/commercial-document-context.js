(()=>{"use strict";
const byId=id=>document.getElementById(id);
const set=(id,value)=>{const el=byId(id);if(el)el.value=value||""};
const request=async(url,options={})=>{
 const response=await fetch(url,{credentials:"same-origin",headers:{"content-type":"application/json",...(options.headers||{})},...options});
 const data=await response.json().catch(()=>({ok:false}));
 return{response,data};
};
const providerFill=provider=>{
 if(!provider)return;
 set("providerCompany",provider.legalName||provider.brandName);
 set("providerContact",provider.ownerName);
 set("providerRole",provider.role||"Inhaber");
 set("providerAddress",provider.address);
 set("providerEmail",provider.email);
};
const customerFill=customer=>{
 set("customerNumber",customer?.customer_number||customer?.customerNumber);
 set("clientCompany",customer?.organization_name||customer?.organizationName);
 set("clientContact",customer?.contact_name||customer?.contactName);
 set("clientEmail",customer?.contact_email||customer?.email);
};
const projectFill=project=>{
 set("projectNo",project?.project_number||project?.projectNumber);
 set("projectName",project?.name);
};
const projectOption=project=>{
 const option=document.createElement("option");
 option.value=project.id;
 option.textContent=(project.project_number||project.projectNumber||"Projekt")+" · "+project.name;
 return option;
};
const status=message=>{const el=byId("commercialStatus");if(el)el.textContent=message};
const setProjectCreationVisible=visible=>{document.querySelectorAll("[data-admin-project-create],[data-admin-sow-save]").forEach(el=>{el.hidden=!visible;});};

let adminData=null,currentData=null;
const detailedScopeInputs=()=>[...document.querySelectorAll('#offerForm input[type="checkbox"]')].filter(input=>!input.dataset.sowModule&&(/^(w|p|a|ai|s|o|h)\d+$/.test(input.name||"")||/^scope[A-Z]/.test(input.name||"")));
const resetSowProjectFields=()=>{
 document.querySelectorAll("[data-sow-module]").forEach(input=>{input.checked=false;});
 detailedScopeInputs().forEach(input=>{input.checked=false;});
 document.querySelectorAll('#offerForm input[name^="scope"][name$="Text"]').forEach(input=>{input.value="";});
 set("offerNo","");set("projectStart","");set("validUntil","");set("sowStatus","draft");
};
async function loadSow(projectId){
 if(!byId("saveSowProject")||!projectId)return;
 resetSowProjectFields();
 const result=await request("/api/commercial/sow?projectId="+encodeURIComponent(projectId),{method:"GET",headers:{}});
 const target=byId("sowSyncStatus");
 if(!result.response.ok){if(target)target.textContent="SOW nicht geladen";return}
 const sow=result.data?.sow;
 document.querySelectorAll("[data-sow-module]").forEach(input=>{input.checked=Boolean(sow?.modules?.some(m=>m.module_code===input.dataset.sowModule));});
 for(const item of sow?.scopeSelections||[]){
  const input=document.querySelector('#offerForm input[type="checkbox"][name="'+CSS.escape(item.key||"")+'"]');
  if(input)input.checked=true;
  const text=document.querySelector('#offerForm input[name="'+CSS.escape((item.key||"")+"Text")+'"]');
  if(text&&item.description)text.value=item.description;
 }
 if(sow){
  set("offerNo",sow.offer_number);set("projectStart",sow.project_start);set("validUntil",sow.valid_until);set("sowStatus",sow.sow_status);
  if(target){const d=result.data?.integrations?.link;target.textContent=d?("Dolibarr: "+(d.dolibarr_sync_status||"—")+" · Jira: "+(d.jira_sync_status||"—")):"SOW gespeichert";}
 }else if(target)target.textContent="Noch kein SOW gespeichert";
}
function populateProjects(projects,selectedId){
 const picker=byId("projectPicker");if(!picker)return;
 picker.replaceChildren();
 const list=projects||[];
 if(!list.length){
  const option=document.createElement("option");option.value="";option.textContent="Noch kein Projekt";picker.append(option);projectFill(null);return;
 }
 list.forEach(project=>picker.append(projectOption(project)));
 const target=list.find(p=>p.id===selectedId)||list[0];
 picker.value=target.id;projectFill(target);loadSow(target.id).catch(()=>{});
 picker.onchange=()=>{const selected=list.find(p=>p.id===picker.value);projectFill(selected);loadSow(selected?.id).catch(()=>{});};
}
function applyAdminCustomer(organizationId,selectedProjectId){
 const customer=(adminData?.customers||[]).find(c=>c.organization_id===organizationId);
 if(!customer)return;
 customerFill(customer);
 const projects=(adminData.projects||[]).filter(p=>p.organization_id===organizationId);
 populateProjects(projects,selectedProjectId);
 status("DB-Verknüpfung aktiv · "+customer.customer_number);
}
function populateAdmin(){
 const picker=byId("customerPicker");if(!picker||!adminData)return;
 picker.hidden=false;picker.disabled=false;picker.replaceChildren();
 (adminData.customers||[]).forEach(customer=>{
  const option=document.createElement("option");
  option.value=customer.organization_id;
  option.textContent=customer.customer_number+" · "+customer.organization_name;
  picker.append(option);
 });
 if(!adminData.customers?.length){status("Noch keine Kundenkonten vorhanden.");return}
 const currentOrg=currentData?.customer?.organizationId;
 picker.value=adminData.customers.some(c=>c.organization_id===currentOrg)?currentOrg:adminData.customers[0].organization_id;
 applyAdminCustomer(picker.value,currentData?.currentProject?.id);
 picker.onchange=()=>applyAdminCustomer(picker.value);
 status("Admin-Modus · Kunde und Projekt aus D1 auswählen");
}
function populateCurrent(){
 const picker=byId("customerPicker");
 if(picker){picker.replaceChildren();const o=document.createElement("option");o.value=currentData.customer.organizationId;o.textContent=currentData.customer.customerNumber+" · "+currentData.customer.organizationName;picker.append(o);picker.disabled=true}
 customerFill(currentData.customer);
 populateProjects(currentData.projects,currentData.currentProject?.id);
 status("Kundenkonto verknüpft · "+currentData.customer.customerNumber);
}
async function refresh(){
 const context=await request("/api/commercial/context",{method:"GET",headers:{}});
 if(context.response.ok&&context.data?.provider)providerFill(context.data.provider);
 currentData=context.data?.authenticated?context.data:null;
 if(!currentData){status("Auftragnehmer geladen · für Kunden-/Projekt-Nr. bitte anmelden.");return}
 const admin=await request("/api/admin/customers",{method:"GET",headers:{}});
 if(admin.response.ok&&admin.data?.ok){
  adminData=admin.data;providerFill(adminData.provider);setProjectCreationVisible(true);populateAdmin();
 }else{adminData=null;setProjectCreationVisible(false);populateCurrent();}
}
const detailedScopeSelections=()=>detailedScopeInputs().filter(input=>input.checked).map(input=>{
 const row=input.closest(".scopeRow"),label=row?.querySelector("td:first-child")?.textContent?.trim()||document.querySelector('label[for="'+CSS.escape(input.id)+'"]')?.textContent?.trim()||input.name;
 const description=row?.querySelector('input[name="'+CSS.escape(input.name+"Text")+'"]')?.value?.trim()||"";
 return{key:input.name,label,description};
});
async function saveSow(){
 if(!adminData){status("SOW kann nur durch BAIS gespeichert werden.");return}
 const projectId=byId("projectPicker")?.value||"",organizationId=byId("customerPicker")?.value||"",button=byId("saveSowProject"),sync=byId("sowSyncStatus");
 const modules=[...document.querySelectorAll("[data-sow-module]:checked")].map(input=>input.dataset.sowModule);
 if(!projectId||!organizationId){status("Bitte zuerst Kunde und Projekt auswählen.");return}
 if(!modules.length){status("Bitte mindestens ein BAIS Vertragsmodul auswählen.");return}
 button.disabled=true;if(sync)sync.textContent="SOW wird gespeichert …";
 try{
  const result=await request("/api/commercial/sow",{method:"POST",body:JSON.stringify({
   projectId,organizationId,offerNumber:byId("offerNo")?.value||"",sowStatus:byId("sowStatus")?.value||"draft",
   projectStart:byId("projectStart")?.value||"",validUntil:byId("validUntil")?.value||"",modules,scopeSelections:detailedScopeSelections()
  })});
  if(!result.response.ok)throw new Error(result.data?.error?.message||"SOW konnte nicht gespeichert werden.");
  if(sync)sync.textContent=result.data?.integrations?.queued?"SOW gespeichert · Dolibarr/Jira Sync queued":"SOW gespeichert";
  status("SOW verknüpft · "+result.data.project.projectNumber+" · "+modules.join(", "));
  await loadSow(projectId);
 }catch(error){if(sync)sync.textContent=error.message||"SOW Fehler";status(error.message||"SOW konnte nicht gespeichert werden.");}
 finally{button.disabled=false}
}
async function createProject(){
 if(!adminData){status("Projekte können nur durch BAIS angelegt werden.");return;}
 const input=byId("newProjectName"),button=byId("createProject");
 const name=String(input?.value||"").trim();
 if(name.length<2){status("Bitte zuerst einen Projektnamen eingeben.");input?.focus();return}
 button.disabled=true;status("Projekt wird angelegt …");
 try{
  const organizationId=byId("customerPicker")?.value||"";
  if(!organizationId)throw new Error("Bitte zuerst einen Kunden auswählen.");
  const result=await request("/api/commercial/projects",{method:"POST",body:JSON.stringify({name,organizationId})});
  if(!result.response.ok)throw new Error(result.data?.error?.message||"Projekt konnte nicht angelegt werden.");
  input.value="";await refresh();
  if(organizationId){
   const customerPicker=byId("customerPicker");if(customerPicker)customerPicker.value=organizationId;
   applyAdminCustomer(organizationId,result.data?.project?.id);
  }else{
   const picker=byId("projectPicker");if(picker&&result.data?.project?.id){picker.value=result.data.project.id;picker.dispatchEvent(new Event("change"))}
  }
  status("Projekt angelegt · "+result.data.project.projectNumber);
 }catch(error){status(error.message||"Projekt konnte nicht angelegt werden.")}finally{button.disabled=false}
}
document.addEventListener("DOMContentLoaded",()=>{
 setProjectCreationVisible(false);
 byId("createProject")?.addEventListener("click",createProject);
 byId("saveSowProject")?.addEventListener("click",saveSow);
 refresh().catch(()=>status("DB-Kontext konnte nicht geladen werden."));
});
})();