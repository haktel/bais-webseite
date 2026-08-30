import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

const diagramTokens=[
  "caseFlow","miniArchitecture","barCompare","securityZones","productionPyramid",
  "visualFlow","decisionTree","workflowCanvas","ragPipeline","documentPipeline",
  "contractDiagram","threatMap","dataFlow","processMap","architecture","lessonGrid"
];

test("every n8n module keeps 12 deep lessons with real sourced cases and visual explanations",async()=>{
  for(let i=1;i<=12;i++){
    const n=String(i).padStart(2,"0");
    const html=await readFile("academy/n8n-bootcamp/modul-"+n+"/index.html","utf8");

    const lessonBlocks=[...html.matchAll(/<article class="lesson" id="l(\d+)"[\s\S]*?(?=<article class="lesson"|<section class="liveLab")/g)];
    assert.equal(lessonBlocks.length,12,"modul-"+n+" must keep 12 lessons");

    for(const [index,match] of lessonBlocks.entries()){
      const lesson=match[0];
      assert.match(lesson,/<details>/,"modul-"+n+" lesson "+(index+1)+" needs Vertiefung");
      assert.match(lesson,/class="realCase"/,"modul-"+n+" lesson "+(index+1)+" needs a real-world case");
      assert.match(lesson,/https:\/\//,"modul-"+n+" lesson "+(index+1)+" real-world case needs a source link");
      assert.ok(
        diagramTokens.some(token=>lesson.includes(token)),
        "modul-"+n+" lesson "+(index+1)+" needs at least one visual/diagram component"
      );
    }

    assert.match(html,/class="liveLab"/,"modul-"+n+" needs a live lab");
    assert.match(html,/data-assessment/,"modul-"+n+" needs an assessment");
  }
});

test("module 01 retains the concrete production cases requested for foundational learning",async()=>{
  const html=await readFile("academy/n8n-bootcamp/modul-01/index.html","utf8");
  for(const company of["DELIVERY HERO","VODAFONE","STEPSTONE","TRENDYOL"]){
    assert.match(html,new RegExp("REALER FALL · "+company));
  }
  assert.match(html,/200 Stunden pro Monat/);
  assert.match(html,/2–3 Millionen/);
  assert.match(html,/700\+ aktive/);
  assert.match(html,/5\.000\+/);
});

test("n8n learning sequence remains mandatory in UI and server evidence",async()=>{
  const study=await readFile("assets/n8n-module-study.js","utf8");
  const landing=await readFile("assets/n8n-bootcamp-sequence.js","utf8");
  const progress=await readFile("functions/api/academy/module-progress.js","utf8");
  const routeGuard=await readFile("functions/academy/n8n-bootcamp/_middleware.js","utf8");

  assert.match(study,/nextLesson/);
  assert.match(study,/nextLabCase/);
  assert.match(study,/assessmentUnlocked/);
  assert.match(landing,/sequenceLocked/);
  assert.match(progress,/assertN8nSequence/);
  assert.match(progress,/firstIncompletePriorN8nModule/);
  assert.match(routeGuard,/firstIncompletePriorN8nModule/);
});
