const logoutButton=document.querySelector("[data-admin-logout]");

logoutButton?.addEventListener("click",async event=>{
 event.preventDefault();
 event.stopImmediatePropagation();
 if(logoutButton.disabled)return;
 const originalText=logoutButton.textContent;
 logoutButton.disabled=true;
 logoutButton.textContent="Abmeldung …";
 try{
  const response=await fetch("/api/academy/auth/logout",{
   method:"POST",
   credentials:"same-origin",
   headers:{"content-type":"application/json"},
   body:"{}"
  });
  if(response.status===403)throw new Error("Abmeldung wurde vom Server abgelehnt.");
  location.replace("/admin-login/");
 }catch(error){
  logoutButton.disabled=false;
  logoutButton.textContent=originalText;
  alert(error?.message||"Abmeldung fehlgeschlagen. Bitte erneut versuchen.");
 }
},{capture:true});
