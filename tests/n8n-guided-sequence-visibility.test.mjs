import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

test("strict guided mode hides future n8n lesson content instead of merely dimming it",async()=>{
  const css=await readFile("assets/n8n-guided-sequence.css","utf8");
  const middleware=await readFile("functions/academy/n8n-bootcamp/_middleware.js","utf8");
  assert.match(css,/\.lesson\.sequenceLocked\{display:none!important\}/);
  assert.match(css,/\.assessment\.sequenceLocked/);
  assert.match(css,/\.liveLab\.sequenceLocked/);
  assert.match(middleware,/n8n-guided-sequence\.css/);
  assert.match(middleware,/withGuidedSequence/);
});
