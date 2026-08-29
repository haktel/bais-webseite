import{assertDatabase,handleError,json,requestId}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{ensureCertificateSchema}from"../../_lib/certificates.js";
export const onRequestGet=async({request,env})=>{const id=requestId(request);try{
 const db=assertDatabase(env);await ensureAuthSchema(db);await ensureCertificateSchema(db);const user=await requireSession(db,request);
 const result=await db.prepare("SELECT ce.public_code,ce.title,ce.issued_at,ce.revoked_at,c.title AS course_title FROM certificates ce LEFT JOIN courses c ON c.id=ce.course_id WHERE ce.user_id=? ORDER BY ce.issued_at DESC").bind(user.user_id).all();
 return json({ok:true,certificates:(result.results||[]).map(item=>({...item,verificationUrl:"/zertifikat/?code="+encodeURIComponent(item.public_code)})),requestId:id});
 }catch(error){return handleError(error,id);}};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"GET"});
