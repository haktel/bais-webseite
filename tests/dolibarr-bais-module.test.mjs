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
