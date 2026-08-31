import test from"node:test";
import assert from"node:assert/strict";
import{readdir,readFile}from"node:fs/promises";
import{classifyApiPath}from"../functions/_lib/api-access-policy.js";

const routeFor=file=>{
 let rel=file.replace(/^functions\/api/,"/api").replace(/\.js$/,"");
 rel=rel.replace(/\/index$/,"");
 rel=rel.replace(/\[code\]/g,"BAIS-TEST-CODE");
 return rel;
};

test("every API function is explicitly classified by the fail-closed firewall",async()=>{
 const files=(await readdir(new URL("../functions/api/",import.meta.url),{recursive:true}))
  .filter(x=>x.endsWith(".js")&&x!=="_middleware.js")
  .map(x=>"functions/api/"+x.replaceAll("\\","/"));
 const denied=[];
 for(const file of files){
  const route=routeFor(file),policy=classifyApiPath(route);
  if(policy.mode==="deny")denied.push({file,route});
 }
 assert.deepEqual(denied,[],"Unclassified API routes must never deploy");
});

test("public API surface stays intentionally small and hardened",async()=>{
 const publicExpectations=new Map([
  ["functions/api/contact.js",/verifyTurnstile/],
  ["functions/api/academy/enrollments.js",/verifyTurnstile/],
  ["functions/api/academy/auth/register.js",/verifyTurnstile/],
  ["functions/api/academy/auth/login.js",/consumeRateLimit/],
  ["functions/api/n8n-demo.js",/synthetisch|synthetic/i],
  ["functions/api/n8n-signature-verify.js",/verifyN8nSignature/],
  ["functions/api/certificates/[code].js",/maskCertificateHolder/]
 ]);
 for(const[file,pattern]of publicExpectations){
  const source=await readFile(new URL("../"+file,import.meta.url),"utf8");
  assert.match(source,pattern,file+" lacks required public-route guard");
 }
});

test("Academy lab APIs are no longer authenticated by Origin alone",()=>{
 for(const route of["/api/n8n-module-01","/api/n8n-module-12","/api/kif-module-01","/api/kif-module-06","/api/academy/auth-lab-resource"]){
  const policy=classifyApiPath(route);
  assert.equal(policy.mode,"course");
  assert.ok(policy.courseSlug);
 }
});

test("admin APIs require MFA except the MFA/bootstrap control plane",()=>{
 for(const route of["/api/admin/contacts","/api/admin/students","/api/admin/customers","/api/admin/privacy-requests","/api/admin/certificates"]){
  assert.equal(classifyApiPath(route).mode,"admin_mfa");
 }
 assert.equal(classifyApiPath("/api/admin/mfa").mode,"admin_session");
 assert.equal(classifyApiPath("/api/admin/bootstrap").mode,"admin_session");
});

test("unknown future API routes fail closed",()=>{
 assert.equal(classifyApiPath("/api/new-secret-backdoor").mode,"deny");
 assert.equal(classifyApiPath("/api/internal/debug").mode,"deny");
});
