const N8N_MODULE_07_WEBHOOK="https://6wejmb5u.rpcld.co/webhook/bais-academy-modul-07";
const ALLOWED_ORIGINS=new Set(["https://bais-solutions.de","https://www.bais-solutions.de","https://bais-webseite.pages.dev"]);
const allowedOrigin=o=>Boolean(o&&(ALLOWED_ORIGINS.has(o)||o.endsWith(".bais-webseite.pages.dev")));
const cleanKey=value=>String(value??"").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,48);
export async function onRequestPost({request}){
 const origin=request.headers.get("Origin");if(!allowedOrigin(origin))return Response.json({ok:false,error:"Origin not allowed"},{status:403});
 let body;try{body=await request.json();}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}
 const scenario=String(body?.scenario??"").slice(0,24),labKey=cleanKey(body?.labKey);
 if(!["create","update","event-first","event-repeat"].includes(scenario)||!labKey)return Response.json({ok:false,error:"Invalid lab scenario"},{status:422});
 try{
  const upstream=await fetch(N8N_MODULE_07_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","User-Agent":"BAIS-Academy/1.0"},body:JSON.stringify({scenario,labKey})});
  const text=await upstream.text();return new Response(text,{status:upstream.status,headers:{"Content-Type":upstream.headers.get("Content-Type")||"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return Response.json({ok:false,error:"Live persistence lab unavailable"},{status:502,headers:{"Cache-Control":"no-store"}});}
}
export function onRequest(){return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});}