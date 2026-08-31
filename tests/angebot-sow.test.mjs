import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const html=fs.readFileSync(new URL("../angebot/index.html",import.meta.url),"utf8");

test("Angebot exposes customer-selectable service categories",()=>{
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
 assert.ok((html.match(/type="checkbox"/g)||[]).length>=50);
});

test("Angebot is a real fillable form with calendar fields",()=>{
 assert.match(html,/<form id="offerForm"/);
 assert.ok((html.match(/type="date"/g)||[]).length>=10);
 for(const id of["offerDate","validUntil","projectStart","clientCompany","currentSituation","projectGoal","outOfScope","hourlyRate","depositPct","paymentDays"]){
   assert.match(html,new RegExp('id="'+id+'"'),"missing input: "+id);
 }
 assert.doesNotMatch(html,/contenteditable=/i);
 assert.doesNotMatch(html,/\[[A-ZÄÖÜ0-9_]{3,}\]/);
});

test("Angebot contains the contractual sales sections",()=>{
 for(const needle of[
  "AUSGANGSLAGE & ZIELSETZUNG",
  "LEISTUNGSUMFANG / SCOPE OF WORK",
  "ABGRENZUNG",
  "VORGEHEN & MEILENSTEINE",
  "ZEITPLAN",
  "PREISE & KALKULATION",
  "ZAHLUNGSBEDINGUNGEN",
  "MITWIRKUNGSPFLICHTEN",
  "GEWÄHRLEISTUNG & SUPPORT NACH GO-LIVE",
  "ANGEBOTSGÜLTIGKEIT & RECHTLICHE HINWEISE",
  "UNTERSCHRIFTEN"
 ])assert.equal(html.includes(needle),true,"missing SOW section: "+needle);
});

test("Angebot is noindex, print-to-PDF ready and session-scoped",()=>{
 assert.match(html,/name="robots" content="noindex,nofollow"/i);
 assert.match(html,/window\.print\(\)/);
 assert.match(html,/sessionStorage/);
 assert.match(html,/printHideUnchecked/);
 assert.doesNotMatch(html,/fetch\s*\(/i);
 assert.doesNotMatch(html,/action\s*=/i);
});

test("unknown commercial facts remain empty and are not guessed",()=>{
 for(const id of["hourlyRate","dailyRate","sprintPrice","vatRate","depositPct","midPct","finalPct","paymentDays"]){
   const re=new RegExp('<input[^>]*id="'+id+'"[^>]*>');
   const tag=html.match(re)?.[0]||"";
   assert.ok(tag,"missing commercial input "+id);
   assert.doesNotMatch(tag,/value="/i,"commercial input must not be prefilled: "+id);
 }
});

test("price and payment calculations are implemented",()=>{
 assert.match(html,/class="tableInput priceLine"/);
 assert.match(html,/id="netTotal"/);
 assert.match(html,/id="vatTotal"/);
 assert.match(html,/id="grossTotal"/);
 assert.match(html,/id="depositAmount"/);
 assert.match(html,/id="midAmount"/);
 assert.match(html,/id="finalAmount"/);
});
