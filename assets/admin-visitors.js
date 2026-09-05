const root=document.querySelector('[data-view="visitors"]');

const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const date=value=>value?new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"–";
const duration=seconds=>{
 if(!seconds&&seconds!==0)return"–";
 const m=Math.floor(seconds/60),s=seconds%60;
 return m>0?m+" Min "+s+" Sek":s+" Sek";
};
const short=(path,max=60)=>{
 const value=String(path||"–");
 return value.length>max?value.slice(0,max-1)+"…":value;
};

const api=async()=>{
 const response=await fetch("/api/admin/visitors",{credentials:"same-origin",headers:{"content-type":"application/json"}});
 const data=await response.json().catch(()=>({error:{message:"Ungültige Serverantwort."}}));
 if(!response.ok)throw new Error(data.error?.message||"Besucherdaten konnten nicht geladen werden.");
 return data;
};

const table=(head,rows,empty)=>`<div class="adminTableWrap"><table class="adminTable"><thead><tr>${head.map(x=>"<th>"+x+"</th>").join("")}</tr></thead><tbody>${rows||'<tr><td colspan="'+head.length+'" class="adminEmpty">'+empty+'</td></tr>'}</tbody></table></div>`;

function render(data){
 if(!root)return;
 const metrics=[
  ["Seitenaufrufe (24h)",data.todayViews],
  ["Sitzungen (24h)",data.todaySessions],
  ["Aktive Besucher jetzt",data.activeNow],
  ["Ø Verweildauer",duration(data.avgDurationSeconds)]
 ].map(([label,value])=>'<article class="adminMetric"><span>'+label+'</span><strong>'+esc(value)+'</strong></article>').join("");

 const topRows=(data.topPages||[]).map(row=>"<tr><td>"+esc(short(row.path))+"</td><td>"+row.views+"</td><td>"+duration(row.avgDurationSeconds)+"</td></tr>").join("");
 const entryRows=(data.entryPages||[]).map(row=>"<tr><td>"+esc(short(row.path))+"</td><td>"+row.views+"</td></tr>").join("");
 const recentRows=(data.recent||[]).map(row=>"<tr><td>"+esc(short(row.path))+"</td><td>"+esc(short(row.referrer||"Direkt",40))+"</td><td>"+duration(row.durationSeconds)+"</td><td>"+date(row.enteredAt)+"</td></tr>").join("");

 root.innerHTML=
  '<div class="adminPanelHead"><h2>Besucher-Monitoring</h2><p>Eigenes, cookie-loses Tracking der letzten 24 Stunden. Keine IP-Adressen, keine personenbezogenen Daten, nur eine sitzungsbasierte Kennung.</p></div>'+
  '<div class="adminMetrics">'+metrics+'</div>'+
  '<div class="adminSubhead"><h3>Meistbesuchte Seiten</h3></div>'+
  table(["Seite","Aufrufe","Ø Verweildauer"],topRows,"Noch keine Daten vorhanden.")+
  '<div class="adminSubhead"><h3>Einstiegsseiten</h3></div>'+
  table(["Seite","Aufrufe"],entryRows,"Noch keine Daten vorhanden.")+
  '<div class="adminSubhead"><h3>Letzte Besuche</h3></div>'+
  table(["Seite","Herkunft","Verweildauer","Zeit"],recentRows,"Noch keine Besuche aufgezeichnet.");
}

async function load(){
 if(!root)return;
 root.innerHTML='<p class="adminEmpty">Besucherdaten werden geladen …</p>';
 try{render(await api());}catch(error){root.innerHTML='<div class="adminSectionWarning"><strong>Besucherdaten nicht verfügbar:</strong> '+esc(error.message)+'</div>';}
}

load();
