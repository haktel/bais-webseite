import test from "node:test";
import assert from "node:assert/strict";
import {enqueueProjectIntegrations} from "../functions/_lib/project-sync.js";

class FakeStatement {
 constructor(db,sql){this.db=db;this.sql=sql;this.bindings=[];}
 bind(...bindings){this.bindings=bindings;return this;}
 async first(){
  if(this.sql.includes("SELECT sow_status FROM project_sow"))return this.db.sow;
  throw new Error("Unexpected first(): "+this.sql);
 }
}

class FakeDb {
 constructor(sow){this.sow=sow;this.batches=[];}
 prepare(sql){return new FakeStatement(this,sql);}
 async batch(statements){this.batches.push(statements);return statements.map(()=>({success:true}));}
}

test("runtime: unsigned SOW never queues Dolibarr or Jira",async()=>{
 const db=new FakeDb({sow_status:"approved"});
 const result=await enqueueProjectIntegrations(db,{projectId:"project-1",now:"2026-09-02T08:00:00.000Z"});

 assert.deepEqual(result,{queued:false,reason:"sow_not_signed"});
 // The first batch only contains the idempotent schema guards.
 assert.equal(db.batches.length,1);
});

test("runtime: signed SOW queues exactly one retry-safe job per external target",async()=>{
 const db=new FakeDb({sow_status:"signed"});
 const now="2026-09-02T08:00:00.000Z";
 const result=await enqueueProjectIntegrations(db,{projectId:"project-1",now});

 assert.deepEqual(result,{queued:true});
 assert.equal(db.batches.length,2);
 const jobs=db.batches[1];
 assert.equal(jobs.length,3);
 assert.match(jobs[0].sql,/project_integration_links/);
 assert.match(jobs[0].sql,/ON CONFLICT\(project_id\) DO UPDATE/);
 assert.match(jobs[1].sql,/VALUES\(\?,\?,'dolibarr','pending'/);
 assert.match(jobs[2].sql,/VALUES\(\?,\?,'jira','pending'/);
 assert.match(jobs[1].sql,/ON CONFLICT\(project_id,target\) DO UPDATE/);
 assert.match(jobs[2].sql,/ON CONFLICT\(project_id,target\) DO UPDATE/);
 assert.equal(jobs[1].bindings[1],"project-1");
 assert.equal(jobs[2].bindings[1],"project-1");
 assert.equal(jobs[1].bindings[2],now);
 assert.equal(jobs[2].bindings[2],now);
});

test("runtime: a missing SOW fails closed",async()=>{
 const db=new FakeDb(null);

 await assert.rejects(
  enqueueProjectIntegrations(db,{projectId:"project-404"}),
  error=>error?.status===404&&error?.code==="sow_not_found"
 );
 assert.equal(db.batches.length,1);
});
