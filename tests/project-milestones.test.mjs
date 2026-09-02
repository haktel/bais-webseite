import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{MODULE_MILESTONE_TEMPLATES,seedProjectMilestones}from"../functions/_lib/project-milestones.js";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

const fakeDb=({hasExisting=false}={})=>{
 const batchCalls=[];
 const db={
  prepare(sql){
   return{bind(...args){return{sql,args,first:async()=>hasExisting?{present:1}:null};}};
  },
  async batch(statements){batchCalls.push(statements);return statements.map(()=>({success:true}));}
 };
 return{db,batchCalls};
};

test("seedProjectMilestones is idempotent and never duplicates milestones for a project that already has some",async()=>{
 const{db,batchCalls}=fakeDb({hasExisting:true});
 const result=await seedProjectMilestones(db,{projectId:"p1",organizationId:"org1",modules:["MOD-01"],actorUserId:"admin1"});
 assert.deepEqual(result,{seeded:false,count:0});
 assert.equal(batchCalls.length,0);
});

test("seedProjectMilestones is a no-op when no known module codes are selected",async()=>{
 const{db,batchCalls}=fakeDb({hasExisting:false});
 const result=await seedProjectMilestones(db,{projectId:"p1",organizationId:"org1",modules:["MOD-99"],actorUserId:"admin1"});
 assert.deepEqual(result,{seeded:false,count:0});
 assert.equal(batchCalls.length,0);
});

test("seedProjectMilestones seeds de-duplicated template milestones per module scoped to the project, plus an audit event",async()=>{
 const{db,batchCalls}=fakeDb({hasExisting:false});
 const result=await seedProjectMilestones(db,{projectId:"p1",organizationId:"org1",modules:["MOD-01","MOD-02"],actorUserId:"admin1"});
 const expectedCount=MODULE_MILESTONE_TEMPLATES["MOD-01"].length+MODULE_MILESTONE_TEMPLATES["MOD-02"].length;
 assert.equal(result.seeded,true);
 assert.equal(result.count,expectedCount);
 assert.equal(batchCalls.length,1);
 const statements=batchCalls[0];
 const milestoneInserts=statements.filter(s=>s.sql.startsWith("INSERT INTO milestones"));
 assert.equal(milestoneInserts.length,expectedCount);
 assert.ok(milestoneInserts.every(s=>s.args[1]==="p1"),"every milestone row must be scoped to the signed project");
 const positions=milestoneInserts.map(s=>s.args[5]);
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b),"milestones must keep a stable ordered position");
 const audit=statements.find(s=>s.sql.startsWith("INSERT INTO audit_events"));
 assert.ok(audit,"seeding milestones must be audit-logged");
 assert.equal(audit.args[1],"admin1");
 assert.equal(audit.args[2],"org1");
 assert.equal(audit.args[3],"project.milestones.seeded");
 assert.equal(audit.args[5],"p1");
});

test("seedProjectMilestones de-duplicates a milestone title shared by two selected modules",async()=>{
 const{db}=fakeDb({hasExisting:false});
 const result=await seedProjectMilestones(db,{projectId:"p1",organizationId:"org1",modules:["MOD-01","MOD-01"],actorUserId:"admin1"});
 assert.equal(result.count,MODULE_MILESTONE_TEMPLATES["MOD-01"].length);
});

test("signing a SOW seeds project milestones from the contracted modules",()=>{
 const api=read("functions/api/commercial/sow.js");
 assert.match(api,/import\{seedProjectMilestones\}from"\.\.\/\.\.\/_lib\/project-milestones\.js"/);
 assert.match(api,/seedProjectMilestones\(db,\{projectId,organizationId,modules:result\.modules\.map\(m=>m\.code\),actorUserId:admin\.user_id/);
 assert.match(api,/milestones:\{seeded:milestones\.seeded,count:milestones\.count\}/);
});
