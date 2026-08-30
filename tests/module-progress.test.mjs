import test from"node:test";import assert from"node:assert/strict";
import{onRequestPost}from"../functions/api/academy/module-progress.js";

const future=new Date(Date.now()+3600_000).toISOString();

function makeDb(getProgressRow){
 return{
  prepare(sql){
   return{
    bind:(...args)=>({
     run:async()=>({success:true}),
     first:async()=>{
      if(sql.startsWith("SELECT s.id AS session_id"))return{session_id:"s1",user_id:"u1",expires_at:future,status:"active"};
      if(sql.includes("FROM enrollments e JOIN course_runs"))return{id:"course-1",slug:"n8n-bootcamp"};
      if(sql.startsWith("SELECT completed_lessons_json,lab_cases_json,assessment_best FROM academy_module_progress"))return getProgressRow();
      if(sql.startsWith("SELECT COALESCE(SUM(module_percent),0)"))return{total:0};
      return null;
     }
    }),
    run:async()=>({success:true})
   };
  },
  batch:async statements=>{for(const s of statements)await s.run?.();return statements.map(()=>({success:true}));}
 };
}

function makeRequest(moduleSlug,event,extra){
 return{
  url:"https://bais-solutions.de/api/academy/module-progress",
  headers:{get:name=>({cookie:"__Host-bais_session=faketoken",origin:"https://bais-solutions.de","content-length":"200","content-type":"application/json"}[name.toLowerCase()]??null)},
  json:async()=>({courseSlug:"n8n-bootcamp",moduleSlug,event,...extra})
 };
}

test("modul-02 lesson_complete is accepted (regression: was missing from LESSONS_PER_MODULE)",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lesson_complete",{lessonId:"01"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.completedLessons,["01"]);
});

test("modul-02 lab_case 'single' is accepted (regression: was missing from LAB_CASES)",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lab_case",{caseId:"single"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["single"]);
});

test("modul-02 rejects a lab case id that isn't one of its three real cases",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lab_case",{caseId:"qualified"}),env});
 assert.equal(res.status,422);
});
