import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("every Academy module card on the index page has a call-to-action link",()=>{
 const html=read("academy/index.html");
 const cards=html.match(/<article class="card"[^]*?<\/article>/g)||[];
 assert.ok(cards.length>=25,"expected at least 25 module cards on the Academy index page");
 for(const card of cards){
  const idMatch=card.match(/id="([^"]+)"/);
  const id=idMatch?idMatch[1]:"(no id)";
  assert.match(card,/<p><a href="[^"]+">[^<]+→<\/a><\/p><\/article>$/,`card "${id}" is missing a trailing call-to-action link`);
 }
});

test("format/deliverable cards without a dedicated program page link to Kontakt instead",()=>{
 const html=read("academy/index.html");
 for(const id of["impuls","workshop","bootcamp","role-program","learning-assets","assessment"]){
  const card=html.match(new RegExp(`<article class="card" id="${id}"[^]*?<\\/article>`));
  assert.ok(card,`card #${id} not found`);
  assert.match(card[0],/href="\.\.\/kontakt\/index\.html"/,`card #${id} should link to Kontakt`);
 }
});
