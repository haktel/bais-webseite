import test from"node:test";
import assert from"node:assert/strict";
import{readFile,access}from"node:fs/promises";

test("n8n bootcamp ships all 12 protected modules, assets and workflows",async()=>{
 for(let i=1;i<=12;i++){
  const n=String(i).padStart(2,"0"),base="academy/n8n-bootcamp/modul-"+n;
  await access(base+"/index.html");
  await access("functions/academy/n8n-bootcamp/modul-"+n+"/_middleware.js");
  if(i===1)await access("assets/n8n-module-study.js");
  else await access("assets/n8n-module-"+n+".js");
  await access("assets/n8n-module-"+n+"-assessment.js");
  await access("automation/n8n/bais-academy-modul-"+n+".json");
  const html=await readFile(base+"/index.html","utf8");
  assert.match(html,/noindex,nofollow/);
  assert.match(html,new RegExp('data-module="modul-'+n+'"'));
 }
});

test("n8n bootcamp final exam is linked from the capstone and landing page",async()=>{
 const capstone=await readFile("academy/n8n-bootcamp/modul-12/index.html","utf8");
 const landing=await readFile("academy/n8n-bootcamp/index.html","utf8");
 const exam=await readFile("academy/n8n-bootcamp/abschlusspruefung/index.html","utf8");
 assert.match(capstone,/\.\.\/abschlusspruefung\//);
 assert.match(landing,/ABSCHLUSSPRÜFUNG · SERVER-SIDE/);
 assert.match(exam,/24 serverseitig zusammengestellte Fragen/);
 await access("functions/academy/n8n-bootcamp/abschlusspruefung/_middleware.js");
 await access("functions/api/academy/n8n-final-exam.js");
});

test("n8n landing page exposes every module exactly as LIVE",async()=>{
 const landing=await readFile("academy/n8n-bootcamp/index.html","utf8");
 for(let i=1;i<=12;i++){
  const label="MODUL "+String(i).padStart(2,"0")+" · LIVE";
  assert.equal(landing.split(label).length-1,1,label+" should occur exactly once");
 }
});
