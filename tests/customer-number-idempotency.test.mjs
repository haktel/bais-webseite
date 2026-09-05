import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import{ensureCommercialIdentityForLead}from"../functions/_lib/commercial.js";

class Statement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async first(){
  this.db.firsts.push({sql:this.sql,args:this.args});
  if(this.sql.includes("FROM organizations o JOIN customer_accounts ca")){
   const email=String(this.args[0]||"").toLowerCase();
   const organization=[...this.db.organizations.values()].find(row=>row.billing_email.toLowerCase()===email);
   if(!organization)return null;
   return{organization_id:organization.id,customer_number:this.db.customerAccounts.get(organization.id)};
  }
  if(this.sql.includes("INSERT INTO business_sequences")&&this.sql.includes("RETURNING next_value")){
   this.db.sequence++;
   return{next_value:this.db.sequence};
  }
  return null;
 }
 async run(){this.db.runs.push({sql:this.sql,args:this.args});return{success:true,meta:{changes:1}};}
 async all(){return{results:[]};}
}
class FakeDb{
 constructor(){this.sequence=0;this.organizations=new Map();this.customerAccounts=new Map();this.firsts=[];this.runs=[];this.batches=[];}
 prepare(sql){return new Statement(this,sql);}
 async batch(statements){
  this.batches.push(statements);
  for(const statement of statements){
   const{sql,args}=statement;
   if(sql.includes("INSERT INTO organizations(id,name,slug,billing_email,created_at)")){
    this.organizations.set(args[0],{id:args[0],name:args[1],slug:args[2],billing_email:args[3]});
   }
   if(sql.includes("INSERT INTO customer_accounts(organization_id,customer_number"))this.customerAccounts.set(args[0],args[1]);
  }
  return statements.map(()=>({success:true}));
 }
}

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("same lead identity reuses one BAIS customer number across normalized email variants",async()=>{
 const db=new FakeDb(),now="2026-09-05T12:00:00.000Z";
 const first=await ensureCommercialIdentityForLead(db,{email:"  Kunde@Example.COM ",displayName:"Kunde",company:"Kunde GmbH",now});
 assert.equal(first.reused,false);
 assert.equal(first.customerNumber,"KD-2026-000001");
 assert.equal(db.sequence,1);
 assert.equal(db.organizations.size,1);
 assert.equal(db.customerAccounts.size,1);

 const second=await ensureCommercialIdentityForLead(db,{email:"KUNDE@example.com",displayName:"Kunde Zweitkontakt",company:"Andere Schreibweise",now});
 assert.deepEqual(second,{organizationId:first.organizationId,customerNumber:first.customerNumber,reused:true});
 assert.equal(db.sequence,1,"reused identity must not allocate another customer number");
 assert.equal(db.organizations.size,1,"reused identity must not create another organization");
 assert.equal(db.customerAccounts.size,1,"reused identity must not create another customer account");
});

test("customer number and ERP mapping are schema-unique and keyed by the same BAIS identity",()=>{
 const commercial=read("functions/_lib/commercial.js");
 const erp=read("functions/_lib/erp-sync.js");
 const migration=read("migrations/0014_erp_sync.sql");
 assert.match(commercial,/customer_number TEXT NOT NULL UNIQUE/);
 assert.match(commercial,/CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_number/);
 assert.match(erp,/ref_ext:row\.customer_number/);
 assert.match(erp,/findRemoteByCustomerNumber\(config,row\.customer_number\)/);
 assert.match(erp,/remote_ref=excluded\.remote_ref/);
 assert.match(migration,/organization_id TEXT PRIMARY KEY/);
 assert.match(migration,/CREATE UNIQUE INDEX IF NOT EXISTS idx_erp_links_customer_number\s+ON erp_links\(bais_customer_number\)/);
});

test("public lead entry points converge on one commercial identity allocator",()=>{
 for(const file of["functions/api/contact.js","functions/api/academy/enrollments.js","functions/api/customer/auth/register.js"]){
  assert.match(read(file),/ensureCommercialIdentityForLead/);
 }
 const customer=read("functions/api/customer/auth/register.js");
 assert.doesNotMatch(customer,/allocateCustomerNumber/);
});
