import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import vm from"node:vm";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("dedicated admin login browser script is syntactically valid",()=>{
 const source=read("assets/admin-login.js").replace(/import\("\.\/vendor\/qrcode\.mjs"\)/g,"Promise.resolve({qrcode(){}})");
 assert.doesNotThrow(()=>new vm.Script(source));
});