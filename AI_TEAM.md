# BAIS AI Team — Release Orchestration

## Mission
Finish `bais-solutions.de` as a production-ready customer-facing system. The priority is **release completion**, not feature expansion.

All AI agents working on this repository MUST optimize for closing verified release blockers and must not invent new product scope unless a blocker requires it.

## Single source of truth
- `main` is the authoritative integration branch.
- Every change uses a dedicated short-lived branch and PR.
- Before starting work: fetch/pull latest `main`.
- Never work from stale AI branches.
- Never stack unrelated PRs.
- Do not edit the same subsystem concurrently with another active AI task.

## Team roles

### ChatGPT / Codex — Release Lead
Owns:
- release-blocker triage and prioritization
- architecture and cross-cutting integration decisions
- security / tenant-isolation / DSGVO-sensitive review
- Cloudflare D1/R2/Pages/Workers integration review
- final PR review and release-gate verification
- resolving conflicts between agent implementations

Default behavior: inspect first, change minimally, test fully, then PR.

### Claude Code — Senior Implementation Engineer
Owns:
- multi-file implementation and refactoring
- auth, account, portal and backend workflows
- customer lifecycle, Dolibarr and n8n integration work
- regression fixes that require broad repository context
- adding/repairing automated tests for implemented behavior

Default behavior: one blocker per branch. No unrelated UI/content cleanup in backend PRs.

### Gemini / Antigravity — Independent QA & UX Engineer
Owns:
- independent functional audit of public and authenticated flows
- responsive behavior and visual regression review
- accessibility review (keyboard, labels, semantic HTML, focus, contrast)
- broken links, dead CTAs, inconsistent navigation and content defects
- performance/Lighthouse-oriented review
- second-opinion security/edge-case review

Default behavior: report reproducible defects first; fix only verified defects on a dedicated branch.

### GitHub Copilot — Fast Fix & Test Engineer
Owns:
- small scoped bugs
- TypeScript/JavaScript/HTML/CSS fixes
- unit/regression tests
- repetitive safe edits
- lint/type/build/test failures
- small accessibility and responsive corrections

Default behavior: minimal diff. No architecture redesign, auth model change, database schema redesign, or broad refactor without a release-lead decision.

## Mandatory workflow
1. Start from latest `main`.
2. Read this file and the agent-specific instruction file.
3. Select exactly one verified release blocker.
4. Reproduce or prove the defect before changing code.
5. Make the smallest coherent fix.
6. Add or update regression tests where feasible.
7. Run the release checks below.
8. Inspect the diff for accidental/unrelated changes.
9. Open a PR against `main` with: Problem, Root Cause, Fix, Tests, Risks.
10. Do not merge if required checks fail.

## Required release checks
Run, as applicable:

```bash
npm test
npm run check
npm run cf:dry-run
```

Additionally verify affected user flows in a real browser or Playwright-equivalent environment.

## Definition of Done
A blocker is done only when all applicable points are true:
- intended user flow works end-to-end
- no dummy/test path is required for production behavior
- authenticated data is tenant-scoped
- customer A cannot access customer B data
- secrets/API keys are not exposed client-side or committed
- input validation and authorization are enforced server-side
- Cloudflare D1/R2 bindings and runtime assumptions remain valid
- direct links, email-token flows and refresh/deep-link behavior work
- desktop and mobile layouts are usable
- keyboard navigation and form labels remain usable
- no obvious WCAG contrast/focus regression is introduced
- no new console/runtime error is introduced
- automated regression test exists when practical
- `npm test` passes
- `npm run check` passes
- `npm run cf:dry-run` passes when Cloudflare code/config is affected
- PR contains only related changes

## Responsive / Accessibility / Lighthouse gate
For public/customer-facing pages, check:
- 390px mobile viewport
- tablet-sized viewport
- desktop >= 1366px
- no horizontal overflow
- no clipped headings/buttons/forms
- visible keyboard focus
- logical tab order
- semantic headings
- explicit form labels and useful validation errors
- image `alt` text where meaningful
- no avoidable layout shift from new assets
- no obvious render-blocking or oversized asset regression
- Lighthouse categories should not materially regress; investigate any significant Performance, Accessibility, Best Practices or SEO drop caused by the PR

## Non-negotiable rules
- Do not say "done" based only on code inspection.
- Do not fix symptoms without identifying the root cause.
- Do not replace working production behavior with mocks.
- Do not create customer-visible dummy data.
- Do not weaken authentication/authorization to make a test pass.
- Do not silently change API contracts, form IDs, database semantics or customer-number mapping.
- Do not touch unrelated Academy/content files during platform/backend work.
- Do not create giant cleanup PRs while release blockers remain.

## Release priority order
1. Broken production / deployment / runtime
2. Authentication, authorization, MFA, tenant isolation
3. Customer registration and first-customer lifecycle
4. Project Portal and document access
5. Dolibarr / n8n / integration reliability
6. Forms, email/token flows and persistence
7. Public navigation, broken links and critical UX
8. Responsive/accessibility/performance regressions
9. Content polish
10. New features only after release blockers are closed
