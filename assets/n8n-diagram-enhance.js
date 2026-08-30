// Progressive enhancement: turns the plain text/box "flow" diagrams used
// throughout the n8n bootcamp lessons (.visualFlow, .caseFlow) into real
// animated SVG diagrams - rounded nodes, connecting lines, arrowheads and a
// subtle flowing-data animation - instead of static CSS boxes with arrow
// glyphs between them. Runs on any page that loads it; if a lesson adds a
// new .caseFlow/.visualFlow block later, it gets the same treatment for
// free, no per-diagram markup needed.
(()=> {
  const esc=value=>String(value).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

  function svgFlow(labels,{dark=false}={}){
    const n=labels.length;
    if(n<2)return null;
    const nodeH=44,gap=46,marginX=16;
    // Size each node to its own label instead of a fixed width, so longer
    // labels (e.g. "Webhook [TRIGGER]") don't overflow their box.
    const widths=labels.map(label=>Math.max(112,label.length*7.3+30));
    const centers=[];
    let x=marginX;
    widths.forEach((width,i)=>{
      x+=width/2;
      centers.push(x);
      x+=width/2+gap;
    });
    const w=Math.max(560,x-gap+marginX),h=110,y=h/2;
    let paths="";
    for(let i=0;i<n-1;i++){
      paths+=`<line class="dgLine" x1="${centers[i]+widths[i]/2}" y1="${y}" x2="${centers[i+1]-widths[i+1]/2}" y2="${y}" marker-end="url(#dgArrow)"/>`;
    }
    let nodes="";
    labels.forEach((label,i)=>{
      nodes+=`<g transform="translate(${centers[i]},${y})"><rect class="dgNode${dark?" dgNodeDark":""}" x="${-widths[i]/2}" y="${-nodeH/2}" width="${widths[i]}" height="${nodeH}" rx="12"/><text class="dgText" text-anchor="middle" dy="5">${esc(label)}</text></g>`;
    });
    return `<svg class="dgFlow" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(labels.join(" → "))}"><defs><marker id="dgArrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" class="dgArrowHead"/></marker></defs>${paths}${nodes}</svg>`;
  }

  document.querySelectorAll(".visualFlow").forEach(el=>{
    const labels=[...el.querySelectorAll(".vfNode")].map(node=>node.textContent.trim());
    const svg=svgFlow(labels);
    if(svg){el.innerHTML=svg;el.classList.add("dgEnhanced");}
  });

  document.querySelectorAll(".caseFlow").forEach(el=>{
    const labels=[...el.querySelectorAll("b")].map(node=>node.textContent.trim());
    const svg=svgFlow(labels,{dark:el.classList.contains("lifecycle")});
    if(svg){el.innerHTML=svg;el.classList.add("dgEnhanced");}
  });

  // .miniArchitecture is used for everything from JSON/code snippets to
  // simple "A → B → C" step chains. Only the latter is a real diagram in
  // disguise - a single line, arrow-separated, with no braces/expressions
  // that would mean it's actually a data example. Converting only that safe
  // subset (code and multi-line content is deliberately left as text).
  document.querySelectorAll(".miniArchitecture").forEach(el=>{
    const text=el.textContent;
    if(text.includes("\n")||!text.includes(" → ")||/[{}]/.test(text))return;
    const labels=text.split(" → ").map(part=>part.trim()).filter(Boolean);
    const svg=svgFlow(labels);
    if(svg){el.innerHTML=svg;el.classList.add("dgEnhanced","miniArchitectureFlow");}
  });

  // Converts an assessment percentage into a German university-style grade
  // (Notenskala 1-5, ausreichend/50% is the minimum passing grade) instead
  // of a flat pass/fail label - used by both modules' assessment result
  // screens and the shared progress summary text.
  window.percentToNote=function(percent){
    const p=Number(percent)||0;
    if(p>=92)return{note:1,label:"sehr gut",passed:true};
    if(p>=81)return{note:2,label:"gut",passed:true};
    if(p>=67)return{note:3,label:"befriedigend",passed:true};
    if(p>=50)return{note:4,label:"ausreichend",passed:true};
    return{note:5,label:"nicht ausreichend",passed:false};
  };

  // Shared helper for the interactive Live Lab node rows (modul-01's
  // .labNodes, modul-02's .module2Flow): draws a real connecting line
  // between each pair of nodes in the row and returns handles so the
  // module-specific lab script can light up the correct segment while its
  // simulated/live execution steps through the nodes.
  window.mountLabConnector=function(container){
    if(!container)return{lines:[],reset(){}};
    const items=[...container.children].filter(el=>el.tagName!=="svg"&&!el.classList.contains("labConnSvg"));
    const n=items.length;
    if(n<2)return{lines:[],reset(){}};
    const pts=items.map((_,i)=>(i+0.5)/n*100);
    const y=50;
    const segs=pts.slice(0,-1).map((x1,i)=>`<line class="labConnLine" data-seg="${i}" x1="${x1}%" y1="${y}%" x2="${pts[i+1]}%" y2="${y}%"/>`).join("");
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("class","labConnSvg");
    svg.setAttribute("preserveAspectRatio","none");
    svg.innerHTML=segs;
    container.prepend(svg);
    const lines=[...svg.querySelectorAll(".labConnLine")];
    return{
      lines,
      reset(){lines.forEach(l=>l.classList.remove("active","done"));}
    };
  };
})();
