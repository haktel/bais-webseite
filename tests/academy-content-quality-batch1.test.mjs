import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

// These 12 top-level Academy program pages previously repeated the exact same
// three placeholder sentences across their ZIELGRUPPE, LERNZIELE and CURRICULUM
// cards (e.g. all 4 role cards on one page shared one identical sentence).
// This locks in the fix: none of the generic filler may reappear on these pages.
const fixedPages=[
 "ai-coding","ai-governance","api-integration","caio-masterguide","data-literacy",
 "enterprise-tools","eu-ai-act","ki-fuehrerschein","ki-it-security","ki-leadership",
 "knowledge-assistant-lab","prompt-engineering",
];

const FILLERS=[
 "Rollenbezogene Aufgaben, Entscheidungen und Verantwortlichkeiten stehen im Mittelpunkt.",
 "Praxisorientierte Vertiefung mit Übungen, Reflexion und direktem Bezug zum Unternehmensalltag.",
 "Inhalt, Methode und Transfer werden auf Zielgruppe und vorhandene Systeme abgestimmt.",
];

for(const slug of fixedPages){
 test(`academy/${slug} no longer repeats generic placeholder text on ZIELGRUPPE/LERNZIELE/CURRICULUM cards`,()=>{
  const html=read(`academy/${slug}/index.html`);
  for(const filler of FILLERS){
   assert.doesNotMatch(html,new RegExp(filler.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),
    `${slug} should not contain the generic filler: "${filler}"`);
  }
 });
}

test("within each fixed page, the 4 ZIELGRUPPE role-card descriptions are all distinct",()=>{
 for(const slug of fixedPages){
  const html=read(`academy/${slug}/index.html`);
  const m=html.match(/<div class="ey">ZIELGRUPPE<\/div>.*?<\/div><\/div><\/section>/s);
  assert.ok(m,`${slug}: ZIELGRUPPE section not found`);
  const paras=[...m[0].matchAll(/<h2>[^<]+<\/h2><p>([^<]+)<\/p>/g)].map(x=>x[1]);
  assert.equal(paras.length,4,`${slug}: expected 4 role descriptions`);
  assert.equal(new Set(paras).size,4,`${slug}: role descriptions must all be unique, found duplicates`);
 }
});

test("within each fixed page, the 4 LERNZIELE descriptions are all distinct",()=>{
 for(const slug of fixedPages){
  const html=read(`academy/${slug}/index.html`);
  const m=html.match(/<div class="ey">LERNZIELE<\/div>.*?<\/div><\/div><\/section>/s);
  assert.ok(m,`${slug}: LERNZIELE section not found`);
  const paras=[...m[0].matchAll(/<h2>[^<]+<\/h2><p>([^<]+)<\/p>/g)].map(x=>x[1]);
  assert.equal(paras.length,4,`${slug}: expected 4 learning-objective descriptions`);
  assert.equal(new Set(paras).size,4,`${slug}: learning-objective descriptions must all be unique, found duplicates`);
 }
});
