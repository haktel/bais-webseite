import{ApiError}from"./api.js";

const pad=value=>String(value).padStart(6,"0");
const yearOf=iso=>new Date(iso||Date.now()).getUTCFullYear();
const safeSlug=value=>String(value||"kunde").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"kunde";

export async function ensureCommercialSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS business_sequences(sequence_key TEXT PRIMARY KEY,next_value INTEGER NOT NULL CHECK(next_value>=0),updated_at TEXT NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS customer_accounts(organization_id TEXT PRIMARY KEY,customer_number TEXT NOT NULL UNIQUE,account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN('active','inactive','blocked')),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE)"),
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_number ON customer_accounts(customer_number)"),
  db.prepare("CREATE TABLE IF NOT EXISTS business_profile(id TEXT PRIMARY KEY CHECK(id='default'),legal_name TEXT NOT NULL,brand_name TEXT NOT NULL,owner_name TEXT,street_address TEXT,postal_code TEXT,city TEXT,country_code TEXT NOT NULL DEFAULT 'DE',vat_id TEXT,email TEXT,updated_at TEXT NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS project_registry(project_id TEXT PRIMARY KEY,project_number TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE)"),
  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_project_registry_number ON project_registry(project_number)")
 ]);
 await db.prepare("INSERT OR IGNORE INTO business_profile(id,legal_name,brand_name,owner_name,street_address,postal_code,city,country_code,vat_id,email,updated_at) VALUES('default','BAIT Solution','BAIS – Bünyamin Atik – IT Solutions','Bünyamin Atik','Kleine Burgholzstr. 11','44145','Dortmund','DE','DE815818009','info@bais-solutions.de',?)")
  .bind(new Date().toISOString()).run();
}

async function nextNumber(db,prefix,kind,now){
 const year=yearOf(now),key=kind+":"+year;
 const row=await db.prepare(
  "INSERT INTO business_sequences(sequence_key,next_value,updated_at) VALUES(?,1,?) "+
  "ON CONFLICT(sequence_key) DO UPDATE SET next_value=business_sequences.next_value+1,updated_at=excluded.updated_at "+
  "RETURNING next_value"
 ).bind(key,now).first();
 const value=Number(row?.next_value);
 if(!Number.isInteger(value)||value<1)throw new ApiError(500,"sequence_failed","Die Geschäftsnummer konnte nicht erzeugt werden.");
 return prefix+"-"+year+"-"+pad(value);
}
export const allocateCustomerNumber=(db,now=new Date().toISOString())=>nextNumber(db,"KD","customer",now);
export const allocateProjectNumber=(db,now=new Date().toISOString())=>nextNumber(db,"PR","project",now);

export async function getBusinessProfile(db){
 await ensureCommercialSchema(db);
 return await db.prepare("SELECT legal_name,brand_name,owner_name,street_address,postal_code,city,country_code,vat_id,email FROM business_profile WHERE id='default' LIMIT 1").first();
}

export async function ensureCommercialIdentityForUser(db,{userId,displayName,email,company,now=new Date().toISOString(),intakeName="Erstprojekt / Intake"}){
 await ensureCommercialSchema(db);
 const user=await db.prepare("SELECT id,organization_id,display_name,email FROM users WHERE id=? LIMIT 1").bind(userId).first();
 if(!user)throw new ApiError(404,"user_not_found","Benutzerkonto nicht gefunden.");

 let organizationId=user.organization_id||null,createdOrganization=false,createdProjectId=null;
 try{
  if(!organizationId){
   organizationId=crypto.randomUUID();
   const organizationName=String(company||displayName||email||"Kunde").trim().slice(0,160);
   const slug=safeSlug(organizationName)+"-"+organizationId.slice(0,8);
   await db.prepare("INSERT INTO organizations(id,name,slug,billing_email,created_at) VALUES(?,?,?,?,?)")
    .bind(organizationId,organizationName,slug,email||user.email||null,now).run();
   await db.prepare("UPDATE users SET organization_id=? WHERE id=?").bind(organizationId,userId).run();
   createdOrganization=true;
  }

  let customer=await db.prepare("SELECT customer_number FROM customer_accounts WHERE organization_id=? LIMIT 1").bind(organizationId).first();
  if(!customer){
   const customerNumber=await allocateCustomerNumber(db,now);
   await db.prepare("INSERT INTO customer_accounts(organization_id,customer_number,account_status,created_at,updated_at) VALUES(?,?,?,?,?)")
    .bind(organizationId,customerNumber,"active",now,now).run();
   customer={customer_number:customerNumber};
  }

  let project=await db.prepare("SELECT p.id,pr.project_number,p.name,p.status,p.created_at FROM projects p LEFT JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? ORDER BY p.created_at ASC LIMIT 1").bind(organizationId).first();
  if(!project){
   const projectId=crypto.randomUUID(),projectNumber=await allocateProjectNumber(db,now);
   await db.batch([
    db.prepare("INSERT INTO projects(id,organization_id,name,status,created_at) VALUES(?,?,?,?,?)").bind(projectId,organizationId,intakeName,"planned",now),
    db.prepare("INSERT INTO project_registry(project_id,project_number,created_at) VALUES(?,?,?)").bind(projectId,projectNumber,now),
    db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) VALUES(?,?,?)").bind(projectId,userId,"customer")
   ]);
   createdProjectId=projectId;
   project={id:projectId,project_number:projectNumber,name:intakeName,status:"planned",created_at:now};
  }else{
   await db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) VALUES(?,?,?)").bind(project.id,userId,"customer").run();
   if(!project.project_number){
    const projectNumber=await allocateProjectNumber(db,now);
    await db.prepare("INSERT OR IGNORE INTO project_registry(project_id,project_number,created_at) VALUES(?,?,?)").bind(project.id,projectNumber,now).run();
    const registry=await db.prepare("SELECT project_number FROM project_registry WHERE project_id=? LIMIT 1").bind(project.id).first();
    project.project_number=registry?.project_number||projectNumber;
   }
  }

  return{organizationId,customerNumber:customer.customer_number,project};
 }catch(error){
  if(createdProjectId)try{await db.prepare("DELETE FROM projects WHERE id=?").bind(createdProjectId).run();}catch{}
  if(createdOrganization){
   try{await db.prepare("UPDATE users SET organization_id=NULL WHERE id=?").bind(userId).run();}catch{}
   try{await db.prepare("DELETE FROM customer_accounts WHERE organization_id=?").bind(organizationId).run();}catch{}
   try{await db.prepare("DELETE FROM organizations WHERE id=?").bind(organizationId).run();}catch{}
  }
  throw error;
 }
}

