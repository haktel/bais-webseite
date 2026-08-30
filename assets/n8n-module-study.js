(()=> {
  const COURSE="n8n-bootcamp",MODULE=document.body.dataset.module||"modul-01";
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
      const id=lesson.dataset.lesson,button=lesson.querySelector("[data-done]");
      if(button&&done.has(id)){
        button.classList.add("done");
        button.disabled=true;
        button.textContent="✓ Abgeschlossen";
        lesson.classList.add("done");
        document.querySelector(`.studyNav a[href="#${lesson.id}"]`)?.classList.add("done");
      }
    });
    const pct=Number(state.modulePercent)||0;
    if(bar)bar.style.width=pct+"%";
    const grade=state.assessmentBest>0&&window.percentToNote?window.percentToNote(state.assessmentBest):null;
    const assessmentText=grade?`Note ${grade.note} (${state.assessmentBest}%)`:"noch nicht abgelegt";
    if(text)text.textContent=`${state.completedLessons.length}/12 Lektionen · ${state.labCases.length}/3 Labs · Assessment ${assessmentText} · Modul ${pct}%`;
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

  // A learner can no longer unlock "Lerneinheit abschließen" just by
  // opening the "Vertiefung" - the button stays disabled with a live
  // countdown until enough time has actually been spent with it open.
  // Required time scales with how much there is to read (min 20s, max
  // 110s at ~200 words/minute), tracked cumulatively across close/reopen
  // so closing early never punishes you, just doesn't count more time.
  const READ_WPM=200,MIN_READ_SECONDS=20,MAX_READ_SECONDS=110;
  const estimateReadSeconds=text=>{
    const words=text.trim().split(/\s+/).filter(Boolean).length;
    return Math.min(MAX_READ_SECONDS,Math.max(MIN_READ_SECONDS,Math.round(words/READ_WPM*60)));
  };

  lessons.forEach(lesson=>{
    const details=lesson.querySelector("details"),button=lesson.querySelector("[data-done]");
    if(!details||!button)return;
    const summary=details.querySelector("summary");
    const bodyText=[...details.childNodes].filter(node=>node!==summary).map(node=>node.textContent||"").join(" ");
    const required=estimateReadSeconds(bodyText);
    let accumulated=0,openedAt=null,timer=null;

    // A dedicated, impossible-to-miss reading-progress banner, injected
    // right below "Vertiefung öffnen" - not just a countdown hidden inside
    // the completion button's own label.
    const banner=document.createElement("div");
    banner.className="readTimer";
    banner.innerHTML='<div class="readTimerBar"><i></i></div><span class="readTimerText"></span>';
    summary.after(banner);
    const bar=banner.querySelector("i"),label=banner.querySelector(".readTimerText");

    const updateBanner=(totalRead)=>{
      const pct=Math.min(100,Math.round(totalRead/required*100));
      bar.style.width=pct+"%";
      if(totalRead>=required){
        banner.classList.add("ready");
        label.textContent="✓ Lesezeit erreicht — du kannst diese Lerneinheit jetzt abschließen.";
      }else{
        banner.classList.remove("ready");
        label.textContent=`Lesezeit: ${Math.ceil(totalRead)}s / ${required}s${details.open?"":" · Vertiefung wieder öffnen, um weiterzulesen"}`;
      }
    };

    const updateButton=()=>{
      if(button.classList.contains("done")){banner.hidden=true;return;}
      const elapsedOpen=openedAt?(Date.now()-openedAt)/1000:0;
      const totalRead=accumulated+elapsedOpen;
      updateBanner(totalRead);
      if(totalRead>=required){
        button.dataset.unlocked="true";
        button.disabled=false;
        button.textContent="Lerneinheit abschließen";
        if(timer){clearInterval(timer);timer=null;}
      }else{
        button.disabled=true;
        button.textContent=details.open?"Lesezeit läuft …":"Vertiefung öffnen";
      }
    };

    details.addEventListener("toggle",()=>{
      if(details.open){
        banner.hidden=button.classList.contains("done");
        openedAt=Date.now();
        if(button.dataset.unlocked!=="true"){
          updateButton();
          timer=setInterval(updateButton,1000);
        }
      }else{
        if(openedAt){accumulated+=(Date.now()-openedAt)/1000;openedAt=null;}
        if(timer){clearInterval(timer);timer=null;}
        updateButton();
      }
    });

    button.addEventListener("click",async()=>{
      if(button.disabled)return;
      button.disabled=true;
      try{await postEvidence({event:"lesson_complete",lessonId:lesson.dataset.lesson});if(timer){clearInterval(timer);timer=null;}}
      catch(error){button.disabled=false;updateButton();}
    });

    updateButton();
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

  const connector=window.mountLabConnector?window.mountLabConnector(document.querySelector(".labNodes")):{lines:[],reset(){}};
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function animate(success=true){
    connector.reset();
    for(let i=0;i<nodes.length;i++){
      const node=nodes[i];
      if(i>0)connector.lines[i-1]?.classList.add("active");
      node.classList.add("active");
      await wait(220);
      node.classList.remove("active");
      const ok=success||i<1;
      node.classList.add(ok?"ok":"error");
      if(i>0){connector.lines[i-1]?.classList.remove("active");if(ok)connector.lines[i-1]?.classList.add("done");}
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

  // Generic hook for module-specific lab UIs (e.g. modul-02's JSON lab)
  // that can't share modul-01's form-based markup but still need to
  // report a correctly-completed lab case as evidence.
  window.addEventListener("bais:lab-case",async event=>{
    const caseId=event.detail?.caseId;
    if(typeof caseId==="string"&&caseId){
      try{await postEvidence({event:"lab_case",caseId});}catch{}
    }
  });

  loadState();
})();