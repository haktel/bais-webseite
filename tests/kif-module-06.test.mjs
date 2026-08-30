import test from"node:test";import assert from"node:assert/strict";
import{checkEscalation}from"../functions/api/kif-module-06.js";

test("a personal, non-sensitive internal draft needs no approval",()=>{
 const result=checkEscalation("Ich habe mir mit KI eine persönliche Gliederung für meine eigenen Meeting-Notizen erstellen lassen.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"keine");
});

test("an internal team-facing newsletter needs a second-person review",()=>{
 const result=checkEscalation("Der interne Team-Newsletter mit einer KI-unterstützten Zusammenfassung soll an die gesamte Abteilung gehen.");
 assert.equal(result.ok,true);
 assert.equal(result.status,200);
 assert.equal(result.route,"team_review");
});

test("external + sensitive topic (legal advice to a customer) is blocked, requiring full sign-off",()=>{
 const result=checkEscalation("Eine KI-generierte Antwort zu einer rechtlichen Frage soll direkt an eine externe Kundin verschickt werden.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"vollfreigabe");
 assert.equal(result.status,422);
});

test("regression: inflected German endings (externe, rechtlichen, Kundinnen) are still detected",()=>{
 const result=checkEscalation("Diese externe Mitteilung zu rechtlichen Themen geht an mehrere Kundinnen.");
 assert.equal(result.checks.extern,true);
 assert.equal(result.checks.sensiblesThema,true);
 assert.equal(result.route,"vollfreigabe");
});

test("an empty scenario is rejected",()=>{
 const result=checkEscalation("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});
