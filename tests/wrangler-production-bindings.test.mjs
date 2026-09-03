import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

test("production Wrangler configuration binds the existing D1 database and native R2 bucket",()=>{
 const source=fs.readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8");
 const config=JSON.parse(source);
 assert.equal(config.name,"bais-webseite");
 assert.equal(config.pages_build_output_dir,".");
 assert.deepEqual(config.d1_databases,[{
  binding:"DB",
  database_name:"bais-platform",
  database_id:"0f4ed49b-6a7c-4645-9737-750fced2ecb8",
  migrations_dir:"migrations"
 }]);
 assert.deepEqual(config.r2_buckets,[{
  binding:"PROJECT_DOCUMENTS",
  bucket_name:"bais-project-documents"
 }]);
});
