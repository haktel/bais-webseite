import{assertDatabase,json}from"../_lib/api.js";
import{verifyN8nSignature}from"../_lib/n8n-signing.js";

const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};

export const onRequestPost=async({request,env})=>{
  let body;
  try{
    const raw=await request.text();
    if(raw.length>8192)return json({ok:false,scheme:"hmac-sha256"},200,headers);
    body=JSON.parse(raw||"{}");
  }catch{
    return json({ok:false,scheme:"hmac-sha256"},200,headers);
  }

  try{
    const db=assertDatabase(env);
    const ok=await verifyN8nSignature(db,{
      timestamp:body?.timestamp,
      nonce:body?.nonce,
      signature:body?.signature,
      body:body?.body
    });
    return json({ok,scheme:"hmac-sha256",replayProtected:true},200,headers);
  }catch{
    return json({ok:false,scheme:"hmac-sha256",verificationUnavailable:true},200,headers);
  }
};

export const onRequest=()=>json({ok:false,error:"Method not allowed"},405,{Allow:"POST",...headers});
