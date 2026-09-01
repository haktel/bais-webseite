import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{allocateCustomerNumber,allocateProjectNumber}from"../functions/_lib/commercial.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const fakeSequenceDb=value=>({
 prepare(sql){
  assert.match(sql,/INSERT INTO business_sequences/);
  assert.match(sql,/ON CONFLICT\(sequence_key\) DO UPDATE/);
  assert.match(sql,/RETURNING next_value/);
  return{bind(...args){
   const key=args.find(v=>typeof v==="string"&&/^(customer|project):2026$/.test(v));
   assert.ok(key);
   return{first:async()=>({next_value:value})};
  }};
 }
});

test("commercial numbering uses stable year-prefixed customer and project formats",async()=>{
 assert.equal(await allocateCustomerNumber(fakeSequenceDb(7),"2026-08-31T09:00:00.000Z"),"KD-2026-000007");
 assert.equal(await allocateProjectNumber(fakeSequenceDb(42),"2026-08-31T09:00:00.000Z"),"PR-2026-000042");
});

test("commercial migration uses dedicated registries without altering projects",()=>{
 const sql=read("migrations/0009_commercial_identity.sql");
 for(const table of["business_sequences","customer_accounts","business_profile","project_registry"])
  assert.match(sql,new RegExp("CREATE TABLE IF NOT EXISTS "+table));
 assert.doesNotMatch(sql,/ALTER TABLE projects/i);
 assert.match(sql,/project_number TEXT NOT NULL UNIQUE/i);
});

test("registration assigns customer identity without fabricating a project",()=>{
 const register=read("functions/api/academy/auth/register.js");
 const commercial=read("functions/_lib/commercial.js");
 assert.match(register,/ensureCommercialIdentityForUser/);
 assert.match(register,/company=cleanText\(body\.company,160\)/);
 assert.match(register,/commercial:\{customerNumber:commercial\.customerNumber\}/);
 assert.doesNotMatch(register,/commercial\.project/);
 const ensureSection=commercial.slice(commercial.indexOf("export async function ensureCommercialIdentityForUser"),commercial.indexOf("export async function createProjectForOrganization"));
 assert.doesNotMatch(ensureSection,/INSERT INTO projects/);
 assert.doesNotMatch(ensureSection,/allocateProjectNumber/);
 const account=read("academy/konto/index.html");
 assert.match(account,/name="company"/);
});

test("commercial APIs expose context, project creation and admin customer selection",()=>{
 const context=read("functions/api/commercial/context.js");
 const projects=read("functions/api/commercial/projects.js");
 const admin=read("functions/api/admin/customers.js");
 assert.match(context,/customerNumber/);
 assert.match(context,/project_registry/);
 assert.match(projects,/createProjectForUser/);
 assert.match(projects,/project\.created/);
 assert.match(admin,/requireAdmin/);
 assert.match(admin,/customer_accounts/);
 assert.match(admin,/project_registry/);
});

test("Angebot and Abnahme use readonly DB identifiers and shared autofill",()=>{
 for(const path of["angebot/index.html","abnahme/index.html"]){
  const html=read(path);
  assert.match(html,/id="customerNumber"[^>]*readonly/);
  assert.match(html,/id="projectNo"[^>]*readonly/);
  assert.match(html,/id="customerPicker"/);
  assert.match(html,/id="projectPicker"/);
  assert.match(html,/id="createProject"/);
  assert.match(html,/commercial-document-context\.js\?v=1\.1/);
  assert.match(html,/id="providerCompany"[^>]*readonly/);
  assert.match(html,/id="providerContact"[^>]*readonly/);
 }
});

test("account dashboard renders a real empty project state",()=>{
 const html=read("academy/konto/index.html");
 const js=read("assets/academy-account.js");
 assert.match(html,/KUNDENKONTO · AUTOMATISCHE KUNDEN-NR\./);
 assert.match(html,/data-commercial-identity/);
 assert.match(html,/data-new-project-form/);
 assert.match(js,/\/api\/commercial\/context/);
 assert.match(js,/\/api\/commercial\/projects/);
 assert.match(js,/Noch kein Projekt/);
 assert.doesNotMatch(html,/Das erste Intake-Projekt/);
});


test("legacy empty intake placeholders are removed without deleting projects that contain real data",()=>{
 const commercial=read("functions/_lib/commercial.js");
 const portal=read("functions/api/customer/portal.js");
 const migration=read("migrations/0017_remove_dummy_intake_projects.sql");
 assert.match(commercial,/removeLegacyEmptyIntakeProjects/);
 assert.match(commercial,/SELECT 1 AS present FROM milestones/);
 assert.match(commercial,/SELECT 1 AS present FROM documents/);
 assert.match(commercial,/SELECT 1 AS present FROM approvals/);
 assert.match(commercial,/SELECT 1 AS present FROM document_uploads/);
 assert.match(portal,/removeLegacyEmptyIntakeProjects/);
 assert.match(migration,/Erstprojekt \/ Intake/);
 assert.match(migration,/NOT EXISTS\(SELECT 1 FROM milestones/);
 assert.match(migration,/NOT EXISTS\(SELECT 1 FROM documents/);
 assert.match(migration,/NOT EXISTS\(SELECT 1 FROM approvals/);
 assert.match(migration,/NOT EXISTS\(SELECT 1 FROM document_uploads/);
});
