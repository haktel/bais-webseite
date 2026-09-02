import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("admin operations runbook is exposed only inside protected admin surface",()=>{
 const html=read("admin/runbook/index.html");
 const middleware=read("functions/admin/_middleware.js");
 const admin=read("admin/index.html");
 assert.match(html,/Backup \/ Recovery \/ Monitoring Runbook/);
 assert.match(html,/INTERN/);
 assert.match(html,/\[RTO\]/);
 assert.match(html,/\[RPO\]/);
 assert.match(middleware,/requireAdmin/);
 assert.match(admin,/\/admin\/runbook\//);
});

test("customer operations summary is independently gated by wartung hosting entitlement",()=>{
 const html=read("kundenbereich/betrieb/index.html");
 const middleware=read("functions/kundenbereich/betrieb/_middleware.js");
 const account=read("assets/academy-account.js");
 assert.match(html,/WARTUNG\/HOSTING-SETUP/);
 assert.match(html,/Diese Seite erzeugt keine SLA-Zusagen/);
 assert.match(middleware,/requireCustomerContentAccess/);
 assert.match(middleware,/"wartung_hosting"/);
 assert.match(account,/wartung_hosting:\{label:"Wartung\/Hosting-Setup",href:"\/kundenbereich\/betrieb\//);
 assert.doesNotMatch(account,/project-portal\/kunde\/betrieb/);
});

test("protected runbook pages are no-store and live-audited",()=>{
 const headers=read("_headers");
 const audit=read("scripts/security-live-audit.sh");
 assert.match(headers,/\/kundenbereich\/\*/);
 assert.match(headers,/Cache-Control: private, no-store/);
 assert.match(audit,/check_redirect "\/admin\/runbook\/" "\/academy\/konto\//);
 assert.match(audit,/check_redirect "\/kundenbereich\/betrieb\/" "\/academy\/konto\//);
});

test("customer account cache version includes operations-link build",()=>{
 const html=read("academy/konto/index.html");
 assert.match(html,/academy-account\.js\?v=2\.2/);
});
