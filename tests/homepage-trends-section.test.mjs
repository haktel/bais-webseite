import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("homepage includes the KI-Arbeitsmarkt trends section with three role cards",()=>{
 const html=read("index.html");
 assert.match(html,/class="sec trendsSection"/);
 assert.match(html,/<h3>KI-Trainer<\/h3>/);
 assert.match(html,/<h3>KI-Softwareentwickler<\/h3>/);
 assert.match(html,/<h3>KI-Automatisierungsexperte<\/h3>/);
 const cardCount=(html.match(/class="trendCard reveal"/g)||[]).length;
 assert.equal(cardCount,3);
});

test("homepage trend cards link to real Academy anchors",()=>{
 const home=read("index.html");
 const academy=read("academy/index.html");
 assert.match(home,/href="academy\/index\.html#ki-fuehrerschein"/);
 assert.match(home,/href="academy\/index\.html#ai-coding"/);
 assert.match(home,/href="academy\/index\.html#n8n"/);
 assert.match(academy,/id="ki-fuehrerschein"/);
 assert.match(academy,/id="ai-coding"/);
 assert.match(academy,/id="n8n"/);
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
