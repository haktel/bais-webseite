import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

const visualPattern=/class="(?:caseFlow|workflowMini|miniArchitecture|decisionTree|codeCompare|depthTable|productionPyramid|courseMap|lessonGrid|realCase|failureTaxonomy|retryDecision|backoffVisual|monitorGrid|recoverySteps|dbModel|crudGrid|upsertVisual|schemaDiagram|dedupeFlow|stateChoice|fileFormats|binaryMental|documentPipeline|ragPipeline|chunkVisual|vectorVisual|groundingCompare|toolBoundary|modularityCompare|contractDiagram|orchestratorMap|threatMap|trustBoundary|webhookSecurity|ssrFMap|rbacGrid)"/;

test("all 12 n8n modules keep real-world depth in every lesson",async()=>{
 for(let module=1;module<=12;module++){
  const n=String(module).padStart(2,"0");
  const html=await readFile("academy/n8n-bootcamp/modul-"+n+"/index.html","utf8");
  const blocks=[...html.matchAll(/<article class="lesson" id="l(\d+)"[\s\S]*?(?=<article class="lesson"|<section class="liveLab")/g)];
  assert.equal(blocks.length,12,"modul-"+n+" must contain exactly 12 lessons");

  let totalChars=0;
  for(const match of blocks){
   const lesson=match[1],block=match[0];
   totalChars+=block.length;
   assert.match(block,/class="realCase"/,"modul-"+n+" lesson "+lesson+" needs a real production case");
   assert.match(block,/https:\/\/n8n\.io\/case-studies\//,"modul-"+n+" lesson "+lesson+" needs an official n8n case-study source");
   assert.match(block,visualPattern,"modul-"+n+" lesson "+lesson+" needs a visual learning aid");
   assert.ok(block.length>=1450,"modul-"+n+" lesson "+lesson+" is too shallow ("+block.length+" chars)");
  }
  assert.ok(totalChars/12>=2000,"modul-"+n+" average lesson depth must stay >= 2000 chars");
 }
});
