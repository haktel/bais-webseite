import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const docs=[
 "docs/sales/angebot-sow-vorlage.md",
 "docs/sales/kunden-onboarding-vorlage.md",
 "docs/sales/abnahmeprotokoll-vorlage.md"
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
