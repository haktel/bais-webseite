import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{onRequestPost}from"../functions/api/academy/auth/logout.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("valid-origin logout clears the browser session even when D1 is unavailable",async()=>{
 const request=new Request("https://bais-solutions.de/api/academy/auth/logout",{
  method:"POST",
  headers:{origin:"https://bais-solutions.de",cookie:"__Host-bais_session=test-token"}
 });
 const response=await onRequestPost({request,env:{}});
 assert.equal(response.status,503);
 assert.match(response.headers.get("set-cookie")||"",/__Host-bais_session=;.*Max-Age=0/);
 assert.equal(response.headers.get("clear-site-data"),'"cache", "cookies", "storage"');
 assert.equal(response.headers.get("cache-control"),"no-store");
});

test("invalid-origin logout remains CSRF protected and does not clear the session",async()=>{
 const request=new Request("https://bais-solutions.de/api/academy/auth/logout",{
  method:"POST",
  headers:{origin:"https://example.invalid",cookie:"__Host-bais_session=test-token"}
 });
 const response=await onRequestPost({request,env:{}});
 assert.equal(response.status,403);
 assert.equal(response.headers.get("set-cookie"),null);
});

test("admin logout has a fail-safe handler that redirects to the dedicated admin login",()=>{
 const html=read("admin/index.html"),js=read("assets/admin-logout.js");
 assert.match(html,/admin-logout\.js\?v=1\.0/);
 assert.match(js,/stopImmediatePropagation\(\)/);
 assert.match(js,/capture:true/);
 assert.match(js,/\/api\/academy\/auth\/logout/);
 assert.match(js,/location\.replace\("\/admin-login\/"\)/);
 assert.doesNotMatch(js,/\/academy\/konto\//);
});

test("admin logout fail-safe browser script is syntactically valid",()=>{
 const js=read("assets/admin-logout.js");
 assert.doesNotThrow(()=>new Function(js));
});
