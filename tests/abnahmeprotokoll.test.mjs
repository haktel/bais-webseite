import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const offer=fs.readFileSync(new URL("../angebot/index.html",import.meta.url),"utf8");
const acceptance=fs.readFileSync(new URL("../abnahme/index.html",import.meta.url),"utf8");

const services=[
"Discovery / Kick-off","Anforderungsanalyse","Informationsarchitektur","UX-Konzept / Wireframes","UI-Design","Responsive Webdesign","Frontend-Entwicklung","Backend-Entwicklung","CMS / Content-Verwaltung","Mehrsprachigkeit","Content-Migration","Technisches SEO","Accessibility / Barrierearmut","Performance-Optimierung",
"Kundenlogin","Rollen & Berechtigungen","Projekt-Dashboard","Meilensteine / Status","Tickets / Aufgaben","Dokumente / Downloads","Freigaben / Approval Gates","Projektnachrichten","Audit-/Aktivitätsverlauf","Reporting",
"Prozessanalyse","n8n Workflow","Webhooks","API-Integration","CRM-/ERP-Anbindung","Datenbankintegration","Datenmapping","Fehlerhandling / Retry","Logging / Execution Evidence",
"AI Use-Case Discovery","RAG / Wissensassistent","Dokumentenverarbeitung","AI Agent / Tool Calling","Prompt-/Systemdesign","Human Review / Approval","Guardrails / Safety Controls","Evaluation / Qualitätsmessung",
"Security Architecture Review","Rollen-/Berechtigungskonzept","Secrets / Credential Handling","Hardening","Logging / Monitoring","Backup / Recovery","Incident-Prozess","AI Governance","Risiko-/Control-Mapping",
"Domain / DNS","Hosting / Cloud","Deployment / Go-Live","Monitoring","Backup","Wartung","Patch-/Update-Service","BAIS Care","BAIS Care Plus","BAIS Critical / individuelles SLA",
"Admin-Schulung","Benutzer-Schulung","Technische Dokumentation","Betriebs-Runbook","Übergabe-Workshop"
];

test("Abnahme mirrors the Angebot service taxonomy",()=>{
 for(const service of services){
  assert.equal(offer.includes(service),true,"service missing from Angebot: "+service);
  assert.equal(acceptance.includes(service),true,"service missing from Abnahme: "+service);
 }
});

test("Abnahme provides exactly the three required acceptance outcomes",()=>{
 assert.match(acceptance,/value="vollstaendig"/);
 assert.match(acceptance,/Vollständige Abnahme ohne Mängel/);
 assert.match(acceptance,/value="vorbehalt"/);
 assert.match(acceptance,/Abnahme unter Vorbehalt/);
 assert.match(acceptance,/value="verweigert"/);
 assert.match(acceptance,/Abnahme verweigert/);
});

test("Abnahme has usable dynamic defect management",()=>{
 for(const name of["defectDescription","defectPriority","defectOwner","defectDue","defectStatus"])assert.match(acceptance,new RegExp('name="'+name+'"'));
 assert.match(acceptance,/Mangel \/ Punkt hinzufügen/);
 for(const priority of["P1 · Kritisch","P2 · Hoch","P3 · Mittel","P4 · Niedrig"])assert.equal(acceptance.includes(priority),true);
 for(const owner of["Auftragnehmer","Auftraggeber","Drittanbieter","Gemeinsam"])assert.equal(acceptance.includes(owner),true);
 assert.match(acceptance,/removeDefect/);
});

test("Abnahme uses real dates, print-to-PDF and session-scoped draft storage",()=>{
 assert.ok((acceptance.match(/type="date"/g)||[]).length>=10);
 assert.match(acceptance,/Drucken \/ als PDF speichern/);
 assert.match(acceptance,/window\.print\(\)/);
 assert.match(acceptance,/sessionStorage/);
 assert.match(acceptance,/printHideUnchecked/);
 assert.match(acceptance,/printHideEmptyDefects/);
 assert.doesNotMatch(acceptance,/fetch\s*\(/i);
 assert.doesNotMatch(acceptance,/action\s*=/i);
});

test("Abnahme contains no placeholder codes or guessed warranty/payment values",()=>{
 assert.doesNotMatch(acceptance,/\[[A-ZÄÖÜ0-9_]{3,}\]/);
 for(const id of["paymentDueDays","paymentDueDate","warrantyStart","warrantyDuration","supportStart"]){
  const tag=acceptance.match(new RegExp('<(?:input|select)[^>]*id="'+id+'"[^>]*>'))?.[0]||"";
  assert.ok(tag,"missing field "+id);
  assert.doesNotMatch(tag,/value="[0-9]/,"field must not be guessed: "+id);
 }
});

test("Abnahme references SOW, payment, warranty and legal effect boundaries",()=>{
 for(const needle of[
  "Angebots-/SOW-Nummer",
  "AUSWIRKUNG AUF ZAHLUNG",
  "BEGINN DER MÄNGEL-/GEWÄHRLEISTUNGSFRIST",
  "FOLGEN DER ABNAHME",
  "UNTERSCHRIFTEN",
  "Dieses Protokoll erfindet keine Zahlungsfolge"
 ])assert.equal(acceptance.includes(needle),true,"missing section/boundary: "+needle);
});
