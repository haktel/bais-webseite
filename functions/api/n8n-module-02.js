const N8N_MODULE_02_WEBHOOK="https://6wejmb5u.rpcld.co/webhook/bais-academy-modul-02";
const ALLOWED_ORIGINS=new Set([
  "https://bais-solutions.de",
  "https://www.bais-solutions.de",
  "https://bais-webseite.pages.dev"
]);
const allowedOrigin=origin=>Boolean(origin&&(ALLOWED_ORIGINS.has(origin)||origin.endsWith(".bais-webseite.pages.dev")));
const clean=(value,max=200)=>String(value??"").slice(0,max);

export async function onRequestPost({request}){
  const origin=request.headers.get("Origin");
  if(!allowedOrigin(origin))return Response.json({ok:false,error:"Origin not allowed"},{status:403});
  const raw=await request.text();
  if(raw.length>16000)return Response.json({ok:false,error:"Payload too large"},{status:413});
  let body;
  try{body=JSON.parse(raw);}catch{return Response.json({ok:false,error:"Invalid JSON"},{status:400});}

  const records=Array.isArray(body?.records)?body.records.slice(0,20).map(record=>({
    firstName:clean(record?.firstName,120),
    lastName:clean(record?.lastName,120),
    email:clean(record?.email,254),
    budget:record?.budget,
    tags:Array.isArray(record?.tags)?record.tags.slice(0,20).map(tag=>clean(tag,80)):[],
    source:clean(record?.source??body?.source,120)
  })):[];
  const payload={source:clean(body?.source,120),records};

  try{
    const upstream=await fetch(N8N_MODULE_02_WEBHOOK,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json","User-Agent":"BAIS-Academy/1.0"},
      body:JSON.stringify(payload)
    });
    const text=await upstream.text();
    return new Response(text,{
      status:upstream.status,
      headers:{
        "Content-Type":upstream.headers.get("Content-Type")||"application/json; charset=utf-8",
        "Cache-Control":"no-store",
        "X-Content-Type-Options":"nosniff"
      }
    });
  }catch{
    return Response.json({ok:false,error:"Live n8n Lab temporarily unavailable"},{status:502,headers:{"Cache-Control":"no-store"}});
  }
}
export function onRequest(){
  return Response.json({ok:false,error:"Method not allowed"},{status:405,headers:{Allow:"POST"}});
}
