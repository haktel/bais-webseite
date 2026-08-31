import test from"node:test";
import assert from"node:assert/strict";
import{ensureLeadScoringSchema}from"../functions/_lib/lead-scoring-schema.js";

const fakeDb=existing=>{
 const calls=[];
 return{
  calls,
  prepare(sql){
   calls.push(sql);
   return{
    async all(){
     if(sql.startsWith("PRAGMA table_info("))return{results:[...existing].map(name=>({name}))};
     return{results:[]};
    },
    async run(){
     const match=sql.match(/ADD COLUMN (\w+)/);
     if(match)existing.add(match[1]);
     return{success:true};
    }
   };
  }
 };
};

test("lead scoring guard adds missing contact columns and index",async()=>{
 const db=fakeDb(new Set(["id","name"]));
 await ensureLeadScoringSchema(db,"contacts");
 assert.ok(db.calls.some(sql=>sql.includes("ADD COLUMN score INTEGER")));
 assert.ok(db.calls.some(sql=>sql.includes("ADD COLUMN route TEXT")));
 assert.ok(db.calls.some(sql=>sql.includes("ADD COLUMN n8n_execution_id TEXT")));
 assert.ok(db.calls.some(sql=>sql.includes("idx_contacts_route_score")));
});

test("lead scoring guard adds missing enrollment columns and index",async()=>{
 const db=fakeDb(new Set(["id","course_id"]));
 await ensureLeadScoringSchema(db,"enrollment_requests");
 assert.ok(db.calls.some(sql=>sql.includes("ADD COLUMN score INTEGER")));
 assert.ok(db.calls.some(sql=>sql.includes("ADD COLUMN route TEXT")));
 assert.ok(db.calls.some(sql=>sql.includes("ADD COLUMN n8n_execution_id TEXT")));
 assert.ok(db.calls.some(sql=>sql.includes("idx_enrollment_requests_route_score")));
});

test("admin endpoints heal schema before selecting lead-scoring columns",async()=>{
 const fs=await import("node:fs");
 const contact=fs.readFileSync(new URL("../functions/api/admin/contacts.js",import.meta.url),"utf8");
 const enrollment=fs.readFileSync(new URL("../functions/api/admin/enrollment-requests.js",import.meta.url),"utf8");
 assert.match(contact,/ensureLeadScoringSchema\(db,"contacts"\)/);
 assert.match(enrollment,/ensureLeadScoringSchema\(db,"enrollment_requests"\)/);
});
