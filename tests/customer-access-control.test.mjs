import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{CUSTOMER_CONTENT_KEYS,normalizeCustomerContentKey}from"../functions/_lib/customer-access.js";
import{classifyApiPath}from"../functions/_lib/api-access-policy.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("customer access model is explicit default-deny and organization scoped",()=>{
 assert.deepEqual(CUSTOMER_CONTENT_KEYS,["angebot","abnahme","project_portal","wartung_hosting","content_pflege"]);
 assert.equal(normalizeCustomerContentKey("angebot"),"angebot");
 assert.throws(()=>normalizeCustomerContentKey("internal_debug"));
 const source=read("functions/_lib/customer-access.js");
 assert.match(source,/account_status!=="active"/);
 assert.match(source,/organization_id=\?/);
 assert.match(source,/status='active'/);
 assert.match(source,/project_id='\*' OR project_id=\?/);
 assert.match(source,/expires_at IS NULL OR expires_at>\?/);
 assert.match(source,/project_not_found/);
 assert.match(source,/id=\? AND organization_id=\?/);
});

test("grant and revoke actions are integrity protected and audited",()=>{
 const endpoint=read("functions/api/admin/customer-access.js");
 const helper=read("functions/_lib/customer-access.js");
 assert.match(endpoint,/requireAdmin/);
 assert.match(endpoint,/assertSameOrigin/);
 assert.match(endpoint,/setCustomerContentAccess/);
 assert.match(helper,/customer\.access\.granted/);
 assert.match(helper,/customer\.access\.revoked/);
 assert.match(helper,/audit_events/);
});

test("protected customer pages require their own entitlement keys",()=>{
 const cases=[
  ["functions/angebot/_middleware.js","angebot"],
  ["functions/abnahme/_middleware.js","abnahme"],
  ["functions/project-portal/kunde/_middleware.js","project_portal"]
 ];
 for(const[path,key]of cases){
  const source=read(path);
  assert.match(source,new RegExp('"'+key+'"'));
  assert.match(source,/requireCustomer(Content|Document)Access/);
  assert.match(source,/privatePageResponse/);
 }
});

test("customer portal API never queries other organizations or leaks storage keys",()=>{
 const source=read("functions/api/customer/portal.js");
 assert.match(source,/customerContextForSession/);
 assert.match(source,/p\.organization_id=\?/g);
 assert.doesNotMatch(source,/r2_key/);
 assert.doesNotMatch(source,/SELECT \*/);
});

test("API firewall separates public registration from entitlement-protected customer data",()=>{
 assert.equal(classifyApiPath("/api/customer/auth/register").mode,"public");
 assert.deepEqual(classifyApiPath("/api/customer/portal"),{mode:"customer_content",contentKey:"project_portal"});
 assert.equal(classifyApiPath("/api/customer/internal-debug").mode,"deny");
});

test("customer self-registration creates identity but grants no protected content",()=>{
 const source=read("functions/api/customer/auth/register.js");
 assert.match(source,/verifyTurnstile/);
 assert.match(source,/consumeRateLimit/);
 assert.match(source,/"customer","active"/);
 assert.match(source,/ensureCommercialIdentityForUser/);
 assert.match(source,/customerNumber:commercial\.customerNumber/);
 assert.match(source,/contentAccess:\[\]/);
 assert.match(source,/defaultAccess:"deny"/);
 assert.doesNotMatch(source,/customer_access_grants/);
 assert.match(source,/DELETE FROM audit_events/);
 assert.match(source,/DELETE FROM project_registry/);
 assert.match(source,/DELETE FROM customer_accounts/);
});

test("customer account renders only effective entitlements and project creation stays portal-gated",()=>{
 const context=read("functions/api/commercial/context.js");
 const account=read("assets/academy-account.js");
 const projects=read("functions/api/commercial/projects.js");
 assert.match(context,/filter\(item=>item\.effective\)/);
 assert.match(context,/canSeeProjects/);
 assert.match(account,/data-customer-content/);
 assert.match(account,/hasContentAccess\(data,"project_portal"\)/);
 assert.match(account,/newProjectForm\.hidden=!hasContentAccess/);
 assert.match(projects,/project_portal_not_enabled/);
 assert.match(projects,/hasCustomerContentAccess/);
});

test("customer access schema uses stable tenant-scoped primary key and indexes",()=>{
 const sql=read("migrations/0013_customer_access_control.sql");
 assert.match(sql,/PRIMARY KEY\(organization_id,content_key,project_id\)/);
 assert.match(sql,/FOREIGN KEY\(organization_id\) REFERENCES organizations/);
 assert.match(sql,/idx_customer_access_lookup/);
 assert.match(sql,/status IN\('active','revoked'\)/);
});
