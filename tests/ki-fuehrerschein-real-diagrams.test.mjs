import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

// Pilot for the "real diagrams" pass requested by the user: replaces/adds
// content-accurate SVG diagrams (decision tree, concept cluster) on the
// ki-fuehrerschein course, instead of only the simple A->B->C box/arrow
// style. This locks in the specific lessons that were touched and the
// shared JS/CSS infrastructure they depend on.

const decisionTreeLessons=[
 {mod:"modul-01",lesson:"l12",branches:3},
 {mod:"modul-02",lesson:"l2",branches:3},
 {mod:"modul-04",lesson:"l12",branches:3},
 {mod:"modul-05",lesson:"l5",branches:3},
];

for(const{mod,lesson,branches}of decisionTreeLessons){
 test(`academy/ki-fuehrerschein/${mod} lesson ${lesson} has a decisionTree diagram with a root and ${branches} distinct branches`,()=>{
  const html=read(`academy/ki-fuehrerschein/${mod}/index.html`);
  const lessonMatch=html.match(new RegExp(`id="${lesson}"[^>]*data-lesson.*?(?=<article class="lesson"|<section class="liveLab")`,"s"));
  assert.ok(lessonMatch,`${mod} ${lesson}: lesson block not found`);
  const block=lessonMatch[0];
  const treeMatch=block.match(/<div class="decisionTree">.*?<\/div>\s*(?=<details|$)/s)||block.match(/<div class="decisionTree">.*/s);
  assert.ok(treeMatch,`${mod} ${lesson}: .decisionTree markup not found`);
  const tree=treeMatch[0];
  assert.match(tree,/<div class="dtRoot">[^<]+<\/div>/,`${mod} ${lesson}: missing .dtRoot`);
  const branchMatches=[...tree.matchAll(/<div class="dtBranch" data-outcome="(ok|warn|neutral)"><span class="dtCond">([^<]+)<\/span><span class="dtLeaf">([^<]+)<\/span><\/div>/g)];
  assert.equal(branchMatches.length,branches,`${mod} ${lesson}: expected ${branches} .dtBranch entries`);
  const conds=branchMatches.map(m=>m[2]);
  const leafs=branchMatches.map(m=>m[3]);
  assert.equal(new Set(conds).size,conds.length,`${mod} ${lesson}: branch conditions must be distinct`);
  assert.equal(new Set(leafs).size,leafs.length,`${mod} ${lesson}: branch outcomes must be distinct`);
 });
}

test("academy/ki-fuehrerschein/modul-02 lesson l2 no longer has the dead unconverted 3-line miniArchitecture",()=>{
 const html=read("academy/ki-fuehrerschein/modul-02/index.html");
 const lessonMatch=html.match(/id="l2"[^>]*data-lesson.*?(?=<article class="lesson")/s);
 assert.ok(lessonMatch);
 assert.doesNotMatch(lessonMatch[0],/class="miniArchitecture"/,
  "the old multi-line miniArchitecture block (which the JS never converts to SVG) should be replaced by the decisionTree");
});

test("academy/ki-fuehrerschein/modul-03 lesson l1 has a conceptCluster with all 5 real prompt building blocks",()=>{
 const html=read("academy/ki-fuehrerschein/modul-03/index.html");
 const lessonMatch=html.match(/id="l1"[^>]*data-lesson.*?(?=<article class="lesson")/s);
 assert.ok(lessonMatch,"modul-03 l1: lesson block not found");
 const block=lessonMatch[0];
 assert.doesNotMatch(block,/class="visualFlow"/,
  "the old 3-node compressed visualFlow should be replaced by the 5-part conceptCluster");
 const clusterMatch=block.match(/<div class="conceptCluster">.*?<\/div>\s*(?=<details)/s);
 assert.ok(clusterMatch,"modul-03 l1: .conceptCluster markup not found");
 const cluster=clusterMatch[0];
 assert.match(cluster,/<div class="ccCenter">Präziser Prompt<\/div>/);
 const parts=[...cluster.matchAll(/<div class="ccPart">([^<]+)<\/div>/g)].map(m=>m[1]);
 assert.deepEqual(parts.sort(),["Aufgabe","Einschränkung","Format","Kontext","Rolle"].sort());
});

test("n8n-diagram-enhance.js defines the decisionTree and conceptCluster enhancement hooks",()=>{
 const js=read("assets/n8n-diagram-enhance.js");
 assert.match(js,/function svgTree\(/);
 assert.match(js,/function svgCluster\(/);
 assert.match(js,/querySelectorAll\(".decisionTree"\)/);
 assert.match(js,/querySelectorAll\(".conceptCluster"\)/);
});

test("n8n-diagram-enhance.js gives every diagram's arrow marker a unique id (no duplicate marker ids on a multi-diagram page)",()=>{
 const js=read("assets/n8n-diagram-enhance.js");
 assert.match(js,/let arrowSeq=0/);
 assert.match(js,/arrowDefs\(arrowId\)/);
 // marker id must come from a running counter, not a fixed shared id -
 // occurring 3x confirms svgFlow/svgTree each mint a fresh id per diagram
 const arrowIdAssignments=[...js.matchAll(/const arrowId=`dgArrow\$\{arrowSeq\+\+\}`/g)];
 assert.equal(arrowIdAssignments.length,2,"expected svgFlow and svgTree to each mint a per-diagram marker id");
});

test("n8n-module-study.css defines fallback and SVG styles for decisionTree and conceptCluster",()=>{
 const css=read("assets/n8n-module-study.css");
 for(const selector of[".decisionTree",".dtRoot",".dtBranch",".dtCond",".dtLeaf",".conceptCluster",".ccCenter",".ccPart"]){
  assert.ok(css.includes(selector),`missing CSS for ${selector}`);
 }
 // duplicate selector rules are a real bug (last-wins, easy to introduce
 // while extending a file in multiple edits) - lock in there is only one
 const dgEnhancedRule=[...css.matchAll(/\.decisionTree\.dgEnhanced,\.conceptCluster\.dgEnhanced/g)];
 assert.equal(dgEnhancedRule.length,1,"the .decisionTree.dgEnhanced,.conceptCluster.dgEnhanced rule must appear exactly once");
});

test("all 5 pilot pages load the bumped n8n-diagram-enhance.js and n8n-module-study.css versions",()=>{
 for(const mod of["modul-01","modul-02","modul-03","modul-04","modul-05"]){
  const html=read(`academy/ki-fuehrerschein/${mod}/index.html`);
  assert.match(html,/n8n-diagram-enhance\.js\?v=1\.4/,`${mod}: stale diagram-enhance version`);
  assert.match(html,/n8n-module-study\.css\?v=1\.8/,`${mod}: stale module-study CSS version`);
 }
});
