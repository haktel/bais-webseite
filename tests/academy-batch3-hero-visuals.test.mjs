import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const pages=[
 {slug:"knowledge-assistant-lab",img:"knowledge-assistant-lab-v1"},
 {slug:"ki-it-security",img:"ki-it-security-v1"},
 {slug:"prompt-engineering",img:"prompt-engineering-v1"},
 {slug:"it-projektmanagement-ai-delivery",img:"it-projektmanagement-ai-delivery-v1"},
 {slug:"prozessanalyse-automation",img:"prozessanalyse-automation-v1"},
 {slug:"data-literacy",img:"data-literacy-v1"},
 {slug:"ai-customer-service",img:"ai-customer-service-v1"},
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

test("the 7 third-batch hero visual files exist and are non-trivial embedded images",()=>{
 for(const {img} of pages){
  const svg=read(`assets/visuals/${img}.svg`);
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/data:image\/webp;base64,/);
  assert.ok(svg.length>20000,`${img}.svg should embed a real image, not a stub`);
 }
});

test("all 23 top-level Academy program pages now have a real hero visual",()=>{
 const allProgramPages=[
  "ki-fuehrerschein","n8n-bootcamp","secure-ai-rag","caio-masterguide","ai-for-sales","ai-coding",
  "policy-enablement","ai-governance","eu-ai-act","ki-leadership",
  "ki-health","ki-health-klinik","ki-health-pflege",
  "enterprise-tools","api-integration","ai-agents",
  "knowledge-assistant-lab","ki-it-security","prompt-engineering",
  "it-projektmanagement-ai-delivery","prozessanalyse-automation","data-literacy","ai-customer-service",
 ];
 assert.equal(allProgramPages.length,23);
 for(const slug of allProgramPages){
  const html=read(`academy/${slug}/index.html`);
  assert.match(html,/<body class="progDetailPage">/,`${slug} missing progDetailPage class`);
  assert.match(html,/<figure class="heroMedia">/,`${slug} missing heroMedia figure`);
 }
});
