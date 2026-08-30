import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

test("module 01 every lesson contains a real published case and a visual learning aid",async()=>{
 const html=await readFile("academy/n8n-bootcamp/modul-01/index.html","utf8");
 const blocks=[...html.matchAll(/<article class="lesson" id="l(\d+)"[\s\S]*?(?=<article class="lesson"|<section class="liveLab")/g)];
 assert.equal(blocks.length,12);
 for(const match of blocks){
  const lesson=match[1],block=match[0];
  assert.match(block,/class="realCase"/,"lesson "+lesson+" must include a real case");
  assert.match(block,/https:\/\/n8n\.io\/case-studies\//,"lesson "+lesson+" must cite an official n8n case study");
  assert.match(block,/class="(?:caseFlow|workflowMini|miniArchitecture|decisionTree|codeCompare|depthTable|productionPyramid|courseMap|lessonGrid|realCase)"/,"lesson "+lesson+" must include a visual learning aid");
  assert.ok(block.length>=1800,"lesson "+lesson+" should remain deep enough to teach from");
 }
});

test("module 01 tells learners the mandatory order explicitly",async()=>{
 const html=await readFile("academy/n8n-bootcamp/modul-01/index.html","utf8");
 assert.match(html,/Pflicht-Reihenfolge:<\/strong> Lerneinheit 01 → 12 → Pflicht-Labs → Assessment/);
});
