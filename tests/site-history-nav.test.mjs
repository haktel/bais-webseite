import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("BAIS history navigation assets exist and use session-scoped internal history",()=>{
 const js=read("assets/site-history-nav.js");
 const css=read("assets/site-history-nav.css");
 assert.match(js,/sessionStorage/);
 assert.match(js,/bais-site-history-v1/);
 assert.match(js,/location\.pathname\+location\.search\+location\.hash/);
 assert.match(js,/state\.back/);
 assert.match(js,/state\.forward/);
 assert.match(js,/location\.assign\(target\.url\)/);
 assert.doesNotMatch(js,/history\.back\(/);
 assert.doesNotMatch(js,/history\.forward\(/);
 assert.match(css,/\.baisHistoryNav/);
 assert.match(css,/button:disabled/);
 assert.match(css,/@media\(max-width:560px\)/);
});

test("key public BAIS pages include back-forward navigation",()=>{
 for(const path of[
  "index.html",
  "preise/index.html",
  "kontakt/index.html",
  "referenzen/index.html",
  "referenzen/n8n-live-demo/index.html",
  "loesungen/index.html",
  "project-portal/index.html",
  "academy/index.html",
  "docs/index.html",
  "agb/index.html",
  "avv/index.html",
  "sla/index.html"
 ]){
   const html=read(path);
   assert.match(html,/site-history-nav\.css\?v=1\.1/,path+" missing navigation CSS");
   assert.match(html,/site-history-nav\.js\?v=1\.0/,path+" missing navigation JS");
 }
});

test("KI-Fuehrerschein module files remain untouched by global history injection",()=>{
 for(let i=1;i<=6;i++){
   const id=String(i).padStart(2,"0");
   const html=read("academy/ki-fuehrerschein/modul-"+id+"/index.html");
   assert.doesNotMatch(html,/site-history-nav\./);
 }
});
