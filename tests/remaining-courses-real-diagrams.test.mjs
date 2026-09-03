import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

// Third batch in the "real diagrams" pass (after ki-fuehrerschein #166 and
// secure-ai-rag #167): the three remaining weak courses -
// ki-it-security, ki-leadership, eu-ai-act. All three already had
// n8n-diagram-enhance.js loaded (fixed for 6 courses at once in #168), so
// this batch only adds new decisionTree/conceptCluster/visualFlow markup
// matched to each lesson's actual content.

// Each diagram block is emitted as a single line with no internal
// newlines, so "up to the next literal newline" reliably bounds the whole
// block (concept clusters have no nested <div> that is itself followed by
// a newline).
function extractBlock(html,lessonId,cssClass){
 const lessonMatch=html.match(new RegExp(`id="${lessonId}"[^>]*data-lesson.*?(?=<article class="lesson"|<section class="soft")`,"s"));
 assert.ok(lessonMatch,`${lessonId}: lesson block not found`);
 const block=lessonMatch[0];
 const diagramMatch=block.match(new RegExp(`<div class="${cssClass}">[\\s\\S]*?</div>\\n`));
 assert.ok(diagramMatch,`${lessonId}: .${cssClass} markup not found`);
 return diagramMatch[0];
}

const conceptClusterLessons=[
 {course:"ki-it-security",mod:"modul-01",lesson:"l3",center:"Bereitstellungsmodell",parts:["Consumer-SaaS","Business-/API-Vertrag","Self-hosted"]},
 {course:"ki-it-security",mod:"modul-03",lesson:"l6",center:"Mehrschichtiger Schutz",parts:["Eingabe","Verarbeitung","Ausgabe","Erkennung"]},
 {course:"ki-it-security",mod:"modul-04",lesson:"l2",center:"Anbieterprüfung",parts:["Datenverarbeitungsort","Trainingsnutzung","AVV/DPA"]},
 {course:"ki-it-security",mod:"modul-05",lesson:"l3",center:"Sicherheitstests",parts:["Direkte Injection","Indirekte Injection","Vertrauliche Daten","Toxizität"]},
 {course:"ki-leadership",mod:"modul-02",lesson:"l4",center:"Risikoarten",parts:["Rechtlich","Operativ","Reputativ"]},
 {course:"ki-leadership",mod:"modul-03",lesson:"l2",center:"AI-Betriebsmodell",parts:["AI/Product Owner","Data Steward","Risk &amp; Compliance Reviewer","Security","End-User Champion"]},
 {course:"ki-leadership",mod:"modul-05",lesson:"l2",center:"Unterschätzte Ressourcen",parts:["Budget","Fachexpertise","Führungsaufmerksamkeit"]},
 {course:"eu-ai-act",mod:"modul-02",lesson:"l4",center:"Pflichten in der Lieferkette",parts:["Provider","Importeur/Händler","Deployer"]},
 {course:"eu-ai-act",mod:"modul-03",lesson:"l2",center:"Hochrisiko-Bereiche",parts:["Biometrie","Kritische Infrastruktur","Bildung","Beschäftigung","Essenzielle Dienste","Strafverfolgung","Migration &amp; Grenzkontrolle","Rechtspflege &amp; Demokratie"]},
 {course:"eu-ai-act",mod:"modul-04",lesson:"l2",center:"AI-Literacy je Rolle",parts:["Mitarbeitende","Führungskräfte","Fachbereiche","Compliance"]},
 {course:"eu-ai-act",mod:"modul-05",lesson:"l1",center:"Pflichtdokumentation",parts:["Technische Dokumentation","Risikomanagement-Nachweis","Konformitätsbewertung","Betriebsanleitung"]},
 {course:"eu-ai-act",mod:"modul-06",lesson:"l2",center:"Eskalations-Trigger",parts:["Annex-III-Bereich berührt","Auffällige Muster","Fehlende Dokumentation","Beschwerde"]},
];

for(const{course,mod,lesson,center,parts}of conceptClusterLessons){
 test(`academy/${course}/${mod} lesson ${lesson} has a conceptCluster with ${parts.length} correct parts`,()=>{
  const html=read(`academy/${course}/${mod}/index.html`);
  const cluster=extractBlock(html,lesson,"conceptCluster");
  assert.match(cluster,new RegExp(`<div class="ccCenter">${center.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}</div>`));
  const foundParts=[...cluster.matchAll(/<div class="ccPart">([^<]+)<\/div>/g)].map(m=>m[1]);
  assert.deepEqual(foundParts.sort(),[...parts].sort(),`${course}/${mod} ${lesson}: unexpected part set`);
 });
}

