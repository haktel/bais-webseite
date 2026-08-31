import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const html=fs.readFileSync(new URL("../angebot/index.html",import.meta.url),"utf8");

test("Angebot SOW exposes customer-selectable service categories",()=>{
 for(const needle of[
  "Welche Leistungen werden gewünscht?",
  "Website & UX",
  "Project Portal",
  "Automation / n8n / Integration",
  "AI / RAG / Agents",
  "Cybersecurity & Governance",
  "Hosting, Betrieb & Support",
  "Schulung & Handover",
  "Betriebsmodell"
 ])assert.equal(html.includes(needle),true,"missing service group: "+needle);
 assert.ok((html.match(/type="checkbox"/g)||[]).length>=40);
});

test("Angebot SOW contains the contractual sales sections",()=>{
 for(const needle of[
  "AUSGANGSLAGE & ZIEL",
  "SCOPE OF WORK",
  "ABGRENZUNG",
  "VORGEHEN & MEILENSTEINE",
  "ZEITPLAN",
  "PREISE & KALKULATION",
  "ZAHLUNGSBEDINGUNGEN",
  "MITWIRKUNGSPFLICHTEN",
  "GEWÄHRLEISTUNG & SUPPORT",
  "GÜLTIGKEIT & VERTRAGSUNTERLAGEN",
  "UNTERSCHRIFTEN"
 ])assert.equal(html.includes(needle),true,"missing SOW section: "+needle);
});

test("Angebot SOW is noindex and print-ready without server submission",()=>{
 assert.match(html,/name="robots" content="noindex,nofollow"/i);
 assert.match(html,/window\.print\(\)/);
 assert.doesNotMatch(html,/<form\b/i);
 assert.doesNotMatch(html,/fetch\s*\(/i);
 assert.match(html,/Keine Formulardaten werden an einen Server gesendet/i);
});

test("Angebot SOW keeps unknown commercial facts as placeholders",()=>{
 for(const needle of[
  "[KUNDENFIRMA]",
  "[ANGEBOTSNUMMER]",
  "[ANZAHLUNG_PROZENT]",
  "[ZAHLUNGSZIEL]",
  "[STUNDENSATZ]",
  "[TAGESSATZ]"
 ])assert.equal(html.includes(needle),true,"missing placeholder: "+needle);
});
