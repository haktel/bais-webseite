import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("BAIS Control Center is a separately branded AdminLTE 4 surface",()=>{
 const html=read("bais-control-center/index.html");
 assert.match(html,/admin-lte@4\.9\.1/);
 assert.match(html,/<title>BAIS Control Center<\/title>/);
 assert.match(html,/Bünyamin Atik · IT Solutions/);
 assert.match(html,/BAIS · PRODUCTION CONTROL/);
 assert.match(html,/data-admin-logout/);
 assert.match(html,/assets\/bais-control-center\.js/);
 assert.match(html,/assets\/bais-control-center\.css/);
});

test("BAIS Control Center is admin-MFA protected and no-store",()=>{
 const middleware=read("functions/bais-control-center/_middleware.js");
 const headers=read("_headers");
 const login=read("assets/admin-login.js");
 const audit=read("scripts/security-live-audit.sh");
 assert.match(middleware,/requireAdmin/);
 assert.match(middleware,/new URL\("\/admin-login\/"/);
 assert.match(middleware,/\/bais-control-center\//);
 assert.match(headers,/\/bais-control-center\/\*[\s\S]*Cache-Control: private, no-store/);
 assert.match(login,/requested\.startsWith\("\/bais-control-center\/"\)/);
 assert.match(audit,/check_redirect "\/bais-control-center\/" "\/admin-login\//);
});

test("BAIS Control Center loads only existing protected admin APIs",()=>{
 const js=read("assets/bais-control-center.js");
 for(const endpoint of["/api/admin/overview","/api/admin/system-health","/api/admin/customer-access","/api/admin/project-approvals"]){
  assert.match(js,new RegExp(endpoint.replaceAll("/","\\/")));
 }
 assert.match(js,/credentials:"same-origin"/);
 assert.match(js,/admin-login\/\?continue=%2Fbais-control-center%2F/);
 new Function(js);
});