import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import path from"node:path";
import{fileURLToPath}from"node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const walk=dir=>{
 const base=path.join(root,dir),out=[];
 for(const entry of fs.readdirSync(base,{withFileTypes:true})){
  const rel=path.join(dir,entry.name);
  if(entry.isDirectory())out.push(...walk(rel));
  else if(entry.name.endsWith(".js"))out.push(rel.replaceAll(path.sep,"/"));
 }
 return out;
};

const criticalFiles=[
 ...walk("functions/api/customer"),
 ...walk("functions/api/commercial"),
 "functions/_lib/auth.js",
 "functions/_lib/customer-access.js",
 "functions/_lib/commercial.js",
 "functions/_lib/erp-sync.js",
 "functions/_lib/r2-documents.js",
 "assets/academy-account.js",
 "assets/customer-portal.js",
 "assets/commercial-document-context.js",
 "assets/admin.js",
 "assets/admin-dashboard.js"
];

const forbiddenFixtures=[
 /\b(?:dummy|fixture)\b/i,
 /example\.invalid/i,
 /test@example\./i,
 /\b(?:project|org|customer)[-_]?(?:demo|test|mock)\b/i,
 /\bKD[-_]?TEST\b/i,
 /\bCU[-_]?TEST\b/i
];

test("production customer/commercial runtime contains no fixture dependency",()=>{
 const hits=[];
 for(const file of criticalFiles){
  const source=read(file);
  for(const pattern of forbiddenFixtures){
   pattern.lastIndex=0;
   if(pattern.test(source))hits.push(`${file} -> ${pattern}`);
  }
 }
 assert.deepEqual(hits,[],`fixture-like production dependency found:\n${hits.join("\n")}`);
});

test("customer registration creates identity but never fabricates a project",()=>{
 const register=read("functions/api/customer/auth/register.js");
 assert.doesNotMatch(register,/INSERT INTO projects/i);
 assert.doesNotMatch(register,/Erstprojekt\s*\/\s*Intake/i);
 assert.match(register,/ensureCommercialIdentityForLead/);
 assert.match(register,/contentAccess:\[\]/);
 assert.match(register,/defaultAccess:"deny"/);
});

test("customer browser surfaces have no dummy project fallback",()=>{
 const account=read("assets/academy-account.js"),portal=read("assets/customer-portal.js");
 for(const source of[account,portal]){
  assert.doesNotMatch(source,/Erstprojekt\s*\/\s*Intake/i);
  assert.doesNotMatch(source,/project[-_]?demo|project[-_]?test|mockProject/i);
 }
 assert.match(portal,/p\.modules\|\|\[\]/);
});

test("legacy placeholder cleanup exists only as migration/cleanup compatibility, not creation logic",()=>{
 const migration=read("migrations/0017_remove_dummy_intake_projects.sql");
 assert.match(migration,/DELETE FROM projects/);
 assert.match(migration,/name='Erstprojekt \/ Intake'/);
 assert.doesNotMatch(migration,/INSERT INTO projects/i);
 const firstCustomer=read("tests/first-customer-e2e-smoke.test.mjs");
 assert.match(firstCustomer,/no dummy intake or customer-side project creation/);
});
