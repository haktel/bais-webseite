const DEMO={
  apiKey:"bais-demo-key-read",
  bearerRead:"bais-demo-token-read",
  bearerNoScope:"bais-demo-token-no-scope",
  bearerExpired:"bais-demo-token-expired",
  basicUser:"academy",
  basicPass:"demo-only"
};

const noStore={"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8"};

const unauthorized=(reason)=>new Response(JSON.stringify({
  ok:false,status:401,error:"unauthorized",reason,
  lesson:"401 = Identität fehlt, Credential ungültig oder Token abgelaufen."
}),{status:401,headers:noStore});

const forbidden=(reason)=>new Response(JSON.stringify({
  ok:false,status:403,error:"forbidden",reason,
  lesson:"403 = Identität ist bekannt, aber die erforderliche Berechtigung/Scope fehlt."
}),{status:403,headers:noStore});

export async function onRequestGet({request}){
  const url=new URL(request.url);
  const requiredScope=url.searchParams.get("scope")||"customer:read";
  const apiKey=request.headers.get("X-API-Key")||"";
  const authorization=request.headers.get("Authorization")||"";

  let principal=null,scopes=[],authType=null;

  if(apiKey){
    authType="api_key";
    if(apiKey!==DEMO.apiKey)return unauthorized("invalid_api_key");
    principal="demo-api-key-client";
    scopes=["customer:read"];
  }else if(authorization.startsWith("Bearer ")){
    authType="bearer";
    const token=authorization.slice(7);
    if(token===DEMO.bearerExpired)return unauthorized("token_expired");
    if(token===DEMO.bearerRead){
      principal="demo-bearer-client";
      scopes=["customer:read","profile:read"];
    }else if(token===DEMO.bearerNoScope){
      principal="demo-bearer-client";
      scopes=["profile:read"];
    }else return unauthorized("invalid_bearer_token");
  }else if(authorization.startsWith("Basic ")){
    authType="basic";
    let decoded="";
    try{decoded=atob(authorization.slice(6));}catch{return unauthorized("invalid_basic_encoding");}
    if(decoded!==DEMO.basicUser+":"+DEMO.basicPass)return unauthorized("invalid_basic_credentials");
    principal="demo-basic-client";
    scopes=["customer:read"];
  }else{
    return unauthorized("credential_missing");
  }

  if(!scopes.includes(requiredScope))return forbidden("missing_scope:"+requiredScope);

  return new Response(JSON.stringify({
    ok:true,status:200,
    auth:{type:authType,principal,scopes,requiredScope},
    resource:{customerId:"C-1042",name:"Mina Yilmaz",segment:"business"},
    lesson:"Credential gültig + erforderlicher Scope vorhanden."
  }),{status:200,headers:noStore});
}

export function onRequest(){
  return new Response(JSON.stringify({ok:false,error:"method_not_allowed"}),{
    status:405,headers:{...noStore,Allow:"GET"}
  });
}