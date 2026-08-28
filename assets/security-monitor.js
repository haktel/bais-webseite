(()=>{
const root=document.querySelector('[data-security-monitor]');if(!root)return;
const $=(s)=>root.querySelector(s), feed=$('[data-event-feed]'), canvas=$('canvas'), ctx=canvas.getContext('2d');
let running=true,ticks=18420,blocked=317,risk=24,latency=42,points=Array.from({length:42},(_,i)=>({traffic:42+Math.sin(i/4)*12+Math.random()*9,threat:5+Math.random()*9}));
const scenarios=[
{type:'Prompt Injection',sev:'high',source:'198.51.100.24',action:'Request isoliert'},
{type:'Data Leakage Pattern',sev:'high',source:'203.0.113.18',action:'Output blockiert'},
{type:'Anomalous Tool Call',sev:'medium',source:'192.0.2.44',action:'Human Review'},
{type:'Token Abuse',sev:'medium',source:'198.51.100.71',action:'Rate Limit'},
{type:'Policy Check',sev:'low',source:'192.0.2.16',action:'Erlaubt'},
{type:'Identity Drift',sev:'medium',source:'203.0.113.42',action:'Session beendet'}];
const safeEvents=[
{type:'RAG Source Validation',sev:'low',source:'192.0.2.11',action:'Validiert'},
{type:'Model Gateway Request',sev:'low',source:'198.51.100.9',action:'Erlaubt'},
{type:'Secret Scan',sev:'low',source:'203.0.113.7',action:'Keine Findings'}];
function size(){const dpr=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
function line(key,color,max){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.beginPath();points.forEach((p,i)=>{const x=i/(points.length-1)*w,y=h-(p[key]/max*h*.82)-18;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()}
function draw(){ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);line('traffic','#48bcae',80);line('threat','#e0ae58',32)}
function addEvent(e){const row=document.createElement('div');row.className='eventRow';const now=new Date().toLocaleTimeString('de-DE',{hour12:false});row.innerHTML=`<time>${now}</time><span class="severity ${e.sev}">${e.sev.toUpperCase()}</span><b>${e.type}</b><span class="source">${e.source}</span><span class="action">${e.action}</span>`;feed.prepend(row);while(feed.children.length>6)feed.lastElementChild.remove()}
function updateMatrix(){const vals={injection:12+Math.round(Math.random()*19),leakage:5+Math.round(Math.random()*11),anomaly:16+Math.round(Math.random()*21),identity:7+Math.round(Math.random()*16)};Object.entries(vals).forEach(([k,v])=>{const el=$(`[data-threat="${k}"]`);el.style.setProperty('--value',v+'%');el.nextElementSibling.textContent=v});risk=Math.max(8,Math.min(65,Math.round(Object.values(vals).reduce((a,b)=>a+b,0)/4)));$('[data-risk]').textContent=risk+'/100'}
function tick(force){if(!running&&!force)return;ticks+=Math.round(18+Math.random()*34);latency=36+Math.round(Math.random()*17);const threat=Math.random()<.32;const event=threat?scenarios[Math.floor(Math.random()*scenarios.length)]:safeEvents[Math.floor(Math.random()*safeEvents.length)];if(threat&&event.sev!=='low')blocked++;points.push({traffic:40+Math.random()*25,threat:threat?13+Math.random()*16:3+Math.random()*7});points.shift();$('[data-events]').textContent=ticks.toLocaleString('de-DE');$('[data-blocked]').textContent=blocked;$('[data-latency]').textContent=latency+' ms';$('[data-clock]').textContent=new Date().toLocaleTimeString('de-DE',{hour12:false})+' CET';addEvent(event);updateMatrix();draw()}
root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action==='toggle'){running=!running;root.classList.toggle('monitorPaused',!running);b.textContent=running?'Monitoring pausieren':'Monitoring fortsetzen';$('[data-live-text]').textContent=running?'LIVE SIMULATION':'PAUSIERT'}if(b.dataset.scenario){const event=scenarios.find(x=>x.type===b.dataset.scenario);if(event){blocked++;points.push({traffic:69,threat:30});points.shift();addEvent(event);updateMatrix();draw()}}});
new ResizeObserver(size).observe(canvas);for(let i=0;i<5;i++)addEvent(i%2?scenarios[i]:safeEvents[i%safeEvents.length]);updateMatrix();draw();setInterval(()=>tick(false),2200);
})();
