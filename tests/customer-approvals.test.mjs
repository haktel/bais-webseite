import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{ApiError}from"../functions/_lib/api.js";
import{classifyApiPath}from"../functions/_lib/api-access-policy.js";
import{requestProjectApproval}from"../functions/_lib/approvals.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const fakeDb=({project=null}={})=>{
 const batchCalls=[];
 const db={
  prepare(sql){
   return{
    bind(...args){return{sql,args,first:async()=>sql.startsWith("SELECT id,organization_id FROM projects")?project:null};},
    all:async()=>({results:[{name:"decision_note"}]}),
    run:async()=>({success:true})
   };
  },
  async batch(statements){batchCalls.push(statements);return statements.map(()=>({success:true}));}
 };
 return{db,batchCalls};
};

test("requestProjectApproval rejects a project that does not exist",async()=>{
 const{db,batchCalls}=fakeDb({project:null});
 await assert.rejects(
  ()=>requestProjectApproval(db,{projectId:"missing",subject:"Design-Freigabe",actorUserId:"admin1"}),
  error=>error instanceof ApiError&&error.status===404
 );
 assert.equal(batchCalls.length,0);
});

test("requestProjectApproval creates a pending approval scoped to the project's organization and audit-logs it",async()=>{
 const{db,batchCalls}=fakeDb({project:{id:"p1",organization_id:"org1"}});
 const result=await requestProjectApproval(db,{projectId:"p1",subject:"Design-Freigabe",actorUserId:"admin1"});
 assert.equal(result.status,"pending");
 assert.equal(result.projectId,"p1");
 assert.equal(batchCalls.length,1);
 const statements=batchCalls[0];
 const insert=statements.find(s=>s.sql.startsWith("INSERT INTO approvals"));
 assert.ok(insert);
 assert.equal(insert.args[1],"p1");
 assert.equal(insert.args[2],"Design-Freigabe");
 assert.equal(insert.args[3],"admin1");
 const audit=statements.find(s=>s.sql.startsWith("INSERT INTO audit_events"));
 assert.ok(audit);
 assert.equal(audit.args[1],"admin1");
 assert.equal(audit.args[2],"org1");
 assert.equal(audit.args[3],"project.approval.requested");
});

test("BS-8 API firewall: admin request-approval route is admin-MFA protected, customer decide route requires project_portal entitlement",()=>{
 assert.equal(classifyApiPath("/api/admin/project-approvals").mode,"admin_mfa");
 assert.deepEqual(classifyApiPath("/api/customer/approvals/decide"),{mode:"customer_content",contentKey:"project_portal"});
});

test("admin can only request approvals for signed projects and every write is origin- and MFA-protected",()=>{
 const api=read("functions/api/admin/project-approvals.js");
 assert.match(api,/requireAdmin\(db,request\)/);
 assert.match(api,/assertSameOrigin/);
 assert.match(api,/validation_failed/);
 assert.match(api,/s\.sow_status='signed'/);
 assert.match(api,/requestProjectApproval/);
});

test("customer approval decision is origin-protected, tenant-scoped, entitlement-gated, rate-limited and single-shot",()=>{
 const api=read("functions/api/customer/approvals/decide.js");
 assert.match(api,/assertSameOrigin/);
 assert.match(api,/session\.role!=="customer"/);
 assert.match(api,/approval\.organization_id!==customer\.organizationId/);
 assert.match(api,/hasCustomerContentAccess\(db,\{organizationId:customer\.organizationId,contentKey:"project_portal",projectId:approval\.project_id\}\)/);
 assert.match(api,/approval\.status!=="pending"/);
 assert.match(api,/status='pending'/);
 assert.match(api,/consumeRateLimit\(db,request,"customer-approval-decide"/);
 assert.match(api,/customer\.approval\.approved.*customer\.approval\.rejected/);
});

test("approval schema healer adds the decision_note column and a lookup index without depending on the migration having run",()=>{
 const lib=read("functions/_lib/approvals.js");
 assert.match(lib,/PRAGMA table_info\(approvals\)/);
 assert.match(lib,/ALTER TABLE approvals ADD COLUMN decision_note TEXT/);
 assert.match(lib,/duplicate column name/i);
 assert.match(lib,/idx_approvals_project_status/);
 const migration=read("migrations/0020_approval_decision_note.sql");
 assert.match(migration,/ALTER TABLE approvals ADD COLUMN decision_note TEXT/);
});

test("admin control center exposes a Kunden-Freigaben tab to request approvals",()=>{
 const html=read("admin/index.html");
 const script=read("assets/admin.js");
 assert.match(html,/data-tab="approvals"/);
 assert.match(html,/data-view="approvals"/);
 assert.match(script,/data-approval-request-form/);
 assert.match(script,/\/api\/admin\/project-approvals/);
});

test("customer Project Portal renders Freigeben/Ablehnen actions only for pending approvals and calls the decide endpoint",()=>{
 const script=read("assets/customer-portal.js");
 assert.match(script,/data-approval-decide/);
 assert.match(script,/x\.status==="pending"\?/);
 assert.match(script,/Freigeben/);
 assert.match(script,/Ablehnen/);
 assert.match(script,/\/api\/customer\/approvals\/decide/);
});
