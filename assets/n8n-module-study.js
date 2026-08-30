(()=> {
  const key="bais-n8n-mod01-progress";
  const done=new Set(JSON.parse(localStorage.getItem(key)||"[]"));
  const lessons=[...document.querySelectorAll("[data-lesson]")];
  const bar=document.querySelector("[data-progress-bar]");
  const text=document.querySelector("[data-progress-text]");

  async function syncProgress(percent){
    try{
      await fetch("/api/academy/progress",{
        method:"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({courseSlug:"n8n-bootcamp",progressPercent:percent})
      });
    }catch{}
  }

  function refresh(sync=false){
    lessons.forEach(lesson=>{
      const id=lesson.dataset.lesson;
      const button=lesson.querySelector("[data-done]");
      const complete=done.has(id);
      button?.classList.toggle("done",complete);
      if(button)button.textContent=complete?"✓ Erledigt":"Als gelernt markieren";
    });
    const pct=lessons.length?Math.round(done.size/lessons.length*100):0;
    if(bar)bar.style.width=pct+"%";
    if(text)text.textContent=done.size+" von "+lessons.length+" Lerneinheiten · "+pct+"%";
    localStorage.setItem(key,JSON.stringify([...done]));
    if(sync)syncProgress(pct);
  }

  lessons.forEach(lesson=>lesson.querySelector("[data-done]")?.addEventListener("click",()=>{
    const id=lesson.dataset.lesson;
    done.has(id)?done.delete(id):done.add(id);
    refresh(true);
  }));
  refresh(false);

  const form=document.querySelector("[data-lab-form]");
  const out=document.querySelector("[data-lab-output]");
  const nodes=[...document.querySelectorAll("[data-lab-node]")];
  const run=document.querySelector("[data-lab-run]");
  const presets=[...document.querySelectorAll("[data-lab-preset]")];
  let busy=false;

  const scenarios={
    qualified:{name:"Mina Yilmaz",email:"mina@example.com",company:"Nord GmbH",budget:"7500"},
    standard:{name:"Jonas Weber",email:"jonas@example.com",company:"Weber Service",budget:"3200"},
    invalid:{name:"Test Fehler",email:"keine-gueltige-mail",company:"Demo GmbH",budget:"7500"}
  };

  presets.forEach(button=>button.addEventListener("click",()=>{
    if(busy)return;
    const values=scenarios[button.dataset.labPreset];
    if(!values||!form)return;
    Object.entries(values).forEach(([name,value])=>{const input=form.elements.namedItem(name);if(input)input.value=value;});
    presets.forEach(x=>x.setAttribute("aria-pressed",String(x===button)));
    out.textContent=button.dataset.labPreset==="invalid"
      ?"Fehlerszenario geladen. Erwartung: Validation lehnt die ungültige E-Mail ab."
      :"Szenario geladen. Starte den echten Production Workflow.";
    nodes.forEach(n=>n.classList.remove("active","ok","error"));
  }));

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function animate(success=true){
    for(let i=0;i<nodes.length;i++){
      const node=nodes[i];
      node.classList.add("active");
      await wait(240);
      node.classList.remove("active");
      node.classList.add(success||i<1?"ok":"error");
    }
  }

  form?.addEventListener("submit",async event=>{
    event.preventDefault();
    if(busy)return;
    busy=true;
    run.disabled=true;
    run.textContent="n8n läuft…";
    nodes.forEach(n=>n.classList.remove("active","ok","error"));
    out.textContent="Production Webhook wird aufgerufen…";
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      const response=await fetch("/api/n8n-module-01",{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(data)
      });
      const body=await response.json().catch(()=>({}));
      await animate(response.ok);
      out.textContent=JSON.stringify(body,null,2);
      if(!response.ok){
        out.textContent+="\n\nAnalyse: Der Workflow hat den Request kontrolliert abgelehnt. Prüfe jetzt Input → Validation → Response.";
      }else{
        out.textContent+="\n\nAnalyse: route="+body.route+". Ändere Budget oder E-Mail und vergleiche den nächsten Lauf.";
      }
    }catch(error){
      nodes[0]?.classList.add("error");
      out.textContent="FEHLER: "+error.message+"\n\nDebugging: Erreicht der Request den Endpoint? Gibt es eine Execution? Welcher HTTP-Status kommt zurück?";
    }finally{
      busy=false;
      run.disabled=false;
      run.textContent="Live Workflow starten";
    }
  });
})();