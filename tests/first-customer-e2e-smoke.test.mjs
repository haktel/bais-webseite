import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{classifyApiPath}from"../functions/_lib/api-access-policy.js";
import{PROJECT_MODULES,normalizeProjectModules}from"../functions/_lib/project-sow.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("BS-12 first-customer E2E smoke contract is complete from registration to portal",()=>{
 const registration=read("functions/api/customer/auth/register.js");
 const verification=read("functions/api/customer/auth/verify.js");
 const projects=read("functions/api/commercial/projects.js");
 const sow=read("functions/api/commercial/sow.js");
 const sowLibrary=read("functions/_lib/project-sow.js");
 const portal=read("functions/api/customer/portal.js");
 const portalUi=read("assets/customer-portal.js");

 // 1. Public registration creates one durable customer identity, but no project/access.
 assert.equal(classifyApiPath("/api/customer/auth/register").mode,"public");
 assert.match(registration,/ensureCommercialIdentityForLead/);
 assert.match(registration,/issueCustomerEmailVerification/);
 assert.doesNotMatch(registration,/createProjectForOrganization|customer_access_grants/);

 // 2. Email proof activates the customer and establishes an authenticated session.
 assert.match(verification,/findCustomerEmailVerification/);
 assert.match(verification,/UPDATE users SET status='active'/);
 assert.match(verification,/createSession/);

 // 3. Only an MFA-authenticated admin may create the real customer project.
 assert.match(projects,/requireAdmin\(db,request\)/);
 assert.match(projects,/createProjectForOrganization/);
 assert.match(projects,/project_portal_not_enabled/);

 // 4. The SOW is project/customer bound; only a signed SOW starts integrations.
 assert.match(sow,/requireAdmin\(db,request\)/);
 assert.match(sow,/saveProjectSow/);
 assert.match(sow,/result\.sowStatus==="signed"/);
 assert.match(sow,/enqueueProjectIntegrations/);
 assert.match(sowLibrary,/signed_sow_immutable/);

 // 5. The customer portal is tenant scoped and returns only contracted signed modules.
 assert.deepEqual(normalizeProjectModules(["MOD-04","MOD-02"]),["MOD-02","MOD-04"]);
 assert.equal(PROJECT_MODULES["MOD-02"],"Project Portal");
 assert.equal(classifyApiPath("/api/customer/portal").contentKey,"project_portal");
 assert.match(portal,/customerContextForSession/);
 assert.match(portal,/s\.sow_status='signed'/);
 assert.match(portal,/p\.organization_id=\?/g);
 assert.doesNotMatch(portal,/jira_(?:issue|parent)|dolibarr_|r2_key/i);
 assert.match(portalUi,/p\.modules\|\|\[\]/);
});

test("BS-12 first-customer browser flow has no dummy intake or customer-side project creation",()=>{
 const account=read("assets/academy-account.js");
 const portalUi=read("assets/customer-portal.js");
 assert.doesNotMatch(account,/Erstprojekt\s*\/\s*Intake/);
 assert.doesNotMatch(account,/\/api\/commercial\/projects/);
 assert.doesNotMatch(portalUi,/\/api\/commercial\/projects/);
 assert.match(portalUi,/\/api\/customer\/portal/);
});
