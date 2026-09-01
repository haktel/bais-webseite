import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("BAIS Dolibarr module stays in custom/ and declares triggers",()=>{
  const mod=read("dolibarr/custom/bais/core/modules/modBAIS.class.php");
  assert.match(mod,/class modBAIS extends DolibarrModules/);
  assert.match(mod,/'triggers'\s*=>\s*1/);
  assert.match(mod,/_load_tables\('\/bais\/sql\/'\)/);
});

test("BAIS reference manager defines canonical automatic numbers",()=>{
  const manager=read("dolibarr/custom/bais/class/baismanager.class.php");
  const trigger=read("dolibarr/custom/bais/core/triggers/interface_99_modBAIS_BAISTrigger.class.php");
  assert.match(manager,/sprintf\('%s-%04d-%06d'/);
  assert.match(trigger,/\$prefix = 'KD'/);
  assert.match(trigger,/\$prefix = 'PR'/);
  assert.match(trigger,/\$prefix = 'AN'/);
  assert.match(trigger,/\$prefix = 'RE'/);
});

test("BAIS trigger failures do not roll back Dolibarr core transactions",()=>{
  const trigger=read("dolibarr/custom/bais/core/triggers/interface_99_modBAIS_BAISTrigger.class.php");
  assert.match(trigger,/catch \(Throwable \$e\)/);
  assert.match(trigger,/return 0;/);
});

test("BAIS REST API is read-only in phase one",()=>{
  const api=read("dolibarr/custom/bais/class/api_bais.class.php");
  assert.match(api,/@url GET \/health/);
  assert.match(api,/@url GET \/reference\/\{type\}\/\{id\}/);
  assert.match(api,/@url GET \/events/);
  assert.doesNotMatch(api,/@url (POST|PUT|PATCH|DELETE)/);
});

test("BAIS server deployer never carries API keys or passwords",()=>{
  const deploy=read("scripts/server/deploy-bais-dolibarr-module.sh");
  assert.doesNotMatch(deploy,/DOLI_ADMIN_PASSWORD=/);
  assert.doesNotMatch(deploy,/DOLAPIKEY/);
  assert.match(deploy,/php -l/);
  assert.match(deploy,/activateModule/);
});


test("new Dolibarr customer automatically receives one idempotent BAIS starter pack",()=>{
  const manager=read("dolibarr/custom/bais/class/baismanager.class.php");
  const trigger=read("dolibarr/custom/bais/core/triggers/interface_99_modBAIS_BAISTrigger.class.php");
  const sql=read("dolibarr/custom/bais/sql/llx_bais_customer_onboarding.sql");
  assert.match(manager,/ensureCustomerStarterPack/);
  assert.match(manager,/UNIQUE KEY uk_bais_customer_onboarding/);
  assert.match(manager,/kundenstammblatt-v1/);
  assert.match(manager,/welcome-onboarding-v1/);
  assert.match(manager,/avv-dsgvo-check-v1/);
  assert.match(trigger,/CUSTOMER_STARTER_PACK_PREPARED/);
  assert.match(trigger,/\$action === 'COMPANY_CREATE'/);
  assert.match(sql,/UNIQUE KEY uk_bais_customer_onboarding/);
});

test("Dolibarr customer starter pack template family keeps BAIS customer identity explicit",()=>{
  for(const path of[
    "dolibarr/custom/bais/templates/kundenstammblatt-v1.md",
    "dolibarr/custom/bais/templates/welcome-onboarding-v1.md",
    "dolibarr/custom/bais/templates/angebot-sow-check-v1.md",
    "dolibarr/custom/bais/templates/avv-dsgvo-check-v1.md",
    "dolibarr/custom/bais/templates/projekt-kickoff-v1.md",
    "dolibarr/custom/bais/templates/abnahme-vorbereitung-v1.md"
  ]){
    const source=read(path);
    assert.match(source,/\[KUNDEN_NUMMER\]/);
    assert.match(source,/BAIS/);
  }
});


test("Dolibarr BAIS 0.3 exposes least-privilege idempotent project upsert",()=>{
 const api=read("dolibarr/custom/bais/class/api_bais.class.php");
 const mod=read("dolibarr/custom/bais/core/modules/modBAIS.class.php");
 const trigger=read("dolibarr/custom/bais/core/triggers/interface_99_modBAIS_BAISTrigger.class.php");
 const provision=read("scripts/server/provision-bais-dolibarr-api-user.sh");
 assert.match(mod,/version = '0\.3\.0'/);
 assert.match(mod,/50032103/);
 assert.match(mod,/project/);
 assert.match(mod,/write/);
 assert.match(api,/@url POST \/project\/upsert/);
 assert.match(api,/requireProjectWritePermission/);
 assert.match(api,/ref_ext/);
 assert.match(api,/Societe::PROSPECT/);
 assert.match(api,/Societe::CUSTOMER_AND_PROSPECT/);
 assert.match(api,/Only a signed SOW/);
 assert.match(api,/projectRef/);
 assert.match(api,/assignReference\('project'.*projectRef, \$projectRef\)/s);
 assert.match(trigger,/objectType === 'project'/);
 assert.match(trigger,/preferredRef = \$sourceRef/);
 assert.match(provision,/50032103/);
 assert.match(provision,/BAIS Projekt-Upsert/);
});
