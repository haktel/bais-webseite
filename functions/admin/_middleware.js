import{assertDatabase}from"../_lib/api.js";
import{requireAdmin}from"../_lib/admin.js";

const privateResponse=response=>{
 const headers=new Headers(response.headers);
 headers.set("cache-control","private, no-store, max-age=0");
 headers.set("pragma","no-cache");
 headers.set("x-robots-tag","noindex, nofollow, noarchive");
 headers.set("referrer-policy","no-referrer");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};

export const onRequest=async context=>{
 try{
  const db=assertDatabase(context.env);
  await requireAdmin(db,context.request);
  return privateResponse(await context.next());
 }catch(error){
  if(error?.status===401||error?.code==="mfa_setup_required"){
   const target=new URL("/academy/konto/",context.request.url);
   target.searchParams.set("continue","/admin/");
   target.searchParams.set("reason",error?.code==="mfa_setup_required"?"mfa_setup_required":error?.code==="mfa_required"?"mfa_required":"admin_login_required");
   return Response.redirect(target,302);
  }
  return new Response("Forbidden",{status:403,headers:{"cache-control":"no-store","content-type":"text/plain; charset=utf-8"}});
 }
};