import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{PROJECT_MODULES,normalizeProjectModules}from"../functions/_lib/project-sow.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SOW uses exactly the four canonical BAIS modules",()=>{
 assert.deepEqual(PROJECT_MODULES,{
  "MOD-01":"Website-Entwicklung",
  "MOD-02":"Project Portal",
  "MOD-03":"Wartung/Hosting-Setup",
  "MOD-04":"Content-Pflege"
 });
 assert.deepEqual(normalizeProjectModules(["mod-04","MOD-02","MOD-02"]),["MOD-02","MOD-04"]);
 const sowLib=read("functions/_lib/project-sow.js");
 assert.match(sowLib,/description.*slice\(0,1000\)/s);
 assert.match(sowLib,/scopeSelections:parseScope/);
 assert.throws(()=>normalizeProjectModules(["MOD-99"]));
});

test("signed SOW is immutable and only signed state queues external project systems",()=>{
 const sow=read("functions/_lib/project-sow.js");
 const sync=read("functions/_lib/project-sync.js");
 const api=read("functions/api/commercial/sow.js");
 assert.match(sow,/signed_sow_immutable/);
 assert.match(sow,/existing\?\.sow_status==="signed"/);
 assert.match(sync,/row\.sow_status!=="signed"/);
 assert.match(sync,/sow_not_signed/);
 assert.match(api,/result\.sowStatus==="signed"/);
 assert.doesNotMatch(api,/\["approved","signed"\]\.includes\(result\.sowStatus\)/);
});

test("SOW write path is admin MFA protected and project-customer bound",()=>{
 const api=read("functions/api/commercial/sow.js");
 assert.match(api,/assertSameOrigin/);
 assert.match(api,/requireAdmin\(db,request\)/);
 assert.match(api,/project_customer_required/);
 assert.match(api,/saveProjectSow/);
 assert.match(api,/enqueueErpProspectSync/);
 assert.match(api,/enqueueProjectIntegrations/);
 assert.match(api,/syncPendingErpJobs/);
 assert.match(api,/syncPendingProjectIntegrations/);
});

test("Dolibarr and Jira sync are retry-safe and keyed to BAIS project",()=>{
 const sync=read("functions/_lib/project-sync.js");
 const migration=read("migrations/0018_project_sow_integrations.sql");
 assert.match(sync,/bais\/project\/upsert/);
 assert.match(sync,/project_ref:row\.project_number/);
 assert.match(sync,/JIRA_BASE_URL/);
 assert.match(sync,/JIRA_EMAIL/);
 assert.match(sync,/JIRA_API_TOKEN/);
 assert.match(sync,/JIRA_PROJECT_KEY/);
 assert.match(sync,/\.atlassian\.net/);
 assert.match(sync,/\/rest\/api\/3\//);
 assert.match(sync,/type:"doc",version:1/);
 assert.match(sync,/jira_parent_key/);
 assert.match(sync,/project_module_integration_links/);
 assert.match(sync,/search\/jql/);
 assert.match(sync,/projectJiraLabel/);
 assert.match(sync,/moduleJiraLabel/);
 assert.match(sync,/multiple BAIS parent issues/);
 assert.match(sync,/multiple BAIS module issues/);
 assert.match(sync,/fields\.parent=\{key:parent\.key\}/);
 assert.match(migration,/UNIQUE\(project_id,target\)/);
 assert.match(migration,/PRIMARY KEY\(project_id,module_code\)/);
 assert.match(sync,/status=\'processing\'.*status IN\(\'pending\',\'failed\'\)/s);
 assert.match(sync,/claim\?\.meta\?\.changes/);
 assert.match(sync,/staleBefore/);
});

test("customer Project Portal receives contracted modules but not integration identifiers",()=>{
 const api=read("functions/api/customer/portal.js");
 const ui=read("assets/customer-portal.js");
 assert.match(api,/project_modules/);
 assert.match(api,/project_sow/);
 assert.match(ui,/Beauftragte Module/);
 assert.match(ui,/module_code/);
 assert.match(ui,/module_name/);
 assert.match(api,/s\.sow_status=\'signed\'/);
 assert.doesNotMatch(api,/jira_parent_key/);
 assert.doesNotMatch(api,/dolibarr_project_id/);
});

test("integration jobs defer when remote credentials are not configured",()=>{
 const sync=read("functions/_lib/project-sync.js");
 assert.match(sync,/if\(!config\.configured\)return\{configured:false\}/);
 assert.match(sync,/result\.configured===false/);
 assert.match(sync,/deferred\+\+/);
 assert.match(sync,/15\*60_000/);
});


test("signed Dolibarr project sync promotes the existing prospect instead of creating a second customer",()=>{
 const api=read("dolibarr/custom/bais/class/api_bais.class.php");
 const sync=read("functions/_lib/project-sync.js");
 assert.match(api,/Only a signed SOW may create or update a Dolibarr project/);
 assert.match(api,/Societe::PROSPECT/);
 assert.match(api,/Societe::CUSTOMER_AND_PROSPECT/);
 assert.match(api,/\$company->update\(\$socid, \$this->user/);
 assert.match(api,/ref_ext/);
 assert.match(sync,/UPDATE erp_links SET erp_role='customer'/);
});


test("Angebot persists and reloads structured deliverable scope per project",()=>{
 const ui=read("assets/commercial-document-context.js");
 assert.match(ui,/detailedScopeInputs/);
 assert.match(ui,/\^scope\[A-Z\]/);
 assert.match(ui,/description/);
 assert.match(ui,/scopeSelections/);
 assert.match(ui,/resetSowProjectFields/);
 assert.match(ui,/sow\?\.scopeSelections/);
});
