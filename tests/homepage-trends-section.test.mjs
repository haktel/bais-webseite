import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("homepage includes the KI-Arbeitsmarkt trends section with three role cards",()=>{
 const html=read("index.html");
 assert.match(html,/class="sec dark trendsSection"/);
 assert.match(html,/<h3>KI-Trainer<\/h3>/);
 assert.match(html,/<h3>KI-Softwareentwickler<\/h3>/);
 assert.match(html,/<h3>KI-Automatisierungsexperte<\/h3>/);
 const cardCount=(html.match(/class="trendCard reveal"/g)||[]).length;
 assert.equal(cardCount,3);
});

test("homepage trend cards link directly to the real Academy program pages",()=>{
 const home=read("index.html");
 const kiFuehrerschein=read("academy/ki-fuehrerschein/index.html");
 const aiCoding=read("academy/ai-coding/index.html");
 const n8n=read("academy/n8n-bootcamp/index.html");
 assert.match(home,/href="academy\/ki-fuehrerschein\/"/);
 assert.match(home,/href="academy\/ai-coding\/"/);
 assert.match(home,/href="academy\/n8n-bootcamp\/"/);
 assert.match(kiFuehrerschein,/rel="canonical" href="https:\/\/bais-solutions\.de\/academy\/ki-fuehrerschein\/"/);
 assert.match(aiCoding,/rel="canonical" href="https:\/\/bais-solutions\.de\/academy\/ai-coding\/"/);
 assert.match(n8n,/rel="canonical" href="https:\/\/bais-solutions\.de\/academy\/n8n-bootcamp\/"/);
});

test("homepage trend cards cite real, named sources",()=>{
 const html=read("index.html");
 assert.match(html,/trendSources/);
 assert.match(html,/weforum\.org\/stories\/2025\/01\/future-of-jobs-report-2025/);
 assert.match(html,/LinkedIn „Jobs on the Rise" 2026/);
 assert.doesNotMatch(html,/laut Studien belegt/);
});

test("trendsSection styling exists in site.css",()=>{
 const css=read("assets/site.css");
 assert.match(css,/\.trendsSection\{/);
 assert.match(css,/\.trendGrid\{/);
 assert.match(css,/\.trendCard\{/);
 assert.match(css,/\.trendMedia\{/);
});

test("homepage trend cards each render an AI-generated visual with descriptive alt text",()=>{
 const html=read("index.html");
 assert.match(html,/trendMedia"><img src="assets\/visuals\/ki-trainer-v1\.svg"[^>]*alt="[^"]{20,}"/);
 assert.match(html,/trendMedia"><img src="assets\/visuals\/ki-softwareentwickler-v1\.svg"[^>]*alt="[^"]{20,}"/);
 assert.match(html,/trendMedia"><img src="assets\/visuals\/ki-automatisierung-v1\.svg"[^>]*alt="[^"]{20,}"/);
});

test("trend visual files exist and are non-trivial embedded images",()=>{
 for(const file of["ki-trainer-v1.svg","ki-softwareentwickler-v1.svg","ki-automatisierung-v1.svg"]){
  const svg=read(`assets/visuals/${file}`);
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/data:image\/webp;base64,/);
  assert.ok(svg.length>20000,`${file} should embed a real image, not a stub`);
 }
});

test("trend cards keep readable colors and safe word-wrap on the dark section",()=>{
 const css=read("assets/site.css");
 // h3 sits on a white card inside a .dark (color:#fff) section - must not inherit white-on-white.
 assert.match(css,/\.trendCard h3\{color:var\(--ink\)/);
 // Long unhyphenated German compounds (e.g. "Softwareentwickler") must wrap instead of overflowing the card.
 assert.match(css,/\.trendCard h3\{[^}]*overflow-wrap:break-word/);
});
