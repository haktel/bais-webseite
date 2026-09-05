import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("admin sidebar keeps every navigation group and label readable",()=>{
 const html=read("admin/index.html");
 const css=read("assets/admin-sidebar-fix.css");
 const labels=[
  "Studierende",
  "Academy-Anfragen",
  "Programme",
  "Nachweise",
  "Besucher",
  "Kunden & Freigaben",
  "Kunden-Freigaben",
  "ERP Sync",
  "Kontakt",
  "Datenschutz"
 ];
 assert.match(html,/admin-sidebar-fix\.css\?v=1\.0/);
 for(const label of labels)assert.match(html,new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
 assert.match(css,/flex-direction:column!important/);
 assert.match(css,/grid-template-columns:34px minmax\(0,1fr\)!important/);
 assert.match(css,/white-space:normal!important/);
 assert.match(css,/visibility:visible!important/);
});

test("admin theme uses one sidebar type scale and controlled dashboard colors",()=>{
 const html=read("admin/index.html");
 const css=read("assets/admin-theme.css");
 assert.match(html,/admin-theme\.css\?v=1\.1/);
 assert.match(css,/--bais-admin-menu-text:#d9e8ed/);
 assert.match(css,/font-family:var\(--bais-font\)!important/);
 assert.match(css,/font-size:13px!important/);
 assert.match(css,/\.baisQuickLinks button/);
 assert.match(css,/\.adminMetric:nth-child\(6n\+2\)/);
 assert.match(css,/\.baisHealthCard:nth-child\(6n\+4\)/);
 assert.match(css,/data-tab="privacy"/);
});
