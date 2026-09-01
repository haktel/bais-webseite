import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("customer registration durably queues ERP prospect sync without making ERP availability transactional",()=>{
 const register=read("functions/api/customer/auth/register.js");
 assert.match(register,/enqueueErpProspectSync/);
 assert.match(register,/syncPendingErpJobs/);
 assert.match(register,/context\.waitUntil/);
 assert.match(register,/catch\(error\).*area:"erp\.enqueue"/s);
});

test("ERP outbox stores references instead of duplicating prospect PII in job payloads",()=>{
 const migration=read("migrations/0014_erp_sync.sql");
 assert.match(migration,/CREATE TABLE IF NOT EXISTS erp_sync_jobs/);
 assert.match(migration,/organization_id TEXT NOT NULL/);
 assert.doesNotMatch(migration,/payload_json/);
 assert.match(migration,/UNIQUE\(organization_id,job_type,object_key\)/);
});

test("ERP sync creates a Dolibarr prospect and preserves BAIS customer number as ref_ext",()=>{
 const erp=read("functions/_lib/erp-sync.js");
 assert.match(erp,/client:2/);
 assert.match(erp,/code_client:"-1"/);
 assert.match(erp,/ref_ext:row\.customer_number/);
 assert.match(erp,/thirdparties/);
 assert.match(erp,/DOLAPIKEY/);
});

test("ERP credentials are encrypted at rest and never returned by admin overview",()=>{
 const erp=read("functions/_lib/erp-sync.js");
 const admin=read("functions/api/admin/erp-sync.js");
 assert.match(erp,/AES-GCM/);
 assert.match(erp,/BAIS-ERP-AES-GCM-v1/);
 assert.match(admin,/save_config/);
 assert.doesNotMatch(admin,/apiKey:/);
});

test("Dolibarr BAIS trigger accepts an existing KD reference from ref_ext",()=>{
 const trigger=read("dolibarr/custom/bais/core/triggers/interface_99_modBAIS_BAISTrigger.class.php");
 const manager=read("dolibarr/custom/bais/class/baismanager.class.php");
 assert.match(trigger,/object->ref_ext/);
 assert.match(trigger,/\^KD-/);
 assert.match(manager,/preferredRef/);
 assert.match(manager,/ensureSequenceAtLeast/);
});


test("empty Dolibarr third-party lookup is treated as not found rather than sync failure",()=>{
 const erp=read("functions/_lib/erp-sync.js");
 assert.match(erp,/error\?\.status\)===404/);
 assert.match(erp,/return null;/);
});

test("provisioning accepts authenticated empty third-party list",()=>{
 const script=read("scripts/server/provision-bais-dolibarr-api-user.sh");
 assert.match(script,/HTTP_CODE" = "404"/);
 assert.match(script,/No third parties found/);
});


test("ERP sync D1 upsert has one binding per SQL placeholder",()=>{
 const erp=read("functions/_lib/erp-sync.js");
 const m=erp.match(/INSERT INTO erp_links\(organization_id,bais_customer_number,dolibarr_thirdparty_id,[^"]+VALUES\(([^"]+)\)[^"]*"\)\.bind\(([^)]+)\)/);
 assert.ok(m,"ERP link upsert SQL not found");
 assert.equal((m[1].match(/\?/g)||[]).length,m[2].split(",").length);
});
