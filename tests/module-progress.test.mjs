import test from"node:test";import assert from"node:assert/strict";
import{onRequestPost}from"../functions/api/academy/module-progress.js";

const future=new Date(Date.now()+3600_000).toISOString();
const allLessons=Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0"));
const progressRow=(lessons=[],labs=[],best=0)=>({
 completed_lessons_json:JSON.stringify(lessons),
 lab_cases_json:JSON.stringify(labs),
 assessment_best:best
});

function makeDb(getProgressRow,aggregate={total:0}){
 return{
  prepare(sql){
   return{
    bind:(...args)=>({
     run:async()=>({success:true}),
     first:async()=>{
      if(sql.startsWith("SELECT s.id AS session_id"))return{session_id:"s1",user_id:"u1",expires_at:future,status:"active"};
      if(sql.includes("FROM enrollments e JOIN course_runs"))return{id:"course-1",slug:"n8n-bootcamp"};
      if(sql.startsWith("SELECT completed_lessons_json,lab_cases_json,assessment_best FROM academy_module_progress"))return getProgressRow();
      if(sql.startsWith("SELECT COALESCE(SUM(module_percent),0)"))return aggregate;
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

test("modul-02 first lab case is accepted only after all lessons",async()=>{
 const db=makeDb(()=>progressRow(allLessons,[])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lab_case",{caseId:"single"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["single"]);
 assert.equal(body.module.sequence.nextLabCase,"batch");
});

test("modul-02 rejects a lab case id that isn't one of its three real cases",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lab_case",{caseId:"qualified"}),env});
 assert.equal(res.status,422);
});

test("modul-03 lesson_complete is accepted (regression: was missing from LESSONS_PER_MODULE)",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-03","lesson_complete",{lessonId:"01"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.completedLessons,["01"]);
});

test("modul-03 first lab case is accepted only after all lessons",async()=>{
 const db=makeDb(()=>progressRow(allLessons,[])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-03","lab_case",{caseId:"get"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["get"]);
 assert.equal(body.module.sequence.nextLabCase,"post");
});

test("n8n lesson 02 is blocked until lesson 01 is complete",async()=>{
 const db=makeDb(()=>progressRow([],[])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lesson_complete",{lessonId:"02"}),env});
 assert.equal(res.status,409);
});

test("n8n lab is blocked until all 12 lessons are complete",async()=>{
 const db=makeDb(()=>progressRow(["01","02"],[])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lab_case",{caseId:"single"}),env});
 assert.equal(res.status,409);
});

test("n8n later lab case is blocked until previous required case is complete",async()=>{
 const db=makeDb(()=>progressRow(allLessons,[])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","lab_case",{caseId:"batch"}),env});
 assert.equal(res.status,409);
});

test("n8n assessment is blocked until all required labs are complete",async()=>{
 const db=makeDb(()=>progressRow(allLessons,["single","batch"])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-02","assessment_result",{score:90}),env});
 assert.equal(res.status,409);
});

test("ki-fuehrerschein modul-02 lesson_complete is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-02","lesson_complete",{lessonId:"01"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-02",event:"lesson_complete",lessonId:"01"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.completedLessons,["01"]);
});

test("ki-fuehrerschein modul-02 lab_case 'kritisch' is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-02","lab_case",{caseId:"kritisch"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-02",event:"lab_case",caseId:"kritisch"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["kritisch"]);
});

test("ki-fuehrerschein modul-02 rejects a lab case id that belongs to n8n-bootcamp instead",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-02","lab_case",{caseId:"single"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-02",event:"lab_case",caseId:"single"});
 const res=await onRequestPost({request:req,env});
 assert.equal(res.status,422);
});

test("ki-fuehrerschein modul-03 lesson_complete is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-03","lesson_complete",{lessonId:"01"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-03",event:"lesson_complete",lessonId:"01"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.completedLessons,["01"]);
});

test("ki-fuehrerschein modul-03 lab_case 'unzureichend' is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-03","lab_case",{caseId:"unzureichend"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-03",event:"lab_case",caseId:"unzureichend"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["unzureichend"]);
});

test("ki-fuehrerschein modul-04 lesson_complete is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-04","lesson_complete",{lessonId:"01"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-04",event:"lesson_complete",lessonId:"01"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.completedLessons,["01"]);
});

test("ki-fuehrerschein modul-04 lab_case 'besondere_kategorie' is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-04","lab_case",{caseId:"besondere_kategorie"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-04",event:"lab_case",caseId:"besondere_kategorie"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["besondere_kategorie"]);
});

test("ki-fuehrerschein modul-05 lesson_complete is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-05","lesson_complete",{lessonId:"01"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-05",event:"lesson_complete",lessonId:"01"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.completedLessons,["01"]);
});

test("ki-fuehrerschein modul-05 lab_case 'unbelegt' is accepted",async()=>{
 const db=makeDb(()=>null),env={DB:db};
 const req=makeRequest("modul-05","lab_case",{caseId:"unbelegt"});
 req.json=async()=>({courseSlug:"ki-fuehrerschein",moduleSlug:"modul-05",event:"lab_case",caseId:"unbelegt"});
 const res=await onRequestPost({request:req,env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["unbelegt"]);
});

test("course-wide percent averages over all 12 real n8n modules",async()=>{
 const db=makeDb(()=>null,{total:1200}),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-12","lesson_complete",{lessonId:"01"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.equal(body.course.percent,100);
});

test("n8n modul-11 security lab respects required case order",async()=>{
 const db=makeDb(()=>progressRow(allLessons,["trusted","tampered","pii"])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-11","lab_case",{caseId:"ssrf"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["trusted","tampered","pii","ssrf"]);
 assert.equal(body.module.labTotal,5);
 assert.equal(body.module.sequence.nextLabCase,"destructive");
});

test("n8n modul-12 capstone lab case is accepted in required order",async()=>{
 const db=makeDb(()=>progressRow(allLessons,["happy","high","invalid","security"])),env={DB:db};
 const res=await onRequestPost({request:makeRequest("modul-12","lab_case",{caseId:"weakroi"}),env});
 const body=await res.json();
 assert.equal(res.status,200);
 assert.deepEqual(body.module.labCases,["happy","high","invalid","security","weakroi"]);
 assert.equal(body.module.lessonTotal,12);
 assert.equal(body.module.labTotal,5);
 assert.equal(body.module.sequence.assessmentUnlocked,true);
});
