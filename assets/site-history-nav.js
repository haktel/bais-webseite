(()=>{"use strict";
const KEY="bais-site-history-v1",MAX=40;
const cleanEntry=e=>e&&typeof e.url==="string"?{url:e.url,title:typeof e.title==="string"?e.title:"BAIS"}:null;
const currentEntry=()=>({url:location.pathname+location.search+location.hash,title:(document.title||"BAIS").replace(/\s*\|\s*BAIS.*$/i,"").trim()||"BAIS"});
const same=(a,b)=>Boolean(a&&b&&a.url===b.url);
function load(){
  try{
    const raw=JSON.parse(sessionStorage.getItem(KEY)||"null");
    if(!raw||!Array.isArray(raw.back)||!Array.isArray(raw.forward))throw 0;
    return{back:raw.back.map(cleanEntry).filter(Boolean).slice(-MAX),current:cleanEntry(raw.current),forward:raw.forward.map(cleanEntry).filter(Boolean).slice(-MAX)};
  }catch{return{back:[],current:null,forward:[]}}
}
function save(s){try{sessionStorage.setItem(KEY,JSON.stringify({back:s.back.slice(-MAX),current:s.current,forward:s.forward.slice(-MAX)}))}catch{}}
function pushUnique(list,entry){if(!entry)return;if(!same(list[list.length-1],entry))list.push(entry);if(list.length>MAX)list.splice(0,list.length-MAX)}
const state=load(),now=currentEntry();
if(!state.current){state.current=now}
else if(!same(state.current,now)){
  const nav=performance.getEntriesByType?.("navigation")?.[0]?.type||"navigate";
  const backTop=state.back[state.back.length-1],forwardTop=state.forward[state.forward.length-1];
  if(nav==="back_forward"&&same(backTop,now)){
    state.back.pop();pushUnique(state.forward,state.current);
  }else if(nav==="back_forward"&&same(forwardTop,now)){
    state.forward.pop();pushUnique(state.back,state.current);
  }else{
    pushUnique(state.back,state.current);state.forward=[];
  }
  state.current=now;
}else state.current=now;
save(state);

function go(direction){
  const from=state.current||currentEntry();
  const source=direction==="back"?state.back:state.forward;
  const target=source.pop();
  if(!target)return;
  const destination=direction==="back"?state.forward:state.back;
  pushUnique(destination,from);
  state.current=target;
  save(state);
  location.assign(target.url);
}
function label(btn,entry,base){
  btn.disabled=!entry;
  btn.title=entry?base+": "+entry.title:base+" ist in dieser Sitzung nicht verfügbar";
}

function mountDropdownGuards(){
  if(!matchMedia("(min-width:981px)").matches)return;
  for(const item of document.querySelectorAll(".navItem")){
    const trigger=item.querySelector(":scope > a"),submenu=item.querySelector(":scope > .submenu");
    if(!trigger||!submenu)continue;
    let closeTimer=0;
    const open=()=>{clearTimeout(closeTimer);item.classList.add("navOpen");trigger.setAttribute("aria-expanded","true");};
    const close=()=>{clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!item.matches(":hover")&&!item.matches(":focus-within")){item.classList.remove("navOpen");trigger.setAttribute("aria-expanded","false");}},250);};
    trigger.setAttribute("aria-haspopup","true");
    trigger.setAttribute("aria-expanded","false");
    item.addEventListener("pointerenter",open);
    item.addEventListener("pointerleave",close);
    item.addEventListener("focusin",open);
    item.addEventListener("focusout",close);
    submenu.addEventListener("pointerenter",open);
    submenu.addEventListener("pointerleave",close);
  }
}

function mount(){
  if(document.querySelector(".baisHistoryNav"))return;
  const nav=document.createElement("nav");
  nav.className="baisHistoryNav";
  nav.setAttribute("aria-label","BAIS Seitennavigation");
  const back=document.createElement("button"),forward=document.createElement("button");
  back.type=forward.type="button";
  back.innerHTML='<span class="navArrow" aria-hidden="true">←</span><span>Zurück</span>';
  forward.innerHTML='<span>Weiter</span><span class="navArrow" aria-hidden="true">→</span>';
  back.setAttribute("aria-label","Zur vorherigen BAIS-Seite");
  forward.setAttribute("aria-label","Zur nächsten BAIS-Seite");
  const refresh=()=>{
    label(back,state.back[state.back.length-1],"Zurück");
    label(forward,state.forward[state.forward.length-1],"Weiter");
  };
  back.addEventListener("click",()=>go("back"));
  forward.addEventListener("click",()=>go("forward"));
  nav.append(back,forward);
  document.body.append(nav);
  refresh();
}
const init=()=>{mount();mountDropdownGuards();};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();