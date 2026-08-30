(()=> {
  const COURSE=document.body.dataset.course||"n8n-bootcamp",MODULE=document.body.dataset.module||"modul-01";
  const lessons=[...document.querySelectorAll("[data-lesson]")];
  const bar=document.querySelector("[data-progress-bar]");
  const text=document.querySelector("[data-progress-text]");
  const IS_N8N=COURSE==="n8n-bootcamp";
  let state={
    completedLessons:[],labCases:[],assessmentBest:0,lessonTotal:lessons.length||12,labTotal:0,assessmentTarget:81,modulePercent:0,
    sequence:IS_N8N?{enforced:true,nextLesson:"01",lessonsComplete:false,labsUnlocked:false,nextLabCase:null,labsComplete:false,assessmentUnlocked:false}:{enforced:false}
  };
  let busy=false;

  const getPresetButtons=()=>[...document.querySelectorAll(".liveLab button")].filter(button=>Object.keys(button.dataset).some(key=>key.toLowerCase().endsWith("preset")));
  const presetCase=button=>{
    const key=Object.keys(button.dataset).find(k=>k.toLowerCase().endsWith("preset"));
    return key?String(button.dataset[key]||""):"";
  };
  const ensureLockBanner=(container,key,textValue)=>{
    if(!container)return null;
    let banner=container.querySelector(`[data-sequence-lock="${key}"]`);
    if(!banner){
      banner=document.createElement("div");
      banner.className="sequenceLockBanner";
      banner.dataset.sequenceLock=key;
      container.prepend(banner);
    }
    banner.textContent=textValue;
    return banner;
  };

  const ensureEvidenceStyle=()=>{
    if(document.getElementById("n8n-evidence-style"))return;
    const style=document.createElement("style");
    style.id="n8n-evidence-style";
    style.textContent='.teachList label.evidenceDone{border-color:#9bcdbd;background:#f4fbf8}.teachList label.evidencePending{opacity:.72}.teachList input[type="checkbox"][disabled]{cursor:not-allowed}.masteryEvidenceState{display:block;margin-top:5px;font-size:.7rem;font-weight:800;color:#63747b}.evidenceDone .masteryEvidenceState{color:#0a6b55}.nextModule a.sequenceLocked{pointer-events:auto;opacity:.55;cursor:not-allowed;text-decoration:none}';
    document.head.append(style);
  };

  const applyMasteryEvidence=()=>{
    if(!IS_N8N)return;
    const labels=[...document.querySelectorAll(".teachList label")];
    if(!labels.length)return;
    ensureEvidenceStyle();
    const done=new Set((state.completedLessons||[]).map(String));
    labels.forEach((label,index)=>{
      const input=label.querySelector('input[type="checkbox"]');
      if(!input)return;
      const lessonId=String(index+1).padStart(2,"0");
      const achieved=done.has(lessonId)||done.has(String(index+1));
      input.checked=achieved;
      input.disabled=true;
      input.setAttribute("aria-disabled","true");
      input.tabIndex=-1;
      label.classList.toggle("evidenceDone",achieved);
      label.classList.toggle("evidencePending",!achieved);
      let status=label.querySelector(".masteryEvidenceState");
      if(!status){
        status=document.createElement("small");
        status.className="masteryEvidenceState";
        label.append(status);
      }
      status.textContent=achieved
        ?"✓ Automatisch aus abgeschlossenem Lernnachweis"
        :"🔒 Wird erst durch Lerneinheit "+lessonId+" bestätigt";
    });
  };

  const applyNextModuleGate=()=>{
    if(!IS_N8N)return;
    const unlocked=Number(state.modulePercent||0)>=100;
    document.querySelectorAll(".nextModule a").forEach(link=>{
      if(!link.dataset.sequenceOriginalText)link.dataset.sequenceOriginalText=link.textContent||"Weiter";
      if(link.dataset.sequenceGateBound!=="true"){
        link.dataset.sequenceGateBound="true";
        link.addEventListener("click",event=>{
          if(link.dataset.sequenceLocked==="true"){
            event.preventDefault();
            document.querySelector("[data-progress-text]")?.scrollIntoView({behavior:"smooth",block:"center"});
            alert("Dieses Modul muss zuerst vollständig abgeschlossen werden: 12 Lerneinheiten, alle Pflicht-Labs und das Assessment.");
          }
        });
      }
      link.dataset.sequenceLocked=String(!unlocked);
      link.classList.toggle("sequenceLocked",!unlocked);
      if(unlocked){
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
        link.title="";
        link.textContent=link.dataset.sequenceOriginalText;
      }else{
        link.setAttribute("aria-disabled","true");
        link.setAttribute("tabindex","-1");
        link.title="Erst nach 100% Modulfortschritt freigeschaltet";
        link.textContent="🔒 Weiter erst nach vollständigem Modulabschluss";
      }
    });
  };

  const applySequenceLocks=()=>{
    if(!IS_N8N)return;
    const seq=state.sequence||{};
    const done=new Set(state.completedLessons||[]);
    const nextLesson=seq.nextLesson||null;

    lessons.forEach(lesson=>{
      const id=lesson.dataset.lesson;
      const completed=done.has(id);
      const unlocked=completed||!nextLesson||id===nextLesson;
      lesson.dataset.sequenceLocked=String(!unlocked);
      lesson.classList.toggle("sequenceLocked",!unlocked);
      const details=lesson.querySelector("details");
      const button=lesson.querySelector("[data-done]");
      const nav=document.querySelector(`.studyNav a[href="#${lesson.id}"]`);
      if(!unlocked){
        if(details?.open)details.open=false;
        if(button){button.disabled=true;button.textContent=`🔒 Erst Lerneinheit ${nextLesson} abschließen`;}
        nav?.classList.add("sequenceLocked");
        nav?.setAttribute("aria-disabled","true");
      }else{
        nav?.classList.remove("sequenceLocked");
        nav?.removeAttribute("aria-disabled");
      }
    });

    const liveLab=document.querySelector(".liveLab");
    const presets=getPresetButtons();
    if(liveLab){
      const labsUnlocked=Boolean(seq.labsUnlocked);
      const nextCase=seq.nextLabCase||null;
      liveLab.classList.toggle("sequenceLocked",!labsUnlocked);
      const banner=ensureLockBanner(
        liveLab,
        "lab",
        labsUnlocked
          ? nextCase?`Pflicht-Reihenfolge aktiv · als Nächstes: ${nextCase}`:"✓ Alle Pflicht-Labs abgeschlossen."
          :"🔒 Live Lab wird erst nach allen 12 Lerneinheiten freigeschaltet."
      );
      banner?.classList.toggle("ready",labsUnlocked);

      presets.forEach(button=>{
        const id=presetCase(button);
        const completed=(state.labCases||[]).includes(id);
        const allowed=labsUnlocked&&Boolean(nextCase)&&id===nextCase;
        button.disabled=!allowed;
        button.classList.toggle("sequenceDone",completed);
        button.classList.toggle("sequenceCurrent",allowed);
        button.title=completed?"Bereits abgeschlossen":allowed?"Nächster Pflichtfall":"Noch gesperrt";
      });

      const active=presets.find(button=>button.getAttribute("aria-pressed")==="true");
      const activeCase=active?presetCase(active):"";
      [...liveLab.querySelectorAll("button")].filter(button=>!presets.includes(button)).forEach(button=>{
        button.disabled=!labsUnlocked||!nextCase||activeCase!==nextCase;
      });
    }

    const assessment=document.querySelector("[data-assessment]");
    if(assessment){
      const unlocked=Boolean(seq.assessmentUnlocked);
      assessment.classList.toggle("sequenceLocked",!unlocked);
      assessment.setAttribute("aria-disabled",String(!unlocked));
      const banner=ensureLockBanner(
        assessment,
        "assessment",
        unlocked?"✓ Assessment freigeschaltet.":"🔒 Assessment wird nach allen Lerneinheiten und Pflicht-Labs freigeschaltet."
      );
      banner?.classList.toggle("ready",unlocked);
    }
  };

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
      const nav=document.querySelector(`.studyNav a[href="#${lesson.id}"]`);
      if(button&&done.has(id)){
        button.classList.add("done");
        button.disabled=true;
        button.textContent="✓ Abgeschlossen";
        lesson.classList.add("done");
        nav?.classList.add("done");
      }else{
        lesson.classList.remove("done");
        nav?.classList.remove("done");
      }
    });
    applySequenceLocks();
    applyMasteryEvidence();
    applyNextModuleGate();
    const pct=Number(state.modulePercent)||0;
    if(bar)bar.style.width=pct+"%";
    const grade=state.assessmentBest>0&&window.percentToNote?window.percentToNote(state.assessmentBest):null;
    const assessmentText=grade?`Note ${grade.note} (${state.assessmentBest}%)`:"noch nicht abgelegt";
    const lessonTotal=Number(state.lessonTotal)||lessons.length||12,labTotal=Number(state.labTotal)||state.labCases.length||0;
    if(text)text.textContent=`${state.completedLessons.length}/${lessonTotal} Lektionen · ${state.labCases.length}/${labTotal} Labs · Assessment ${assessmentText} · Modul ${pct}%`;
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
  // Required time scales with how much there is to read, at a careful
  // (not skimming) reading pace, with a generous floor so even short
  // lessons demand real engagement - tracked cumulatively across
  // close/reopen so closing early never punishes you, just doesn't count
  // more time. Only one lesson's "Vertiefung" can be open at a time
  // (accordion behaviour below), so the clock always reflects time
  // actually spent on that one lesson - it can't be padded by opening
  // several sections at once and waiting once for all of them.
  const READ_WPM=130,MIN_READ_SECONDS=50,MAX_READ_SECONDS=240;
  const estimateReadSeconds=text=>{
    const words=text.trim().split(/\s+/).filter(Boolean).length;
    return Math.min(MAX_READ_SECONDS,Math.max(MIN_READ_SECONDS,Math.round(words/READ_WPM*60)));
  };

  const openLessons=[];

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
      if(IS_N8N&&lesson.dataset.sequenceLocked==="true"){
        if(timer){clearInterval(timer);timer=null;}
        button.disabled=true;
        button.textContent=`🔒 Erst Lerneinheit ${state.sequence?.nextLesson||"01"} abschließen`;
        banner.classList.remove("ready");
        label.textContent="Diese Lerneinheit ist noch gesperrt.";
        return;
      }
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

    const pause=()=>{
      if(openedAt){accumulated+=(Date.now()-openedAt)/1000;openedAt=null;}
      if(timer){clearInterval(timer);timer=null;}
      updateButton();
    };

    const entry={details,pause};

    details.addEventListener("toggle",()=>{
      if(details.open&&IS_N8N&&lesson.dataset.sequenceLocked==="true"){
        details.open=false;
        return;
      }
      if(details.open){
        // Accordion: opening this lesson's "Vertiefung" forces every other
        // currently open one shut and pauses its clock, so the required
        // time always reflects attention actually spent on this lesson -
        // not several sections left open in parallel during one wait.
        openLessons.forEach(other=>{
          if(other!==entry&&other.details.open){other.details.open=false;other.pause();}
        });
        if(!openLessons.includes(entry))openLessons.push(entry);
        banner.hidden=button.classList.contains("done");
        if(IS_N8N&&lesson.dataset.serverEvidenceOpen!=="true"&&lesson.dataset.serverEvidenceOpen!=="pending"){
          lesson.dataset.serverEvidenceOpen="pending";
          api("/api/academy/module-progress",{method:"POST",body:JSON.stringify({courseSlug:COURSE,moduleSlug:MODULE,event:"lesson_open",lessonId:lesson.dataset.lesson})})
            .then(()=>{lesson.dataset.serverEvidenceOpen="true";})
            .catch(error=>{
              lesson.dataset.serverEvidenceOpen="";
              banner.classList.remove("ready");
              label.textContent="Server-Lernnachweis konnte nicht gestartet werden: "+error.message;
            });
        }
        openedAt=Date.now();
        if(button.dataset.unlocked!=="true"){
          updateButton();
          timer=setInterval(updateButton,1000);
        }
      }else{
        pause();
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

  if(IS_N8N){
    getPresetButtons().forEach(button=>button.addEventListener("click",()=>setTimeout(applySequenceLocks,0)));
    document.querySelectorAll(".studyNav a").forEach(link=>link.addEventListener("click",event=>{
      if(link.classList.contains("sequenceLocked")){
        event.preventDefault();
        const current=state.sequence?.nextLesson||"01";
        document.getElementById("l"+Number(current))?.scrollIntoView({behavior:"smooth",block:"start"});
      }
    }));
  }

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
    }finally{
      busy=false;
      run.disabled=false;
      run.textContent="Live Workflow starten";
      if(IS_N8N)setTimeout(applySequenceLocks,0);
    }
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

  if(IS_N8N)renderProgress();
  loadState();
})();