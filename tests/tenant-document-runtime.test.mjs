import test from"node:test";
import assert from"node:assert/strict";
import{onRequestGet as downloadDocument}from"../functions/api/customer/documents/download.js";
import{onRequestGet as readNativeDocument}from"../functions/api/customer/documents/file.js";
import{onRequestPut as uploadDocument}from"../functions/api/customer/documents/upload.js";
import{onRequestPost as requestUpload}from"../functions/api/customer/documents/upload-url.js";
import{onRequestPost as finalizeUpload}from"../functions/api/customer/documents/finalize.js";

class Statement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async first(){
  this.db.firsts.push({sql:this.sql,args:this.args});
  if(this.sql.includes("FROM user_sessions s JOIN users u"))return{
   session_id:"session-a",user_id:"user-a",expires_at:"2099-01-01T00:00:00.000Z",
   last_seen_at:new Date().toISOString(),user_agent_hash:null,display_name:"Customer A",
   email:"customer-a@example.invalid",role:"customer",status:"active"
  };
  if(this.sql.includes("FROM users u JOIN customer_accounts ca"))return{organization_id:"org-a",customer_number:"KD-A",account_status:"active"};
  if(this.sql.includes("FROM customer_access_grants"))return{ok:1};
  if(this.sql.includes("FROM projects WHERE id=? AND organization_id=?")){
   const[projectId,organizationId]=this.args;
   return projectId==="project-a"&&organizationId==="org-a"?{id:"project-a"}:null;
  }
  if(this.sql.includes("FROM documents d JOIN projects p")||this.sql.includes("FROM documents d ")){
   const[documentId,organizationId]=this.args;
   return documentId==="doc-a"&&organizationId==="org-a"?{id:"doc-a",project_id:"project-a",name:"a.pdf",r2_key:"customers/org-a/projects/project-a/documents/doc-a/a.pdf",mime_type:"application/pdf",actual_size:10}:null;
  }
  if(this.sql.includes("FROM document_uploads du JOIN projects p")){
   const[uploadId,organizationId,projectOrganizationId]=this.args;
   return uploadId==="upload-a"&&organizationId==="org-a"&&projectOrganizationId==="org-a"?{
    id:"upload-a",organization_id:"org-a",project_id:"project-a",incoming_key:"incoming/upload-a",original_name:"a.pdf",
    mime_type:"application/pdf",declared_size:10,status:"pending",created_by:"user-a",expires_at:"2099-01-01T00:00:00.000Z"
   }:null;
  }
  return null;
 }
 async run(){this.db.runs.push({sql:this.sql,args:this.args});return{success:true,meta:{changes:1}};}
 async all(){return{results:[]};}
}
class FakeDb{
 constructor(){this.runs=[];this.firsts=[];this.batches=[];}
 prepare(sql){return new Statement(this,sql);}
 async batch(statements){this.batches.push(statements);return statements.map(()=>({success:true}));}
}

const request=(path,{method="GET",body}={})=>new Request("https://bais-solutions.de"+path,{
 method,
 headers:{cookie:"__Host-bais_session=test-session",origin:"https://bais-solutions.de","user-agent":"tenant-runtime-test",...(body?{"content-type":"application/json"}:{})},
 body:body?JSON.stringify(body):undefined
});
const environment=()=>{
 const db=new FakeDb(),r2Calls={get:0,put:0,head:0};
 const bucket={
  async get(){r2Calls.get++;return null;},
  async put(){r2Calls.put++;throw new Error("R2 must not be reached for cross-tenant requests");},
  async head(){r2Calls.head++;return null;}
 };
 return{db,r2Calls,env:{DB:db,PROJECT_DOCUMENTS:bucket}};
};
const errorCode=async response=>(await response.clone().json()).error?.code;

for(const [name,handler,path]of[
 ["download URL",downloadDocument,"/api/customer/documents/download?id=doc-b"],
 ["native file read",readNativeDocument,"/api/customer/documents/file?id=doc-b"]
]){
 test(`tenant runtime: customer A cannot read customer B document via ${name}`,async()=>{
  const{db,r2Calls,env}=environment();
  const response=await handler({request:request(path),env});
  assert.equal(response.status,404);
  assert.equal(await errorCode(response),"document_not_found");
  assert.deepEqual(r2Calls,{get:0,put:0,head:0});
  assert.equal(db.runs.some(x=>x.sql.includes("audit_events")),false);
  const lookup=db.firsts.find(x=>x.sql.includes("FROM documents d"));
  assert.deepEqual(lookup.args,["doc-b","org-a"]);
 });
}

test("tenant runtime: wildcard portal entitlement cannot start an upload for another tenant project",async()=>{
 const{db,r2Calls,env}=environment();
 const response=await requestUpload({request:request("/api/customer/documents/upload-url",{method:"POST",body:{projectId:"project-b",fileName:"b.pdf",mimeType:"application/pdf",sizeBytes:10}}),env});
 assert.equal(response.status,404);
 assert.equal(await errorCode(response),"project_not_found");
 assert.deepEqual(r2Calls,{get:0,put:0,head:0});
 assert.equal(db.runs.some(x=>x.sql.includes("INSERT INTO document_uploads")),false);
 const ownership=db.firsts.find(x=>x.sql.includes("FROM projects WHERE id=? AND organization_id=?"));
 assert.deepEqual(ownership.args,["project-b","org-a"]);
});

test("tenant runtime: customer A cannot PUT bytes into customer B pending upload",async()=>{
 const{db,r2Calls,env}=environment();
 const response=await uploadDocument({request:request("/api/customer/documents/upload?id=upload-b",{method:"PUT"}),env});
 assert.equal(response.status,404);
 assert.equal(await errorCode(response),"upload_not_found");
 assert.deepEqual(r2Calls,{get:0,put:0,head:0});
 const lookup=db.firsts.find(x=>x.sql.includes("FROM document_uploads du JOIN projects p"));
 assert.deepEqual(lookup.args,["upload-b","org-a","org-a"]);
});

test("tenant runtime: customer A cannot finalize customer B pending upload",async()=>{
 const{db,r2Calls,env}=environment();
 const response=await finalizeUpload({request:request("/api/customer/documents/finalize",{method:"POST",body:{uploadId:"upload-b"}}),env});
 assert.equal(response.status,404);
 assert.equal(await errorCode(response),"upload_not_found");
 assert.deepEqual(r2Calls,{get:0,put:0,head:0});
 assert.equal(db.runs.some(x=>x.sql.includes("status='finalizing'")),false);
 const lookup=db.firsts.find(x=>x.sql.includes("FROM document_uploads du JOIN projects p"));
 assert.deepEqual(lookup.args,["upload-b","org-a","org-a"]);
});
