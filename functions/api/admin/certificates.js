import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId}from"../../_lib/api.js";
import{requireAdmin}from"../../_lib/admin.js";
import{assertSameOrigin}from"../../_lib/auth.js";
import{createCertificateCode,ensureCertificateSchema}from"../../_lib/certificates.js";
const list=async db=>{const[issued,eligible]=await Promise.all([
 db.prepare("SELECT ce.id,ce.public_code,ce.title,ce.issued_at,ce.revoked_at,u.display_name,u.email,c.title AS course_title FROM certificates ce JOIN users u ON u.id=ce.user_id LEFT JOIN courses c ON c.id=ce.course_id ORDER BY ce.issued_at DESC LIMIT 250").all(),
 db.prepare("SELECT p.user_id,p.course_id,p.updated_at,u.display_name,u.email,c.title AS course_title FROM course_progress p JOIN users u ON u.id=p.user_id JOIN courses c ON c.id=p.course_id WHERE p.status='completed' AND NOT EXISTS(SELECT 1 FROM certificates ce WHERE ce.user_id=p.user_id AND ce.course_id=p.course_id AND ce.revoked_at IS NULL) ORDER BY p.updated_at DESC LIMIT 250").all()
]);return{certificates:issued.results||[],eligible:eligible.results||[]};};
export const onRequestGet=async({request,env})=>{const id=requestId(request);try{const db=assertDatabase(env);await requireAdmin(db,request);await ensureCertificateSchema(db);return json({ok:true,...await list(db),requestId:id});}catch(error){return handleError(error,id);}};
export const onRequestPost=async({request,env})=>{const id=requestId(request);try{
 assertSameOrigin(request);const db=assertDatabase(env),admin=await requireAdmin(db,request);await ensureCertificateSchema(db);const body=await readJson(request),userId=cleanText(body.userId,80),courseId=cleanText(body.courseId,80);
 if(!userId||!courseId)throw new ApiError(422,"validation_failed","Studierender und Programm sind erforderlich.");
 const eligible=await db.prepare("SELECT u.display_name,c.title FROM course_progress p JOIN users u ON u.id=p.user_id JOIN courses c ON c.id=p.course_id WHERE p.user_id=? AND p.course_id=? AND p.status='completed' AND u.role='student' LIMIT 1").bind(userId,courseId).first();
 if(!eligible)throw new ApiError(409,"completion_required","Ein Nachweis kann erst nach dokumentiertem Abschluss ausgestellt werden.");
 if(await db.prepare("SELECT id FROM certificates WHERE user_id=? AND course_id=? AND revoked_at IS NULL LIMIT 1").bind(userId,courseId).first())throw new ApiError(409,"certificate_exists","Für diesen Abschluss besteht bereits ein gültiger Nachweis.");
 let code;for(let attempt=0;attempt<5;attempt++){code=createCertificateCode();if(!await db.prepare("SELECT id FROM certificates WHERE public_code=?").bind(code).first())break;}
 const now=new Date().toISOString(),certificateId=crypto.randomUUID(),title="BAIS Academy Abschlussnachweis";
 await db.batch([db.prepare("INSERT INTO certificates(id,public_code,user_id,course_id,title,issued_at,revoked_at) VALUES(?,?,?,?,?,?,NULL)").bind(certificateId,code,userId,courseId,title,now),db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),admin.user_id,"certificate.issued","certificate",certificateId,JSON.stringify({publicCode:code,userId,courseId}),now)]);
 return json({ok:true,certificate:{id:certificateId,code},requestId:id},201);
 }catch(error){return handleError(error,id);}};
export const onRequestPatch=async({request,env})=>{const id=requestId(request);try{
 assertSameOrigin(request);const db=assertDatabase(env),admin=await requireAdmin(db,request);await ensureCertificateSchema(db);const body=await readJson(request),certificateId=cleanText(body.id,80),action=cleanText(body.action,20);
 if(!certificateId||!["revoke","restore"].includes(action))throw new ApiError(422,"validation_failed","Nachweis und gültige Aktion sind erforderlich.");
 const certificate=await db.prepare("SELECT id,public_code FROM certificates WHERE id=? LIMIT 1").bind(certificateId).first();if(!certificate)throw new ApiError(404,"certificate_not_found","Nachweis wurde nicht gefunden.");
 const now=new Date().toISOString();await db.batch([db.prepare("UPDATE certificates SET revoked_at=? WHERE id=?").bind(action==="revoke"?now:null,certificateId),db.prepare("INSERT INTO audit_events(id,actor_user_id,event_type,entity_type,entity_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),admin.user_id,"certificate."+action,"certificate",certificateId,JSON.stringify({publicCode:certificate.public_code}),now)]);
 return json({ok:true,...await list(db),requestId:id});
 }catch(error){return handleError(error,id);}};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET, POST, PATCH"});
