const EXCLUDED_PREFIXES=["/admin/","/bais-control-center/","/api/","/assets/","/kundenbereich/","/project-portal/"];
const BRAND_FAVICON='<link rel="icon" href="/assets/bais-favicon-concept2.svg?v=4" type="image/svg+xml">';
const BRAND_THEME_COLOR='<meta name="theme-color" content="#0B2D45">';
const HOME_CONCEPT_CSS='<link rel="stylesheet" href="/assets/home-concept2.css?v=4">';
const HOME_CONCEPT_JS='<script src="/assets/home.js?v=4" defer></script>';

const shouldTrack=pathname=>!EXCLUDED_PREFIXES.some(prefix=>pathname.startsWith(prefix));
const isHomepage=pathname=>pathname==="/"||pathname==="/index.html";

class LegalLinkFixer{
 element(element){
  const href=element.getAttribute("href")||"";
  if(!/datenschutz/i.test(href))return;
  const agbHref=href.replace(/datenschutz/i,"agb");
  element.after(' · <a href="'+agbHref+'">AGB</a>',{html:true});
 }
}
class BrandLogoFixer{
 element(element){element.setAttribute('src','/assets/bais-logo-concept2.svg?v=4');element.setAttribute('alt','BAIS – IT / AI / Security');}
}
class FaviconFixer{
 element(element){element.setAttribute('href','/assets/bais-favicon-concept2.svg?v=4');element.setAttribute('type','image/svg+xml');}
}

export const onRequest=async context=>{
 const response=await context.next();
 try{
  const{request}=context;
  const url=new URL(request.url);
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html")||typeof HTMLRewriter==="undefined")return response;

  const bodyText=await response.clone().text();
  let rewriter=new HTMLRewriter();

  rewriter=rewriter.on('img[src*="bais-wordmark.svg"]',new BrandLogoFixer());
  if(/<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(bodyText)){
   rewriter=rewriter.on('link[rel~="icon"]',new FaviconFixer());
  }else{
   rewriter=rewriter.on("head",{element(element){element.append(BRAND_FAVICON,{html:true});}});
  }
  if(!/<meta[^>]+name=["']theme-color["']/i.test(bodyText)){
   rewriter=rewriter.on("head",{element(element){element.append(BRAND_THEME_COLOR,{html:true});}});
  }

  if(isHomepage(url.pathname)){
   rewriter=rewriter.on('script[src*="home.js"]',{element(element){element.remove();}});
   rewriter=rewriter.on('link[href*="home-concept2.css"]',{element(element){element.remove();}});
   rewriter=rewriter.on("head",{element(element){element.append(HOME_CONCEPT_CSS,{html:true});element.append(HOME_CONCEPT_JS,{html:true});}});
  }

  if(shouldTrack(url.pathname)){
   rewriter=rewriter.on("body",{element(element){element.append('<script src="/assets/site-analytics.js" defer></script>',{html:true});}});
  }

  if(!/>AGB<\/a>/.test(bodyText)&&/class="[^"]*legalbar/.test(bodyText)){
   rewriter=rewriter.on('.legalbar a[href*="datenschutz"]',new LegalLinkFixer());
  }

  return rewriter.transform(response);
 }catch{
  return response;
 }
};
