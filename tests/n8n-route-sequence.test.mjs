import test from"node:test";
import assert from"node:assert/strict";
import{onRequest}from"../functions/academy/n8n-bootcamp/_middleware.js";

const future=new Date(Date.now()+3600_000).toISOString();

function makeDb(progress={},role="student"){
  return{
    prepare(sql){
      return{
        bind:(...args)=>({
          first:async()=>{
            if(sql.startsWith("SELECT s.id AS session_id"))return{session_id:"s1",user_id:"u1",expires_at:future,display_name:"Learner",email:"learner@example.com",role,status:"active"};
            if(sql.includes("SELECT c.id AS course_id,e.status FROM enrollments"))return{course_id:"course-n8n",status:"active"};
            if(sql.startsWith("SELECT module_percent FROM academy_module_progress")){
              const slug=args[2];
              return slug in progress?{module_percent:progress[slug]}:null;
            }
            return null;
          },
          run:async()=>({success:true})
        }),
        run:async()=>({success:true})
      };
    },
    batch:async statements=>statements.map(()=>({success:true}))
  };
}

function context(path,progress={},role="student"){
  return{
    request:new Request("https://bais-solutions.de"+path,{headers:{cookie:"__Host-bais_session=fake"}}),
    env:{DB:makeDb(progress,role)},
    next:async()=>new Response("NEXT",{status:200})
  };
}

test("direct module 01 access stays available for an enrolled learner",async()=>{
  const response=await onRequest(context("/academy/n8n-bootcamp/modul-01/"));
  assert.equal(response.status,200);
  assert.equal(await response.text(),"NEXT");
});

test("direct module 05 access redirects to the FIRST incomplete prerequisite, not only module 04",async()=>{
  const response=await onRequest(context("/academy/n8n-bootcamp/modul-05/",{
    "modul-01":100,
    "modul-02":100,
    "modul-03":40,
    "modul-04":100
  }));
  assert.equal(response.status,302);
  const location=response.headers.get("location");
  assert.match(location,/\/academy\/n8n-bootcamp\/modul-03\//);
  assert.match(location,/reason=module_sequence_locked/);
  assert.match(location,/requested=modul-05/);
});

test("admin learner cannot bypass an incomplete earlier module",async()=>{
  const response=await onRequest(context("/academy/n8n-bootcamp/modul-05/",{
    "modul-01":100,
    "modul-02":60,
    "modul-03":100,
    "modul-04":100
  },"admin"));
  assert.equal(response.status,302);
  assert.match(response.headers.get("location"),/\/academy\/n8n-bootcamp\/modul-02\//);
});

test("direct module 05 access opens only after every earlier module is 100%",async()=>{
  const response=await onRequest(context("/academy/n8n-bootcamp/modul-05/",{
    "modul-01":100,
    "modul-02":100,
    "modul-03":100,
    "modul-04":100
  }));
  assert.equal(response.status,200);
  assert.equal(await response.text(),"NEXT");
});

test("final exam direct URL redirects to first incomplete module",async()=>{
  const progress={};
  for(let i=1;i<=12;i++)progress["modul-"+String(i).padStart(2,"0")]=100;
  progress["modul-07"]=80;
  const response=await onRequest(context("/academy/n8n-bootcamp/abschlusspruefung/",progress));
  assert.equal(response.status,302);
  assert.match(response.headers.get("location"),/\/academy\/n8n-bootcamp\/modul-07\//);
  assert.match(response.headers.get("location"),/reason=final_exam_locked/);
});

test("public n8n landing page is not forced through enrollment middleware",async()=>{
  const response=await onRequest({
    request:new Request("https://bais-solutions.de/academy/n8n-bootcamp/"),
    env:{DB:makeDb({})},
    next:async()=>new Response("PUBLIC",{status:200})
  });
  assert.equal(response.status,200);
  assert.equal(await response.text(),"PUBLIC");
});
