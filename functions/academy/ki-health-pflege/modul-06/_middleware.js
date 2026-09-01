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
      "SELECT e.status FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug='ki-health-pflege' AND e.status IN('active','completed') LIMIT 1"
    ).bind(user.user_id).first();
    if(!enrollment){
      return Response.redirect(new URL("/academy/konto/?course=ki-health-pflege&reason=enrollment_required",request.url),302);
    }
    return context.next();
  }catch{
    const target=new URL("/academy/konto/",request.url);
    target.searchParams.set("continue","/academy/ki-health-pflege/modul-06/");
    target.searchParams.set("course","ki-health-pflege");
    return Response.redirect(target,302);
  }
};
