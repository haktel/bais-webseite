const params=new URLSearchParams(location.search);
const requested=params.get("continue")||"/admin/";
const continuePath=requested==="/admin"?"/admin/":requested==="/bais-control-center"?"/bais-control-center/":requested.startsWith("/admin/")||requested.startsWith("/bais-control-center/")?requested:"/admin/";
const passwordStep=document.querySelector('[data-admin-step="password"]'),mfaStep=document.querySelector('[data-admin-step="mfa"]');
const passwordIndicator=document.querySelector('[data-step-indicator="password"]'),mfaIndicator=document.querySelector('[data-step-indicator="mfa"]');
const passwordForm=document.querySelector("[data-admin-password-form]"),mfaVerifyForm=document.querySelector("[data-mfa-verify-form]"),mfaConfirmForm=document.querySelector("[data-mfa-confirm-form]");
const mfaStatus=document.querySelector("[data-admin-mfa-status]"),adminIdentity=document.querySelector("[data-admin-identity]");
const mfaSetupActions=document.querySelector("[data-mfa-setup-actions]"),mfaSetup=document.querySelector("[data-mfa-setup]"),mfaRecovery=document.querySelector("[data-mfa-recovery]"),mfaRecoveryCodes=document.querySelector("[data-mfa-recovery-codes]");
const mfaSecret=document.querySelector("[data-mfa-secret]"),mfaQr=document.querySelector("[data-mfa-qr]");
let adminUser=null,qrFactoryPromise;

const api=async(url,options={})=>{
 const response=await fetch(url,{credentials:"same-origin",headers:{"content-type":"application/json",...(options.headers||{})},...options});
 const data=await response.json().catch(()=>({ok:false,error:{message:"Ungültige Serverantwort."}}));
 if(!response.ok)throw new Error(data.error?.message||"Anfrage fehlgeschlagen.");
 return data;
};
const setMessage=(form,message,type="")=>{const target=form?.querySelector(".accountMessage");if(!target)return;target.textContent=message;target.className="accountMessage "+type;};
const showStep=step=>{
 const mfa=step==="mfa";
 passwordStep.hidden=mfa;mfaStep.hidden=!mfa;
 passwordIndicator?.classList.toggle("active",!mfa);mfaIndicator?.classList.toggle("active",mfa);
 if(mfa)setTimeout(()=>mfaVerifyForm?.querySelector("input")?.focus(),0);else setTimeout(()=>passwordForm?.querySelector("input")?.focus(),0);
};
const logout=async()=>{try{await api("/api/academy/auth/logout",{method:"POST",body:"{}"});}catch{}};
const goControlCenter=()=>location.replace(continuePath);
const clearSetupMaterial=()=>{if(mfaSecret)mfaSecret.textContent="";if(mfaQr)mfaQr.replaceChildren();};
const qrcodeFactory=()=>qrFactoryPromise??=import("./vendor/qrcode.mjs").then(module=>module.qrcode);
const renderQr=async uri=>{
 const value=String(uri||"");if(!value.startsWith("otpauth://totp/"))throw new Error("Ungültige MFA-QR-Daten.");
 const qrcode=await qrcodeFactory(),qr=qrcode(0,"M");qr.addData(value);qr.make();mfaQr.innerHTML=qr.createSvgTag({cellSize:6,margin:4,scalable:true});
 const svg=mfaQr.querySelector("svg");if(svg){svg.setAttribute("role","img");svg.setAttribute("aria-label","QR-Code für BAIS Administrator-MFA");svg.setAttribute("focusable","false");}
};
const renderMfaState=state=>{
 showStep("mfa");
 if(adminIdentity)adminIdentity.textContent=adminUser?.email?"Administrator: "+adminUser.email:"Administrator-Sitzung";
 clearSetupMaterial();mfaRecovery.hidden=true;mfaSetup.hidden=true;
 if(state.verified){mfaStatus.textContent="MFA bestätigt. Control Center wird geöffnet …";mfaSetupActions.hidden=true;mfaVerifyForm.hidden=true;goControlCenter();return;}
 if(state.configured){mfaStatus.textContent="Passwort korrekt. Bestätigen Sie jetzt den zweiten Faktor.";mfaSetupActions.hidden=true;mfaVerifyForm.hidden=false;return;}
 mfaStatus.textContent="Passwort korrekt. Für dieses Administrator-Konto muss jetzt MFA eingerichtet werden.";mfaSetupActions.hidden=false;mfaVerifyForm.hidden=true;
};
const loadMfaState=async()=>{const data=await api("/api/admin/mfa",{method:"GET",headers:{}});renderMfaState(data.mfa);return data.mfa;};

