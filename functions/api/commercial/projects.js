import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{requireAdmin}from"../../_lib/admin.js";
import{createProjectForOrganization,ensureCommercialIdentityForUser}from"../../_lib/commercial.js";
import{customerContextForSession,hasCustomerContentAccess}from"../../_lib/customer-access.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);const session=await requireSession(db,request);
  if(session.role==="admin"||session.role==="trainer")throw new ApiError(403,"customer_context_required","Dieser Endpoint ist auf das eigene Kundenkonto beschränkt.");
  const customer=await customerContextForSession(db,session);
  if(!await hasCustomerContentAccess(db,{organizationId:customer.organizationId,contentKey:"project_portal"}))throw new ApiError(403,"project_portal_not_enabled","Das Project Portal ist für dieses Kundenkonto nicht freigeschaltet.");
  const identity=await ensureCommercialIdentityForUser(db,{userId:session.user_id,displayName:session.display_name,email:session.email});
  const rows=await db.prepare("SELECT p.id,pr.project_number,p.name,p.status,p.starts_at,p.ends_at,p.created_at FROM projects p JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? ORDER BY p.created_at DESC").bind(identity.organizationId).all();
  return json({ok:true,projects:rows.results||[],requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);
  const db=assertDatabase(env),admin=await requireAdmin(db,request);
  const body=await readJson(request),name=cleanText(body.name,180),organizationId=cleanText(body.organizationId,80);
  if(name.length<2)throw new ApiError(422,"validation_failed","Ein Projektname ist erforderlich.");
  if(!organizationId)throw new ApiError(422,"customer_required","Bitte zuerst einen Kunden auswählen.");
  const project=await createProjectForOrganization(db,{organizationId,name,actorUserId:admin.user_id,now:new Date().toISOString()});
  const now=new Date().toISOString();
  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),admin.user_id,organizationId,"project.created","project",project.id,JSON.stringify({projectNumber:project.projectNumber,source:"admin_sales_flow"}),now).run();
  return json({ok:true,project,requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
