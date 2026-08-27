import{ApiError,assertDatabase,cleanText,handleError,json,readJson,requestId,validEmail,verifyTurnstile}from"../../_lib/api.js";
export const onRequestPost=async({request,env})=>{
 const id=requestId(request);
 try{
  const db=assertDatabase(env),body=await readJson(request);
  const name=cleanText(body.name,120),email=cleanText(body.email,254).toLowerCase(),company=cleanText(body.company,160);
  const courseSlug=cleanText(body.courseSlug,120),note=cleanText(body.note,2000);
  if(name.length<2||!validEmail(email)||!courseSlug) throw new ApiError(422,"validation_failed","Name, gültige E-Mail und Programm sind erforderlich.");
  const course=await db.prepare("SELECT id,title,status FROM courses WHERE slug=? LIMIT 1").bind(courseSlug).first();
  if(!course||course.status!=="published") throw new ApiError(404,"course_not_found","Das gewählte Academy-Programm ist nicht verfügbar.");
  await verifyTurnstile(body.turnstileToken,request,env.TURNSTILE_SECRET);
  const idValue=crypto.randomUUID(),createdAt=new Date().toISOString();
  await db.prepare("INSERT INTO enrollment_requests(id,course_id,name,email,company,note,status,created_at) VALUES(?,?,?,?,?,?,?,?)")
   .bind(idValue,course.id,name,email,company||null,note||null,"new",createdAt).run();
  return json({ok:true,id:idValue,message:"Ihre Academy-Anfrage wurde übermittelt.",requestId:id},201);
 }catch(error){return handleError(error,id);}
};
export const onRequest=()=>json({ok:false,error:{code:"method_not_allowed",message:"Methode nicht erlaubt."}},405,{allow:"POST"});
