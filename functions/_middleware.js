const EXCLUDED_PREFIXES=["/admin/","/bais-control-center/","/api/","/assets/","/kundenbereich/","/project-portal/"];

const shouldTrack=pathname=>!EXCLUDED_PREFIXES.some(prefix=>pathname.startsWith(prefix));

export const onRequest=async context=>{
 const response=await context.next();
 try{
  const{request}=context;
  const url=new URL(request.url);
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html")||typeof HTMLRewriter==="undefined"||!shouldTrack(url.pathname))return response;
  return new HTMLRewriter().on("body",{
   element(element){
    element.append('<script src="/assets/site-analytics.js" defer></script>',{html:true});
   }
  }).transform(response);
 }catch{
  return response;
 }
};
