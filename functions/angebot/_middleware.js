import{requireCustomerDocumentAccess,customerLoginRedirect,privatePageResponse}from"../_lib/customer-access.js";
export const onRequest=async context=>{
 try{
  const access=await requireCustomerDocumentAccess(context.request,context.env,"angebot");
  if(!access.ok)return access.response;
  return privatePageResponse(await context.next());
 }catch(error){
  if(Number(error?.status)===401)return customerLoginRedirect(context.request,"/angebot/");
  const status=Number(error?.status)===403?403:500;
  return new Response(status===403?"Dieser Inhalt ist für Ihr Kundenkonto nicht freigeschaltet.":"Zugriff konnte nicht geprüft werden.",{status,headers:{"cache-control":"private, no-store","content-type":"text/plain; charset=utf-8","x-robots-tag":"noindex, nofollow"}});
 }
};
