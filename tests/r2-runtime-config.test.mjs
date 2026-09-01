import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("production supports native R2 binding while retaining aws4fetch S3 mode",()=>{
 const pkg=JSON.parse(read("package.json"));
 const helper=read("functions/_lib/r2-documents.js");
 assert.match(pkg.dependencies.aws4fetch,/^\^1\.0\.20$/);
 assert.match(helper,/PROJECT_DOCUMENTS/);
 assert.match(helper,/r2StorageMode/);
 assert.match(helper,/new AwsClient/);
 assert.match(helper,/signQuery:true/);
 assert.match(helper,/putIncomingObject/);
 assert.match(helper,/getNativeObject/);
});

test("S3-direct provisioning is optional and missing secrets do not fail main",()=>{
 const workflow=read(".github/workflows/r2-runtime-provision.yml");
 assert.match(workflow,/workflow_dispatch/);
 assert.doesNotMatch(workflow,/push:\s*\n/);
 assert.match(workflow,/R2_S3_DIRECT_STATUS=OPTIONAL_NOT_CONFIGURED/);
 assert.doesNotMatch(read("assets/customer-portal.js"),/R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
 assert.doesNotMatch(read("functions/api/customer/portal.js"),/R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
});
