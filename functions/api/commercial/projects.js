import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{createProjectForUser,ensureCommercialIdentityForUser}from"../../_lib/commercial.js";

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);const session=await requireSession(db,request);
  const identity=await ensureCommercialIdentityForUser(db,{userId:session.user_id,displayName:session.display_name,email:session.email});
  const rows=await db.prepare("SELECT id,project_number,name,status,starts_at,ends_at,created_at FROM projects WHERE organization_id=? ORDER BY created_at DESC").bind(identity.organizationId).all();
  return json({ok:true,projects:rows.results||[],requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);const db=assertDatabase(env);await ensureAuthSchema(db);const session=await requireSession(db,request);
  const body=await readJson(request),name=cleanText(body.name,180);
  if(name.length<2)throw new ApiError(422,"validation_failed","Ein Projektname ist erforderlich.");
  const project=await createProjectForUser(db,{userId:session.user_id,name,now:new Date().toISOString()});
  await db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) SELECT ?,u.id,u.organization_id,?,?,?,?,? FROM users u WHERE u.id=?")
   .bind(crypto.randomUUID(),session.user_id,"project.created","project",project.id,JSON.stringify({projectNumber:project.projectNumber,reusedIntake:project.reusedIntake===true}),new Date().toISOString(),session.user_id).run();
  return json({ok:true,project,requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
