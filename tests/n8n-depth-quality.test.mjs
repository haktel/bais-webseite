import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

const visualClassPattern=/class="[^"]*(?:visual|grid|flow|diagram|map|compare|timeline|model|tree|pyramid|architecture|pipeline)[^"]*"/i;

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
      assert.match(
        lesson,
        visualClassPattern,
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
  assert.match(study,/applyMasteryEvidence/);
  assert.match(study,/input\.disabled=true/);
  assert.match(study,/applyNextModuleGate/);
  assert.match(landing,/sequenceLocked/);
  assert.match(progress,/assertN8nSequence/);
  assert.match(progress,/lesson_open/);
  assert.match(progress,/lesson_evidence_too_short/);
  assert.match(progress,/N8N_MIN_LESSON_SECONDS=45/);
  assert.match(progress,/firstIncompletePriorN8nModule/);
  assert.match(routeGuard,/firstIncompletePriorN8nModule/);
});


test("all n8n modules load the automatic mastery gate asset",async()=>{
  for(let i=1;i<=12;i++){
    const n=String(i).padStart(2,"0");
    const html=await readFile("academy/n8n-bootcamp/modul-"+n+"/index.html","utf8");
    assert.match(html,/n8n-module-study\.js\?v=2\.0/,"modul-"+n+" must load n8n study v1.8");
    assert.match(html,/class="teachList"/,"modul-"+n+" must retain the evidence checklist");
  }
});


test("n8n lessons require server-backed lesson evidence before completion",async()=>{
  const study=await readFile("assets/n8n-module-study.js","utf8");
  const progress=await readFile("functions/api/academy/module-progress.js","utf8");
  const auth=await readFile("functions/_lib/auth.js","utf8");
  assert.match(study,/event:"lesson_open"/);
  assert.match(study,/MIN_READ_SECONDS=50/);
  assert.match(progress,/academy_lesson_sessions/);
  assert.match(progress,/N8N_MIN_LESSON_SECONDS=45/);
  assert.match(progress,/lesson_evidence_too_short/);
  assert.match(auth,/CREATE TABLE IF NOT EXISTS academy_lesson_sessions/);
});
