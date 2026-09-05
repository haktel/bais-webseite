const brandingView=document.querySelector('[data-view="branding"]');
const documentsView=document.querySelector('[data-view="documents"]');
const pageTitle=document.querySelector('[data-admin-page-title]');
const pageDescription=document.querySelector('[data-admin-page-description]');

const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const api=async(url,options={})=>{const response=await fetch(url,{credentials:"same-origin",headers:{"content-type":"application/json",...(options.headers||{})},...options});const data=await response.json().catch(()=>({error:{message:"Ungültige Serverantwort."}}));if(!response.ok)throw new Error(data.error?.message||"Anfrage fehlgeschlagen.");return data;};
const assets={primary:"/assets/bais-wordmark.svg",mark:"/assets/bais-mark.svg",mono:"/assets/bais-wordmark-mono.svg",dark:"/assets/bais-wordmark-dark.svg",light:"/assets/bais-wordmark-light.svg"};
let settings=null;

const colorField=(key,label,help)=>`<label class="brandField"><span>${esc(label)}</span><div class="brandColorInput"><input type="color" data-setting="${key}" value="${esc(settings[key])}" aria-label="${esc(label)} Farbe"><input type="text" data-setting-text="${key}" value="${esc(settings[key])}" maxlength="7" aria-label="${esc(label)} Hex-Wert"></div><small>${esc(help)}</small></label>`;
const textField=(key,label,type="text",help="")=>`<label class="brandField"><span>${esc(label)}</span><input type="${type}" data-setting="${key}" value="${esc(settings[key])}" ${type==="number"?'inputmode="numeric"':''}>${help?`<small>${esc(help)}</small>`:""}</label>`;
const selectField=(key,label,options)=>`<label class="brandField"><span>${esc(label)}</span><select data-setting="${key}">${options.map(([value,text])=>`<option value="${esc(value)}" ${settings[key]===value?"selected":""}>${esc(text)}</option>`).join("")}</select></label>`;

