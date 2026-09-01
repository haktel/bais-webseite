import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("customer documents are protected by server-side session middleware",()=>{
 for(const path of["functions/angebot/_middleware.js","functions/abnahme/_middleware.js"]){
  const source=read(path);
  assert.match(source,/requireCustomerDocumentAccess/);
  assert.match(source,/context\.next\(\)/);
  assert.match(source,/customerLoginRedirect/);
 }
 const helper=read("functions/_lib/customer-access.js");
 assert.match(helper,/requireSession/);
 assert.match(helper,/admin/);
 assert.match(helper,/customer/);
 assert.match(helper,/student/);
});

test("commercial context never exposes customer context anonymously",()=>{
 const source=read("functions/api/commercial/context.js");
 assert.match(source,/const session=await requireSession\(db,request\)/);
 assert.doesNotMatch(source,/authenticated:false/);
});

test("customer project reads stay tenant-scoped while project creation is admin-only",()=>{
 const source=read("functions/api/commercial/projects.js");
 assert.match(source,/ensureCommercialIdentityForUser/);
 assert.match(source,/WHERE p\.organization_id=\?/);
 assert.match(source,/Dieser Endpoint ist auf das eigene Kundenkonto beschränkt/);
 assert.match(source,/requireAdmin\(db,request\)/);
 assert.match(source,/createProjectForOrganization/);
 assert.doesNotMatch(source,/createProjectForUser/);
});

test("public project flow does not link directly to protected customer documents",()=>{
 const html=read("projektablauf/index.html");
 assert.doesNotMatch(html,/href="\.\.\/abnahme\//);
 assert.doesNotMatch(html,/href="\.\.\/angebot\//);
});

test("customer document drafts are session scoped and cleared at auth boundaries",()=>{
 for(const path of["angebot/index.html","abnahme/index.html"]){
  const html=read(path);
  assert.match(html,/sessionStorage/);
  assert.doesNotMatch(html,/localStorage/);
 }
 const account=read("assets/academy-account.js");
 assert.match(account,/clearPrivateBrowserState/);
 assert.match(account,/key\.startsWith\("bais-"\)/);
 assert.match(account,/value==="\/angebot\/"/);
 assert.match(account,/value==="\/abnahme\/"/);
});
