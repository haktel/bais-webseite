import{BRAND_DEFAULTS,getBrandSettings}from"../_lib/brand-settings.js";

const cssValue=value=>String(value??"").replace(/[{};<>\\]/g,"");
const render=s=>`html:root{--bais-navy:${cssValue(s.primaryNavy)};--bais-navy-2:${cssValue(s.primaryNavy)};--bais-teal:${cssValue(s.teal)};--bais-teal-bright:${cssValue(s.teal)};--bais-gold:${cssValue(s.gold)};--bais-bg:${cssValue(s.neutral)};--bais-radius:${cssValue(s.radius)}px;--bais-container:${cssValue(s.containerWidth)}px;--bais-font:"${cssValue(s.fontBody)}",Arial,"Helvetica Neue",Helvetica,sans-serif;--bais-display:"${cssValue(s.fontHeading)}",Georgia,"Times New Roman",serif;}`;

export const onRequestGet=async({env})=>{
 let settings=BRAND_DEFAULTS;
 try{if(env?.DB)settings=await getBrandSettings(env.DB);}catch(error){console.error("brand-theme",error instanceof Error?error.message:"unknown");}
 return new Response(render(settings),{status:200,headers:{"content-type":"text/css; charset=utf-8","cache-control":"public, max-age=60, stale-while-revalidate=300","x-content-type-options":"nosniff"}});
};

export const onRequest=onRequestGet;
