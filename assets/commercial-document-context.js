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

let adminData=null,currentData=null;
function populateProjects(projects,selectedId){
 const picker=byId("projectPicker");if(!picker)return;
 picker.replaceChildren();
 const list=projects||[];
 if(!list.length){
  const option=document.createElement("option");option.value="";option.textContent="Noch kein Projekt";picker.append(option);projectFill(null);return;
 }
 list.forEach(project=>picker.append(projectOption(project)));
 const target=list.find(p=>p.id===selectedId)||list[0];
 picker.value=target.id;projectFill(target);
 picker.onchange=()=>projectFill(list.find(p=>p.id===picker.value));
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
  adminData=admin.data;providerFill(adminData.provider);populateAdmin();
 }else populateCurrent();
}
async function createProject(){
 const input=byId("newProjectName"),button=byId("createProject");
 const name=String(input?.value||"").trim();
 if(name.length<2){status("Bitte zuerst einen Projektnamen eingeben.");input?.focus();return}
 button.disabled=true;status("Projekt wird angelegt …");
 try{
  const organizationId=adminData?byId("customerPicker")?.value||"":"";
  const result=await request("/api/commercial/projects",{method:"POST",body:JSON.stringify({name,organizationId:organizationId||undefined})});
  if(!result.response.ok)throw new Error(result.data?.error?.message||"Projekt konnte nicht angelegt werden.");
  input.value="";await refresh();
  const picker=byId("projectPicker");if(picker&&result.data?.project?.id){picker.value=result.data.project.id;picker.dispatchEvent(new Event("change"))}
  status("Projekt angelegt · "+result.data.project.projectNumber);
 }catch(error){status(error.message||"Projekt konnte nicht angelegt werden.")}finally{button.disabled=false}
}
document.addEventListener("DOMContentLoaded",()=>{
 byId("createProject")?.addEventListener("click",createProject);
 refresh().catch(()=>status("DB-Kontext konnte nicht geladen werden."));
});
})();