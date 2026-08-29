import test from"node:test";import assert from"node:assert/strict";import{buildLeadPayload,mapLeadResult}from"../functions/_lib/n8n.js";

test("buildLeadPayload fills defaults and forces consent for real submissions",()=>{
 const payload=buildLeadPayload({name:"Jane Doe",email:"jane@example.com",company:"",topic:"",message:"Hallo, wir brauchen Automation."});
 assert.deepEqual(payload,{name:"Jane Doe",email:"jane@example.com",company:"",topic:"Sonstiges",message:"Hallo, wir brauchen Automation.",consent:true});
});

test("buildLeadPayload preserves a provided company and topic",()=>{
 const payload=buildLeadPayload({name:"Jane",email:"jane@example.com",company:"ACME GmbH",topic:"Cybersecurity",message:"Test"});
 assert.equal(payload.company,"ACME GmbH");
 assert.equal(payload.topic,"Cybersecurity");
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
