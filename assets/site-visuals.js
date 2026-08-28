(()=>{
const path=location.pathname.replace(/\/+$/,'/')||'/';
if(path==='/')return;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const academy={
'ki-fuehrerschein':['Grundlagen','Sicher anwenden','Risiken erkennen','Transfer'],
'ki-leadership':['Strategie','Use Cases','Organisation','Steuerung'],
'ki-it-security':['Threats','Controls','Testing','Incident'],
'data-literacy':['Daten verstehen','Qualität prüfen','Analysieren','Entscheiden'],
'prompt-engineering':['Kontext','Instruktion','Evaluation','Versionierung'],
'secure-ai-rag':['Quellen','Retrieval','Guardrails','Evidence'],
'ai-agents':['Ziel','Tools','Orchestrierung','Kontrolle'],
'enterprise-tools':['Auswahl','Integration','Berechtigung','Betrieb'],
'n8n-bootcamp':['Trigger','Workflow','Fehlerpfad','Monitoring'],
'ai-coding':['Plan','Implementierung','Test','Review'],
'api-integration':['Contract','Auth','Mapping','Observability'],
'knowledge-assistant-lab':['Ingestion','Index','Antwort','Evaluation'],
'ai-governance':['Systemregister','Risiko','Controls','Review'],
'eu-ai-act':['Rolle','Einstufung','Pflichten','Nachweise'],
'caio-masterguide':['Strategie','Portfolio','Governance','Value'],
'policy-enablement':['Policy','Rollen','Training','Kontrolle'],
'ai-for-sales':['Prozess','Assistenz','Qualität','Conversion'],
'ai-customer-service':['Anfrage','Kontext','Antwort','Eskalation'],
'prozessanalyse-automation':['Ist-Prozess','Potenzial','Automation','KPI'],
'it-projektmanagement-ai-delivery':['Scope','Planung','Delivery','Handover']};
const risks={
'r-001-use-case-purpose':['Zweck','Grenzen','Owner','Freigabe'],
'r-002-consequence-impact':['Szenario','Auswirkung','Schwere','Control'],
'r-003-affected-persons-scale':['Personen','Reichweite','Vulnerabilität','Schutz'],
'r-004-personal-data-classification':['Datenart','Schutzbedarf','Zugriff','Löschung'],
'r-005-provider-supply-chain':['Provider','Subprozessor','Abhängigkeit','Exit'],
'r-006-ai-security-controls':['Threat','Prävention','Detektion','Response'],
'r-007-human-oversight':['Prüfen','Override','Stop','Eskalation'],
'r-008-transparency-disclosure':['Kennzeichnung','Zweck','Grenzen','Kontakt'],
'r-009-explainability-traceability':['Input','Version','Quelle','Entscheidungsweg'],
'r-010-ownership-accountability':['Rolle','RACI','Freigabe','Eskalation'],
'r-011-monitoring-incident-management':['Signal','Severity','Containment','Learning'],
'r-012-evidence-documentation':['Risiko','Control','Test','Evidence']};
const general={
'/loesungen/':{label:'SOLUTION ARCHITECTURE',title:'Leistungen als verbundenes System',img:'bais-ecosystem',steps:['Anforderung','Architektur','Integration','Betrieb'],lenses:['Business Fit','Security','Integration','Operations']},
'/academy/':{label:'LEARNING ARCHITECTURE',title:'Lernen, anwenden, nachweisen',img:'academy-lab',steps:['Orientierung','Praxis-Lab','Transfer','Evidence'],lenses:['Wissen','Anwendung','Security','Transfer']},
'/project-portal/':{label:'DELIVERY TRANSPARENCY',title:'Ein Projekt – eine sichtbare Steuerung',img:'bais-ecosystem',steps:['Milestone','Dokument','Freigabe','Audit Trail'],lenses:['Status','Scope','Quality','Risk']},
'/ai-governance/':{label:'GOVERNANCE SYSTEM',title:'Risiko wird in Controls übersetzt',img:'governance',steps:['System','Risiko','Control','Evidence'],lenses:['Purpose','Data','Oversight','Operations']},
'/ai-governance/risk-check/':{label:'RISK LOGIC',title:'Von zwölf Antworten zum priorisierten Profil',img:'governance',steps:['Antworten','Risikofelder','Priorität','Maßnahme'],lenses:['Impact','Security','Transparency','Evidence']},
'/docs/':{label:'KNOWLEDGE SYSTEM',title:'Wissen wird auffindbar und prüfbar',img:'governance',steps:['Thema','Artikel','Nachweis','Review'],lenses:['Struktur','Version','Owner','Gültigkeit']},
'/docs/ai-governance/':{label:'R-001 BIS R-012',title:'Der Governance-Wissensrahmen',img:'governance',steps:['Purpose','Data','Oversight','Evidence'],lenses:['12 Risiken','Controls','RACI','Gespräch']},
'/ueber-bais/':{label:'BAIS OPERATING MODEL',title:'Technisch tief. Geschäftlich klar.',img:'bais-ecosystem',steps:['Verstehen','Bauen','Absichern','Übergeben'],lenses:['Engineering','Security','Governance','Academy']},
'/kontakt/':{label:'PROJECT INTAKE',title:'Vom Anliegen zur belastbaren Einordnung',img:'bais-ecosystem',steps:['Anfrage','Discovery','Einordnung','Nächster Schritt'],lenses:['Ziel','System','Daten','Risiko']},
'/impressum/':{label:'VERANTWORTUNG',title:'Anbieter- und Kontaktstruktur',img:null,steps:['Anbieter','Vertretung','Kontakt','Recht'],lenses:['Identität','Erreichbarkeit','Steuer','Inhalt']},
'/datenschutz/':{label:'DATENSCHUTZ-LIFECYCLE',title:'Datenverarbeitung nachvollziehbar einordnen',img:null,steps:['Erhebung','Zweck','Schutz','Löschung'],lenses:['Rechtsgrundlage','Betroffene','TOM','Frist']},
'/referenzen/':{label:'DEMONSTRATOR SYSTEM',title:'Technische Substanz transparent zeigen',img:'ai-engineering',steps:['Problem','Architektur','Demo','Grenze'],lenses:['Funktion','Security','Evidence','Status']},
'/projektablauf/':{label:'DELIVERY FLOW',title:'Jede Phase erzeugt ein Ergebnis',img:'bais-ecosystem',steps:['Discovery','Build','Validate','Handover'],lenses:['Scope','Owner','Review','Evidence']},
'/academy/pakete/':{label:'PROGRAMM-LOGIK',title:'Lernumfang passend zum Ziel',img:'academy-lab',steps:['Bedarf','Pfad','Praxis','Nachweis'],lenses:['Rolle','Tiefe','Format','Transfer']},
'/academy/anmeldung/':{label:'ANMELDEPROZESS',title:'Vom Lernziel zum passenden Programm',img:'academy-lab',steps:['Interesse','Beratung','Zuordnung','Start'],lenses:['Ziel','Vorkenntnis','Termin','Format']},
'/lab/':{label:'BAIS LAB',title:'Bauen, testen, dokumentieren',img:'ai-engineering',steps:['Hypothese','Prototyp','Test','Evidence'],lenses:['System','Security','Automation','Learning']},
'/zertifikat/':{label:'VERIFICATION FLOW',title:'Nachweis eindeutig prüfen',img:'academy-lab',steps:['Code','Datensatz','Status','Ergebnis'],lenses:['Identität','Programm','Datum','Gültigkeit']},
'/project-portal/demo/':{label:'PORTAL WORKFLOW',title:'Status, Dokumente und Freigaben verbunden',img:'bais-ecosystem',steps:['Projekt','Milestone','Approval','Handover'],lenses:['Fortschritt','Risiko','Change','Evidence']},
'/branchen/mittelstand/':{label:'MITTELSTAND',title:'Pragmatische Digitalisierung mit Betriebsfokus',img:'bais-ecosystem',steps:['Engpass','Priorität','Integration','Nutzen'],lenses:['Aufwand','Security','Akzeptanz','Betrieb']},
'/branchen/vertrieb/':{label:'VERTRIEB',title:'Mehr Kontext – bessere Kundenarbeit',img:'ai-engineering',steps:['Signal','Vorbereitung','Gespräch','Follow-up'],lenses:['Daten','Qualität','Tempo','Conversion']},
'/branchen/it-security/':{label:'SECURITY OPERATIONS',title:'Prävention, Detektion und Response verbinden',img:'cybersecurity',steps:['Identify','Protect','Detect','Respond'],lenses:['Identity','Network','Cloud','Evidence']},
'/branchen/bildung/':{label:'BILDUNG',title:'Lernsysteme sicher und wirksam gestalten',img:'academy-lab',steps:['Zielgruppe','Lernpfad','Praxis','Nachweis'],lenses:['Didaktik','Datenschutz','Transfer','Qualität']}};
let cfg=general[path];
const academyKey=Object.keys(academy).find(k=>path===`/academy/${k}/`);
if(academyKey)cfg={label:'ACADEMY LEARNING MAP',title:'Vom Verständnis zur sicheren Anwendung',img:'academy-lab',steps:academy[academyKey],lenses:['Verstehen','Anwenden','Bewerten','Transfer']};
const riskKey=Object.keys(risks).find(k=>path===`/docs/ai-governance/${k}/`);
if(riskKey)cfg={label:'CONTROL & EVIDENCE MAP',title:'Vom Risiko zum prüfbaren Nachweis',img:'governance',steps:risks[riskKey],lenses:['Context','Risk','Control','Evidence']};
if(!cfg)return;
const h1=$('h1');
const first=$('main > section');
if(!first||!h1||$('.topicVisual'))return;
const image=cfg.img?`<figure class="topicImage"><img src="/assets/visuals/${cfg.img}-v1.svg" width="1200" height="675" loading="lazy" alt="Thematische 3D-Visualisierung zu ${esc(h1.textContent.trim())}"></figure>`:'';
const steps=cfg.steps.map((s,i)=>`<li><span>0${i+1}</span><b>${esc(s)}</b></li>`).join('');
const lenses=cfg.lenses.map((s,i)=>`<li><b>${esc(s)}</b><i style="--level:${62+i*9}%"></i></li>`).join('');
const section=document.createElement('section');
section.className='topicVisual';
section.setAttribute('aria-labelledby','topicVisualTitle');
section.innerHTML=`<div class="c"><div class="topicVisualHead"><div><span>${esc(cfg.label)}</span><h2 id="topicVisualTitle">${esc(cfg.title)}</h2></div><p>Die Grafik zeigt die fachliche Struktur dieses Themas. Sie ist eine Orientierung für Discovery und Umsetzung – keine automatisch ermittelte Bewertung.</p></div><div class="topicVisualGrid">${image}<div class="topicDiagram"><strong>PROZESS / ZUSAMMENHANG</strong><ol>${steps}</ol><strong>PRÜFPERSPEKTIVEN</strong><ul>${lenses}</ul></div></div></div>`;
first.insertAdjacentElement('afterend',section);
})();
