import test from"node:test";import assert from"node:assert/strict";
import{checkOutput}from"../functions/api/kif-module-02.js";

test("a hedged, sourced text is rated 'verlaesslich'",()=>{
 const result=checkOutput("Laut den mir vorliegenden Informationen könnte die Umsatzsteigerung bei etwa 8-10 % liegen; das solltest du vor der Veröffentlichung mit den aktuellen Quartalszahlen abgleichen.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"verlaesslich");
 assert.equal(result.checks.hatQuelleOderVorbehalt,true);
});

test("a precise, unsourced statistic without a hedge is rated 'pruefen', not blocked",()=>{
 const result=checkOutput("Die Konversionsrate liegt bei 34,7 % und ist branchenweit der Höchstwert.");
 assert.equal(result.ok,true);
 assert.equal(result.status,200);
 assert.equal(result.route,"pruefen");
 assert.equal(result.checks.unbelegteZahlOderJahr,true);
});

test("absolute-certainty language combined with an unsourced statistic is blocked as 'kritisch'",()=>{
 const result=checkOutput("Das ist zu 100% korrekt und garantiert der offizielle Rekordwert von 2019 mit 47,8 Millionen verkauften Einheiten.");
 assert.equal(result.ok,false);
 assert.equal(result.route,"kritisch");
 assert.equal(result.status,422);
});

test("absolute-certainty language alone (no specific claim) is rated 'pruefen', not blocked",()=>{
 const result=checkOutput("Das funktioniert garantiert für jeden Anwendungsfall in deinem Team.");
 assert.equal(result.ok,true);
 assert.equal(result.route,"pruefen");
 assert.equal(result.checks.ueberzogeneSicherheit,true);
 assert.equal(result.checks.unbelegteZahlOderJahr,false);
});

test("an empty text is rejected",()=>{
 const result=checkOutput("   ");
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});

test("a text over 4000 characters is rejected",()=>{
 const result=checkOutput("a".repeat(4001));
 assert.equal(result.ok,false);
 assert.equal(result.status,422);
});
