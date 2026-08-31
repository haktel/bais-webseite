import{requireCustomerContentAccess,customerLoginRedirect,privatePageResponse}from"../../_lib/customer-access.js";
export const onRequest=async context=>{
 try{
  const access=await requireCustomerContentAccess(context.request,context.env,"project_portal");
  if(!access.ok)return access.response;
  return privatePageResponse(await context.next());
 }catch(error){
  if(Number(error?.status)===401)return customerLoginRedirect(context.request,"/project-portal/kunde/");
  const status=Number(error?.status)||403;
  return new Response(status===403?"Dieser Bereich ist für Ihr Kundenkonto nicht freigeschaltet.":"Zugriff nicht möglich.",{status,headers:{"cache-control":"private, no-store","content-type":"text/plain; charset=utf-8"}});
 }
};
