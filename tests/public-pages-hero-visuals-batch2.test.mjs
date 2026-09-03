import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

// Pages that got the standard two-column .mainHeroPage treatment (plain .hero .heroGrid before).
const mainHeroPages=[
 {path:"docs/index.html",img:"docs-wiki-v1"},
 {path:"branchen/mittelstand/index.html",img:"branchen-mittelstand-v1"},
 {path:"branchen/vertrieb/index.html",img:"branchen-vertrieb-v1"},
 {path:"branchen/bildung/index.html",img:"branchen-bildung-v1"},
 {path:"project-portal/index.html",img:"project-portal-v1"},
 {path:"referenzen/beispielprojekt-wissensassistent/index.html",img:"referenzen-wissensassistent-v1"},
 {path:"lab/index.html",img:"bais-lab-v1"},
 {path:"zertifikat/index.html",img:"zertifikat-v1"},
];

for(const {path,img} of mainHeroPages){
 test(`${path} hero renders a real visual, not just text`,()=>{
  const html=read(path);
  assert.match(html,/<body class="mainHeroPage">/);
  const re=new RegExp(`<figure class="heroMedia"><img src="[^"]*${img}\\.svg" width="1200" height="675" alt="[^"]{20,}"`);
  assert.match(html,re);
  assert.match(html,/<figcaption><span><i><\/i> BAIS<\/span><b>[^<]+<\/b><\/figcaption><\/figure>/);
 });
}

// Pages with an existing custom hero + aside (governance wiki, use-case discovery, n8n live demo):
// keep their aside untouched, add a full-width heroMedia banner below instead.
const bannerPages=[
 {path:"docs/ai-governance/index.html",img:"ai-governance-wiki-v1",aside:/<aside class="wikiPurpose">/},
 {path:"loesungen/ai-use-case/index.html",img:"ai-use-case-v1",aside:/<aside class="factPanel"/},
 {path:"referenzen/n8n-live-demo/index.html",img:"n8n-live-demo-v1",aside:/<aside class="truthBox">/},
];

for(const {path,img,aside} of bannerPages){
 test(`${path} keeps its existing hero aside and adds a heroMedia banner`,()=>{
  const html=read(path);
  assert.match(html,aside);
  const re=new RegExp(`<figure class="heroMedia"><img src="[^"]*${img}\\.svg" width="1200" height="675" alt="[^"]{20,}"`);
  assert.match(html,re);
 });
}

test("all 11 new batch-2 hero visual files exist and are non-trivial embedded images",()=>{
 const imgs=[...mainHeroPages.map(p=>p.img),...bannerPages.map(p=>p.img)];
 for(const img of imgs){
  const svg=read(`assets/visuals/${img}.svg`);
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/data:image\/webp;base64,/);
  assert.ok(svg.length>20000,`${img}.svg should embed a real image, not a stub`);
 }
});

test("branchen/it-security already has its own hero visual and was intentionally left untouched",()=>{
 const html=read("branchen/it-security/index.html");
 assert.match(html,/<figure class="securityHeroMedia"><img src="\/assets\/visuals\/cybersecurity-v1\.svg"/);
});
