import test from"node:test";import assert from"node:assert/strict";
import{checkPrompt}from"../functions/api/kif-module-01.js";

test("a clear prompt with task, context and format is rated 'gut'",()=>{
 const result=checkPrompt("Fasse die folgenden drei Absätze zu maximal fünf Stichpunkten für eine interne Projektstatus-E-Mail an unser Team zusammen. Ton: sachlich und knapp.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"gut");
 assert.ok(result.score>=70);
});

test("a vague one-line prompt is rated 'verbesserungswuerdig', not blocked",()=>{
 const result=checkPrompt("Schreib mir was zu Marketing.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"verbesserungswuerdig");
 assert.ok(result.score<70);
});

test("a prompt containing an IBAN is blocked regardless of otherwise good phrasing",()=>{
 const result=checkPrompt("Erstelle eine Erinnerungs-E-Mail an unseren Kunden Herrn Meier, IBAN DE89370400440532013000, Kundennummer 88213, dass die Rechnung noch offen ist.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"blockiert");
 assert.equal(result.status,422);
});

test("a prompt containing an email address is blocked",()=>{
 const result=checkPrompt("Antworte höflich auf diese Beschwerde von kunde.meier@example.com bezüglich der Lieferverzögerung.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"blockiert");
});

test("an empty prompt is rejected",()=>{
 const result=checkPrompt("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});

test("a realistic prompt mentioning a phone number is not falsely blocked",()=>{
 // Regression guard: phone-number-shaped digit runs must not trip the
 // sensitive-data check the way a real IBAN or card number should.
 const result=checkPrompt("Formuliere eine freundliche Antwort für einen Kunden, der unter 0231 1378 0434 zurückgerufen werden möchte, im Ton unseres Supports.");
 assert.equal(result.ok,true);
});
