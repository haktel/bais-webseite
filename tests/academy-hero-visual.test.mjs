import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Academy hero renders a real visual, not just text",()=>{
 const html=read("academy/index.html");
 assert.match(html,/<body class="academyPage">/);
 assert.match(html,/<figure class="heroMedia"><img src="\.\.\/assets\/visuals\/academy-lab-v1\.svg"/);
});

test("academy-visual.css gives the Academy hero a two-column layout for the image",()=>{
 const css=read("assets/academy-visual.css");
 assert.match(css,/\.academyPage \.heroGrid\{grid-template-columns:minmax\(0,1\.05fr\) minmax\(340px,\.95fr\)/);
 assert.match(css,/@media\(max-width:980px\)\{\.academyPage \.heroGrid\{grid-template-columns:1fr\}\}/);
});
