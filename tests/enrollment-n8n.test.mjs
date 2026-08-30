import test from"node:test";import assert from"node:assert/strict";import{buildLeadPayload}from"../functions/_lib/n8n.js";

test("an enrollment without a company still passes n8n's required-field check",()=>{
 const payload=buildLeadPayload({name:"Max Student",email:"max@example.com",company:"",topic:"n8n Automation Bootcamp",message:"Anmeldung für n8n Automation Bootcamp"});
 assert.equal(payload.company,"Privatperson");
 assert.equal(payload.topic,"n8n Automation Bootcamp");
});
