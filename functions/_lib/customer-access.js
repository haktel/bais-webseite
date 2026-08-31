import{assertDatabase}from"./api.js";
import{ensureAuthSchema,requireSession}from"./auth.js";

const ALLOWED_ROLES=new Set(["admin","customer","student"]);

export async function requireCustomerDocumentAccess(request,env){
 const db=assertDatabase(env);
 await ensureAuthSchema(db);
 const user=await requireSession(db,request);
 if(!ALLOWED_ROLES.has(user.role)){
  return{ok:false,response:new Response("Forbidden",{status:403,headers:{"cache-control":"no-store","content-type":"text/plain; charset=utf-8"}})};
 }
 return{ok:true,user};
}

export function privatePageResponse(response){
 const headers=new Headers(response.headers);
 headers.set("cache-control","private, no-store, max-age=0");
 headers.set("pragma","no-cache");
 headers.set("x-robots-tag","noindex, nofollow, noarchive");
 headers.set("referrer-policy","no-referrer");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export function customerLoginRedirect(request,continuePath){
 const target=new URL("/academy/konto/",request.url);
 target.searchParams.set("continue",continuePath);
 target.searchParams.set("reason","customer_login_required");
 return Response.redirect(target,302);
}