function syncColorInputs(root){
 root.querySelectorAll('input[type="color"][data-setting]').forEach(color=>{
  const text=root.querySelector(`[data-setting-text="${CSS.escape(color.dataset.setting)}"]`);
  color.addEventListener("input",()=>{if(text)text.value=color.value.toUpperCase();applyPreview();});
  text?.addEventListener("input",()=>{if(/^#[0-9a-f]{6}$/i.test(text.value)){color.value=text.value;applyPreview();}});
 });
 root.querySelectorAll('[data-setting]').forEach(input=>input.addEventListener("input",applyPreview));
}

function collect(root){
 const payload={};
 root.querySelectorAll('[data-setting]').forEach(input=>{
  if(input.type==="color")payload[input.dataset.setting]=input.value.toUpperCase();
  else payload[input.dataset.setting]=String(input.value).trim();
 });
 return payload;
}

function applyPreview(){
 const root=brandingView&&!brandingView.hidden?brandingView:documentsView;
 if(!root)return;
 const values={...settings,...collect(root)};
 document.documentElement.style.setProperty("--bais-navy",values.primaryNavy);
 document.documentElement.style.setProperty("--bais-teal",values.teal);
 document.documentElement.style.setProperty("--bais-gold",values.gold);
 document.documentElement.style.setProperty("--bais-bg",values.neutral);
 document.documentElement.style.setProperty("--bais-radius",`${values.radius}px`);
 const preview=root.querySelector("[data-brand-live-copy]");if(preview)preview.textContent=values.brandSlogan||settings.brandSlogan;
 const issuer=root.querySelector("[data-doc-issuer-preview]");if(issuer)issuer.textContent=values.issuerName||settings.issuerName;
 const signer=root.querySelector("[data-doc-signer-preview]");if(signer)signer.textContent=values.signerName||settings.signerName;
}

async function save(root,status){
 const button=root.querySelector('[data-brand-save]');button.disabled=true;status.textContent="Änderungen werden gespeichert …";status.className="brandSaveStatus";
 try{const result=await api("/api/admin/brand-settings",{method:"PATCH",body:JSON.stringify({settings:collect(root)})});settings=result.settings;status.textContent="Gespeichert. Die Markenfarben werden systemweit über das BAIS Theme ausgeliefert.";status.className="brandSaveStatus success";applyPreview();}
 catch(error){status.textContent=error.message;status.className="brandSaveStatus error";}finally{button.disabled=false;}
}

function renderBranding(){
 brandingView.innerHTML=`<div class="brandSettingsShell">
  <div class="brandSettingsHead"><div><span class="brandKicker">BAIS DESIGN SYSTEM</span><h2>Branding &amp; Identity</h2><p>Logo-Set, Markenfarben, Typografie und globale Design-Tokens. Änderungen an Farben und Tokens werden systemweit ausgeliefert.</p></div><button type="button" class="brandSaveButton" data-brand-save>Änderungen speichern</button></div>
  <div class="brandSettingsGrid">
   <section class="brandCard brandAssetsCard"><div class="brandCardHead"><h3>Logos &amp; Markenassets</h3><span>Concept 2 · freigegeben</span></div><div class="brandAssetGrid">
    <article><span>Primäres Logo</span><img src="${assets.primary}" alt="BAIS Primärlogo"><code>bais-wordmark.svg</code></article>
    <article><span>Icon Mark</span><img class="squareAsset" src="${assets.mark}" alt="BAIS Icon Mark"><code>bais-mark.svg</code></article>
    <article><span>Monochrom</span><img src="${assets.mono}" alt="BAIS Logo monochrom"><code>bais-wordmark-mono.svg</code></article>
    <article class="darkAsset"><span>Dark Mode</span><img src="${assets.dark}" alt="BAIS Logo für dunklen Hintergrund"><code>bais-wordmark-dark.svg</code></article>
   </div><p class="brandAssetNote">Die Assets liegen versioniert im Repository; so bleiben Briefbogen, Zertifikate, Portal und Website identisch.</p></section>
   <section class="brandCard"><div class="brandCardHead"><h3>Markenfarben</h3><span>systemweit</span></div><div class="brandFieldGrid">${colorField("primaryNavy","Primary Navy","Vertrauen · Stabilität · Kompetenz")}${colorField("teal","Teal","Innovation · AI · Fortschritt")}${colorField("gold","Gold","Qualität · Sicherheit · Premium")}${colorField("neutral","Neutral","Flächen · Balance · Hintergründe")}</div></section>
   <section class="brandCard"><div class="brandCardHead"><h3>Typografie &amp; Layout</h3><span>Design Tokens</span></div><div class="brandFieldGrid">${textField("fontBody","Primäre Schriftart")}${textField("fontHeading","Überschriften")}${textField("radius","Eckenradius","number","0–32 px")}${textField("containerWidth","Container-Breite","number","960–1600 px")}${textField("brandTagline","Logo-Untertitel")}${textField("brandSlogan","Markenslogan")}${textField("headerCtaLabel","Header CTA")}</div></section>
   <section class="brandCard brandPreviewCard"><div class="brandCardHead"><h3>Live-Vorschau</h3><span>Website · Portal · Dokumente</span></div><div class="brandPreviewHeader"><img src="${assets.primary}" alt="BAIS"><nav aria-label="Vorschau Navigation"><span>Lösungen</span><span>Academy</span><span>Unternehmen</span><button type="button">Projekt einordnen</button></nav></div><div class="brandPreviewHero"><span>INTELLIGENCE SECURES PROGRESS</span><h3>Sichere Technologie.<br>Stärkere Möglichkeiten.</h3><p data-brand-live-copy>${esc(settings.brandSlogan)}</p><div><button type="button">Mehr erfahren</button><button type="button" class="ghost">Academy</button></div></div><div class="brandPreviewFooter"><img src="${assets.primary}" alt=""><span>Website · Academy · Project Portal · Zertifikate</span></div></section>
  </div><p class="brandSaveStatus" role="status" aria-live="polite" data-brand-status></p>
 </div>`;
 syncColorInputs(brandingView);brandingView.querySelector('[data-brand-save]').addEventListener("click",()=>save(brandingView,brandingView.querySelector('[data-brand-status]')));applyPreview();
}

function renderDocuments(){
 documentsView.innerHTML=`<div class="brandSettingsShell">
  <div class="brandSettingsHead"><div><span class="brandKicker">CORPORATE DOCUMENTS</span><h2>Dokumente, Zertifikate &amp; Briefbogen</h2><p>Gemeinsame Vorgaben für Teilnahmebescheinigung, Zertifikat, Briefbogen, Angebote und E-Mail-Signatur.</p></div><button type="button" class="brandSaveButton" data-brand-save>Änderungen speichern</button></div>
  <div class="brandSettingsGrid docsGrid">
   <section class="brandCard"><div class="brandCardHead"><h3>Allgemeine Dokumentdaten</h3><span>BAIS Standard</span></div><div class="brandFieldGrid">${textField("issuerName","Aussteller / Herausgeber")}${textField("signerName","Name Unterzeichner")}${textField("signerRole","Position")}${textField("verificationUrl","QR-Verifikations-URL","url")}${textField("certificateIdPattern","Zertifikat-ID Muster")}${selectField("certificateBorderStyle","Rahmenstil",[["double-gold","Doppelter Rahmen (Gold)"],["single-gold","Einfacher Rahmen (Gold)"],["minimal","Minimal"]])}${selectField("certificateWatermark","Wasserzeichen",[["on","BAIS Icon aktiv"],["off","Deaktiviert"]])}${selectField("localeDefault","Standardsprache",[["de-DE","Deutsch (DE)"],["en-US","English (EN)"],["tr-TR","Türkçe (TR)"]])}${textField("letterheadFooter","Briefbogen-Fußzeile")}${textField("emailSignatureSlogan","E-Mail-Signatur Slogan")}</div></section>
   <section class="brandCard docsPreviewCard"><div class="brandCardHead"><h3>Live-Vorschau</h3><span>A4</span></div><div class="docPreviewGrid">
    <article class="certificatePreview"><img src="${assets.primary}" alt="BAIS"><b>BAIS ACADEMY</b><h4>TEILNAHMEBESCHEINIGUNG</h4><i>hiermit wird bestätigt, dass</i><strong>Markus Weber</strong><span>am Programm</span><em>Secure AI &amp; RAG Engineering</em><small>teilgenommen hat.</small><div class="certificateBottom"><span>5. September 2026</span><span><b data-doc-signer-preview>${esc(settings.signerName)}</b><small>${esc(settings.signerRole)}</small></span></div><footer data-doc-issuer-preview>${esc(settings.issuerName)}</footer></article>
    <article class="letterPreview"><header><img src="${assets.primary}" alt="BAIS"><span>${esc(settings.brandTagline)}</span></header><b>BAIS · Bünyamin Atik – IT Solutions</b><p>Max Mustermann<br>Musterfirma GmbH<br>Musterstraße 12</p><strong>Betreff: Ihr individuelles Angebot</strong><p>Sehr geehrter Herr Mustermann,<br><br>vielen Dank für Ihr Interesse an unseren Lösungen. Gerne senden wir Ihnen anbei die abgestimmten Unterlagen.</p><p>Mit freundlichen Grüßen<br><b>${esc(settings.signerName)}</b></p><footer>${esc(settings.letterheadFooter)}</footer></article>
   </div></section>
  </div><p class="brandSaveStatus" role="status" aria-live="polite" data-brand-status></p>
 </div>`;
 syncColorInputs(documentsView);documentsView.querySelector('[data-brand-save]').addEventListener("click",()=>save(documentsView,documentsView.querySelector('[data-brand-status]')));applyPreview();
}

async function init(){
 if(!brandingView||!documentsView)return;
 try{const data=await api("/api/admin/brand-settings");settings=data.settings;renderBranding();renderDocuments();}
 catch(error){brandingView.innerHTML=`<p class="adminMessage error">${esc(error.message)}</p>`;documentsView.innerHTML=`<p class="adminMessage error">${esc(error.message)}</p>`;return;}
 document.querySelectorAll('[data-tab="branding"],[data-tab="documents"]').forEach(tab=>tab.addEventListener("click",()=>{
  const branding=tab.dataset.tab==="branding";pageTitle.textContent=branding?"Branding & Identity":"Dokumente & Vorlagen";pageDescription.textContent=branding?"BAIS Corporate Design systemweit verwalten.":"Zertifikate, Teilnahmebescheinigungen, Briefbogen und Signaturen konfigurieren.";
 }));
}

init();
