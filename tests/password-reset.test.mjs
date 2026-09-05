import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{issuePasswordReset,findPasswordReset,sha256}from"../functions/_lib/auth.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("issuePasswordReset stores a hashed, per-user reset token with a 1 hour expiry",async()=>{
 const calls=[];
 const db={prepare(sql){calls.push(sql);return{bind:(...args)=>{calls.push(args);return{run:async()=>({success:true})};}};}};
 const now=new Date("2026-01-01T00:00:00.000Z");
 const result=await issuePasswordReset(db,"user-1",now);
 assert.match(calls[0],/INSERT INTO user_password_resets/);
 assert.match(calls[0],/ON CONFLICT\(user_id\) DO UPDATE/);
 assert.equal(calls[1][0],"user-1");
 assert.equal(result.expiresAt,"2026-01-01T01:00:00.000Z");
 assert.match(result.token,/^[A-Za-z0-9_-]{32,}$/);
});

test("findPasswordReset rejects malformed tokens without querying the database",async()=>{
 let queried=false;
 const db={prepare(){queried=true;return{bind:()=>({first:async()=>{queried=true;return null;}})};}};
 assert.equal(await findPasswordReset(db,""),null);
 assert.equal(await findPasswordReset(db,"too-short"),null);
 assert.equal(queried,false);
});

test("findPasswordReset looks up the hashed token, never the raw value",async()=>{
 const validToken="a".repeat(32),expectedHash=await sha256(validToken);
 let boundArg;
 const row={user_id:"user-1",token_hash:expectedHash,expires_at:"2099-01-01T00:00:00.000Z",used_at:null,display_name:"Test",email:"test@example.com",organization_id:"org-1"};
 const db={prepare(){return{bind(arg){boundArg=arg;return{first:async()=>row};}};}};
 const result=await findPasswordReset(db,validToken);
 assert.equal(boundArg,expectedHash);
 assert.notEqual(boundArg,validToken);
 assert.equal(result.user_id,"user-1");
 assert.equal(result.tokenHash,expectedHash);
});

test("migration creates the password reset table scoped one row per user with a hashed, unique, indexed token",()=>{
 const migration=read("migrations/0019_password_reset.sql");
 assert.match(migration,/CREATE TABLE IF NOT EXISTS user_password_resets/);
 assert.match(migration,/user_id TEXT PRIMARY KEY/);
 assert.match(migration,/token_hash TEXT NOT NULL UNIQUE/);
 assert.match(migration,/FOREIGN KEY\(user_id\) REFERENCES users\(id\) ON DELETE CASCADE/);
 assert.match(migration,/CREATE INDEX IF NOT EXISTS idx_user_password_resets_token/);
});

test("request-password-reset endpoint never reveals whether an account exists and rate-limits requests",()=>{
 const source=read("functions/api/academy/auth/request-password-reset.js");
 assert.match(source,/assertSameOrigin\(request\)/);
 assert.match(source,/consumeRateLimit\(db,request,"password-reset-request",email,3\)/);
 const genericReturns=[...source.matchAll(/return json\(\{ok:true,message:genericMessage/g)];
 assert.ok(genericReturns.length>=2,"every response branch must return the same generic message so an attacker cannot enumerate registered emails");
 assert.match(source,/onRequest=\(\)=>json\(.*405/s);
});

test("reset-password endpoint enforces expiry, single use, password policy and invalidates existing sessions",()=>{
 const source=read("functions/api/academy/auth/reset-password.js");
 assert.match(source,/assertSameOrigin\(request\)/);
 assert.match(source,/reset\.expires_at<=now/);
 assert.match(source,/reset\.used_at/);
 assert.match(source,/validPassword\(password\)/);
 assert.match(source,/UPDATE user_password_resets SET used_at=\?.*used_at IS NULL/);
 assert.match(source,/DELETE FROM user_sessions WHERE user_id=\?/);
 assert.match(source,/INSERT INTO audit_events/);
 assert.match(source,/"user\.password\.reset"/);
});

test("account page wires up a forgot-password request form and a token-gated new-password form",()=>{
 const html=read("academy/konto/index.html");
 assert.match(html,/data-password-reset-request-form/);
 assert.match(html,/data-password-reset-confirm-form hidden/);
});

test("account script extracts the reset token from the URL fragment and only reveals the new-password form when one is present",()=>{
 const script=read("assets/academy-account.js");
 assert.match(script,/get\("reset"\)/);
 assert.match(script,/if\(passwordResetToken\)\{showAuth\(\);setAccountView\("login"\);setLoginView\("reset"\);const confirmForm=document\.querySelector\("\[data-password-reset-confirm-form\]"\);if\(confirmForm\)confirmForm\.hidden=false;/);
 assert.match(script,/api\("\/api\/academy\/auth\/request-password-reset"/);
 assert.match(script,/api\("\/api\/academy\/auth\/reset-password"/);
});
