import test from"node:test";
import assert from"node:assert/strict";
import{readFile}from"node:fs/promises";

function visibleText(html){
 return html
  .replace(/<script[\s\S]*?<\/script>/gi," ")
  .replace(/<style[\s\S]*?<\/style>/gi," ")
  .replace(/<[^>]+>/g," ")
  .replace(/&(?:amp|gt|lt|quot|#039);/g," ")
  .replace(/\s+/g," ")
  .trim();
}

test("n8n landing curriculum mirrors the actual 12-module program",async()=>{
 const html=await readFile("academy/n8n-bootcamp/index.html","utf8");
 const start=html.indexOf('<div class="ey">CURRICULUM</div>');
 assert.ok(start>=0);
 const sectionStart=html.lastIndexOf("<section",start);
 const sectionEnd=html.indexOf("</section>",start);
 const curriculum=html.slice(sectionStart,sectionEnd);
 for(let i=1;i<=12;i++){
  const n=String(i).padStart(2,"0");
  assert.equal((curriculum.match(new RegExp("<span>MODUL "+n+"<\\/span>","g"))||[]).length,1,"curriculum must contain Modul "+n+" exactly once");
 }
 assert.equal((curriculum.match(/<span>MODUL \d{2}<\/span>/g)||[]).length,12);
});

test("modules 10-12 do not regress to mixed Turkish draft prose",async()=>{
 const banned=[
  /[ğışçĞİŞÇ]/,
  /\b(?:için|değil|önce|sonra|gerekir|olmalı|hangi|neden|aynı|artık|sayılmaz|yönet|yüksek|düşük|doğrula|taşır|geçirmemeli|açıkla|hazır)\b/i,
  /\b(?:bir|ve)\b.{0,80}\b(?:için|değil|gerekir|olmalı)\b/i
 ];
 for(const n of ["10","11","12"]){
  const html=await readFile("academy/n8n-bootcamp/modul-"+n+"/index.html","utf8");
  const text=visibleText(html);
  for(const pattern of banned)assert.doesNotMatch(text,pattern,"modul-"+n+" contains mixed Turkish draft prose: "+pattern);
 }
});
