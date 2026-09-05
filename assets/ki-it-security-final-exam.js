(()=> {
 const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 const status=$("[data-final-status]"),modules=$("[data-final-modules]"),start=$("[data-final-start]"),questions=$("[data-final-questions]"),submit=$("[data-final-submit]"),result=$("[data-final-result]"),timer=$("[data-final-timer]"),meta=$("[data-final-meta]");
 let attemptId=null,expiresAt=null,examQuestions=[],tick=null;
 const api=async(options={})=>{const r=await fetch("/api/academy/ki-it-security-final-exam",{credentials:"same-origin",headers:{"Accept":"application/json","Content-Type":"application/json"},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error?.message||"Anfrage fehlgeschlagen.");return d;};
 function renderModules(items){modules.innerHTML=items.map((m,i)=>'<article class="'+(m.ready?"ready":"wait")+'"><span>MODUL '+String(i+1).padStart(2,"0")+'</span><strong>'+m.modulePercent+'%</strong><span>Assessment '+m.assessmentBest+'%</span></article>').join("");}
 function renderStatus(d){
  renderModules(d.modules||[]);
  start.disabled=!d.eligible;
  status.className="statusBanner "+(d.eligible?"ok":"warn");
  status.innerHTML=d.eligible?"<strong>✓ Prüfungsfreigabe aktiv</strong><p>Alle 6 Module sind serverseitig mit 100% dokumentiert.</p>":"<strong>Noch nicht freigeschaltet</strong><p>Alle 6 Module müssen 100% erreichen. Fehlende Module sind unten markiert.</p>";
  meta.innerHTML='<div><span>FRAGEN</span><strong>'+d.questionCount+'</strong></div><div><span>ZEIT</span><strong>'+d.timeLimitMinutes+' Min.</strong></div><div><span>BESTEHEN</span><strong>≥ '+d.passScore+'%</strong></div><div><span>BEST SCORE</span><strong>'+d.bestPassedScore+'%</strong></div>';
  if(d.certificate){result.hidden=false;result.className="examResult pass";result.innerHTML='<div class="scoreBig">Zertifikat aktiv</div><p>'+esc(d.certificate.title)+'</p><div class="certificateBox"><strong>'+esc(d.certificate.code)+'</strong><br><a href="'+esc(d.certificate.verificationUrl)+'">Öffentlich prüfen →</a></div>';}
 }
 function renderExam(d){
  attemptId=d.attemptId;expiresAt=new Date(d.expiresAt);examQuestions=d.questions||[];
  questions.innerHTML=examQuestions.map((q,i)=>'<article class="examQ"><div class="examQTop"><span>FRAGE '+(i+1)+'/'+examQuestions.length+'</span><span>MODUL '+String(q.module).padStart(2,"0")+'</span></div><h3>'+esc(q.prompt)+'</h3><div class="examOptions">'+q.options.map((o,idx)=>'<label class="examOption"><input type="radio" name="'+esc(q.id)+'" value="'+idx+'"><span>'+esc(o)+'</span></label>').join("")+'</div></article>').join("");
  questions.hidden=false;submit.hidden=false;start.hidden=true;result.hidden=true;
  if(tick)clearInterval(tick);tick=setInterval(updateTimer,1000);updateTimer();
 }
 function updateTimer(){
  if(!expiresAt)return;const ms=expiresAt-Date.now(),sec=Math.max(0,Math.floor(ms/1000)),m=Math.floor(sec/60),s=sec%60;
  timer.innerHTML='<span>RESTZEIT</span><strong>'+String(m).padStart(2,"0")+':'+String(s).padStart(2,"0")+'</strong>';
  timer.classList.toggle("expired",ms<=0);submit.disabled=ms<=0;
  if(ms<=0&&tick){clearInterval(tick);tick=null;}
 }
 start.addEventListener("click",async()=>{start.disabled=true;start.textContent="Prüfung wird vorbereitet…";try{const d=await api({method:"POST",body:JSON.stringify({action:"start"})});renderExam(d);}catch(e){status.className="statusBanner warn";status.textContent=e.message;start.disabled=false;}finally{start.textContent="Abschlussprüfung starten";}});
 submit.addEventListener("click",async()=>{const answers={};for(const q of examQuestions){const v=document.querySelector('input[name="'+CSS.escape(q.id)+'"]:checked');if(!v){alert("Bitte alle Fragen beantworten.");return;}answers[q.id]=Number(v.value);}submit.disabled=true;submit.textContent="Wird ausgewertet…";try{const d=await api({method:"POST",body:JSON.stringify({action:"submit",attemptId,answers})});if(tick)clearInterval(tick);result.hidden=false;result.className="examResult "+(d.passed?"pass":"fail");result.innerHTML='<div class="scoreBig">'+d.score+'% · Note '+d.grade+'</div><p>'+d.correct+'/'+d.total+' richtig · BAIS Bestehensgrenze '+d.passScore+'%.</p><div class="reviewList">'+d.review.map((r,i)=>'<article class="'+(r.correct?"ok":"bad")+'"><strong>Frage '+(i+1)+' · Modul '+String(r.module).padStart(2,"0")+' · '+(r.correct?"richtig":"falsch")+'</strong><p>'+esc(r.explanation)+'</p></article>').join("")+'</div>'+(d.certificate?'<div class="certificateBox"><strong>Zertifikat: '+esc(d.certificate.code)+'</strong><br><a href="'+esc(d.certificate.verificationUrl)+'">Öffentlich prüfen →</a></div>':'<p>Ein neuer Versuch verwendet möglichst andere Fragen als der letzte Versuch.</p>');questions.hidden=true;submit.hidden=true;start.hidden=false;start.disabled=false;start.textContent="Neuen Versuch starten";}catch(e){result.hidden=false;result.className="examResult fail";result.textContent=e.message;submit.disabled=false;}finally{submit.textContent="Prüfung abgeben";}});
 api({method:"GET",headers:{"Accept":"application/json"}}).then(renderStatus).catch(e=>{status.className="statusBanner warn";status.textContent=e.message;start.disabled=true;});
})();
