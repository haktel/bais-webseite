const forms=document.querySelectorAll(".js-api-form");
for(const form of forms){
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  const button=form.querySelector('button[type="submit"]'),status=form.querySelector(".formStatus");
  if(!form.reportValidity())return;
  const data={};
  for(const [key,value] of new FormData(form).entries()){
   if(key==="cf-turnstile-response")continue;
   if(Object.hasOwn(data,key))data[key]=Array.isArray(data[key])?[...data[key],value]:[data[key],value];else data[key]=value;
  }
  const token=new FormData(form).get("cf-turnstile-response");
  data.turnstileToken=token||"";
  button.disabled=true;button.setAttribute("aria-busy","true");status.className="formStatus";status.textContent="Wird sicher übermittelt …";
  try{
   const response=await fetch(form.dataset.endpoint,{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},body:JSON.stringify(data)});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(result?.error?.message||"Die Anfrage konnte nicht gesendet werden.");
   status.className="formStatus success";status.textContent=result.message||"Vielen Dank. Ihre Anfrage wurde übermittelt.";
   form.reset();form.dispatchEvent(new Event("academy:reset"));if(window.turnstile)window.turnstile.reset();
  }catch(error){
   status.className="formStatus error";status.textContent=error instanceof Error?error.message:"Die Anfrage konnte nicht gesendet werden.";
   if(window.turnstile)window.turnstile.reset();
  }finally{button.disabled=false;button.removeAttribute("aria-busy");}
 });
}