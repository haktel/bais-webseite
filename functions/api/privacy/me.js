import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{assertSameOrigin,ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{ensurePrivacySchema}from"../../_lib/privacy.js";

const TYPES=new Set(["access","deletion","rectification","restriction","objection","portability"]);

export const onRequestGet=async({request,env})=>{
 const traceId=requestId(request);
 try{
  const db=assertDatabase(env);await ensureAuthSchema(db);await ensurePrivacySchema(db);
  const user=await requireSession(db,request);
  const account=await db.prepare("SELECT id,organization_id,display_name,email,role,status,created_at FROM users WHERE id=? LIMIT 1").bind(user.user_id).first();
  const organization=account?.organization_id?await db.prepare("SELECT o.id,o.name,o.billing_email,ca.customer_number FROM organizations o LEFT JOIN customer_accounts ca ON ca.organization_id=o.id WHERE o.id=? LIMIT 1").bind(account.organization_id).first():null;
  const projects=account?.organization_id?await db.prepare("SELECT p.id,pr.project_number,p.name,p.status,p.starts_at,p.ends_at,p.created_at FROM projects p LEFT JOIN project_registry pr ON pr.project_id=p.id WHERE p.organization_id=? ORDER BY p.created_at DESC").bind(account.organization_id).all():{results:[]};
  const enrollments=await db.prepare("SELECT c.slug,c.title,e.status,e.enrolled_at,e.completed_at FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? ORDER BY e.enrolled_at DESC").bind(user.user_id).all();
  const progress=await db.prepare("SELECT c.slug,c.title,p.progress_percent,p.status,p.updated_at FROM course_progress p JOIN courses c ON c.id=p.course_id WHERE p.user_id=? ORDER BY p.updated_at DESC").bind(user.user_id).all();
  const certificates=await db.prepare("SELECT ce.public_code,ce.title,ce.issued_at,ce.revoked_at,c.title AS course_title FROM certificates ce LEFT JOIN courses c ON c.id=ce.course_id WHERE ce.user_id=? ORDER BY ce.issued_at DESC").bind(user.user_id).all();
  const accessRequests=await db.prepare("SELECT r.id,c.slug AS course_slug,c.title AS course_title,r.status,r.created_at FROM enrollment_requests r JOIN courses c ON c.id=r.course_id WHERE lower(r.email)=lower(?) ORDER BY r.created_at DESC LIMIT 100").bind(user.email).all();
  const contacts=await db.prepare("SELECT id,company,email,phone,topic,timeline,message,status,created_at FROM contacts WHERE lower(email)=lower(?) ORDER BY created_at DESC LIMIT 100").bind(user.email).all();
  const requests=await db.prepare("SELECT id,request_type,status,note,created_at,resolved_at FROM privacy_requests WHERE user_id=? OR lower(email)=lower(?) ORDER BY created_at DESC LIMIT 100").bind(user.user_id,user.email).all();
  const sessions=await db.prepare("SELECT created_at,last_seen_at,expires_at FROM user_sessions WHERE user_id=? ORDER BY last_seen_at DESC LIMIT 20").bind(user.user_id).all();
  return json({ok:true,export:{
   generatedAt:new Date().toISOString(),
   account:{displayName:account?.display_name,email:account?.email,role:account?.role,status:account?.status,createdAt:account?.created_at},
   customer:organization?{organizationName:organization.name,billingEmail:organization.billing_email,customerNumber:organization.customer_number}:null,
   projects:projects.results||[],enrollments:enrollments.results||[],progress:progress.results||[],certificates:certificates.results||[],
   accessRequests:accessRequests.results||[],contactRequests:contacts.results||[],privacyRequests:requests.results||[],sessions:sessions.results||[]
  },requestId:traceId});
 }catch(error){return handleError(error,traceId);}
};

export const onRequestPost=async({request,env})=>{
 const traceId=requestId(request);
 try{
  assertSameOrigin(request);const db=assertDatabase(env);await ensureAuthSchema(db);await ensurePrivacySchema(db);
  const user=await requireSession(db,request),body=await readJson(request,4096),requestType=cleanText(body.requestType,40),note=cleanText(body.note,1000);
  if(!TYPES.has(requestType))throw new ApiError(422,"validation_failed","Ungültiger Datenschutzanfragetyp.");
  const existing=await db.prepare("SELECT id,status FROM privacy_requests WHERE user_id=? AND request_type=? AND status IN('open','in_progress') ORDER BY created_at DESC LIMIT 1").bind(user.user_id,requestType).first();
  if(existing)return json({ok:true,request:{id:existing.id,status:existing.status,requestType},duplicate:true,requestId:traceId});
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await db.batch([
   db.prepare("INSERT INTO privacy_requests(id,user_id,email,request_type,status,note,created_at,resolved_at) VALUES(?,?,?,?,?,?,?,NULL)").bind(id,user.user_id,user.email,requestType,"open",note||null,now),
   db.prepare("INSERT INTO audit_events(id,actor_user_id,organization_id,event_type,entity_type,entity_id,metadata_json,created_at) SELECT ?,u.id,u.organization_id,'privacy.request.created','privacy_request',?,?,? FROM users u WHERE u.id=?").bind(crypto.randomUUID(),id,JSON.stringify({requestType}),now,user.user_id)
  ]);
  return json({ok:true,request:{id,status:"open",requestType},requestId:traceId},201);
 }catch(error){return handleError(error,traceId);}
};

export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST"});
