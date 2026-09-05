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
 const loginPos=js.indexOf('/api/academy/auth/login');
 const mfaPos=js.indexOf('/api/admin/mfa');
 assert.ok(loginPos>=0&&mfaPos>loginPos,"password endpoint must be wired before MFA endpoint");
 assert.match(js,/data\.user\?\.role!=="admin"/);
 assert.match(js,/showStep\("mfa"\)/);
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