import test from"node:test";import assert from"node:assert/strict";
import{checkCitation}from"../functions/api/kif-module-05.js";

test("a claim with a concrete author+year citation is rated 'belegt'",()=>{
 const result=checkCitation("Laut einer Analyse von Müller et al. (2021) stieg die Konversionsrate im untersuchten Zeitraum um rund 12 %.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"belegt");
 assert.equal(result.checks.hatZitat,true);
});

test("a parenthetical (Autor, Jahr) citation is also recognized as 'belegt'",()=>{
 const result=checkCitation("Laut (Schmidt, 2019) verbessert sich die Fehlerquote deutlich.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"belegt");
});

test("a generic 'Studien zeigen' attribution with no concrete claim is rated 'vage', not blocked",()=>{
 const result=checkCitation("Studien zeigen, dass automatisierte Workflows die Bearbeitungszeit deutlich verkürzen.");
 assert.equal(result.ok,true);
 assert.equal(result.status,200);
 assert.equal(result.route,"vage");
});

test("a specific statistic with zero source mention is blocked as 'unbelegt'",()=>{
 const result=checkCitation("Die Fehlerquote liegt bei 3,2 % und ist damit branchenweit die niedrigste.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"unbelegt");
 assert.equal(result.status,422);
});

test("a specific statistic softened by a vague source is rated 'vage', not blocked",()=>{
 const result=checkCitation("Einer Studie zufolge liegt die Fehlerquote bei etwa 3 %.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"vage");
});

test("an empty text is rejected",()=>{
 const result=checkCitation("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});
