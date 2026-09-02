import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("floating back/forward nav sits bottom-right, not bottom-left, so it can't overlap left-aligned page content (e.g. Academy's dark tab section)",()=>{
 const css=read("assets/site-history-nav.css");
 assert.match(css,/\.baisHistoryNav\{[^}]*right:14px/);
 assert.doesNotMatch(css,/\.baisHistoryNav\{[^}]*left:14px/);
 assert.match(css,/@media\(max-width:560px\)\{\s*\.baisHistoryNav\{[^}]*right:9px/);
});

test("floating back/forward nav has an opaque background so it stays legible over dark page sections",()=>{
 const css=read("assets/site-history-nav.css");
 assert.match(css,/\.baisHistoryNav\{[^}]*background:#fff/);
});
