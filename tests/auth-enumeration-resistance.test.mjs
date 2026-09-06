import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

for(const [name,path,sendCall,area] of [
 ["password reset","functions/api/academy/auth/request-password-reset.js","sendPasswordResetEmail","auth.password_reset.delivery"],
 ["verification resend","functions/api/customer/auth/resend-verification.js","sendCustomerVerificationEmail","auth.customer_verification_resend.delivery"]
]){
 test(`${name} keeps account existence private when transactional mail fails`,()=>{
  const source=read(path);
  assert.match(source,/export const onRequestPost=async context=>/);
  assert.match(source,new RegExp(`const delivery=${sendCall}\\(`));
  assert.match(source,/\.catch\(\(\)=>logDeliveryFailure\(traceId\)\)/);
  assert.match(source,/typeof context\.waitUntil==="function"/);
  assert.match(source,/context\.waitUntil\(delivery\)/);
  assert.match(source,/else await delivery/);
  assert.match(source,new RegExp(`area:\"${area.replaceAll(".","\\.")}\"`));
  assert.match(source,/code:"mail_delivery_failed"/);
  assert.doesNotMatch(source,/logDeliveryFailure=.*email/);
  assert.doesNotMatch(source,/logDeliveryFailure=.*token/);
  assert.match(source,/catch\{logDeliveryFailure\(traceId\);\}/);
 }
 );
}
