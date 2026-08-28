(() => {
  'use strict';

  const dimensions = {
    impact: 'Zweck & Auswirkung',
    data: 'Daten & Sicherheit',
    oversight: 'Kontrolle & Transparenz',
    operations: 'Betrieb & Nachweise'
  };

  const questions = [
    { id: 'use', dimension: 'impact', title: 'Wofür wird das AI-System eingesetzt?', hint: 'Wählen Sie die Aussage, die dem tatsächlichen Einsatzzweck am nächsten kommt.', options: [
      ['Interne Unterstützung ohne direkte Außenwirkung', 0], ['Inhalte oder Empfehlungen für Kunden/Nutzer', 4], ['Vorbereitung wesentlicher Entscheidungen über Personen', 8], ['Autonome Entscheidung mit erheblicher Wirkung', 10]
    ]},
    { id: 'consequence', dimension: 'impact', title: 'Welche Folgen kann ein falsches Ergebnis haben?', hint: 'Betrachten Sie den plausiblen Schaden, nicht nur den Normalbetrieb.', options: [
      ['Leicht und vollständig korrigierbar', 0], ['Finanzieller oder operativer Mehraufwand', 4], ['Erhebliche Nachteile für einzelne Personen', 8], ['Gefahr für Gesundheit, Sicherheit oder Grundrechte', 10]
    ]},
    { id: 'scale', dimension: 'impact', title: 'Wie groß ist der betroffene Personenkreis?', hint: 'Auch indirekt betroffene Personen berücksichtigen.', options: [
      ['Kleines internes Testteam', 0], ['Ein Team oder begrenzte Nutzergruppe', 3], ['Viele Kunden, Mitarbeitende oder Bürger', 7], ['Sehr große oder besonders schutzbedürftige Gruppe', 10]
    ]},
    { id: 'dataType', dimension: 'data', title: 'Welche Daten verarbeitet das System?', hint: 'Maßgeblich ist die sensibelste regelmäßig verwendete Datenart.', options: [
      ['Keine personenbezogenen oder vertraulichen Daten', 0], ['Normale personenbezogene Daten', 4], ['Vertrauliche Unternehmens- oder umfangreiche Profildaten', 7], ['Besondere Kategorien personenbezogener Daten', 10]
    ]},
    { id: 'provider', dimension: 'data', title: 'Wie kontrolliert ist die technische Lieferkette?', hint: 'Modell, Hosting, APIs, Plugins und Unterauftragnehmer einbeziehen.', options: [
      ['Vollständig dokumentiert und vertraglich geregelt', 0], ['Wesentliche Anbieter und Datenflüsse sind bekannt', 3], ['Teilweise unklar oder häufig wechselnd', 7], ['Unbekannte Tools/Plugins oder ungeregelte Datenflüsse', 10]
    ]},
    { id: 'security', dimension: 'data', title: 'Wie ist das System technisch abgesichert?', hint: 'Zugriffe, Secrets, Logging, Trennung und Tests bewerten.', options: [
      ['Security Controls getestet und dokumentiert', 0], ['Basisschutz vorhanden, Tests teilweise', 3], ['Einzelne Schutzmaßnahmen ohne Gesamtprüfung', 7], ['Keine definierten Security Controls', 10]
    ]},
    { id: 'human', dimension: 'oversight', title: 'Wie funktioniert Human Oversight?', hint: 'Eine formale Freigabe zählt nur, wenn Menschen wirksam eingreifen können.', options: [
      ['Qualifizierte Prüfung mit Stop-/Override-Möglichkeit', 0], ['Stichproben und definierte Eskalation', 3], ['Mensch sieht Ergebnis, greift aber selten ein', 7], ['Keine menschliche Kontrolle vorgesehen', 10]
    ]},
    { id: 'transparency', dimension: 'oversight', title: 'Werden AI-Einsatz und Grenzen transparent gemacht?', hint: 'Betroffene müssen die Rolle des Systems angemessen verstehen können.', options: [
      ['Kennzeichnung, Zweck und Grenzen sind klar', 0], ['Grundlegende Information vorhanden', 3], ['Nur intern bekannt oder schwer verständlich', 7], ['AI-Einsatz wird nicht offengelegt', 10]
    ]},
    { id: 'explainability', dimension: 'oversight', title: 'Können Ergebnisse nachvollzogen werden?', hint: 'Quellen, Eingaben, Versionen und Entscheidungsweg berücksichtigen.', options: [
      ['Quellen und wesentliche Faktoren sind prüfbar', 0], ['Teilweise nachvollziehbar', 3], ['Nur Ergebnis und Prompt sind verfügbar', 7], ['Entscheidungsweg ist nicht rekonstruierbar', 10]
    ]},
    { id: 'owner', dimension: 'operations', title: 'Ist die Verantwortung eindeutig geregelt?', hint: 'Fachlicher Owner, technischer Betrieb und Freigabe müssen klar sein.', options: [
      ['Rollen, Owner und Eskalation dokumentiert', 0], ['Owner benannt, Details noch offen', 3], ['Verantwortung verteilt oder informell', 7], ['Niemand trägt eindeutig Verantwortung', 10]
    ]},
    { id: 'monitoring', dimension: 'operations', title: 'Wie wird der laufende Betrieb überwacht?', hint: 'Qualität, Drift, Fehler, Missbrauch und Incidents einbeziehen.', options: [
      ['KPIs, Logging, Alerts und Incident-Prozess aktiv', 0], ['Regelmäßige manuelle Reviews', 3], ['Reaktion hauptsächlich nach Beschwerden', 7], ['Kein Monitoring oder Incident-Prozess', 10]
    ]},
    { id: 'evidence', dimension: 'operations', title: 'Welche Nachweise sind vorhanden?', hint: 'Zweck, Daten, Tests, Risiken, Freigaben und Änderungen betrachten.', options: [
      ['Systemakte mit Tests, Risiken und Reviews', 0], ['Zentrale Dokumentation teilweise vorhanden', 3], ['Verteilte Notizen ohne festen Review', 7], ['Keine belastbare Dokumentation', 10]
    ]}
  ];

  const controls = {
    use: 'Zweck, zulässige Nutzung und ausgeschlossene Entscheidungen verbindlich festlegen.',
    consequence: 'Fehlerszenarien, Schadensausmaß und Abbruchkriterien mit Fachverantwortlichen testen.',
    scale: 'Betroffenengruppen und Schutzbedarfe dokumentieren; Pilotumfang bewusst begrenzen.',
    dataType: 'Datenminimierung, Rechtsgrundlage, Löschkonzept und Schutzbedarf fachlich prüfen.',
    provider: 'Anbieter, Modelle, Datenflüsse, Speicherorte und Verträge in einer Lieferkettenakte erfassen.',
    security: 'Zugriffe, Secrets, Mandantentrennung, Logging und Prompt-Injection-Schutz technisch testen.',
    human: 'Wirksame Human-Oversight-Rolle mit Stop, Override und Eskalation in den Prozess einbauen.',
    transparency: 'AI-Einsatz, Zweck, Grenzen und Ansprechpartner verständlich kennzeichnen.',
    explainability: 'Eingaben, Quellen, Modell-/Prompt-Version und Ergebnisweg revisionsfähig protokollieren.',
    owner: 'Fachlichen Owner, technischen Betreiber, Freigabeverantwortung und Eskalationsweg benennen.',
    monitoring: 'Qualitäts-, Drift-, Sicherheits- und Incident-Monitoring mit Schwellenwerten definieren.',
    evidence: 'Zentrale Systemakte mit Risk Assessment, Tests, Freigaben, Änderungen und Review-Terminen führen.'
  };

  const riskOwners = {
    use: 'Business Owner', consequence: 'Risk Owner', scale: 'Business Owner', dataType: 'Data Owner / Datenschutz',
    provider: 'Vendor Manager', security: 'IT Security', human: 'Fachlicher Owner', transparency: 'Compliance',
    explainability: 'AI/ML Owner', owner: 'Geschäftsführung', monitoring: 'Operations', evidence: 'Governance Lead'
  };

  const riskEvidence = {
    use: 'Freigegebene Zweck- und Use-Case-Beschreibung', consequence: 'Impact- und Fehlerszenarioanalyse',
    scale: 'Betroffenen- und Stakeholderanalyse', dataType: 'Dateninventar, Rechtsgrundlage, Löschkonzept',
    provider: 'Anbieter-, Modell- und Datenflussakte', security: 'Security-Testbericht und Control-Matrix',
    human: 'Human-Oversight- und Eskalationskonzept', transparency: 'Transparenzinformation und Nutzerhinweise',
    explainability: 'Logging-, Quellen- und Versionsnachweise', owner: 'RACI- und Freigabedokument',
    monitoring: 'KPI-, Monitoring- und Incident-Runbook', evidence: 'AI-Systemakte mit Review-Historie'
  };

  const riskCatalog = {
    use: ['R-001', 'Use Case & Purpose'], consequence: ['R-002', 'Consequence & Impact'],
    scale: ['R-003', 'Affected Persons & Scale'], dataType: ['R-004', 'Personal Data & Classification'],
    provider: ['R-005', 'Provider & Supply Chain'], security: ['R-006', 'AI Security Controls'],
    human: ['R-007', 'Human Oversight'], transparency: ['R-008', 'Transparency & Disclosure'],
    explainability: ['R-009', 'Explainability & Traceability'], owner: ['R-010', 'Ownership & Accountability'],
    monitoring: ['R-011', 'Monitoring & Incident Management'], evidence: ['R-012', 'Evidence & Documentation']
  };

  const form = document.querySelector('#riskForm');
  const questionRoot = document.querySelector('#questions');
  const results = document.querySelector('#results');
  const progress = document.querySelector('.progressTrack');
  const progressBar = document.querySelector('#progressBar');
  const answeredCount = document.querySelector('#answeredCount');
  const formError = document.querySelector('#formError');

  function renderQuestions() {
    const fragment = document.createDocumentFragment();
    questions.forEach((question, index) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'riskQuestion';
      fieldset.dataset.question = question.id;
      const legend = document.createElement('legend');
      legend.innerHTML = `<span>${String(index + 1).padStart(2, '0')} · ${dimensions[question.dimension]}</span>${question.title}`;
      const hint = document.createElement('p');
      hint.className = 'questionHint';
      hint.id = `${question.id}-hint`;
      hint.textContent = question.hint;
      fieldset.setAttribute('aria-describedby', hint.id);
      fieldset.append(legend, hint);

      const optionGrid = document.createElement('div');
      optionGrid.className = 'optionGrid';
      question.options.forEach(([label, score], optionIndex) => {
        const option = document.createElement('label');
        option.className = 'riskOption';
        option.innerHTML = `<input type="radio" name="${question.id}" value="${score}" data-label="${label}" required><span class="optionMark" aria-hidden="true"></span><span>${label}</span>`;
        optionGrid.append(option);
        if (optionIndex === 0) option.querySelector('input').dataset.first = 'true';
      });
      fieldset.append(optionGrid);
      fragment.append(fieldset);
    });
    questionRoot.append(fragment);
  }

  function selectedAnswers() {
    return questions.map(question => {
      const input = form.elements[question.id];
      const selected = input instanceof RadioNodeList ? input.value : '';
      return selected === '' ? null : { ...question, score: Number(selected) };
    });
  }

  function updateProgress() {
    const count = selectedAnswers().filter(Boolean).length;
    answeredCount.textContent = String(count);
    progress.setAttribute('aria-valuenow', String(count));
    progressBar.style.width = `${(count / questions.length) * 100}%`;
    if (count === questions.length) formError.hidden = true;
  }

  function classification(score) {
    if (score <= 24) return ['controlled', 'Kontrolliertes Ausgangsprofil', 'Die gewählten Antworten zeigen derzeit überwiegend tragfähige Grundlagen. Reviews und Evidence bleiben trotzdem erforderlich.'];
    if (score <= 49) return ['moderate', 'Erhöhter Governance-Bedarf', 'Mehrere Kontrollen sind noch nicht belastbar. Vor produktiver Skalierung sollten die priorisierten Maßnahmen geschlossen werden.'];
    if (score <= 74) return ['high', 'Hoher Handlungsbedarf', 'Das System verbindet relevante Auswirkungen mit deutlichen Kontrolllücken. Ein strukturierter Governance- und Security-Review ist erforderlich.'];
    return ['critical', 'Kritisches Risikoprofil', 'Die Konstellation enthält sehr hohe Auswirkungen oder wesentliche Kontrolllücken. Produktiver Einsatz sollte bis zur fachlichen Prüfung und Risikobehandlung begrenzt werden.'];
  }

  function renderExecutiveDecision(score, answers, dimensionScores) {
    const byId = id => answers.find(answer => answer.id === id);
    const criticalCount = answers.filter(answer => answer.score >= 8).length;
    let decisionClass = 'go', decision = 'GO WITH CONTROLS', review = 'Quartalsweise';
    let text = 'Ein kontrollierter Betrieb ist grundsätzlich vertretbar. Bestehende Controls, Evidence und regelmäßige Reviews müssen aktiv bleiben.';
    if (score >= 75 || criticalCount >= 4) {
      decisionClass = 'no-go'; decision = 'NO-GO'; review = 'Wöchentlich';
      text = 'Kein unkontrollierter Produktivbetrieb. Kritische Risiken müssen zuerst behandelt, getestet, dokumentiert und durch die verantwortlichen Rollen freigegeben werden.';
    } else if (score >= 50 || criticalCount >= 2) {
      decisionClass = 'conditional'; decision = 'CONDITIONAL GO'; review = 'Zweiwöchentlich';
      text = 'Nur ein begrenzter Pilotbetrieb ist vertretbar: mit benanntem Owner, Human Oversight, Monitoring, Exit-Kriterien und dokumentierter Risikobehandlung.';
    } else if (score >= 25) {
      decisionClass = 'conditional'; decision = 'CONDITIONAL GO'; review = 'Monatlich';
      text = 'Betrieb nur mit terminiertem Maßnahmenplan. Offene Go-Live Gates müssen vor einer Skalierung geschlossen und nachgewiesen werden.';
    }
    const badge = document.querySelector('#decisionBadge');
    badge.className = `decisionBadge ${decisionClass}`; badge.textContent = decision;
    document.querySelector('#decisionText').textContent = text;
    document.querySelector('#decisionReview').textContent = review;
    document.querySelector('#decisionOwner').textContent = byId('owner').score >= 7 ? 'Geschäftsführung festlegen' : 'Business Owner';

    const rankedDimensions = Object.entries(dimensionScores).sort((a, b) => b[1] - a[1]);
    const reasons = [`${dimensions[rankedDimensions[0][0]]} ist mit ${rankedDimensions[0][1]}% das stärkste Risikofeld.`, `${criticalCount} von 12 Antworten enthalten ein sehr hohes Einzelsignal.`, byId('consequence').score >= 7 ? 'Fehler können erhebliche Auswirkungen auf Personen oder den Betrieb haben.' : 'Die angegebenen Fehlerfolgen sind derzeit begrenzt oder kontrollierbar.', byId('evidence').score >= 7 ? 'Belastbare Nachweise und Review-Historie fehlen.' : 'Eine dokumentierte Evidence-Basis ist zumindest teilweise vorhanden.'];
    const reasonRoot = document.querySelector('#decisionReasons'); reasonRoot.replaceChildren();
    reasons.forEach(reason => { const li = document.createElement('li'); li.textContent = reason; reasonRoot.append(li); });

    const boundaries = decisionClass === 'no-go' ? ['Nur isolierter Test mit synthetischen oder freigegebenen Daten.', 'Keine autonomen Entscheidungen und keine Wirkung auf betroffene Personen.', 'Ausgaben müssen vor Nutzung vollständig menschlich geprüft werden.', 'Kein Rollout, keine Skalierung und keine neuen Datenquellen.'] : decisionClass === 'conditional' ? ['Begrenzter Pilot mit definiertem Nutzerkreis und dokumentiertem Zweck.', 'Human Review vor Entscheidungen mit Außenwirkung.', 'Monitoring, Incident-Kanal und Stop-Kriterium müssen aktiv sein.', 'Keine Erweiterung von Zweck, Daten oder Nutzerkreis ohne Review.'] : ['Freigegebener Zweck und dokumentierter Nutzerkreis.', 'Monitoring und Incident-Prozess bleiben aktiv.', 'Wesentliche Ergebnisse werden risikobasiert menschlich geprüft.', 'Änderungen lösen ein Re-Assessment aus.'];
    const boundaryRoot = document.querySelector('#operatingBoundary'); boundaryRoot.replaceChildren();
    boundaries.forEach(item => { const li = document.createElement('li'); li.textContent = item; boundaryRoot.append(li); });

    const gates = [['Owner & RACI', byId('owner').score <= 3, 'Verantwortung, Freigabe und Eskalation'], ['Human Oversight', byId('human').score <= 3, 'Stop, Override und qualifizierte Prüfung'], ['Security Review', byId('security').score <= 3, 'Zugriff, Secrets, Logging und Tests'], ['Monitoring & Incident', byId('monitoring').score <= 3, 'KPIs, Alerts, Runbook und Reaktion'], ['Evidence Pack', byId('evidence').score <= 3, 'Systemakte, Tests, Risiken und Reviews']];
    const gateRoot = document.querySelector('#goLiveGates'); gateRoot.replaceChildren();
    gates.forEach(([label, passed, detail]) => { const item = document.createElement('div'); item.className = passed ? 'gate passed' : 'gate open'; item.innerHTML = `<span aria-hidden="true">${passed ? '✓' : '!'}</span><b>${label}</b><small>${detail}</small><em>${passed ? 'GESCHLOSSEN' : 'OFFEN'}</em>`; gateRoot.append(item); });
    document.querySelector('#gateCount').textContent = `${gates.filter(gate => gate[1]).length}/5`;

    const approvals = ['Business Owner: Zweck, Nutzen und Restrisiko', 'Technical Owner: Architektur und Betriebsfähigkeit'];
    if (byId('dataType').score >= 4) approvals.push('Datenschutz: Datenverarbeitung und Betroffenenrechte');
    if (byId('security').score >= 4) approvals.push('IT Security: technische Controls und Security Tests');
    if (score >= 50) approvals.push('Geschäftsführung/Risk Owner: dokumentierte Restrisikoakzeptanz');
    const approvalRoot = document.querySelector('#approvalChain'); approvalRoot.replaceChildren();
    approvals.forEach(item => { const li = document.createElement('li'); li.textContent = item; approvalRoot.append(li); });

    const triggers = ['Änderung von Zweck, Nutzergruppe oder Entscheidungswirkung', 'Neues Modell, neuer Anbieter, Plugin oder Datenfluss', 'Neue oder sensiblere Datenarten', 'Security Incident, Beschwerde oder erheblicher Qualitätsfehler', 'Drift, KPI-Verletzung oder Änderung der Rechtslage'];
    const triggerRoot = document.querySelector('#reassessmentTriggers'); triggerRoot.replaceChildren();
    triggers.forEach(item => { const li = document.createElement('li'); li.textContent = item; triggerRoot.append(li); });
  }

  function riskLevel(score) {
    if (score >= 8) return ['critical', 'Kritisch', '7 Tage'];
    if (score >= 6) return ['high', 'Hoch', '14 Tage'];
    if (score >= 3) return ['moderate', 'Moderat', '30 Tage'];
    return ['controlled', 'Kontrolliert', '90 Tage'];
  }

  function renderRiskRegister(answers) {
    const ranked = [...answers].sort((a, b) => b.score - a.score);
    const body = document.querySelector('#riskRegisterBody');
    body.replaceChildren();
    ranked.forEach(answer => {
      const [levelClass, levelLabel, target] = riskLevel(answer.score);
      const [stableId, catalogName] = riskCatalog[answer.id];
      const selected = form.querySelector(`input[name="${answer.id}"]:checked`)?.dataset.label || '';
      const row = document.createElement('tr');
      row.dataset.riskId = stableId;
      row.dataset.level = levelClass;
      row.dataset.status = 'open';
      const wikiAnchor = stableId.toLowerCase();
      row.innerHTML = `<td><a class="stableRiskId" href="../../docs/ai-governance/#${wikiAnchor}" aria-label="${stableId} im AI Governance Wiki öffnen">${stableId}</a><small>${catalogName}</small></td><td><strong>${answer.title}</strong><small>${selected}</small></td><td><span class="tableLevel ${levelClass}">${levelLabel}</span><small>${answer.score}/10</small></td><td>${riskOwners[answer.id]}</td><td>${controls[answer.id]}</td><td>${riskEvidence[answer.id]}</td><td>${target}</td><td><label class="statusCheck"><input type="checkbox" aria-label="${stableId} ${answer.title}: als behandelt markieren"><span aria-hidden="true"></span><b>Offen</b></label></td>`;
      body.append(row);
    });

    const catalogRoot = document.querySelector('#riskCatalogGrid');
    catalogRoot.replaceChildren();
    Object.values(riskCatalog).forEach(([id, name]) => {
      const item = document.createElement('div');
      item.innerHTML = `<b>${id}</b><span>${name}</span>`;
      catalogRoot.append(item);
    });

    const counts = { critical: 0, high: 0, moderate: 0, controlled: 0 };
    ranked.forEach(answer => { counts[riskLevel(answer.score)[0]] += 1; });
    const stats = document.querySelector('#registerStats'); stats.replaceChildren();
    [['Kritisch', counts.critical, 'critical'], ['Hoch', counts.high, 'high'], ['Moderat', counts.moderate, 'moderate'], ['Kontrolliert', counts.controlled, 'controlled']].forEach(([label, value, type]) => {
      const item = document.createElement('div'); item.className = `registerStat ${type}`; item.innerHTML = `<span>${label}</span><strong>${value}</strong>`; stats.append(item);
    });

    const empty = document.querySelector('#registerEmpty');
    function applyFilter(filter) {
      let visible = 0;
      body.querySelectorAll('tr').forEach(row => {
        const show = filter === 'all' || (filter === 'open' && row.dataset.status === 'open') || (filter === 'treated' && row.dataset.status === 'treated') || (filter === 'critical' && ['critical', 'high'].includes(row.dataset.level));
        row.hidden = !show; if (show) visible += 1;
      });
      empty.hidden = visible !== 0;
    }

    body.querySelectorAll('.statusCheck input').forEach(input => input.addEventListener('change', () => {
      const row = input.closest('tr'); row.dataset.status = input.checked ? 'treated' : 'open';
      const label = input.closest('.statusCheck').querySelector('b'); label.textContent = input.checked ? 'Behandelt' : 'Offen';
      const treated = body.querySelectorAll('.statusCheck input:checked').length;
      document.querySelector('#treatedCount').textContent = String(treated);
      document.querySelector('.registerTrack').setAttribute('aria-valuenow', String(treated));
      document.querySelector('#registerBar').style.width = `${(treated / 12) * 100}%`;
      const active = document.querySelector('.filterButton.active')?.dataset.riskFilter || 'all'; applyFilter(active);
    }));

    document.querySelectorAll('.filterButton').forEach(button => button.onclick = () => {
      document.querySelectorAll('.filterButton').forEach(item => item.classList.toggle('active', item === button));
      applyFilter(button.dataset.riskFilter);
    });
    document.querySelector('#treatedCount').textContent = '0';
    document.querySelector('.registerTrack').setAttribute('aria-valuenow', '0');
    document.querySelector('#registerBar').style.width = '0%';
    applyFilter('all');
  }

  function renderResults(answers) {
    const total = answers.reduce((sum, answer) => sum + answer.score, 0);
    const score = Math.round((total / 120) * 100);
    const [level, title, text] = classification(score);
    const dimensionScores = {};
    Object.keys(dimensions).forEach(key => {
      const group = answers.filter(answer => answer.dimension === key);
      dimensionScores[key] = Math.round((group.reduce((sum, answer) => sum + answer.score, 0) / (group.length * 10)) * 100);
    });

    document.querySelector('#scoreValue').textContent = String(score);
    document.querySelector('#scoreRing').style.setProperty('--score', `${score * 3.6}deg`);
    const badge = document.querySelector('#riskBadge');
    badge.className = `riskBadge ${level}`;
    badge.textContent = level === 'controlled' ? 'NIEDRIG–MODERAT' : level === 'moderate' ? 'MODERAT' : level === 'high' ? 'HOCH' : 'KRITISCH';
    document.querySelector('#riskTitle').textContent = title;
    document.querySelector('#riskText').textContent = text;
    document.querySelector('#resultSummary').textContent = `Ergebnis aus 12 beantworteten Kontrollfragen · ${score} von 100 Risikopunkten.`;

    const bars = document.querySelector('#dimensionBars');
    bars.replaceChildren();
    Object.entries(dimensionScores).forEach(([key, value]) => {
      const item = document.createElement('div');
      item.className = 'dimensionItem';
      item.innerHTML = `<div><b>${dimensions[key]}</b><span>${value}%</span></div><div class="dimensionTrack"><span style="width:${value}%"></span></div>`;
      bars.append(item);
    });

    const ranked = [...answers].sort((a, b) => b.score - a.score);
    const critical = ranked.filter(answer => answer.score >= 7).slice(0, 5);
    const criticalList = document.querySelector('#criticalSignals');
    criticalList.replaceChildren();
    (critical.length ? critical : ranked.slice(0, 3)).forEach(answer => {
      const li = document.createElement('li');
      const selected = form.querySelector(`input[name="${answer.id}"]:checked`);
      li.innerHTML = `<b>${answer.title}</b><span>${selected?.dataset.label || ''}</span>`;
      criticalList.append(li);
    });

    const recommended = ranked.filter(answer => answer.score >= 3).slice(0, 6);
    const controlList = document.querySelector('#recommendedControls');
    controlList.replaceChildren();
    (recommended.length ? recommended : ranked.slice(0, 3)).forEach(answer => {
      const li = document.createElement('li');
      li.textContent = controls[answer.id];
      controlList.append(li);
    });

    renderExecutiveDecision(score, answers, dimensionScores);
    renderRiskRegister(answers);

    results.hidden = false;
    results.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    document.querySelector('#result-title').focus({ preventScroll: true });
  }

  renderQuestions();
  form.addEventListener('change', updateProgress);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const answers = selectedAnswers();
    const missingIndex = answers.findIndex(answer => answer === null);
    if (missingIndex !== -1) {
      formError.hidden = false;
      form.querySelector(`[data-question="${questions[missingIndex].id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.querySelector(`input[name="${questions[missingIndex].id}"]`).focus({ preventScroll: true });
      return;
    }
    renderResults(answers);
  });
  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      updateProgress();
      results.hidden = true;
      formError.hidden = true;
    }, 0);
  });
  document.querySelector('#printResult').addEventListener('click', () => window.print());
})();