export async function createProjectForOrganization(db,{organizationId,name,actorUserId=null,now=new Date().toISOString()}){
 await ensureCommercialSchema(db);
 const customer=await db.prepare("SELECT ca.organization_id FROM customer_accounts ca JOIN organizations o ON o.id=ca.organization_id WHERE ca.organization_id=? AND ca.account_status='active' LIMIT 1").bind(organizationId).first();
 if(!customer)throw new ApiError(404,"customer_not_found","Kundenkonto nicht gefunden.");
 const projectName=String(name||"").trim().slice(0,180);
 if(projectName.length<2)throw new ApiError(422,"validation_failed","Ein Projektname ist erforderlich.");

 const intake=await db.prepare("SELECT p.id,pr.project_number,p.name,p.status FROM projects p LEFT JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? AND p.name='Erstprojekt / Intake' AND p.status='planned' ORDER BY p.created_at ASC LIMIT 1")
  .bind(organizationId).first();
 if(intake){
  await db.prepare("UPDATE projects SET name=? WHERE id=?").bind(projectName,intake.id).run();
  await db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) SELECT ?,id,'customer' FROM users WHERE organization_id=? AND status='active' AND role IN('student','customer')").bind(intake.id,organizationId).run();
  if(actorUserId)await db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) VALUES(?,?,?)").bind(intake.id,actorUserId,"admin").run();
  return{id:intake.id,projectNumber:intake.project_number,name:projectName,status:"planned",reusedIntake:true,organizationId};
 }

 const projectId=crypto.randomUUID(),projectNumber=await allocateProjectNumber(db,now);
 const statements=[
  db.prepare("INSERT INTO projects(id,organization_id,name,status,created_at) VALUES(?,?,?,?,?)").bind(projectId,organizationId,projectName,"planned",now),
  db.prepare("INSERT INTO project_registry(project_id,project_number,created_at) VALUES(?,?,?)").bind(projectId,projectNumber,now),
  db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) SELECT ?,id,'customer' FROM users WHERE organization_id=? AND status='active' AND role IN('student','customer')").bind(projectId,organizationId)
 ];
 if(actorUserId)statements.push(db.prepare("INSERT OR IGNORE INTO project_members(project_id,user_id,role) VALUES(?,?,?)").bind(projectId,actorUserId,"admin"));
 await db.batch(statements);
 return{id:projectId,projectNumber,name:projectName,status:"planned",reusedIntake:false,organizationId};
}

export async function createProjectForUser(db,{userId,name,now=new Date().toISOString()}){
 await ensureCommercialSchema(db);
 const user=await db.prepare("SELECT id,organization_id,display_name,email FROM users WHERE id=? LIMIT 1").bind(userId).first();
 if(!user)throw new ApiError(404,"user_not_found","Benutzerkonto nicht gefunden.");
 const identity=await ensureCommercialIdentityForUser(db,{userId,displayName:user.display_name,email:user.email,now});
 return createProjectForOrganization(db,{organizationId:identity.organizationId,name,actorUserId:userId,now});
}
