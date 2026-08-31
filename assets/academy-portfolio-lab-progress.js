(()=> {
  // Generic progress bridge for the shared Portfolio-Board (Leadership),
  // Attack-&-Defense-Chain (IT & Security) and EU AI Act Orientation risk-map
  // lab widgets from academy-business-labs.js. Those widgets only update
  // their own panel and don't know about academy progress tracking — this
  // file listens for the same clicks and reports each case via the shared
  // "bais:lab-case" event that n8n-module-study.js already consumes (see its
  // listener), so no change to academy-business-labs.js or
  // n8n-module-study.js is needed.
  document.addEventListener("click", event => {
    const portfolio = event.target.closest("[data-portfolio]");
    if (portfolio) {
      window.dispatchEvent(new CustomEvent("bais:lab-case", {detail: {caseId: portfolio.dataset.portfolio}}));
      return;
    }
    const threat = event.target.closest("[data-threat]");
    if (threat) {
      window.dispatchEvent(new CustomEvent("bais:lab-case", {detail: {caseId: threat.dataset.threat}}));
      return;
    }
    const riskClass = event.target.closest(".riskClass[data-class]");
    if (riskClass) {
      window.dispatchEvent(new CustomEvent("bais:lab-case", {detail: {caseId: riskClass.dataset.class}}));
    }
  });
})();
