import{requireCustomerDocumentAccess,customerLoginRedirect}from"../_lib/customer-access.js";
export const onRequest=async context=>{
 try{
  const access=await requireCustomerDocumentAccess(context.request,context.env);
  if(!access.ok)return access.response;
  return context.next();
 }catch{return customerLoginRedirect(context.request,"/abnahme/");}
};