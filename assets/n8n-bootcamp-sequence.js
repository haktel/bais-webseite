(()=> {
  const cards=[...document.querySelectorAll('.card')];
  const moduleCards=new Map();
  let examCard=null;

  for(const card of cards){
    const link=card.querySelector('a[href*="./modul-"]');
    if(link){
      const match=link.getAttribute('href')?.match(/\.\/modul-(\d{2})\//);
      if(match)moduleCards.set(Number(match[1]),{card,link});
    }
    const examLink=card.querySelector('a[href*="abschlusspruefung"]');
    if(examLink)examCard={card,link:examLink};
  }

  const style=document.createElement('style');
  style.textContent='.card.sequenceDone{border-color:#9bcdbd;background:#f4fbf8}.card.sequenceCurrent{border-color:#173f52;box-shadow:0 0 0 3px #173f5214}.card.sequenceLocked{opacity:.56;background:#f5f7f8}.card.sequenceLocked .cta{pointer-events:none;background:#c8d2d6!important;color:#63747b!important;cursor:not-allowed}.sequenceState{display:inline-flex;margin:0 0 10px;padding:6px 9px;border-radius:999px;font-size:.68rem;font-weight:900;letter-spacing:.04em}.sequenceState.done{background:#e0f4eb;color:#0a6b55}.sequenceState.current{background:#e7eef1;color:#173f52}.sequenceState.locked{background:#eceff1;color:#6c7a80}';
  document.head.append(style);

  const badge=(card,type,text)=>{
    let el=card.querySelector('[data-sequence-state]');
    if(!el){
      el=document.createElement('span');
      el.dataset.sequenceState='1';
      el.className='sequenceState';
      card.prepend(el);
    }
    el.className='sequenceState '+type;
    el.textContent=text;
  };

  const lockLink=(link,message)=>{
    link.setAttribute('aria-disabled','true');
    link.dataset.sequenceLocked='true';
    link.title=message;
    link.addEventListener('click',event=>{
      if(link.dataset.sequenceLocked==='true'){
        event.preventDefault();
        alert(message);
      }
    });
  };

  const api=async moduleSlug=>{
    const response=await fetch('/api/academy/module-progress?courseSlug=n8n-bootcamp&moduleSlug='+encodeURIComponent(moduleSlug),{credentials:'same-origin',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('progress unavailable');
    return response.json();
  };

  (async()=>{
    let currentFound=false,allComplete=true;
    for(let n=1;n<=12;n++){
      const entry=moduleCards.get(n);
      if(!entry)continue;
      const slug='modul-'+String(n).padStart(2,'0');

      if(currentFound){
        allComplete=false;
        entry.card.classList.add('sequenceLocked');
        badge(entry.card,'locked','🔒 Gesperrt');
        lockLink(entry.link,'Zuerst Modul '+String(n-1).padStart(2,'0')+' vollständig abschließen.');
        continue;
      }

      let progress=0;
      try{
        const data=await api(slug);
        progress=Number(data?.module?.modulePercent||0);
      }catch{
        return;
      }

      if(progress===100){
        entry.card.classList.add('sequenceDone');
        badge(entry.card,'done','✓ Abgeschlossen');
      }else{
        currentFound=true;
        allComplete=false;
        entry.card.classList.add('sequenceCurrent');
        badge(entry.card,'current',n===1?'▶ Hier starten':'▶ Nächstes Pflichtmodul');
      }
    }

    if(examCard){
      if(allComplete){
        examCard.card.classList.add('sequenceCurrent');
        badge(examCard.card,'current','✓ Freigeschaltet');
      }else{
        examCard.card.classList.add('sequenceLocked');
        badge(examCard.card,'locked','🔒 Erst nach Modul 12');
        lockLink(examCard.link,'Die Abschlussprüfung wird erst nach 100% in allen 12 Modulen freigeschaltet.');
      }
    }
  })();
})();