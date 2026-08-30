import test from"node:test";
import assert from"node:assert/strict";
import{DEMO_SCENARIOS,buildDemoPayload}from"../functions/api/n8n-demo.js";

test("n8n public demo exposes only fixed business scenarios",()=>{
 assert.deepEqual(Object.keys(DEMO_SCENARIOS),["automation","security","academy"]);
});

test("n8n demo builds synthetic payload without user supplied PII",()=>{
 const payload=buildDemoPayload("automation","planned");
 assert.equal(payload.name,"BAIS Live Demo");
 assert.equal(payload.email,"n8n.demo@example.com");
 assert.equal(payload.topic,"Automation / n8n");
 assert.equal(payload.consent,true);
 assert.match(payload.message,/synthetischer öffentlicher BAIS-Demolauf/i);
});

test("n8n demo urgency changes the fixed workflow context",()=>{
 const planned=buildDemoPayload("security","planned");
 const urgent=buildDemoPayload("security","urgent");
 assert.notEqual(planned.message,urgent.message);
 assert.match(urgent.message,/24 bis 48 Stunden/);
});

test("n8n demo rejects unsupported scenario or urgency before webhook call",()=>{
 assert.equal(buildDemoPayload("custom","urgent"),null);
 assert.equal(buildDemoPayload("automation","now"),null);
});