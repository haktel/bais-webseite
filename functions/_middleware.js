const EXCLUDED_PREFIXES=["/admin/","/bais-control-center/","/api/","/assets/","/kundenbereich/","/project-portal/"];

const shouldTrack=pathname=>!EXCLUDED_PREFIXES.some(prefix=>pathname.startsWith(prefix));

class LegalLinkFixer{
 element(element){
  const href=element.getAttribute("href")||"";
  if(!/datenschutz/i.test(href))return;
  const agbHref=href.replace(/datenschutz/i,"agb");
  element.after(' · <a href="'+agbHref+'">AGB</a>',{html:true});
 }
}

export const onRequest=async context=>{
 const response=await context.next();
 try{
  const{request}=context;
  const url=new URL(request.url);
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html")||typeof HTMLRewriter==="undefined")return response;

  let rewriter=new HTMLRewriter();

  if(shouldTrack(url.pathname)){
   rewriter=rewriter.on("body",{
    element(element){
     element.append('<script src="/assets/site-analytics.js" defer></script>',{html:true});
    }
   });
  }

  const bodyText=await response.clone().text();
  if(!/>AGB<\/a>/.test(bodyText)&&/class="[^"]*legalbar/.test(bodyText)){
   rewriter=rewriter.on('.legalbar a[href*="datenschutz"]',new LegalLinkFixer());
  }

  return rewriter.transform(response);
 }catch{
  return response;
 }
};
