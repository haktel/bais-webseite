import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Control Center operational modules stay inside the admin shell",()=>{
 const html=read("admin/index.html");
 const quick=html.match(/<div class="baisQuickLinks"[\s\S]*?<\/div>/)?.[0]||"";
 assert.match(quick,/data-internal-view="runbook"/);
 assert.match(quick,/data-internal-view="billing"/);
 assert.match(quick,/data-internal-view="portal"/);
 assert.match(quick,/data-internal-view="academy"/);
 assert.doesNotMatch(quick,/href=/);
 assert.match(html,/data-standard-workspace/);
 assert.match(html,/data-internal-workspace/);
 assert.match(html,/admin-internal-nav\.js\?v=1\.0/);
 assert.match(html,/admin-internal-nav\.css\?v=1\.0/);
});

test("Legacy/full-page tools are explicit new-tab actions only",()=>{
 const source=read("assets/admin-internal-nav.js");
 assert.match(source,/href="\/admin\/runbook\/" target="_blank" rel="noopener"/);
 assert.match(source,/href="\/admin\/rechnung\/" target="_blank" rel="noopener"/);
 assert.match(source,/href="\/project-portal\/" target="_blank" rel="noopener"/);
 assert.match(source,/href="\/academy\/" target="_blank" rel="noopener"/);
 assert.match(source,/standardWorkspace\.hidden=true/);
 assert.match(source,/internalWorkspace\.hidden=false/);
 assert.doesNotThrow(()=>new Function(source));
});

test("Top-level secondary destinations do not replace the Control Center tab",()=>{
 const html=read("admin/index.html");
 assert.match(html,/href="\/academy\/konto\/" target="_blank" rel="noopener">Mein Konto/);
 assert.match(html,/href="\/" target="_blank" rel="noopener">Website/);
});
