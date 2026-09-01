import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("R2 runtime uses aws4fetch and a private production-origin CORS contract",()=>{
 const pkg=JSON.parse(read("package.json"));
 const cors=JSON.parse(read("config/r2/project-documents-cors.json"));
 const lifecycle=JSON.parse(read("config/r2/project-documents-lifecycle.json"));
 const workflow=read(".github/workflows/r2-runtime-provision.yml");
 assert.match(pkg.dependencies.aws4fetch,/^\^1\.0\.20$/);
 assert.deepEqual(cors.rules[0].allowed.origins,["https://bais-solutions.de"]);
 assert.ok(cors.rules[0].allowed.methods.includes("PUT"));
 assert.deepEqual(cors.rules[0].allowed.headers,["Content-Type"]);
 assert.equal(lifecycle.rules[0].conditions.prefix,"incoming/customer-documents/");
 assert.equal(lifecycle.rules[0].deleteObjectsTransition.condition.maxAge,86400);
 assert.match(workflow,/R2_ACCESS_KEY_ID/);
 assert.match(workflow,/R2_SECRET_ACCESS_KEY/);
 assert.match(workflow,/\/r2\/buckets\/\$\{R2_BUCKET_NAME\}\/cors/);
 assert.match(workflow,/\/r2\/buckets\/\$\{R2_BUCKET_NAME\}\/lifecycle/);
 assert.match(workflow,/R2_STATUS=PROJECT_PORTAL_STORAGE_PROVISIONED/);
});

test("R2 storage helper never exposes credentials and uses short-lived presigned operations",()=>{
 const helper=read("functions/_lib/r2-documents.js");
 assert.match(helper,/new AwsClient/);
 assert.match(helper,/signQuery:true/);
 assert.match(helper,/DOCUMENT_UPLOAD_TTL_SECONDS=180/);
 assert.match(helper,/DOCUMENT_DOWNLOAD_TTL_SECONDS=300/);
 assert.doesNotMatch(read("assets/customer-portal.js"),/R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
 assert.doesNotMatch(read("functions/api/customer/portal.js"),/R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
});
