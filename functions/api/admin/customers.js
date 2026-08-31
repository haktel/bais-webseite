import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{requireAdmin}from"../../_lib/admin.js";
import{ensureCommercialSchema,ensureCommercialIdentityForUser,getBusinessProfile}from"../../_lib/commercial.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env),admin=await requireAdmin(db,request);
  await ensureCommercialSchema(db);

  // Backfill active external accounts that predate commercial numbering.
  const users=await db.prepare("SELECT id,display_name,email,organization_id FROM users WHERE status='active' ORDER BY created_at ASC LIMIT 500").all();
  for(const user of users.results||[]){
   await ensureCommercialIdentityForUser(db,{userId:user.id,displayName:user.display_name,email:user.email});
  }

  const customers=await db.prepare(
   "SELECT ca.customer_number,o.id AS organization_id,o.name AS organization_name,o.billing_email,ca.account_status,ca.created_at,"+
   "(SELECT u.display_name FROM users u WHERE u.organization_id=o.id AND u.status='active' ORDER BY u.created_at ASC LIMIT 1) AS contact_name,"+
   "(SELECT u.email FROM users u WHERE u.organization_id=o.id AND u.status='active' ORDER BY u.created_at ASC LIMIT 1) AS contact_email "+
   "FROM customer_accounts ca JOIN organizations o ON o.id=ca.organization_id ORDER BY ca.customer_number ASC"
  ).all();
  const projects=await db.prepare(
   "SELECT p.id,p.organization_id,p.project_number,p.name,p.status,p.starts_at,p.ends_at,p.created_at "+
   "FROM projects p JOIN customer_accounts ca ON ca.organization_id=p.organization_id ORDER BY p.created_at DESC"
  ).all();
  const provider=await getBusinessProfile(db);

  return json({
   ok:true,
   actor:{id:admin.user_id,role:admin.role},
   customers:customers.results||[],
   projects:projects.results||[],
   provider:{
    legalName:provider?.legal_name||"",
    brandName:provider?.brand_name||"",
    ownerName:provider?.owner_name||"",
    role:"Inhaber",
    address:[provider?.street_address,[provider?.postal_code,provider?.city].filter(Boolean).join(" "),provider?.country_code].filter(Boolean).join(", "),
    email:provider?.email||"",
    vatId:provider?.vat_id||""
   },
   requestId:traceId
  });
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
