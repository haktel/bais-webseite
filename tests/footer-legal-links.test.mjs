import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const pages=[
 "agb/index.html","avv/index.html","sla/index.html","preise/index.html",
 "referenzen/index.html","kontakt/index.html","impressum/index.html",
 "datenschutz/index.html","referenzen/n8n-live-demo/index.html",
 "angebot/index.html","abnahme/index.html"
];

test("public and document footers keep contractual AVV/SLA links out of the global legal bar",()=>{
 for(const path of pages){
  const source=read(path);
  const footer=(source.match(/<footer class="footer">[\s\S]*?<\/footer>/)||[""])[0];
  assert.ok(footer,path+" footer missing");
  assert.doesNotMatch(footer,/>AVV \/ DPA<\/a>/,path+" exposes AVV/DPA in footer");
  assert.doesNotMatch(footer,/>SLA<\/a>/,path+" exposes SLA in footer");
 }
});
