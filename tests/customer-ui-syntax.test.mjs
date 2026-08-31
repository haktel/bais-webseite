import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import vm from"node:vm";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("customer-facing and admin browser scripts remain syntactically valid",()=>{
 for(const path of[
  "assets/admin.js",
  "assets/academy-account.js",
  "assets/customer-portal.js",
  "assets/commercial-document-context.js",
  "assets/site-history-nav.js",
  "assets/invoice-builder.js"
 ]){
  const source=read(path);
  assert.doesNotThrow(()=>new vm.Script(source,{filename:path}),path+" contains invalid JavaScript");
 }
});
