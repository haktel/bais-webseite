import test from"node:test";
import assert from"node:assert/strict";
import{signCanonical,stableStringify,timingSafeEqual}from"../functions/_lib/n8n-signing.js";

const secret="AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8";

test("stableStringify produces the same canonical JSON regardless of object key order",()=>{
  const a={z:3,a:1,nested:{b:2,a:1},list:[{y:2,x:1}]};
  const b={a:1,list:[{x:1,y:2}],nested:{a:1,b:2},z:3};
  assert.equal(stableStringify(a),stableStringify(b));
});

test("HMAC signature is deterministic for identical canonical request",async()=>{
  const payload={name:"BAIS Live Demo",topic:"Automation / n8n",consent:true};
  const a=await signCanonical(secret,payload,"1788210000","11111111-1111-4111-8111-111111111111");
  const b=await signCanonical(secret,{consent:true,topic:"Automation / n8n",name:"BAIS Live Demo"},"1788210000","11111111-1111-4111-8111-111111111111");
  assert.equal(a,b);
  assert.match(a,/^[A-Za-z0-9_-]{43}$/);
});

test("HMAC signature changes when payload, timestamp or nonce changes",async()=>{
  const base=await signCanonical(secret,{value:1},"1788210000","11111111-1111-4111-8111-111111111111");
  const payload=await signCanonical(secret,{value:2},"1788210000","11111111-1111-4111-8111-111111111111");
  const timestamp=await signCanonical(secret,{value:1},"1788210001","11111111-1111-4111-8111-111111111111");
  const nonce=await signCanonical(secret,{value:1},"1788210000","22222222-2222-4222-8222-222222222222");
  assert.notEqual(base,payload);
  assert.notEqual(base,timestamp);
  assert.notEqual(base,nonce);
});

test("timingSafeEqual only accepts identical signatures",()=>{
  assert.equal(timingSafeEqual("abc123","abc123"),true);
  assert.equal(timingSafeEqual("abc123","abc124"),false);
  assert.equal(timingSafeEqual("abc123","short"),false);
});
