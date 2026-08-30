import test from"node:test";
import assert from"node:assert/strict";
import{firstIncompleteN8nModule,firstIncompletePriorN8nModule,moduleNumberFromSlug,moduleSlugFor}from"../functions/_lib/n8n-course-access.js";

function dbWith(progress={}){
 return{
  prepare(sql){
   return{
    bind:(userId,courseId,moduleSlug)=>({
     first:async()=>{
      if(sql.startsWith("SELECT module_percent FROM academy_module_progress"))
        return moduleSlug in progress?{module_percent:progress[moduleSlug]}:null;
      return null;
     }
    })
   };
  }
 };
}

test("module slug helpers are strict",()=>{
 assert.equal(moduleSlugFor(1),"modul-01");
 assert.equal(moduleSlugFor(12),"modul-12");
 assert.equal(moduleNumberFromSlug("modul-09"),9);
 assert.equal(moduleNumberFromSlug("modul-13"),0);
});

test("direct modul-04 access points to the first incomplete prerequisite",async()=>{
 const db=dbWith({"modul-01":100,"modul-02":80,"modul-03":0});
 assert.equal(await firstIncompletePriorN8nModule(db,"u1","c1","modul-04"),"modul-02");
});

test("direct modul-12 access unlocks only after modul-01 through modul-11 are 100%",async()=>{
 const progress={};
 for(let i=1;i<=11;i++)progress[moduleSlugFor(i)]=100;
 const db=dbWith(progress);
 assert.equal(await firstIncompletePriorN8nModule(db,"u1","c1","modul-12"),null);
 progress["modul-07"]=99;
 assert.equal(await firstIncompletePriorN8nModule(dbWith(progress),"u1","c1","modul-12"),"modul-07");
});

test("final exam gate returns first incomplete module",async()=>{
 const progress={};
 for(let i=1;i<=12;i++)progress[moduleSlugFor(i)]=100;
 assert.equal(await firstIncompleteN8nModule(dbWith(progress),"u1","c1"),null);
 progress["modul-10"]=60;
 assert.equal(await firstIncompleteN8nModule(dbWith(progress),"u1","c1"),"modul-10");
});
