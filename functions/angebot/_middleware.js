import{requireCustomerDocumentAccess,customerLoginRedirect,privatePageResponse}from"../_lib/customer-access.js";
export const onRequest=async context=>{
 try{
  const access=await requireCustomerDocumentAccess(context.request,context.env,"angebot");
  if(!access.ok)return access.response;
  return privatePageResponse(await context.next());
 }catch(error){
  if(Number(error?.status)===401)return customerLoginRedirect(context.request,"/angebot/");
  throw error;
 }
};
