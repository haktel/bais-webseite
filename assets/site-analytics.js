(()=>{
 try{
  const KEY="baisSid",ENTRY_KEY="baisEntrySent";
  let sessionId=sessionStorage.getItem(KEY);
  if(!sessionId){sessionId=crypto.randomUUID();sessionStorage.setItem(KEY,sessionId);}
  const isEntry=!sessionStorage.getItem(ENTRY_KEY);
  if(isEntry)sessionStorage.setItem(ENTRY_KEY,"1");
  const startedAt=Date.now();
  let visitId=null,leaveSent=false;

  fetch("/api/track",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"view",sessionId,path:location.pathname,referrer:document.referrer||null,isEntry}),credentials:"same-origin",keepalive:true})
   .then(r=>r.ok?r.json():null)
   .then(data=>{if(data&&data.id)visitId=data.id;})
   .catch(()=>{});

  const sendLeave=()=>{
   if(leaveSent||!visitId)return;
   leaveSent=true;
   const durationSeconds=Math.round((Date.now()-startedAt)/1000);
   const payload=JSON.stringify({action:"leave",visitId,durationSeconds});
   if(navigator.sendBeacon){
    navigator.sendBeacon("/api/track",new Blob([payload],{type:"application/json"}));
   }else{
    fetch("/api/track",{method:"POST",headers:{"content-type":"application/json"},body:payload,keepalive:true}).catch(()=>{});
   }
  };

  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")sendLeave();});
  addEventListener("pagehide",sendLeave);
 }catch{}
})();
