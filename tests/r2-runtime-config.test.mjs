import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("production declares native R2 binding while keeping aws4fetch as optional S3 mode",()=>{
 const pkg=JSON.parse(read("package.json"));
 const wrangler=JSON.parse(read("wrangler.jsonc"));
 const helper=read("functions/_lib/r2-documents.js");
 assert.match(pkg.dependencies.aws4fetch,/^\^1\.0\.20$/);
 assert.equal(wrangler.d1_databases[0].binding,"DB");
 assert.equal(wrangler.d1_databases[0].database_id,"0f4ed49b-6a7c-4645-9737-750fced2ecb8");
 assert.equal(wrangler.r2_buckets[0].binding,"PROJECT_DOCUMENTS");
 assert.equal(wrangler.r2_buckets[0].bucket_name,"bais-project-documents");
 assert.match(helper,/PROJECT_DOCUMENTS/);
 assert.match(helper,/r2StorageMode/);
 assert.match(helper,/new AwsClient/);
 assert.match(helper,/signQuery:true/);
});

test("native R2 path needs no browser credentials and S3-direct provisioning is optional",()=>{
 const workflow=read(".github/workflows/r2-runtime-provision.yml");
 const upload=read("functions/api/customer/documents/upload.js");
 const file=read("functions/api/customer/documents/file.js");
 assert.match(workflow,/workflow_dispatch/);
 assert.doesNotMatch(workflow,/push:\s*\n/);
 assert.match(workflow,/R2_S3_DIRECT_STATUS=OPTIONAL_NOT_CONFIGURED/);
 assert.match(upload,/putIncomingObject/);
 assert.match(upload,/TransformStream/);
 assert.match(file,/getNativeObject/);
 assert.doesNotMatch(read("assets/customer-portal.js"),/R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
 assert.doesNotMatch(read("functions/api/customer/portal.js"),/R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY/);
});
