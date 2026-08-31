import test from"node:test";import assert from"node:assert/strict";import{buildLeadPayload,deriveLeadSignals,mapLeadResult}from"../functions/_lib/n8n.js";

test("buildLeadPayload minimizes contact identifiers before n8n",()=>{
 const payload=buildLeadPayload({name:"Jane Doe",email:"jane@example.com",company:"ACME GmbH",topic:"Automation / n8n",message:"Hallo Jane, bitte API und Webhook Automation für ACME. Rückruf 0231 123456."});
 assert.equal(payload.name,"BAIS Lead Signal");
 assert.equal(payload.email,"privacy-minimized@bais.invalid");
 assert.equal(payload.company,"Nicht an n8n übermittelt");
 assert.equal(payload.topic,"Automation / n8n");
 assert.equal(payload.consent,true);
 assert.doesNotMatch(payload.message,/Jane Doe|jane@example\.com|ACME GmbH|0231 123456/i);
 assert.match(payload.message,/automation/i);
 assert.match(payload.message,/api/i);
 assert.match(payload.message,/webhook/i);
});

test("buildLeadPayload never forwards free-text message content",()=>{
 const secretPhrase="Kundengeheimnis ALPHA-9371";
 const payload=buildLeadPayload({topic:"Cybersecurity",message:`Bitte prüfen: ${secretPhrase}. Firewall und Incident.`});
 assert.doesNotMatch(payload.message,/ALPHA-9371|Kundengeheimnis/i);
 assert.match(payload.message,/cybersecurity/i);
 assert.match(payload.message,/incident/i);
 assert.match(payload.message,/network/i);
});

test("deriveLeadSignals exposes only allow-listed business metadata",()=>{
 const derived=deriveLeadSignals("Wir brauchen RAG, n8n, Monitoring und ISO 27001. Max Mustermann max@example.com");
 assert.deepEqual(derived.signals,["n8n","rag","monitoring","iso27001"]);
 assert.equal(derived.messageLength,"Wir brauchen RAG, n8n, Monitoring und ISO 27001. Max Mustermann max@example.com".length);
});

test("buildLeadPayload fills safe defaults for sparse submissions",()=>{
 const payload=buildLeadPayload({message:"Allgemeine Anfrage"});
 assert.equal(payload.company,"Nicht an n8n übermittelt");
 assert.equal(payload.topic,"Sonstiges");
 assert.match(payload.message,/Business signals: general/);
});

test("mapLeadResult extracts score, route and execution id from a successful n8n response",()=>{
 const mapped=mapLeadResult({ok:true,execution:10432,leadId:"BAIS-1",score:85,route:"priority-review",nextAction:"Human review",audit:{status:"completed"}});
 assert.deepEqual(mapped,{score:85,route:"priority-review",executionId:"10432"});
});

test("mapLeadResult returns null for a failed or malformed response",()=>{
 assert.equal(mapLeadResult({ok:false,error:"VALIDATION_ERROR"}),null);
 assert.equal(mapLeadResult(null),null);
 assert.equal(mapLeadResult(undefined),null);
});
