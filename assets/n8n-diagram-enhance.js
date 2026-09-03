// Progressive enhancement: turns the plain text/box diagrams used across
// Academy lessons into real SVG diagrams - rounded nodes, connecting lines,
// arrowheads and (for sequential flows) a subtle flowing-data animation -
// instead of static CSS boxes with arrow glyphs between them. Three shapes,
// chosen to match how the content actually reasons rather than forcing
// everything into one look:
//  - .visualFlow / .caseFlow: a straight A → B → C sequence of steps.
//  - .decisionTree: one question, 2-4 outcome branches (classification,
//    escalation logic) - a sequence would misrepresent this as steps.
//  - .conceptCluster: an unordered "these parts make up X" breakdown, with
//    no start or end (e.g. the building blocks of a prompt).
// Runs on any page that loads it; a lesson only has to add the matching
// markup (see the querySelectorAll blocks below for the expected structure)
// and it gets the same treatment for free, no per-diagram JS needed.
(()=> {
  const esc=value=>String(value).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  // Each SVG defines its own arrowhead marker; a page can hold several
  // diagrams, so every marker gets a unique id to stay valid, self-contained
  // markup instead of colliding <marker id="dgArrow"> definitions.
  let arrowSeq=0;
  const arrowDefs=id=>`<defs><marker id="${id}" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" class="dgArrowHead"/></marker></defs>`;

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
    const arrowId=`dgArrow${arrowSeq++}`;
    let paths="";
    for(let i=0;i<n-1;i++){
      paths+=`<line class="dgLine" x1="${centers[i]+widths[i]/2}" y1="${y}" x2="${centers[i+1]-widths[i+1]/2}" y2="${y}" marker-end="url(#${arrowId})"/>`;
    }
    let nodes="";
    labels.forEach((label,i)=>{
      nodes+=`<g transform="translate(${centers[i]},${y})"><rect class="dgNode${dark?" dgNodeDark":""}" x="${-widths[i]/2}" y="${-nodeH/2}" width="${widths[i]}" height="${nodeH}" rx="12"/><text class="dgText" text-anchor="middle" dy="5">${esc(label)}</text></g>`;
    });
    return `<svg class="dgFlow" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(labels.join(" → "))}">${arrowDefs(arrowId)}${paths}${nodes}</svg>`;
  }

  // A yes/no-style decision: one root question, 2-4 outcome branches drawn
  // as curved lines fanning down to leaf nodes, each labelled with the
  // condition that leads there. Used for classification/escalation logic
  // where a straight A → B → C chain would misrepresent the real structure
  // (there is one decision point, not a sequence of steps).
  function svgTree(root,branches){
    if(!root||!branches||branches.length<2)return null;
    const rootW=Math.max(150,root.length*7.4+34),rootH=46;
    const leafH=42,gap=26,marginX=20;
    const rootY=32,leafY=196,condY=126;
    // Each column has to fit whichever of its two labels (condition pill or
    // leaf box) is wider - a fixed column width would let a long label
    // overlap its neighbour, so size columns the same way svgFlow sizes
    // nodes: from the actual text, with a running x position.
    const condWidths=branches.map(b=>Math.max(96,b.cond.length*6.1+18));
    const leafWidths=branches.map(b=>Math.max(126,b.leaf.length*7.3+30));
    const colWidths=branches.map((_,i)=>Math.max(condWidths[i],leafWidths[i]));
    const centers=[];
    let x=marginX;
    colWidths.forEach(cw=>{
      x+=cw/2;
      centers.push(x);
      x+=cw/2+gap;
    });
    const w=Math.max(560,x-gap+marginX,rootW+marginX*2);
    const rootX=w/2;
    const arrowId=`dgArrow${arrowSeq++}`;
    let lines="",conds="",nodes="";
    branches.forEach((b,i)=>{
      const cx=centers[i];
      lines+=`<path class="dgLine dgTreeLine" d="M${rootX} ${rootY+rootH/2} C ${rootX} ${condY-6}, ${cx} ${rootY+34}, ${cx} ${leafY-leafH/2-6}" marker-end="url(#${arrowId})"/>`;
      conds+=`<g transform="translate(${cx},${condY})"><rect class="dgCondBg" x="${-condWidths[i]/2}" y="-14" width="${condWidths[i]}" height="28" rx="8"/><text class="dgCondText" text-anchor="middle" dy="4">${esc(b.cond)}</text></g>`;
      const outcomeClass=b.outcome==="ok"?" dgNodeOk":b.outcome==="warn"?" dgNodeWarn":" dgNodeDark";
      nodes+=`<g transform="translate(${cx},${leafY})"><rect class="dgNode${outcomeClass}" x="${-leafWidths[i]/2}" y="${-leafH/2}" width="${leafWidths[i]}" height="${leafH}" rx="11"/><text class="dgText" text-anchor="middle" dy="5">${esc(b.leaf)}</text></g>`;
    });
    const rootBox=`<g transform="translate(${rootX},${rootY})"><rect class="dgNode dgNodeDark" x="${-rootW/2}" y="${-rootH/2}" width="${rootW}" height="${rootH}" rx="12"/><text class="dgText" text-anchor="middle" dy="5">${esc(root)}</text></g>`;
    const h=leafY+leafH/2+16;
    const label=`${root}: ${branches.map(b=>`${b.cond} → ${b.leaf}`).join("; ")}`;
    return `<svg class="dgFlow dgTree" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(label)}">${arrowDefs(arrowId)}${lines}${rootBox}${conds}${nodes}</svg>`;
  }

  // An enumeration that has no sequence or direction - "these N things
  // together make up X" - drawn as a hub with the parts arranged around it,
  // instead of forcing a false left-to-right order onto them.
  function svgCluster(center,parts){
    if(!center||!parts||parts.length<2)return null;
    const n=parts.length;
    const centerW=Math.max(150,center.length*7.4+34),centerH=52;
    const partWidths=parts.map(label=>Math.max(100,label.length*7.1+26));
    const partH=38,flatten=0.72;
    // Radius has to grow with the part count and label width, or nodes on a
    // small fixed circle start overlapping once there are more than ~5 of
    // them (found while adding an 8-part cluster) - same idea as sizing
    // svgFlow/svgTree from their actual text instead of a fixed slot. Two
    // separate constraints, both required: nodes must clear each other
    // along the circle (radiusFromChord), AND a node sitting near the
    // horizontal (angle 0/180) must clear the center hub itself
    // (radiusFromCenter) - a 4-part cluster with wide labels satisfies the
    // first without satisfying the second, and its side nodes end up
    // overlapping the center box.
    const maxPartW=Math.max(...partWidths);
    const minChord=maxPartW+26;
    const radiusFromChord=minChord/(2*Math.sin(Math.PI/n));
    const radiusFromCenter=centerW/2+maxPartW/2+30;
    const radius=Math.max(118,radiusFromChord,radiusFromCenter);
    const w=Math.max(640,radius*2+maxPartW+70),h=Math.max(300,radius*2*flatten+partH+70);
    const cx=w/2,cy=h/2;
    let lines="",nodes="";
    parts.forEach((label,i)=>{
      const angle=-Math.PI/2+(2*Math.PI*i)/n;
      const px=cx+radius*Math.cos(angle);
      const py=cy+radius*Math.sin(angle)*flatten;
      const partW=partWidths[i];
      lines+=`<line class="dgLine dgSpoke" x1="${cx}" y1="${cy}" x2="${px}" y2="${py}"/>`;
      nodes+=`<g transform="translate(${px},${py})"><rect class="dgNode" x="${-partW/2}" y="${-partH/2}" width="${partW}" height="${partH}" rx="10"/><text class="dgText" text-anchor="middle" dy="4">${esc(label)}</text></g>`;
    });
    const centerBox=`<g transform="translate(${cx},${cy})"><rect class="dgNode dgNodeDark" x="${-centerW/2}" y="${-centerH/2}" width="${centerW}" height="${centerH}" rx="14"/><text class="dgText" text-anchor="middle" dy="5">${esc(center)}</text></g>`;
    return `<svg class="dgFlow dgCluster" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(center)}: ${esc(parts.join(", "))}">${lines}${centerBox}${nodes}</svg>`;
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

  document.querySelectorAll(".decisionTree").forEach(el=>{
    const root=(el.querySelector(".dtRoot")?.textContent||"").trim();
    const branches=[...el.querySelectorAll(".dtBranch")].map(b=>({
      cond:(b.querySelector(".dtCond")?.textContent||"").trim(),
      leaf:(b.querySelector(".dtLeaf")?.textContent||"").trim(),
      outcome:b.dataset.outcome||"neutral",
    }));
    const svg=svgTree(root,branches);
    if(svg){el.innerHTML=svg;el.classList.add("dgEnhanced");}
  });

  document.querySelectorAll(".conceptCluster").forEach(el=>{
    const center=(el.querySelector(".ccCenter")?.textContent||"").trim();
    const parts=[...el.querySelectorAll(".ccPart")].map(p=>p.textContent.trim());
    const svg=svgCluster(center,parts);
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