passwordForm?.addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),values=Object.fromEntries(new FormData(form));
 button.disabled=true;setMessage(form,"Schritt 1 wird geprüft …");
 try{
  const data=await api("/api/academy/auth/login",{method:"POST",body:JSON.stringify(values)});
  form.reset();
  if(data.user?.role!=="admin"){
   await logout();adminUser=null;throw new Error("Dieses Konto besitzt keine Administrator-Berechtigung.");
  }
  adminUser=data.user;setMessage(form,"");showStep("mfa");await loadMfaState();
 }catch(error){showStep("password");setMessage(form,error.message,"error");}
 finally{button.disabled=false;}
});

document.querySelector("[data-mfa-begin]")?.addEventListener("click",async event=>{
 const button=event.currentTarget;button.disabled=true;
 try{
  const data=await api("/api/admin/mfa",{method:"POST",body:JSON.stringify({action:"begin_setup"})});
  await renderQr(data.setup.otpauthUri);mfaSecret.textContent=data.setup.secret;mfaSetup.hidden=false;mfaSetupActions.hidden=true;mfaStatus.textContent="QR-Code scannen und den 6-stelligen Code bestätigen.";
 }catch(error){mfaStatus.textContent=error.message;}finally{button.disabled=false;}
});

mfaConfirmForm?.addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),code=String(new FormData(form).get("code")||"").trim();
 button.disabled=true;setMessage(form,"MFA wird aktiviert …");
 try{
  const data=await api("/api/admin/mfa",{method:"POST",body:JSON.stringify({action:"confirm_setup",code})});
  clearSetupMaterial();mfaSetup.hidden=true;mfaSetupActions.hidden=true;mfaVerifyForm.hidden=true;mfaRecovery.hidden=false;mfaRecoveryCodes.textContent=(data.recoveryCodes||[]).join("\n");mfaStatus.textContent="MFA ist aktiv. Speichern Sie die Recovery-Codes, bevor Sie fortfahren.";setMessage(form,"");form.reset();
 }catch(error){setMessage(form,error.message,"error");}finally{button.disabled=false;}
});

mfaVerifyForm?.addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),code=String(new FormData(form).get("code")||"").trim();
 button.disabled=true;setMessage(form,"Schritt 2 wird geprüft …");
 try{await api("/api/admin/mfa",{method:"POST",body:JSON.stringify({action:"verify",code})});setMessage(form,"MFA bestätigt.","success");form.reset();goControlCenter();}
 catch(error){setMessage(form,error.message,"error");}finally{button.disabled=false;}
});

document.querySelector("[data-mfa-continue]")?.addEventListener("click",goControlCenter);
document.querySelector("[data-admin-cancel]")?.addEventListener("click",async()=>{await logout();adminUser=null;mfaRecovery.hidden=true;mfaSetup.hidden=true;mfaVerifyForm.hidden=true;mfaSetupActions.hidden=true;showStep("password");setMessage(passwordForm,"Abgemeldet.");});

(async()=>{
 showStep("password");
 try{
  const data=await api("/api/academy/auth/me",{method:"GET",headers:{}});
  if(data.user?.role!=="admin"){await logout();return;}
  adminUser=data.user;showStep("mfa");await loadMfaState();
 }catch{showStep("password");}
})();