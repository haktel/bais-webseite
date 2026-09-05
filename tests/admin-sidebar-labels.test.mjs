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
