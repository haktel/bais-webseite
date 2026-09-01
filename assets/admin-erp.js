const root=document.querySelector('[data-view="erp"]');

const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const date=value=>value?new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"–";
const api=async(options={})=>{
 const response=await fetch("/api/admin/erp-sync",{credentials:"same-origin",headers:{"content-type":"application/json"},...options});
 const data=await response.json().catch(()=>({error:{message:"Ungültige Serverantwort."}}));
 if(!response.ok)throw new Error(data.error?.message||"ERP-Anfrage fehlgeschlagen.");
 return data;
};
const badge=(ok,yes="bereit",no="fehlt")=>`<span class="adminStatus ${ok?"valid":"revoked"}">${esc(ok?yes:no)}</span>`;

function render(data){
 if(!root)return;
 const integration=data.integration||{},jobs=data.jobs||[],links=data.links||[];
 const pending=jobs.filter(x=>x.status==="pending"||x.status==="failed"||x.status==="processing").length;
 const synced=links.filter(x=>x.sync_status==="synced").length;
 const rows=jobs.map(job=>`<tr>
  <td><strong>${esc(job.customer_number)}</strong><br><small>${esc(job.organization_name)}</small></td>
  <td>${esc(job.status)}</td>
  <td>${job.attempts||0}</td>
  <td>${date(job.updated_at)}</td>
  <td>${esc(job.last_error||"–")}</td>
 </tr>`).join("");
 root.innerHTML=`
  <div class="adminPanelHead"><h2>Dolibarr ERP Sync</h2><p>Neue Website-Registrierungen werden als <strong>Prospect</strong> vorgemerkt. Erst nach Angebot/SOW werden sie zum Kunden hochgestuft.</p></div>
  <div class="erpSyncSummary">
   <div><span>Integration</span>${badge(integration.enabled,"aktiv","deaktiviert")}</div>
   <div><span>Dolibarr API</span>${badge(integration.apiKeyConfigured)}</div>
   <div><span>Cloudflare Access Service Auth</span>${badge(integration.accessConfigured)}</div>
   <div><span>Synchronisiert</span><strong>${synced}</strong></div>
   <div><span>Offen / Retry</span><strong>${pending}</strong></div>
  </div>
  <form class="erpSyncForm" data-erp-config>
   <label>ERP-Adresse<input name="baseUrl" type="url" value="${esc(integration.baseUrl||"https://erp.bais-solutions.de")}" required></label>
   <label>Dolibarr API-Key <small>Leer lassen = vorhandenen Schlüssel behalten</small><input name="apiKey" type="password" autocomplete="new-password"></label>
   <label>Cloudflare Access Client ID <small>Leer lassen = vorhanden behalten</small><input name="accessClientId" type="password" autocomplete="off"></label>
   <label>Cloudflare Access Client Secret <small>Leer lassen = vorhanden behalten</small><input name="accessClientSecret" type="password" autocomplete="new-password"></label>
   <label class="erpCheck"><input name="enabled" type="checkbox" ${integration.enabled?"checked":""}> ERP-Synchronisierung aktiv</label>
   <div class="erpActions"><button class="adminAction" type="submit">Zugangsdaten speichern</button><button class="adminAction secondary" type="button" data-erp-sync>Jetzt synchronisieren</button><button class="adminAction secondary" type="button" data-erp-retry>Fehler erneut versuchen</button></div>
   <p class="adminMessage" data-erp-message aria-live="polite"></p>
  </form>
  <div class="adminSubhead"><h3>Synchronisationsaufträge</h3></div>
  <div class="adminTableWrap"><table class="adminTable"><thead><tr><th>Kunde</th><th>Status</th><th>Versuche</th><th>Aktualisiert</th><th>Fehler</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="adminEmpty">Keine ERP-Aufträge vorhanden.</td></tr>'}</tbody></table></div>`;
}

async function load(){
 if(!root)return;
 root.innerHTML='<p class="adminEmpty">ERP-Status wird geladen …</p>';
 try{render(await api());}catch(error){root.innerHTML=`<div class="adminSectionWarning"><strong>ERP-Status nicht verfügbar:</strong> ${esc(error.message)}</div>`;}
}

root?.addEventListener("submit",async event=>{
 const form=event.target.closest("[data-erp-config]");if(!form)return;
 event.preventDefault();
 const message=form.querySelector("[data-erp-message]"),button=form.querySelector('button[type="submit"]');button.disabled=true;
 const values=new FormData(form);
 try{
  const data=await api({method:"POST",body:JSON.stringify({action:"save_config",baseUrl:values.get("baseUrl"),apiKey:values.get("apiKey"),accessClientId:values.get("accessClientId"),accessClientSecret:values.get("accessClientSecret"),enabled:values.get("enabled")==="on"})});
  render(data);root.querySelector("[data-erp-message]").textContent="ERP-Zugangsdaten sicher gespeichert.";
 }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
});
root?.addEventListener("click",async event=>{
 const sync=event.target.closest("[data-erp-sync]"),retry=event.target.closest("[data-erp-retry]");if(!sync&&!retry)return;
 const button=sync||retry;button.disabled=true;
 try{
  const data=await api({method:"POST",body:JSON.stringify({action:sync?"sync":"retry_all"})});render(data);
  const msg=root.querySelector("[data-erp-message]"),result=data.result||{};
  msg.textContent=result.configured===false?"Dolibarr API-Zugangsdaten fehlen noch. Auftrag bleibt sicher in der Warteschlange.":`ERP-Sync: ${result.synced||0} erfolgreich, ${result.failed||0} fehlgeschlagen.`;
 }catch(error){root.querySelector("[data-erp-message]").textContent=error.message;}finally{button.disabled=false;}
});

load();
