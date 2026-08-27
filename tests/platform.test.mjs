import test from"node:test";import assert from"node:assert/strict";import{cleanText,validEmail}from"../functions/_lib/api.js";
test("cleanText normalizes control chars and whitespace",()=>assert.equal(cleanText("  BAIS\n\tTest  ",50),"BAIS Test"));
test("validEmail accepts normal and rejects malformed email",()=>{assert.equal(validEmail("info@bais-solutions.de"),true);assert.equal(validEmail("not-an-email"),false);});
test("cleanText enforces maximum length",()=>assert.equal(cleanText("abcdef",3),"abc"));
