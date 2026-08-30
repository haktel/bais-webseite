import test from"node:test";import assert from"node:assert/strict";
import{checkDataClassification}from"../functions/api/kif-module-04.js";

test("a text with no personal-data markers is rated 'unbedenklich'",()=>{
 const result=checkDataClassification("Erstelle eine allgemeine Produktbeschreibung für unseren neuen Newsletter-Anmeldeprozess.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"unbedenklich");
});

test("a text with ordinary personal identifiers is rated 'personenbezogen', not blocked",()=>{
 const result=checkDataClassification("Fasse die Kundenanfrage von Herrn Weber (Kundennummer 88213, geboren am 3. Mai 1985) zusammen.");
 assert.equal(result.ok,true);
 assert.equal(result.status,200);
 assert.equal(result.route,"personenbezogen");
});

test("a text with an Art. 9 DSGVO special category is blocked as 'besondere_kategorie'",()=>{
 const result=checkDataClassification("Erstelle eine interne Notiz zur Schwerbehinderung und den Medikamenten von Frau Klein für die Personalakte.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"besondere_kategorie");
 assert.equal(result.status,422);
});

test("an email address alone is enough to classify as 'personenbezogen'",()=>{
 const result=checkDataClassification("Bitte antworte höflich an kunde.meier@example.com bezüglich der Lieferverzögerung.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"personenbezogen");
});

test("a special category takes precedence even alongside ordinary personal data",()=>{
 const result=checkDataClassification("Kundennummer 88213: Diagnose und laufende Medikamente bitte zusammenfassen.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"besondere_kategorie");
});

test("an empty text is rejected",()=>{
 const result=checkDataClassification("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});
