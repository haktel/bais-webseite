import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

// Second course in the "real diagrams" pass (after ki-fuehrerschein):
// secure-ai-rag was the weakest course by diagram density. This also fixes
// a bigger underlying gap: none of the secure-ai-rag pages loaded
// n8n-diagram-enhance.js at all, so its existing .visualFlow lessons were
// silently rendering as flat CSS boxes, never as real SVG diagrams.

const conceptClusterLessons=[
 {mod:"modul-01",lesson:"l3",center:"Query Transformation",parts:["Query Rewriting","Multi-Query","HyDE"]},
 {mod:"modul-02",lesson:"l2",center:"Chunk-Strategie",parts:["Fixed-Size","Semantic","Overlap"]},
 {mod:"modul-03",lesson:"l2",center:"Zugriffsmodelle",parts:["ACL","RBAC","ABAC"]},
 {mod:"modul-05",lesson:"l4",center:"RAGAS",parts:["Faithfulness","Response Relevancy","Context Precision","Context Recall"]},
 {mod:"modul-06",lesson:"l4",center:"Laufender Betrieb",parts:["Antwortqualität","Kosten","Latenz"]},
];

for(const{mod,lesson,center,parts}of conceptClusterLessons){
 test(`academy/secure-ai-rag/${mod} lesson ${lesson} has a conceptCluster with ${parts.length} correct parts`,()=>{
  const html=read(`academy/secure-ai-rag/${mod}/index.html`);
  const lessonMatch=html.match(new RegExp(`id="${lesson}"[^>]*data-lesson.*?(?=<article class="lesson"|<section class="soft")`,"s"));
  assert.ok(lessonMatch,`${mod} ${lesson}: lesson block not found`);
  const block=lessonMatch[0];
  const clusterMatch=block.match(/<div class="conceptCluster">.*?<\/div>\s*(?=<details)/s);
  assert.ok(clusterMatch,`${mod} ${lesson}: .conceptCluster markup not found`);
  const cluster=clusterMatch[0];
  assert.match(cluster,new RegExp(`<div class="ccCenter">${center.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}</div>`));
  const foundParts=[...cluster.matchAll(/<div class="ccPart">([^<]+)<\/div>/g)].map(m=>m[1]);
  assert.deepEqual(foundParts.sort(),[...parts].sort(),`${mod} ${lesson}: unexpected part set`);
 });
}

test("academy/secure-ai-rag/modul-04 lesson l1 has a decisionTree for direct vs. indirect injection",()=>{
 const html=read("academy/secure-ai-rag/modul-04/index.html");
 const lessonMatch=html.match(/id="l1"[^>]*data-lesson.*?(?=<article class="lesson")/s);
 assert.ok(lessonMatch,"modul-04 l1: lesson block not found");
 const block=lessonMatch[0];
 const treeMatch=block.match(/<div class="decisionTree">.*?<\/div>\s*(?=<details)/s);
 assert.ok(treeMatch,"modul-04 l1: .decisionTree markup not found");
 const tree=treeMatch[0];
 assert.match(tree,/<div class="dtRoot">[^<]+<\/div>/);
 const branches=[...tree.matchAll(/<div class="dtBranch" data-outcome="(ok|warn|neutral)">/g)];
 assert.equal(branches.length,2,"expected exactly 2 branches (direct vs. indirect)");
 assert.ok(tree.includes('data-outcome="warn"'),"the indirect-injection branch should be flagged as the higher-risk outcome");
});

test("all 6 secure-ai-rag module pages now load n8n-diagram-enhance.js (previously missing entirely)",()=>{
 for(const mod of["modul-01","modul-02","modul-03","modul-04","modul-05","modul-06"]){
  const html=read(`academy/secure-ai-rag/${mod}/index.html`);
  assert.match(html,/n8n-diagram-enhance\.js\?v=1\.4/,`${mod}: missing n8n-diagram-enhance.js - its .visualFlow/.decisionTree/.conceptCluster markup would never render as SVG`);
  assert.match(html,/n8n-module-study\.css\?v=1\.8/,`${mod}: stale module-study CSS version`);
 }
});
