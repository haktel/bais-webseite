document.documentElement.classList.add('js');

const conceptCss=document.createElement('link');
conceptCss.rel='stylesheet';
conceptCss.href='/assets/home-concept2.css?v=1.0';
document.head.appendChild(conceptCss);
document.body.classList.add('concept2Home');

const navLinks=document.querySelector('header .links');
if(navLinks){
 navLinks.innerHTML=`
  <div class="navItem"><a href="/loesungen/">Lösungen<i class="caret" aria-hidden="true"></i></a><div class="submenu"><a href="/loesungen/#ai-engineering">AI Engineering & Automation</a><a href="/loesungen/#cybersecurity">Cybersecurity</a><a href="/loesungen/#automation">Automation / n8n</a><a href="/loesungen/#cloud">Cloud & Infrastructure</a><a href="/ai-governance/">AI Governance</a></div></div>
  <div class="navItem"><a href="/academy/">Academy<i class="caret" aria-hidden="true"></i></a><div class="submenu"><a href="/academy/ki-fuehrerschein/">KI-Führerschein</a><a href="/academy/n8n-bootcamp/">n8n Bootcamp</a><a href="/academy/secure-ai-rag/">Secure AI & RAG</a><a href="/academy/caio-masterguide/">CAIO Masterguide</a></div></div>
  <div class="navItem"><a href="/ueber-bais/">Unternehmen<i class="caret" aria-hidden="true"></i></a><div class="submenu"><a href="/ueber-bais/">Über BAIS</a><a href="/project-portal/">Project Portal</a><a href="/ai-governance/">AI Governance</a></div></div>
  <a href="/referenzen/">Referenzen</a><a href="/preise/">Preise</a><a href="/kontakt/">Kontakt</a><a class="cta" href="/kontakt/">Jetzt beraten lassen →</a>`;
}

const hero=document.querySelector('.homeHero');
if(hero){
 const copy=hero.querySelector('.heroCopy');
 if(copy){
  copy.innerHTML=`<div class="ey">INTELLIGENCE SECURES PROGRESS</div><h1>Sichere KI, IT und Automatisierung für eine starke Zukunft.</h1><p class="lead">Wir verbinden Technologie, Sicherheit und Menschen – für messbaren Fortschritt in einer digitalen Welt.</p><div class="heroActions"><a class="btn btnArrow" href="/kontakt/">Jetzt beraten lassen <span aria-hidden="true">→</span></a><a class="btn secondary" href="/loesungen/">Unsere Lösungen entdecken</a></div><ul class="heroProof" aria-label="BAIS Qualitätsmerkmale"><li><i aria-hidden="true"></i><b>Sicher heute</b><small>Menschen, Daten, Unternehmen.</small></li><li><i aria-hidden="true"></i><b>Stärker morgen</b><small>Wissen, Technologie, Fortschritt.</small></li><li><i aria-hidden="true"></i><b>Nachhaltig wachsen</b><small>Für belastbare digitale Zukunft.</small></li></ul>`;
 }
 const media=hero.querySelector('.heroMedia');
 if(media){
  media.setAttribute('aria-label','BAIS Secure Systems Visual');
  const cap=media.querySelector('figcaption');
  if(cap)cap.innerHTML='<span>BAIS Secure Systems</span><b>SICHERN · VERSTEHEN · GESTALTEN</b>';
 }
}

const signal=document.querySelector('.signalBar');
if(signal){
 signal.outerHTML=`<section class="concept2AfterHero" aria-label="BAIS Einstieg und Arbeitsweise">
  <div class="concept2QuickWrap">
   <div class="concept2QuickGrid">
    <a class="concept2QuickCard" href="/loesungen/"><div><h3>Unsere Lösungen</h3><p>Maßgeschneiderte IT-, KI- und Security-Lösungen für Ihren nachhaltigen Erfolg.</p><b>Lösungen entdecken →</b></div><img src="/assets/visuals/ai-engineering-v1.svg" alt="Technische BAIS Lösungsarchitektur"></a>
    <a class="concept2QuickCard" href="/academy/"><div><h3>BAIS Academy</h3><p>Wissen, das wirkt. Schulungen und Zertifizierungen für die digitale Zukunft.</p><b>Academy entdecken →</b></div><img src="/assets/visuals/academy-lab-v1.svg" alt="BAIS Academy Lernumgebung"></a>
    <a class="concept2QuickCard" href="/project-portal/"><div><h3>Project Portal</h3><p>Transparenz, Fortschritt und Zusammenarbeit für laufende Projekte.</p><b>Zum Project Portal →</b></div><img src="/assets/visuals/project-portal-v1.svg" alt="BAIS Project Portal Übersicht"></a>
    <a class="concept2QuickCard" href="/zertifikat/"><div><h3>Zertifikat prüfen</h3><p>BAIS Academy Nachweise öffentlich, sicher und nachvollziehbar verifizieren.</p><b>Zertifikat prüfen →</b></div><img src="/assets/visuals/zertifikat-v1.svg" alt="BAIS Zertifikat Verifizierung"></a>
   </div>
   <div class="concept2Trust"><div class="concept2TrustRow"><div class="concept2TrustLabel">Technologien im Einsatz</div><div class="concept2Stack" aria-label="BAIS Technologie-Stack"><span>Cloudflare</span><span>GitHub</span><span>n8n</span><span>Dolibarr</span><span>Jira</span><span>D1 / R2</span></div><div class="concept2Assurance"><i></i><span>Sichere Technologie. Stärkere Möglichkeiten.</span></div></div></div>
  </div>
  <div class="concept2Process"><div class="concept2ProcessInner"><div class="concept2Steps" aria-label="BAIS Vorgehensmodell"><div class="concept2Step"><span>1</span><div><b>Verstehen</b><small>Ihre Ziele, Herausforderungen und Potenziale analysieren.</small></div></div><div class="concept2Step"><span>2</span><div><b>Konzipieren</b><small>Individuelle Lösungen entwickeln und sauber einordnen.</small></div></div><div class="concept2Step"><span>3</span><div><b>Umsetzen</b><small>Gemeinsam, sicher und agil realisieren.</small></div></div><div class="concept2Step"><span>4</span><div><b>Wachsen</b><small>Sicher, effizient und nachhaltig erfolgreicher werden.</small></div></div></div><div class="concept2ProcessCta"><p>Lassen Sie uns gemeinsam Ihre Möglichkeiten entfalten.</p><a href="/kontakt/">Jetzt Gespräch vereinbaren →</a></div></div></div>
 </section>`;
}

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals=document.querySelectorAll('.reveal');
if(reduceMotion||!('IntersectionObserver'in window)){reveals.forEach(el=>el.classList.add('inView'));}else{const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('inView');observer.unobserve(entry.target);}});},{threshold:.12,rootMargin:'0px 0px -40px'});reveals.forEach(el=>observer.observe(el));}
