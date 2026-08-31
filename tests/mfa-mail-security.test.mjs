import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{base32Encode,verifyTotpSecret}from"../functions/_lib/mfa.js";
import{sendAcademyInviteEmail}from"../functions/_lib/mail.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("RFC6238-compatible TOTP accepts the 59-second SHA1 vector at 6 digits",async()=>{
 const secret=base32Encode(new TextEncoder().encode("12345678901234567890"));
 assert.equal(secret,"GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
 const result=await verifyTotpSecret(secret,"287082",{now:59000,lastCounter:-1});
 assert.equal(result.ok,true);
 assert.equal(result.counter,1);
});

test("TOTP replay of an already accepted counter is rejected",async()=>{
 const secret="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
 const replay=await verifyTotpSecret(secret,"287082",{now:59000,lastCounter:1});
 assert.equal(replay.ok,false);
});

test("admin MFA prefers a dedicated encryption root, supports a domain-separated fallback and time-limited step-up",()=>{
 const mfa=read("functions/_lib/mfa.js");
 assert.match(mfa,/AES-GCM/);
 assert.match(mfa,/MFA_ENCRYPTION_KEY/);
 assert.match(mfa,/TURNSTILE_SECRET/);
 assert.match(mfa,/BAIS-MFA-AES-GCM-v1/);
 assert.match(mfa,/mfa_key_not_configured/);
 assert.match(mfa,/rootSecrets/);
 assert.match(mfa,/for\(const key of keys\)/);
 assert.match(mfa,/MFA_VERIFICATION_TTL_MS=4\*60\*60\*1000/);
 assert.match(mfa,/verified_at/);
 assert.match(mfa,/DELETE FROM admin_mfa_sessions/);
 assert.match(mfa,/admin_mfa_recovery_codes/);
 assert.match(mfa,/last_counter/);
 const admin=read("functions/_lib/admin.js");
 assert.match(admin,/requireAdminMfa/);
 const middleware=read("functions/admin/_middleware.js");
 assert.match(middleware,/mfa_setup_required/);
 assert.match(middleware,/mfa_required/);
});
test("transactional invite delivery fails closed without a provider secret",async()=>{
 await assert.rejects(
  ()=>sendAcademyInviteEmail({env:{},to:"user@example.com",name:"Test",courseTitle:"Testkurs",inviteUrl:"/academy/konto/#invite=secret",expiresAt:new Date(Date.now()+60000).toISOString(),idempotencyKey:"test/1"}),
  error=>error?.status===503&&error?.code==="transactional_email_not_configured"
 );
});

test("invite token is sent server-side and never returned to admin UI",()=>{
 const endpoint=read("functions/api/admin/enrollment-requests.js");
 assert.match(endpoint,/sendAcademyInviteEmail/);
 assert.match(endpoint,/emailSent/);
 assert.match(endpoint,/email_failed/);
 assert.match(endpoint,/UPDATE enrollment_requests SET status=\?/);
 assert.doesNotMatch(endpoint,/return json\(\{ok:true,accessGranted,registrationInvite/);
 const adminJs=read("assets/admin.js");
 assert.doesNotMatch(adminJs,/registrationInvite\.url/);
 assert.doesNotMatch(adminJs,/navigator\.clipboard.*invite/i);
});

test("transactional mail uses Resend bearer auth and idempotency without logging secrets",()=>{
 const mail=read("functions/_lib/mail.js");
 assert.match(mail,/https:\/\/api\.resend\.com\/emails/);
 assert.match(mail,/authorization":"Bearer "/);
 assert.match(mail,/idempotency-key/);
 assert.match(mail,/RESEND_API_KEY/);
 assert.doesNotMatch(mail,/console\.(log|error)/);
});

test("security runtime provisioning preserves existing MFA root and requires transactional mail",()=>{
 const workflow=read(".github/workflows/security-runtime-provision.yml");
 assert.match(workflow,/has\("MFA_ENCRYPTION_KEY"\)/);
 assert.match(workflow,/RESEND_API_KEY/);
 assert.match(workflow,/CLOUDFLARE_TOKEN_MISSING/);
});
