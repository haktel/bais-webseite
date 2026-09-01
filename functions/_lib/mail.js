import{ApiError}from"./api.js";

const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
export async function sendAcademyInviteEmail({env,to,name,courseTitle,inviteUrl,expiresAt,idempotencyKey}){
 const apiKey=String(env?.RESEND_API_KEY||""),from=String(env?.TRANSACTIONAL_EMAIL_FROM||"BAIS <info@bais-solutions.de>").trim();
 if(!apiKey||!from)throw new ApiError(503,"transactional_email_not_configured","Transaktionaler E-Mail-Versand ist noch nicht konfiguriert.");
 const base=String(env?.PUBLIC_BASE_URL||"https://bais-solutions.de").replace(/\/+$/,""),url=new URL(inviteUrl,base).toString();
 const subject="Ihre BAIS Academy Einladung";
 const html=`<div style="font-family:Arial,sans-serif;line-height:1.55;color:#111"><h2>BAIS Academy Einladung</h2><p>Guten Tag ${escapeHtml(name||"")},</p><p>Ihre Anfrage für <strong>${escapeHtml(courseTitle)}</strong> wurde freigegeben.</p><p><a href="${escapeHtml(url)}">Academy-Konto sicher erstellen</a></p><p>Der Link ist einmalig und gültig bis ${escapeHtml(new Date(expiresAt).toLocaleString("de-DE",{timeZone:"Europe/Berlin"}))}.</p><p>Falls Sie diese Anfrage nicht gestellt haben, verwenden Sie den Link nicht.</p><p>BAIS · Bünyamin Atik – IT Solutions</p></div>`;
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
  "authorization":"Bearer "+apiKey,
  "content-type":"application/json",
  "idempotency-key":String(idempotencyKey||"").slice(0,256)
 },body:JSON.stringify({from,to:[to],subject,html})});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new ApiError(502,"transactional_email_failed","Einladungs-E-Mail konnte nicht zugestellt werden.");
 return{id:data?.id||null};
}


export async function sendCustomerVerificationEmail({env,to,name,verificationToken,expiresAt,idempotencyKey}){
 const apiKey=String(env?.RESEND_API_KEY||""),from=String(env?.TRANSACTIONAL_EMAIL_FROM||"BAIS <info@bais-solutions.de>").trim();
 if(!apiKey||!from)throw new ApiError(503,"transactional_email_not_configured","Transaktionaler E-Mail-Versand ist noch nicht konfiguriert.");
 const base=String(env?.PUBLIC_BASE_URL||"https://bais-solutions.de").replace(/\/+$/,"");
 const url=new URL("/academy/konto/",base);url.hash="verify="+encodeURIComponent(String(verificationToken||""));
 const subject="Bitte bestätigen Sie Ihre BAIS E-Mail-Adresse";
 const html=`<div style="font-family:Arial,sans-serif;line-height:1.55;color:#111"><h2>BAIS Kundenkonto bestätigen</h2><p>Guten Tag ${escapeHtml(name||"")},</p><p>bitte bestätigen Sie Ihre E-Mail-Adresse, damit Ihr BAIS Kundenkonto aktiviert wird.</p><p><a href="${escapeHtml(url.toString())}">E-Mail-Adresse bestätigen</a></p><p>Der Link ist einmalig und gültig bis ${escapeHtml(new Date(expiresAt).toLocaleString("de-DE",{timeZone:"Europe/Berlin"}))}.</p><p>Geschützte Projektinhalte bleiben unabhängig davon standardmäßig gesperrt und werden nur ausdrücklich freigeschaltet.</p><p>Falls Sie diese Registrierung nicht ausgelöst haben, ignorieren Sie diese Nachricht.</p><p>BAIS · Bünyamin Atik – IT Solutions</p></div>`;
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{
  "authorization":"Bearer "+apiKey,
  "content-type":"application/json",
  "idempotency-key":String(idempotencyKey||"").slice(0,256)
 },body:JSON.stringify({from,to:[to],subject,html})});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new ApiError(502,"transactional_email_failed","Bestätigungs-E-Mail konnte nicht zugestellt werden.");
 return{id:data?.id||null};
}
