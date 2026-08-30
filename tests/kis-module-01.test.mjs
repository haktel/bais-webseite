import test from"node:test";import assert from"node:assert/strict";
import{checkDataFlow}from"../functions/api/kis-module-01.js";

test("a fully on-premise, internal data flow is rated 'unkritisch'",()=>{
 const result=checkDataFlow("Ein Chatbot beantwortet intern Fragen zu unserer öffentlichen Produktdokumentation, vollständig on-premise gehostet ohne Internetzugriff.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"unkritisch");
});

test("crossing to a cloud provider without sensitive data is rated 'pruefen', not blocked",()=>{
 const result=checkDataFlow("Wir nutzen einen Cloud-Anbieter, um interne Meeting-Notizen zusammenzufassen.");
 assert.equal(result.ok,true);
 assert.equal(result.status,200);
 assert.equal(result.route,"pruefen");
});

test("sensitive data crossing an external boundary with no mitigation is blocked as 'hochrisiko'",()=>{
 const result=checkDataFlow("Wir senden Kundendaten inklusive Zahlungsdaten an einen externen Cloud-Anbieter zur automatischen Auswertung.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"hochrisiko");
 assert.equal(result.status,422);
});

test("sensitive data crossing an external boundary IS acceptable when a mitigation is stated",()=>{
 const result=checkDataFlow("Wir senden Kundendaten an einen externen, EU-gehosteten Anbieter mit Auftragsverarbeitungsvertrag und Verschlüsselung.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"pruefen");
});

test("regression: inflected German endings (externen, verschlüsselter, Kundendaten) are still detected",()=>{
 const result=checkDataFlow("Die externen Systeme empfangen ausschließlich verschlüsselte Kundendaten.");
 assert.equal(result.checks.externeGrenze,true);
 assert.equal(result.checks.sensibleDaten,true);
 assert.equal(result.checks.mitigationErwaehnt,true);
 assert.equal(result.route,"pruefen");
});

test("an empty scenario is rejected",()=>{
 const result=checkDataFlow("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});
