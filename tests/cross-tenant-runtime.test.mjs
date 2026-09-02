import test from "node:test";
import assert from "node:assert/strict";
import {hasCustomerContentAccess,setCustomerContentAccess} from "../functions/_lib/customer-access.js";

class Statement {
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async first(){
  if(this.sql.includes("FROM customer_access_grants")){
   const[organizationId,contentKey,projectId]=this.args;
   return organizationId==="org-a"&&contentKey==="project_portal"&&projectId==="project-a"?{ok:1}:null;
  }
  if(this.sql.includes("FROM customer_accounts WHERE"))return this.args[0]==="org-a"?{organization_id:"org-a"}:null;
  if(this.sql.includes("FROM projects WHERE")){
   const[projectId,organizationId]=this.args;
   return projectId==="project-a"&&organizationId==="org-a"?{id:"project-a"}:null;
  }
  throw new Error("Unexpected first(): "+this.sql);
 }
 async run(){this.db.runs.push({sql:this.sql,args:this.args});return{success:true};}
}

class FakeDb {
 constructor(){this.runs=[];this.batches=[];}
 prepare(sql){return new Statement(this,sql);}
 async batch(statements){this.batches.push(statements);return statements.map(()=>({success:true}));}
}

test("BS-11 runtime: access is granted only to the matching organization and project",async()=>{
 const db=new FakeDb();
 const now="2026-09-02T12:00:00.000Z";

 assert.equal(await hasCustomerContentAccess(db,{organizationId:"org-a",contentKey:"project_portal",projectId:"project-a",now}),true);
 assert.equal(await hasCustomerContentAccess(db,{organizationId:"org-b",contentKey:"project_portal",projectId:"project-a",now}),false);
 assert.equal(await hasCustomerContentAccess(db,{organizationId:"org-a",contentKey:"project_portal",projectId:"project-b",now}),false);
});

test("BS-11 runtime: an admin cannot grant a customer access to another tenant's project",async()=>{
 const db=new FakeDb();

 await assert.rejects(
  setCustomerContentAccess(db,{
   organizationId:"org-a",
   contentKey:"project_portal",
   projectId:"project-b",
   enabled:true,
   actorUserId:"admin-1"
  }),
  error=>error?.status===404&&error?.code==="project_not_found"
 );

 assert.equal(db.runs.some(call=>call.sql.includes("INSERT INTO customer_access_grants")),false);
 assert.equal(db.runs.some(call=>call.sql.includes("INSERT INTO audit_events")),false);
});
