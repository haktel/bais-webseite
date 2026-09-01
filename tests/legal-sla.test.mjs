import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SLA defines P1 through P4 with business impact",()=>{
 const html=read("sla/index.html");
 for(const label of["P1 · Kritisch","P2 · Hoch","P3 · Mittel","P4 · Niedrig"])assert.match(html,new RegExp(label.replace("·","\\s*·\\s*"),"i"));
});

test("SLA distinguishes reaction time from resolution time",()=>{
 const html=read("sla/index.html");
 assert.match(html,/Reaktionszeit ist nicht Lösungszeit/i);
 assert.match(html,/Resolution Targets/i);
 assert.match(html,/keine Garantie für vollständige Fehlerbehebung/i);
});

test("SLA does not silently promise 24-7, uptime, RPO or RTO",()=>{
 const html=read("sla/index.html");
 assert.match(html,/24\/7 nur bei ausdrücklicher Vereinbarung/i);
 assert.match(html,/Verfügbarkeitsziel.*Nur falls vereinbart/is);
 assert.match(html,/RPO.*Nur falls vereinbart/is);
 assert.match(html,/RTO.*Nur falls vereinbart/is);
 assert.match(html,/Service Credits.*Nur falls vereinbart/is);
});

test("SLA connects security incidents to the AVV and covers third parties",()=>{
 const html=read("sla/index.html");
 assert.match(html,/Security Incidents/i);
 assert.match(html,/AVV\/DPA/i);
 assert.match(html,/Drittanbieter und externe Abhängigkeiten/i);
});

test("SLA is exposed in pricing and contractual context, not the global homepage footer",()=>{
 assert.match(read("preise/index.html"),/SLA &amp; Support-Rahmen ansehen/i);
 assert.doesNotMatch(read("index.html"),/sla\/index\.html[^>]*>SLA/i);
 assert.match(read("angebot/index.html"),/href="\.\.\/sla\/"[^>]*>SLA/i);
 assert.match(read("sitemap.xml"),/https:\/\/bais-solutions\.de\/sla\//i);
});
