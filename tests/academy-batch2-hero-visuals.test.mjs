import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const pages=[
 {slug:"policy-enablement",img:"policy-enablement-v1"},
 {slug:"ai-governance",img:"ai-governance-academy-v1"},
 {slug:"eu-ai-act",img:"eu-ai-act-v1"},
 {slug:"ki-leadership",img:"ki-leadership-v1"},
 {slug:"ki-health",img:"ki-health-v1"},
 {slug:"ki-health-klinik",img:"ki-health-klinik-v1"},
 {slug:"ki-health-pflege",img:"ki-health-pflege-v1"},
 {slug:"enterprise-tools",img:"enterprise-tools-v1"},
 {slug:"api-integration",img:"api-integration-v1"},
 {slug:"ai-agents",img:"ai-agents-v1"},
];

for(const {slug,img} of pages){
 test(`academy/${slug} hero renders a real visual, not just text`,()=>{
  const html=read(`academy/${slug}/index.html`);
  assert.match(html,/<body class="progDetailPage">/);
  const re=new RegExp(`<figure class="heroMedia"><img src="\\.\\./\\.\\./assets/visuals/${img}\\.svg" width="1200" height="675" alt="[^"]{20,}"`);
  assert.match(html,re);
  assert.match(html,/<figcaption><span><i><\/i> BAIS Academy<\/span><b>[^<]+<\/b><\/figcaption><\/figure>/);
 });
}

test("the 10 second-batch hero visual files exist and are non-trivial embedded images",()=>{
 for(const {img} of pages){
  const svg=read(`assets/visuals/${img}.svg`);
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/data:image\/webp;base64,/);
  assert.ok(svg.length>20000,`${img}.svg should embed a real image, not a stub`);
 }
});

test("KI Health pages avoid depicting a realistic clinical scene in their alt text (abstract-only visuals)",()=>{
 for(const slug of["ki-health","ki-health-klinik","ki-health-pflege"]){
  const html=read(`academy/${slug}/index.html`);
  assert.doesNotMatch(html,/Diagnose gestellt|Patientengesicht|reale? Patient/i);
 }
});
