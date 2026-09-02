import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const pages=[
 {slug:"ki-fuehrerschein",img:"ki-fuehrerschein-v1"},
 {slug:"n8n-bootcamp",img:"n8n-bootcamp-v1"},
 {slug:"secure-ai-rag",img:"secure-ai-rag-v1"},
 {slug:"caio-masterguide",img:"caio-masterguide-v1"},
 {slug:"ai-for-sales",img:"ai-for-sales-v1"},
 {slug:"ai-coding",img:"ai-coding-v1"},
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

test("progDetailPage heroGrid two-column layout exists in the shared design system CSS",()=>{
 const css=read("assets/bais-design-system.css");
 assert.match(css,/\.progDetailPage \.heroGrid\{grid-template-columns:minmax\(0,1\.05fr\) minmax\(340px,\.95fr\)/);
 assert.match(css,/@media\(max-width:980px\)\{\.progDetailPage \.heroGrid\{grid-template-columns:1fr\}\}/);
});

test("all pages reference the cache-busted bais-design-system.css",()=>{
 const html=read("academy/index.html");
 assert.match(html,/bais-design-system\.css\?v=1\.1/);
 assert.doesNotMatch(html,/bais-design-system\.css\?v=1\.0/);
});

test("the 6 program detail hero visual files exist and are non-trivial embedded images",()=>{
 for(const {img} of pages){
  const svg=read(`assets/visuals/${img}.svg`);
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/data:image\/webp;base64,/);
  assert.ok(svg.length>20000,`${img}.svg should embed a real image, not a stub`);
 }
});

test("progDetailPage hero h1 wraps long unhyphenated German compounds instead of overflowing behind the image",()=>{
 // e.g. "Softwareentwicklung" has no space to break at, and the text column is
 // narrower than the generic .hero h1 max-width once the heroMedia image sits beside it.
 const css=read("assets/bais-design-system.css");
 assert.match(css,/\.progDetailPage \.hero h1\{[^}]*overflow-wrap:break-word/);
 assert.match(css,/\.progDetailPage \.hero h1\{[^}]*max-width:none/);
});
