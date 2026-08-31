import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{ensureCommercialIdentityForUser,getBusinessProfile}from"../../_lib/commercial.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);
  await ensureAuthSchema(db);
  const provider=await getBusinessProfile(db);
  let session;
  try{session=await requireSession(db,request);}catch{
   return json({ok:true,authenticated:false,provider:{
    legalName:provider?.legal_name||"",
    brandName:provider?.brand_name||"",
    ownerName:provider?.owner_name||"",
    role:"Inhaber",
    address:[provider?.street_address,[provider?.postal_code,provider?.city].filter(Boolean).join(" "),provider?.country_code].filter(Boolean).join(", "),
    email:provider?.email||"",
    vatId:provider?.vat_id||""
   },requestId:traceId});
  }

  if(session.role==="admin"||session.role==="trainer"){
   return json({
    ok:true,authenticated:true,user:{displayName:session.display_name,email:session.email,role:session.role},
    customer:null,currentProject:null,projects:[],
    provider:{
     legalName:provider?.legal_name||"",brandName:provider?.brand_name||"",ownerName:provider?.owner_name||"",role:"Inhaber",
     address:[provider?.street_address,[provider?.postal_code,provider?.city].filter(Boolean).join(" "),provider?.country_code].filter(Boolean).join(", "),
     email:provider?.email||"",vatId:provider?.vat_id||""
    },requestId:traceId
   });
  }

  const identity=await ensureCommercialIdentityForUser(db,{
   userId:session.user_id,
   displayName:session.display_name,
   email:session.email,
   now:new Date().toISOString()
  });
  const organization=await db.prepare("SELECT id,name,billing_email FROM organizations WHERE id=? LIMIT 1").bind(identity.organizationId).first();
  const projects=await db.prepare("SELECT p.id,pr.project_number,p.name,p.status,p.starts_at,p.ends_at,p.created_at FROM projects p JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? ORDER BY p.created_at DESC").bind(identity.organizationId).all();

  return json({
   ok:true,
   authenticated:true,
   user:{displayName:session.display_name,email:session.email,role:session.role},
   customer:{
    customerNumber:identity.customerNumber,
    organizationId:identity.organizationId,
    organizationName:organization?.name||session.display_name,
    contactName:session.display_name,
    email:session.email,
    billingEmail:organization?.billing_email||session.email
   },
   currentProject:(projects.results||[])[0]||identity.project,
   projects:projects.results||[],
   provider:{
    legalName:provider?.legal_name||"",
    brandName:provider?.brand_name||"",
    ownerName:provider?.owner_name||"",
    address:[provider?.street_address,[provider?.postal_code,provider?.city].filter(Boolean).join(" "),provider?.country_code].filter(Boolean).join(", "),
    email:provider?.email||"",
    vatId:provider?.vat_id||""
   },
   requestId:traceId
  });
 }catch(error){return handleError(error,traceId);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
