const N8N_MODULE_01_WEBHOOK="https://6wejmb5u.rpcld.co/webhook/bais-academy-modul-01";

const ALLOWED_ORIGINS=new Set([
  "https://bais-solutions.de",
  "https://www.bais-solutions.de",
  "https://bais-webseite.pages.dev"
]);

function allowedOrigin(origin){
  return Boolean(origin&&(ALLOWED_ORIGINS.has(origin)||origin.endsWith(".bais-webseite.pages.dev")));
}

export async function onRequestPost({request}){
  const origin=request.headers.get("Origin");
  if(!allowedOrigin(origin)){
    return Response.json({ok:false,error:"Origin not allowed"},{status:403});
  }

  const raw=await request.text();
  if(raw.length>4096){
    return Response.json({ok:false,error:"Payload too large"},{status:413});
  }

  let body;
  try{body=JSON.parse(raw);}catch{
    return Response.json({ok:false,error:"Invalid JSON"},{status:400});
  }

  const payload={
    name:String(body?.name||"").slice(0,120),
    email:String(body?.email||"").slice(0,254),
    company:String(body?.company||"").slice(0,160),
    budget:Number(body?.budget)
  };

  try{
    const upstream=await fetch(N8N_MODULE_01_WEBHOOK,{
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
