import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

test("module 01 exposes a deep real-world practice workshop",async()=>{
  const page=await readFile("academy/n8n-bootcamp/modul-01/praxiswerkstatt/index.html","utf8");
  const middleware=await readFile("functions/academy/n8n-bootcamp/modul-01/_middleware.js","utf8");
  const css=await readFile("assets/n8n-module-01-praxis.css","utf8");

  for(const company of["Delivery Hero","Stepstone","Vodafone","Formula Bot","System AI"]){
    assert.match(page,new RegExp(company,"i"));
  }
  assert.ok((page.match(/<details>/g)||[]).length>=6,"practice cases need hidden Musterlösungen");
  assert.ok((page.match(/https:\/\/n8n\.io\/case-studies\//g)||[]).length>=5,"real cases need sources");
  assert.ok((page.match(/Break\/Fix/g)||[]).length>=4,"practice workshop needs break/fix exercises");
  assert.match(page,/Solution Architect/);
  assert.match(page,/Acceptance Tests/);
  assert.match(middleware,/praxiswerkstatt/);
  assert.match(middleware,/HTMLRewriter/);
  assert.match(css,/practiceDiagram/);
});
