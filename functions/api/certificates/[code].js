import{ApiError,assertDatabase,cleanText,handleError,json,requestId}from"../../_lib/api.js";
import{maskCertificateHolder}from"../../_lib/certificates.js";
export const onRequestGet=async({request,env,params})=>{
 const id=requestId(request);
 try{
  const db=assertDatabase(env),code=cleanText(params.code,80).toUpperCase();
  if(!/^BAIS-[A-Z0-9-]{8,64}$/.test(code)) throw new ApiError(400,"invalid_code","Ungültiges Zertifikatsformat.");
  const row=await db.prepare(`SELECT c.public_code,c.issued_at,c.revoked_at,c.title,u.display_name,co.title AS course_title
   FROM certificates c JOIN users u ON u.id=c.user_id LEFT JOIN courses co ON co.id=c.course_id WHERE c.public_code=? LIMIT 1`).bind(code).first();
  if(!row) throw new ApiError(404,"certificate_not_found","Kein Nachweis mit diesem Code gefunden.");
  return json({ok:true,certificate:{code:row.public_code,holder:maskCertificateHolder(row.display_name),title:row.title,course:row.course_title,issuedAt:row.issued_at,status:row.revoked_at?"revoked":"valid"},requestId:id},200,{"cache-control":"no-store","pragma":"no-cache","referrer-policy":"no-referrer"});
 }catch(error){return handleError(error,id);}
};
