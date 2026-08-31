import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const docs=[
 "docs/sales/angebot-sow-vorlage.md",
 "docs/sales/kunden-onboarding-vorlage.md",
 "docs/sales/abnahmeprotokoll-vorlage.md",
 "docs/operations/backup-recovery-monitoring-runbook.md"
];
const canonical=[
 ["MOD-01","Website-Entwicklung"],
 ["MOD-02","Project Portal"],
 ["MOD-03","Wartung/Hosting-Setup"],
 ["MOD-04","Content-Pflege"]
];

test("sales document family keeps canonical module names aligned",()=>{
 for(const path of docs){
  const source=read(path);
  for(const[id,label]of canonical){
   assert.ok(source.includes(id),path+" missing "+id);
   assert.ok(source.includes(label),path+" missing "+label);
  }
 }
});

test("customer onboarding contains all required operational sections",()=>{
 const source=read("docs/sales/kunden-onboarding-vorlage.md");
 for(const heading of[
  "1. Onboarding Übersicht",
  "2. Willkommens-E-Mail",
  "3. Kickoff-Call Agenda",
  "4. Informations- & Zugangs-Checkliste",
  "5. Kommunikationskanäle & Ansprechpartner",
  "6. Projektzeitplan-Vorschau",
  "7. Rollen & Verantwortlichkeiten",
  "8. INTERN – Onboarding-Checkliste Auftragnehmer",
  "9. Nächste Schritte & Abschluss"
 ]) assert.ok(source.includes(heading),"missing "+heading);
});

test("onboarding preserves customer isolation and placeholder discipline",()=>{
 const source=read("docs/sales/kunden-onboarding-vorlage.md");
 for(const required of[
  "Default Deny",
  "Kundenkonto ≠ Vollzugriff",
  "Kunden-Nr.",
  "Projekt-Nr.",
  "[PROJECT_PORTAL_NAME_ODER_URL]",
  "[RECHNUNGSSYSTEM]",
  "nicht automatisch erfunden werden",
  "Credentials nicht per normaler E-Mail"
 ]) assert.ok(source.includes(required),"missing "+required);
});


test("operations runbook contains the required technical and customer sections",()=>{
 const source=read("docs/operations/backup-recovery-monitoring-runbook.md");
 for(const required of[
  "1. Overview & Scope",
  "2. Backup Strategy",
  "3. Backup Verification",
  "4. Monitoring & Alerting",
  "5. Incident Severity Levels",
  "6. Recovery Procedures",
  "7. Escalation Path",
  "8. Post-Incident Review",
  "9. Communication & Access References",
  "10. Was ist abgedeckt?",
  "11. Was sollte der Kunde im Notfall tun?"
 ]) assert.ok(source.includes(required),"missing "+required);
});

test("operations runbook keeps risky operational values as placeholders",()=>{
 const source=read("docs/operations/backup-recovery-monitoring-runbook.md");
 for(const required of[
  "[HOSTING_PROVIDER]",
  "[BACKUP_SIKLIGI]",
  "[BACKUP_RETENTION]",
  "[RTO]",
  "[RPO]",
  "[REAKTIONSZEIT_P1]",
  "[REAKTIONSZEIT_P2]",
  "[REAKTIONSZEIT_P3]",
  "[MONITORING_SYSTEM]",
  "[SICHERER_CREDENTIAL_KANAL]",
  "[PASSWORD_MANAGER_REFERENCE]"
 ]) assert.ok(source.includes(required),"missing "+required);
 assert.ok(source.includes("Never store plaintext passwords"));
 assert.ok(source.includes("only if"));
});

test("MOD-03 lifecycle references the operations runbook",()=>{
 const sow=read("docs/sales/angebot-sow-vorlage.md");
 const onboarding=read("docs/sales/kunden-onboarding-vorlage.md");
 const acceptance=read("docs/sales/abnahmeprotokoll-vorlage.md");
 assert.ok(sow.includes("Backup / Recovery / Monitoring Runbook"));
 assert.ok(onboarding.includes("Backup / Recovery / Monitoring Runbook"));
 assert.ok(acceptance.includes("Backup / Recovery / Monitoring Runbook"));
});
