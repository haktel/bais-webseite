import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("admin middleware redirects unauthenticated admins to dedicated admin login",()=>{
 const middleware=read("functions/admin/_middleware.js");
 assert.match(middleware,/new URL\("\/admin-login\/"/);
 assert.match(middleware,/target\.searchParams\.set\("continue",adminContinue/);
 assert.doesNotMatch(middleware,/new URL\("\/academy\/konto\/"/);
});

test("admin login presents password and MFA as separate screens",()=>{
 const html=read("admin-login/index.html");
 assert.match(html,/SCHRITT 1 VON 2/);
 assert.match(html,/data-admin-step="password"/);
 assert.match(html,/Weiter zu MFA/);
 assert.match(html,/SCHRITT 2 VON 2/);
 assert.match(html,/data-admin-step="mfa" hidden/);
 assert.match(html,/MFA bestätigen/);
 assert.match(html,/Control Center öffnen/);
});

test("admin login verifies password before exposing MFA and redirects only after MFA success",()=>{
 const js=read("assets/admin-login.js");
 const passwordHandler=js.match(/passwordForm\?\.addEventListener\("submit",async event=>\{([\s\S]*?)\n\}\);/);
 assert.ok(passwordHandler,"password submit handler must exist");
 const flow=passwordHandler[1];
 assert.match(flow,/api\("\/api\/academy\/auth\/login"/);
 assert.match(flow,/data\.user\?\.role!=="admin"/);
 assert.match(flow,/showStep\("mfa"\)/);
 assert.match(flow,/await loadMfaState\(\)/);
 assert.ok(flow.indexOf('/api/academy/auth/login')<flow.indexOf('showStep("mfa")'),"password must be accepted before the MFA screen is shown");
 assert.match(js,/action:"verify"/);
 assert.match(js,/goControlCenter\(\)/);
 assert.doesNotMatch(js,/loadProgress|loadCommercial|loadAccess/);
});

test("first-time MFA setup keeps recovery codes visible before entering admin",()=>{
 const js=read("assets/admin-login.js");
 assert.match(js,/action:"begin_setup"/);
 assert.match(js,/import\("\.\/vendor\/qrcode\.mjs"\)/);
 assert.match(js,/action:"confirm_setup"/);
 assert.match(js,/mfaRecovery\.hidden=false/);
 assert.match(js,/data-mfa-continue/);
});

test("admin login page is private-cache and noindex",()=>{
 const headers=read("_headers"),html=read("admin-login/index.html");
 assert.match(headers,/\/admin-login\/\*[\s\S]*Cache-Control: private, no-store/);
 assert.match(html,/noindex,nofollow,noarchive/);
});