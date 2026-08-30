import{assertDatabase}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";

const pad=n=>String(n).padStart(2,"0");

export const onRequest=async context=>{
  const{request,env}=context;
  const url=new URL(request.url);
  const match=url.pathname.match(/\/academy\/n8n-bootcamp\/modul-(\d{2})(?:\/|$)/);
  const isFinalExam=/\/academy\/n8n-bootcamp\/abschlusspruefung(?:\/|$)/.test(url.pathname);
  if(!match&&!isFinalExam)return context.next();

  const db=assertDatabase(env);
  try{
    await ensureAuthSchema(db);
    const user=await requireSession(db,request);
    if(user.role==="admin")return context.next();

    const enrollment=await db.prepare(
      "SELECT c.id AS course_id FROM enrollments e JOIN course_runs r ON r.id=e.course_run_id JOIN courses c ON c.id=r.course_id WHERE e.user_id=? AND c.slug='n8n-bootcamp' AND e.status IN('active','completed') LIMIT 1"
    ).bind(user.user_id).first();

    if(!enrollment){
      const target=new URL("/academy/konto/",request.url);
      target.searchParams.set("course","n8n-bootcamp");
      target.searchParams.set("reason","enrollment_required");
      return Response.redirect(target,302);
    }

    if(isFinalExam){
      const rows=await db.prepare(
        "SELECT module_slug,module_percent FROM academy_module_progress WHERE user_id=? AND course_id=?"
      ).bind(user.user_id,enrollment.course_id).all();
      const map=new Map((rows.results||[]).map(row=>[row.module_slug,Number(row.module_percent||0)]));
      const missing=Array.from({length:12},(_,i)=>"modul-"+pad(i+1)).find(slug=>Number(map.get(slug)||0)<100);
      if(missing){
        const target=new URL(`/academy/n8n-bootcamp/${missing}/`,request.url);
        target.searchParams.set("reason","final_exam_locked");
        return Response.redirect(target,302);
      }
      return context.next();
    }

    const current=Number(match[1]);
    if(current<=1)return context.next();

    const previous=`modul-${pad(current-1)}`;
    const progress=await db.prepare(
      "SELECT module_percent FROM academy_module_progress WHERE user_id=? AND course_id=? AND module_slug=? LIMIT 1"
    ).bind(user.user_id,enrollment.course_id,previous).first();

    if(Number(progress?.module_percent||0)<100){
      const target=new URL(`/academy/n8n-bootcamp/${previous}/`,request.url);
      target.searchParams.set("reason","previous_module_required");
      target.searchParams.set("next",`modul-${pad(current)}`);
      return Response.redirect(target,302);
    }

    return context.next();
  }catch{
    const target=new URL("/academy/konto/",request.url);
    target.searchParams.set("continue",url.pathname);
    target.searchParams.set("course","n8n-bootcamp");
    return Response.redirect(target,302);
  }
};