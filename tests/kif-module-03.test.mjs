import test from"node:test";import assert from"node:assert/strict";
import{checkPromptStructure}from"../functions/api/kif-module-03.js";

test("a prompt with all five building blocks is rated 'vollstaendig'",()=>{
 const result=checkPromptStructure("Antworte als erfahrene Marketing-Managerin. Fasse die drei Kampagnen-Ideen für das Vertriebsteam in einer Tabelle mit maximal 5 Zeilen zusammen. Vermeide Fachjargon.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"vollstaendig");
 assert.equal(result.score,100);
});

test("a prompt with only task and context is rated 'teilweise', not blocked",()=>{
 const result=checkPromptStructure("Fasse die Kampagnen-Ideen für das Team zusammen.");
 assert.equal(result.ok,true);
 assert.equal(result.status,200);
 assert.equal(result.route,"teilweise");
 assert.equal(result.blocks.aufgabe,true);
 assert.equal(result.blocks.kontext,true);
});

test("a bare one-line task with no other building blocks is rejected as 'unzureichend'",()=>{
 const result=checkPromptStructure("Schreib was zu Marketing.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"unzureichend");
 assert.equal(result.status,422);
});

test("an empty prompt is rejected",()=>{
 const result=checkPromptStructure("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});

test("a prompt over 2000 characters is rejected",()=>{
 const result=checkPromptStructure("Schreibe ".repeat(300));
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});
