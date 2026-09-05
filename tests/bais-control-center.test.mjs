import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("BAIS Control Center is consolidated into the /admin/ dashboard",()=>{
 const middleware=read("functions/bais-control-center/_middleware.js");
 assert.match(middleware,/Response\.redirect/);
 assert.match(middleware,/\/admin\//);
});

test("Security audit checks the bais-control-center redirect target",()=>{
 const audit=read("scripts/security-live-audit.sh");
 assert.match(audit,/check_redirect "\/bais-control-center\/" "\/admin\//);
});