// Annex III is explicitly the 8-part cluster that motivated the svgCluster()
// scaling fix (fixed radius/canvas would overlap once a cluster grows past
// ~5 short-label parts). Verify the part count directly, not just the set.
test("academy/eu-ai-act/modul-03 lesson l2 (Annex III) cluster has exactly 8 parts",()=>{
 const html=read("academy/eu-ai-act/modul-03/index.html");
 const cluster=extractBlock(html,"l2","conceptCluster");
 const foundParts=[...cluster.matchAll(/<div class="ccPart">/g)];
 assert.equal(foundParts.length,8);
});

const decisionTreeLessons=[
 {course:"ki-it-security",mod:"modul-02",lesson:"l2",branchCount:2,mustInclude:["warn","ok"]},
 {course:"ki-leadership",mod:"modul-04",lesson:"l2",branchCount:3,mustInclude:["ok","neutral","warn"]},
 {course:"ki-leadership",mod:"modul-06",lesson:"l2",branchCount:2,mustInclude:["ok","neutral"]},
 {course:"eu-ai-act",mod:"modul-01",lesson:"l6",branchCount:3,mustInclude:["warn","neutral"]},
];

for(const{course,mod,lesson,branchCount,mustInclude}of decisionTreeLessons){
 test(`academy/${course}/${mod} lesson ${lesson} has a decisionTree with ${branchCount} branches`,()=>{
  const html=read(`academy/${course}/${mod}/index.html`);
  const tree=extractBlock(html,lesson,"decisionTree");
  assert.match(tree,/<div class="dtRoot">[^<]+<\/div>/);
  const branches=[...tree.matchAll(/<div class="dtBranch" data-outcome="(ok|warn|neutral)">/g)];
  assert.equal(branches.length,branchCount,`${course}/${mod} ${lesson}: unexpected branch count`);
  for(const outcome of mustInclude){
   assert.ok(tree.includes(`data-outcome="${outcome}"`),`${course}/${mod} ${lesson}: missing expected outcome "${outcome}"`);
  }
 });
}

const visualFlowLessons=[
 {course:"ki-it-security",mod:"modul-06",lesson:"l2",nodes:["Erkennen","Eindämmen","Untersuchen","Beheben","Nachbereiten"]},
 {course:"ki-leadership",mod:"modul-01",lesson:"l2",nodes:["Exploration","Pilot","Skalierung","Regelbetrieb"]},
];

for(const{course,mod,lesson,nodes}of visualFlowLessons){
 test(`academy/${course}/${mod} lesson ${lesson} has a visualFlow with the ${nodes.length} sequential stages in order`,()=>{
  const html=read(`academy/${course}/${mod}/index.html`);
  const flow=extractBlock(html,lesson,"visualFlow");
  const foundNodes=[...flow.matchAll(/<div class="vfNode">([^<]+)<\/div>/g)].map(m=>m[1]);
  assert.deepEqual(foundNodes,nodes,`${course}/${mod} ${lesson}: stages must stay in their sequential order`);
 });
}

test("all 18 target module pages still load n8n-diagram-enhance.js and current module-study CSS",()=>{
 const pages=[
  "ki-it-security/modul-01","ki-it-security/modul-02","ki-it-security/modul-03",
  "ki-it-security/modul-04","ki-it-security/modul-05","ki-it-security/modul-06",
  "ki-leadership/modul-01","ki-leadership/modul-02","ki-leadership/modul-03",
  "ki-leadership/modul-04","ki-leadership/modul-05","ki-leadership/modul-06",
  "eu-ai-act/modul-01","eu-ai-act/modul-02","eu-ai-act/modul-03",
  "eu-ai-act/modul-04","eu-ai-act/modul-05","eu-ai-act/modul-06",
 ];
 for(const page of pages){
  const html=read(`academy/${page}/index.html`);
  assert.match(html,/n8n-diagram-enhance\.js\?v=1\.4/,`${page}: missing n8n-diagram-enhance.js`);
  assert.match(html,/n8n-module-study\.css\?v=1\.8/,`${page}: stale module-study CSS version`);
 }
});
