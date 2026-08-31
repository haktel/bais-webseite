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

export function customerLoginRedirect(request,continuePath){
 const target=new URL("/academy/konto/",request.url);
 target.searchParams.set("continue",continuePath);
 target.searchParams.set("reason","customer_login_required");
 return Response.redirect(target,302);
}
