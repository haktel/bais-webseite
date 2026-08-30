(()=> {
  const COURSE="n8n-bootcamp",MODULE="modul-01";
  const lessons=[...document.querySelectorAll("[data-lesson]")];
  const bar=document.querySelector("[data-progress-bar]");
  const text=document.querySelector("[data-progress-text]");
  let state={completedLessons:[],labCases:[],assessmentBest:0,modulePercent:0};
  let busy=false;

  const api=async(url,options={})=>{
    const response=await fetch(url,{credentials:"same-origin",headers:{"Content-Type":"application/json","Accept":"application/json",...(options.headers||{})},...options});
    const data=await response.json().catch(()=>({ok:false,error:{message:"Ungültige Serverantwort."}}));
    if(!response.ok)throw new Error(data.error?.message||"Anfrage fehlgeschlagen.");
    return data;
  };

  const renderProgress=()=>{
    const done=new Set(state.completedLessons||[]);
    lessons.forEach(lesson=>{
      const id=lesson.dataset.lesson,button=lesson.querySelector("[data-done]"),details=lesson.querySelector("details");
      const complete=done.has(id);
      if(button){
        button.classList.toggle("done",complete);
        button.disabled=complete||(!details?.open&&button.dataset.unlocked!=="true");
        button.textContent=complete?"✓ Abgeschlossen":button.disabled?"Vertiefung öffnen":"Lerneinheit abschließen";
      }
    });
    const pct=Number(state.modulePercent)||0;
    if(bar)bar.style.width=pct+"%";
    if(text)text.textContent=`${state.completedLessons.length}/12 Lektionen · ${state.labCases.length}/3 Labs · Assessment ${state.assessmentBest}% · Modul ${pct}%`;
  };

  const postEvidence=async(payload)=>{
    const data=await api("/api/academy/module-progress",{method:"POST",body:JSON.stringify({courseSlug:COURSE,moduleSlug:MODULE,...payload})});
    state=data.module;
    renderProgress();
    return data;
  };

  const loadState=async()=>{
    try{
      const data=await api(`/api/academy/module-progress?courseSlug=${encodeURIComponent(COURSE)}&moduleSlug=${encodeURIComponent(MODULE)}`,{method:"GET",headers:{}});
      state=data.module;
      renderProgress();
    }catch(error){
      if(text)text.textContent="Fortschritt konnte nicht geladen werden.";
    }
  };

  lessons.forEach(lesson=>{
    const details=lesson.querySelector("details"),button=lesson.querySelector("[data-done]");
    details?.addEventListener("toggle",()=>{
      if(details.open&&button&&!button.classList.contains("done")){
        button.dataset.unlocked="true";
        button.disabled=false;
        button.textContent="Lerneinheit abschließen";
      }
    });
    button?.addEventListener("click",async()=>{
      if(button.disabled)return;
      button.disabled=true;
      try{await postEvidence({event:"lesson_complete",lessonId:lesson.dataset.lesson});}
      catch(error){button.disabled=false;button.textContent="Erneut versuchen";}
    });
  });

  const form=document.querySelector("[data-lab-form]");
  const out=document.querySelector("[data-lab-output]");
  const nodes=[...document.querySelectorAll("[data-lab-node]")];
  const run=document.querySelector("[data-lab-run]");
  const presets=[...document.querySelectorAll("[data-lab-preset]")];
  let activeCase="";

  const scenarios={
    qualified:{name:"Mina Yilmaz",email:"mina@example.com",company:"Nord GmbH",budget:"7500"},
    standard:{name:"Jonas Weber",email:"jonas@example.com",company:"Weber Service",budget:"3200"},
    invalid:{name:"Test Fehler",email:"keine-gueltige-mail",company:"Demo GmbH",budget:"7500"}
  };

  presets.forEach(button=>button.addEventListener("click",()=>{
    if(busy)return;
    activeCase=button.dataset.labPreset;
    const values=scenarios[activeCase];
    if(!values||!form)return;
    Object.entries(values).forEach(([name,value])=>{const input=form.elements.namedItem(name);if(input)input.value=value;});
    presets.forEach(x=>x.setAttribute("aria-pressed",String(x===button)));
    out.textContent=activeCase==="invalid"
      ?"Fehlerszenario geladen. Erwartung: Validation lehnt die ungültige E-Mail ab."
      :"Szenario geladen. Formuliere zuerst deine Erwartung und starte dann den Workflow.";
    nodes.forEach(n=>n.classList.remove("active","ok","error"));
  }));

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function animate(success=true){
    for(let i=0;i<nodes.length;i++){
      const node=nodes[i];
      node.classList.add("active");
      await wait(220);
      node.classList.remove("active");
      node.classList.add(success||i<1?"ok":"error");
    }
  }

  form?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(busy)return;
    busy=true;run.disabled=true;run.textContent="n8n läuft…";
    nodes.forEach(n=>n.classList.remove("active","ok","error"));
    out.textContent="Production Webhook wird aufgerufen…";
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      const response=await fetch("/api/n8n-module-01",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(data)});
      const body=await response.json().catch(()=>({}));
      await animate(response.ok);
      out.textContent=JSON.stringify(body,null,2);

      const qualifiedOk=activeCase==="qualified"&&response.ok&&body.route==="qualified";
      const standardOk=activeCase==="standard"&&response.ok&&body.route==="standard";
      const invalidOk=activeCase==="invalid"&&response.status===422&&body.route==="rejected";
      if(qualifiedOk||standardOk||invalidOk){
        await postEvidence({event:"lab_case",caseId:activeCase});
        out.textContent+="\n\n✓ Lernfall korrekt durchgeführt und automatisch gespeichert.";
      }else{
        out.textContent+="\n\nDieser Lauf zählt noch nicht als abgeschlossener Lernfall. Wähle A/B/C und prüfe Erwartung, Input und Route.";
      }
    }catch(error){
      nodes[0]?.classList.add("error");
      out.textContent="FEHLER: "+error.message+"\n\nDebugging: Input → Trigger → Execution → Node → Output.";
    }finally{busy=false;run.disabled=false;run.textContent="Live Workflow starten";}
  });

  window.addEventListener("bais:assessment-result",async event=>{
    const score=Number(event.detail?.score);
    if(Number.isInteger(score)){
      try{await postEvidence({event:"assessment_result",score});}catch{}
    }
  });

  loadState();
})();