import{assertDatabase}from"../../_lib/api.js";
import{ensureAuthSchema,requireSession}from"../../_lib/auth.js";
import{findN8nEnrollment,firstIncompleteN8nModule,firstIncompletePriorN8nModule}from"../../_lib/n8n-course-access.js";

const withGuidedSequence=response=>{
  if(typeof HTMLRewriter!=="function")return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  return new HTMLRewriter()
    .on("head",{element(element){
      element.append('<link rel="stylesheet" href="/assets/n8n-guided-sequence.css?v=1.0">',{html:true});
    }})
    .transform(response);
};

export const onRequest=async context=>{
  const{request,env}=context;
  const url=new URL(request.url);
  const match=url.pathname.match(/\/academy\/n8n-bootcamp\/(modul-(?:0[1-9]|1[0-2]))(?:\/|$)/);
  const isFinalExam=/\/academy\/n8n-bootcamp\/abschlusspruefung(?:\/|$)/.test(url.pathname);
  if(!match&&!isFinalExam)return context.next();

  const db=assertDatabase(env);
  try{
    await ensureAuthSchema(db);
    const user=await requireSession(db,request);
    const enrollment=await findN8nEnrollment(db,user.user_id);
    if(!enrollment){
      const target=new URL("/academy/konto/",request.url);
      target.searchParams.set("course","n8n-bootcamp");
      target.searchParams.set("reason","enrollment_required");
      target.searchParams.set("continue",url.pathname);
      return Response.redirect(target,302);
    }

    if(isFinalExam){
      const missing=await firstIncompleteN8nModule(db,user.user_id,enrollment.course_id);
      if(missing){
        const target=new URL(`/academy/n8n-bootcamp/${missing}/`,request.url);
        target.searchParams.set("reason","final_exam_locked");
        return Response.redirect(target,302);
      }
      return context.next();
    }

    const requested=match[1];
    const required=await firstIncompletePriorN8nModule(db,user.user_id,enrollment.course_id,requested);
    if(required){
      const target=new URL(`/academy/n8n-bootcamp/${required}/`,request.url);
      target.searchParams.set("reason","module_sequence_locked");
      target.searchParams.set("requested",requested);
      return Response.redirect(target,302);
    }

    return withGuidedSequence(await context.next());
  }catch{
    const target=new URL("/academy/konto/",request.url);
    target.searchParams.set("continue",url.pathname);
    target.searchParams.set("course","n8n-bootcamp");
    return Response.redirect(target,302);
  }
};
