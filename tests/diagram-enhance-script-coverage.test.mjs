import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";
import path from"node:path";

const root=new URL("..",import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),"utf8");

// Real bug found while building the "real diagrams" pass: a page can carry
// .visualFlow/.caseFlow/.miniArchitecture/.decisionTree/.conceptCluster
// markup and still show only the flat pre-JS CSS fallback forever, if it
// never loads assets/n8n-diagram-enhance.js. This locks in that every
// Academy module page with that markup also loads the script that turns it
// into a real SVG diagram - across every course, not just the ones that
// got new diagrams in this pass.

const diagramClassPattern=/class="(?:[^"]*\s)?(visualFlow|caseFlow|miniArchitecture|decisionTree|conceptCluster)(?:\s[^"]*)?"/;

test("every academy module page with diagram markup also loads n8n-diagram-enhance.js",()=>{
 const academyDir=new URL("academy/",root);
 const courses=fs.readdirSync(academyDir,{withFileTypes:true}).filter(d=>d.isDirectory());
 const missing=[];
 for(const course of courses){
  const courseDir=new URL(course.name+"/",academyDir);
  let modules;
  try{modules=fs.readdirSync(courseDir,{withFileTypes:true}).filter(d=>d.isDirectory()&&/^modul-\d+$/.test(d.name));}
  catch{continue;}
  for(const mod of modules){
   const file=path.join("academy",course.name,mod.name,"index.html");
   let html;
   try{html=read(file);}catch{continue;}
   if(diagramClassPattern.test(html)&&!html.includes("n8n-diagram-enhance.js")){
    missing.push(file);
   }
  }
 }
 assert.deepEqual(missing,[],
  `these pages carry diagram markup but never load n8n-diagram-enhance.js, so it silently renders as flat CSS instead of a real SVG:\n${missing.join("\n")}`);
});
