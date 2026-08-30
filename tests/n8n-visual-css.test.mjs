import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

const visualName=/(flow|visual|diagram|grid|map|compare|timeline|model|tree|pyramid|architecture|pipeline|realCase|miniStat|securityZones|executionTrace|httpCard|production|stateChoice|batch|monitor|dbModel|case)/i;

async function optionalFile(path){
  try{return await readFile(path,"utf8");}
  catch{return"";}
}

test("every n8n visual learning class has actual CSS, not only a class name",async()=>{
  const shared=await readFile("assets/n8n-module-study.css","utf8");
  for(let i=1;i<=12;i++){
    const n=String(i).padStart(2,"0");
    const html=await readFile("academy/n8n-bootcamp/modul-"+n+"/index.html","utf8");
    const moduleCss=await optionalFile("assets/n8n-module-"+n+".css");
    const css=shared+"\n"+moduleCss;
    const classes=[...new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(match=>match[1].split(/\s+/)))];
    const visualClasses=classes.filter(name=>visualName.test(name));
    for(const className of visualClasses){
      assert.ok(
        css.includes("."+className),
        "modul-"+n+" visual class ."+className+" must have a CSS selector"
      );
    }
  }
});

test("module 11 retention visual stays fully German",async()=>{
  const html=await readFile("academy/n8n-bootcamp/modul-11/index.html","utf8");
  assert.doesNotMatch(html,/ne kadar\?/i);
  assert.match(html,/wie lange\?/i);
});
