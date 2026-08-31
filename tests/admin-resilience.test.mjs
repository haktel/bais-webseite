import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("admin data loading is fault-isolated instead of all-or-nothing",()=>{
 const source=read("assets/admin.js");
 assert.match(source,/Promise\.allSettled/);
 assert.match(source,/Datenquelle\(n\) nicht verfügbar/);
 assert.match(source,/Die übrigen Admin-Bereiche bleiben nutzbar/);
 assert.doesNotMatch(source,/await Promise\.all\(\["overview","students","enrollment-requests"/);
});

test("admin customer access GET uses one grant query instead of per-customer N+1 loading",()=>{
 const source=read("functions/api/admin/customer-access.js");
 assert.match(source,/SELECT organization_id,content_key,project_id,status,granted_at,expires_at,revoked_at/);
 assert.doesNotMatch(source,/for\(const customer of customers\)/);
 assert.match(source,/effective:row\.status==="active"/);
});

test("admin asset versions are bumped for resilient loading build",()=>{
 const html=read("admin/index.html");
 assert.match(html,/admin\.css\?v=1\.3/);
 assert.match(html,/admin\.js\?v=1\.6/);
});
