import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{maskCertificateHolder}from"../functions/_lib/certificates.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("admin shell and first-admin bootstrap are not public escalation paths",()=>{
 const middleware=read("functions/admin/_middleware.js");
 assert.match(middleware,/requireAdmin/);
 assert.match(middleware,/cache-control","private, no-store/);
 const bootstrap=read("functions/api/admin/bootstrap.js");
 assert.match(bootstrap,/ADMIN_BOOTSTRAP_SECRET/);
 assert.match(bootstrap,/bootstrapSecret/);
 assert.match(bootstrap,/Nicht verfügbar/);
 const account=read("assets/academy-account.js");
 assert.doesNotMatch(account,/tryBootstrapOwner/);
 assert.doesNotMatch(account,/\/api\/admin\/bootstrap/);
});

test("registration is invitation-bound and cannot inherit approval by email alone",()=>{
 const register=read("functions/api/academy/auth/register.js");
 assert.match(register,/resolveRegistrationInvite/);
 assert.match(register,/consumeRegistrationInvite/);
 assert.match(register,/inviteToken/);
 assert.doesNotMatch(register,/preApproved/);
 const invites=read("functions/_lib/invites.js");
 assert.match(invites,/token_hash/);
 assert.match(invites,/used_at IS NULL/);
 assert.match(invites,/r\.status='approved'/);
 const admin=read("functions/api/admin/enrollment-requests.js");
 assert.match(admin,/createRegistrationInvite/);
 assert.match(admin,/#invite=/);
 assert.doesNotMatch(admin,/\?invite=/);
 assert.match(admin,/inviteId/);
 const account=read("assets/academy-account.js");
 assert.match(account,/location\.hash/);
 assert.match(account,/history\.replaceState/);
});

test("password and session lifecycle are hardened",()=>{
 const auth=read("functions/_lib/auth.js");
 assert.match(auth,/PASSWORD_HASH_ITERATIONS=600000/);
 assert.match(auth,/IDLE_SECONDS=60\*60\*8/);
 assert.match(auth,/SESSION_SECONDS=60\*60\*24/);
 assert.match(auth,/uaMismatch/);
 assert.match(auth,/DELETE FROM user_sessions WHERE expires_at<=\?/);
 assert.match(auth,/DELETE FROM auth_rate_limits WHERE updated_at<\?/);
 const login=read("functions/api/academy/auth/login.js");
 assert.match(login,/PASSWORD_HASH_ITERATIONS/);
 assert.match(login,/UPDATE user_credentials SET password_hash/);
 const logout=read("functions/api/academy/auth/logout.js");
 assert.match(logout,/clear-site-data/);
});

test("public certificate verification is data-minimized and non-cacheable",()=>{
 assert.equal(maskCertificateHolder("Max Mustermann"),"M. M.");
 const api=read("functions/api/certificates/[code].js");
 assert.match(api,/maskCertificateHolder/);
 assert.match(api,/cache-control":"no-store/);
 assert.match(api,/referrer-policy":"no-referrer/);
 assert.doesNotMatch(api,/holder:row\.display_name/);
 const headers=read("_headers");
 assert.match(headers,/\/zertifikat\/\*/);
 assert.match(headers,/\/api\/certificates\/\*/);
});

test("privacy lifecycle is technically implemented, not only documented",()=>{
 const migration=read("migrations/0010_privacy_lifecycle.sql");
 assert.match(migration,/privacy_retention/);
 assert.match(migration,/privacy_requests/);
 const privacy=read("functions/_lib/privacy.js");
 assert.match(privacy,/openLeadDays/);
 assert.match(privacy,/closedLeadDays/);
 assert.match(privacy,/legal_hold=0/);
 assert.match(privacy,/runPrivacyCleanup/);
 for(const path of["functions/api/contact.js","functions/api/academy/enrollments.js"]){
  const source=read(path);
  assert.match(source,/scheduleRetention/);
  assert.match(source,/runPrivacyCleanup/);
 }
 assert.match(read("functions/api/admin/overview.js"),/runPrivacyCleanup/);
});

test("data subject rights have authenticated self-service and admin workflow",()=>{
 const mine=read("functions/api/privacy/me.js");
 assert.match(mine,/requireSession/);
 assert.match(mine,/assertSameOrigin/);
 assert.match(mine,/privacy_requests/);
 const admin=read("functions/api/admin/privacy-requests.js");
 assert.match(admin,/requireAdmin/);
 assert.match(admin,/assertSameOrigin/);
 const account=read("academy/konto/index.html");
 assert.match(account,/Meine Daten herunterladen/);
 assert.match(account,/Datenschutzanfrage senden/);
 const adminHtml=read("admin/index.html");
 assert.match(adminHtml,/data-tab="privacy"/);
});

test("privacy notices match actual customer platform processing",()=>{
 const privacy=read("datenschutz/index.html");
 for(const needle of[
  "LÖSCHLEBENSZYKLUS",
  "KUNDEN-/PROJEKTIDENTITÄT",
  "GESCHÜTZTE DOKUMENTE",
  "ZERTIFIKATSPRÜFUNG",
  "BETROFFENENRECHTE",
  "365 Tage",
  "180 Tage"
 ])assert.equal(privacy.includes(needle),true,"missing privacy disclosure: "+needle);
 assert.match(read("kontakt/index.html"),/Datenschutzhinweise/);
 assert.match(read("academy/anmeldung/index.html"),/Datenschutzhinweise/);
 assert.match(read("academy/konto/index.html"),/Datenschutzhinweise/);
});

test("sensitive customer browser state is purged at auth boundary or session failure",()=>{
 const account=read("assets/academy-account.js");
 assert.match(account,/clearPrivateBrowserState/);
 assert.match(account,/Object\.keys\(localStorage\)/);
 assert.match(account,/Object\.keys\(sessionStorage\)/);
 assert.match(account,/catch\{clearPrivateBrowserState\(\);showAuth\(\);\}/);
 const certificateJs=read("assets/academy-certificates.js");
 assert.match(certificateJs,/target\?\.replaceChildren\(\)/);
});
