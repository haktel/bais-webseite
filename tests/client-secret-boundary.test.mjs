import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import path from"node:path";
import{fileURLToPath}from"node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const walk=(dir,predicate)=>{
 const out=[];
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if([".git","node_modules",".wrangler"].includes(entry.name))continue;
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())out.push(...walk(full,predicate));
  else if(predicate(full))out.push(full);
 }
 return out;
};
const relative=file=>path.relative(root,file).replaceAll(path.sep,"/");

const browserJs=walk(path.join(root,"assets"),file=>file.endsWith(".js"));
const staticHtml=walk(root,file=>file.endsWith(".html")&&!file.includes(`${path.sep}node_modules${path.sep}`));

const SERVER_ONLY_IDENTIFIERS=[
 "TURNSTILE_SECRET",
 "MFA_ENCRYPTION_KEY",
 "ADMIN_BOOTSTRAP_SECRET",
 "RESEND_API_KEY",
 "ERP_DOLAPIKEY",
 "ERP_CF_ACCESS_CLIENT_SECRET",
 "ERP_ENCRYPTION_KEY",
 "R2_SECRET_ACCESS_KEY",
 "R2_ACCESS_KEY_ID",
 "N8N_API_KEY",
 "CLOUDFLARE_API_TOKEN"
];

const CREDENTIAL_PATTERNS=[
 ["OpenAI secret key",/\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g],
 ["Resend API key",/\bre_[A-Za-z0-9]{24,}\b/g],
 ["GitHub token",/\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
 ["Google API key",/\bAIza[0-9A-Za-z_-]{30,}\b/g],
 ["Slack token",/\bxox[baprs]-[0-9A-Za-z-]{20,}\b/g],
 ["AWS-style access key",/\bAKIA[0-9A-Z]{16}\b/g],
 ["private key block",/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g]
];

test("browser JavaScript cannot reference BAIS server-only credential bindings",()=>{
 assert.ok(browserJs.length>0,"expected browser JavaScript assets");
 const leaks=[];
 for(const file of browserJs){
  const source=fs.readFileSync(file,"utf8");
  for(const identifier of SERVER_ONLY_IDENTIFIERS){
   if(source.includes(identifier))leaks.push(`${relative(file)} -> ${identifier}`);
  }
 }
 assert.deepEqual(leaks,[],`server-only credential identifiers reached browser JS:\n${leaks.join("\n")}`);
});

test("static browser-delivered sources contain no credential-shaped literal",()=>{
 const files=[...browserJs,...staticHtml],leaks=[];
 for(const file of files){
  const source=fs.readFileSync(file,"utf8");
  for(const[label,pattern]of CREDENTIAL_PATTERNS){
   pattern.lastIndex=0;
   const match=pattern.exec(source);
   if(match)leaks.push(`${relative(file)} -> ${label}`);
  }
 }
 assert.deepEqual(leaks,[],`credential-shaped literals found in browser-delivered sources:\n${leaks.join("\n")}`);
});

test("customer and admin browser code does not receive infrastructure secret names",()=>{
 const critical=[
  "assets/academy-account.js",
  "assets/customer-portal.js",
  "assets/admin.js",
  "assets/admin-dashboard.js",
  "assets/commercial-document-context.js"
 ];
 for(const name of critical){
  const source=fs.readFileSync(path.join(root,name),"utf8");
  assert.doesNotMatch(source,/(?:DOLAPIKEY|RESEND_API_KEY|TURNSTILE_SECRET|MFA_ENCRYPTION_KEY|R2_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY)|N8N_API_KEY|CLOUDFLARE_API_TOKEN)/,`${name} must remain secret-blind`);
 }
});
