import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const gridPages=[
 {slug:"loesungen",img:"loesungen-v1"},
 {slug:"ai-governance",img:"ai-governance-main-v1"},
 {slug:"ueber-bais",img:"ueber-bais-v1"},
 {slug:"kontakt",img:"kontakt-v1"},
 {slug:"preise",img:"preise-v1"},
 {slug:"projektablauf",img:"projektablauf-v1"},
];

for(const {slug,img} of gridPages){
 test(`${slug} hero renders a real visual, not just text`,()=>{
  const html=read(`${slug}/index.html`);
  assert.match(html,/<body class="mainHeroPage">/);
  const re=new RegExp(`<figure class="heroMedia"><img src="\\.\\./assets/visuals/${img}\\.svg" width="1200" height="675" alt="[^"]{20,}"`);
  assert.match(html,re);
  assert.match(html,/<figcaption><span><i><\/i> BAIS<\/span><b>[^<]+<\/b><\/figcaption><\/figure>/);
 });
}

test("referenzen hero renders a real visual alongside its existing intro/aside layout",()=>{
 const html=read("referenzen/index.html");
 assert.match(html,/<body class="mainHeroPage">/);
 assert.match(html,/<figure class="heroMedia"><img src="\.\.\/assets\/visuals\/referenzen-v1\.svg" width="1200" height="675" alt="[^"]{20,}"/);
 // the existing "what is a demo" explanatory aside must survive untouched
 assert.match(html,/<aside class="refIntroAside">/);
});

test("mainHeroPage heroGrid two-column layout + h1 overflow fix exist in the shared design system CSS",()=>{
 const css=read("assets/bais-design-system.css");
 assert.match(css,/\.mainHeroPage \.heroGrid\{grid-template-columns:minmax\(0,1\.05fr\) minmax\(340px,\.95fr\)/);
 assert.match(css,/@media\(max-width:980px\)\{\.mainHeroPage \.heroGrid\{grid-template-columns:1fr\}\}/);
 assert.match(css,/\.mainHeroPage \.hero h1\{[^}]*overflow-wrap:break-word/);
});

test("the 7 main-page hero visual files exist and are non-trivial embedded images",()=>{
 const allImgs=[...gridPages.map(p=>p.img),"referenzen-v1"];
 for(const img of allImgs){
  const svg=read(`assets/visuals/${img}.svg`);
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/data:image\/webp;base64,/);
  assert.ok(svg.length>20000,`${img}.svg should embed a real image, not a stub`);
 }
});
