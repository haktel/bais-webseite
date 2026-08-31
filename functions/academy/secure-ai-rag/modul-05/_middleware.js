import{assertDatabase}from"../../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../../_lib/auth.js";

export const onRequest=async context=>{
  const{request,env}=context;
  const db=assertDatabase(env);
  try{
    await ensureAuthSchema(db);
    const user=await requireSession(db,request);
    if(user.role==="admin")return context.next();
    const enrollment=await db.prepare(
      "SELECT e.status FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug='secure-ai-rag' AND e.status IN('active','completed') LIMIT 1"
    ).bind(user.user_id).first();
    if(!enrollment){
      return Response.redirect(new URL("/academy/konto/?course=secure-ai-rag&reason=enrollment_required",request.url),302);
    }
    return context.next();
  }catch{
    const target=new URL("/academy/konto/",request.url);
    target.searchParams.set("continue","/academy/secure-ai-rag/modul-05/");
    target.searchParams.set("course","secure-ai-rag");
    return Response.redirect(target,302);
  }
};
