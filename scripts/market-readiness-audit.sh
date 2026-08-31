#!/usr/bin/env bash
set -uo pipefail

BASE_URL="https://bais-solutions.de"
FAIL=0
WARN=0

pass(){ printf 'PASS  %s\n' "$*"; }
fail(){ printf 'FAIL  %s\n' "$*"; FAIL=$((FAIL+1)); }
warn(){ printf 'WARN  %s\n' "$*"; WARN=$((WARN+1)); }

echo "=== 1. CORE PAGES ==="
for path in / /preise/ /kontakt/ /impressum/ /datenschutz/ /agb/ /avv/ /sla/ /referenzen/ /referenzen/n8n-live-demo/ /loesungen/ /ueber-bais/ /project-portal/ /academy/ /ai-governance/; do
  code="$(curl -LsS --max-time 20 -o /tmp/page -w '%{http_code}' "${BASE_URL}${path}" || true)"
  if [ "$code" = "200" ]; then pass "${path} HTTP 200"; else fail "${path} HTTP ${code}"; fi
  if [ "$code" = "200" ]; then
    grep -qi '<meta[^>]*name="viewport"' /tmp/page && pass "${path} viewport" || fail "${path} missing viewport"
    grep -qi '<title>[^<]' /tmp/page && pass "${path} title" || fail "${path} missing title"
  fi
done

echo
echo "=== 2. ERROR BEHAVIOR ==="
code="$(curl -LsS --max-time 20 -o /tmp/missing -w '%{http_code}' "${BASE_URL}/this-path-must-not-exist-market-audit-934781/" || true)"
[ "$code" = "404" ] && pass "unknown path returns 404" || fail "unknown path returned ${code}, expected 404"

echo
echo "=== 3. SECURITY HEADERS ==="
curl -LsSI --max-time 20 "${BASE_URL}/" >/tmp/headers || true
for header in strict-transport-security x-content-type-options x-frame-options referrer-policy permissions-policy content-security-policy; do
  grep -qi "^${header}:" /tmp/headers && pass "${header}" || fail "missing ${header}"
done
grep -qi "frame-ancestors 'none'" /tmp/headers && pass "CSP frame-ancestors none" || fail "CSP frame-ancestors not locked"
grep -qi "object-src 'none'" /tmp/headers && pass "CSP object-src none" || fail "CSP object-src not locked"

echo
echo "=== 4. SEO / CRAWLABILITY ==="
scode="$(curl -LsS --max-time 20 -o /tmp/sitemap.xml -w '%{http_code}' "${BASE_URL}/sitemap.xml" || true)"
[ "$scode" = "200" ] && pass "sitemap.xml HTTP 200" || fail "sitemap.xml HTTP ${scode}"
python3 -c "import xml.etree.ElementTree as ET; ET.parse('/tmp/sitemap.xml')" 2>/tmp/xmlerr
if [ "$?" = "0" ]; then pass "sitemap.xml valid XML"; else fail "sitemap.xml invalid XML"; sed -n '1,6p' /tmp/xmlerr; fi

rcode="$(curl -LsS --max-time 20 -o /tmp/robots.txt -w '%{http_code}' "${BASE_URL}/robots.txt" || true)"
if [ "$rcode" = "200" ]; then
  pass "robots.txt HTTP 200"
  grep -qi 'sitemap:' /tmp/robots.txt && pass "robots.txt advertises sitemap" || warn "robots.txt has no Sitemap directive"
else
  warn "robots.txt HTTP ${rcode}"
fi

echo
echo "=== 5. COMMERCIAL BASICS ==="
curl -LsS --max-time 20 "${BASE_URL}/preise/" >/tmp/pricing || true
grep -Eq '[0-9][0-9.]* ?€/Tag|Tagessätze' /tmp/pricing && pass "pricing page exposes commercial pricing" || fail "pricing page lacks visible day rates"
grep -qi 'Projekt einordnen\|Kontakt' /tmp/pricing && pass "pricing page has CTA" || fail "pricing page lacks CTA"

curl -LsS --max-time 20 "${BASE_URL}/impressum/" >/tmp/imprint || true
for needle in 'Inhaber' 'USt' 'Dortmund'; do
  grep -qi "$needle" /tmp/imprint && pass "imprint contains ${needle}" || fail "imprint missing ${needle}"
done

curl -LsS --max-time 20 "${BASE_URL}/datenschutz/" >/tmp/privacy || true
for needle in 'DSGVO' 'Cloudflare' 'D1' 'Turnstile' 'RepoCloud' 'Privacy-minimierte'; do
  grep -qi "$needle" /tmp/privacy && pass "privacy covers ${needle}" || warn "privacy does not mention ${needle}"
done

curl -LsS --max-time 20 "${BASE_URL}/kontakt/" >/tmp/contact || true
grep -qi '/api/contact' /tmp/contact && pass "contact form wired to API" || fail "contact form API wiring not found"
grep -qi 'challenges.cloudflare.com\|turnstile' /tmp/contact && pass "contact form Turnstile present" || fail "contact form Turnstile not found"
grep -qi 'mailto:info@bais-solutions.de\|info@bais-solutions.de\|data-cfemail=' /tmp/contact && pass "contact email/fallback present" || warn "fallback email not visible"

curl -LsS --max-time 20 "${BASE_URL}/avv/" >/tmp/avv || true
grep -qi 'Art. 28 DSGVO' /tmp/avv && pass "AVV page contains Art. 28 scope" || fail "AVV page missing Art. 28 scope"
grep -qi 'Technische und organisatorische Maßnahmen' /tmp/avv && pass "AVV contains TOM annex" || fail "AVV missing TOM annex"
grep -qi 'Subprozessoren' /tmp/avv && pass "AVV contains subprocessor annex" || fail "AVV missing subprocessor annex"

curl -LsS --max-time 20 "${BASE_URL}/sla/" >/tmp/sla || true
grep -qi 'P1 · Kritisch' /tmp/sla && grep -qi 'P4 · Niedrig' /tmp/sla && pass "SLA page contains P1-P4" || fail "SLA page missing P1-P4"
grep -qi 'Reaktionszeit ist nicht Lösungszeit' /tmp/sla && pass "SLA separates reaction and resolution time" || fail "SLA does not separate reaction and resolution"
grep -qi 'RPO' /tmp/sla && grep -qi 'RTO' /tmp/sla && pass "SLA covers RPO/RTO" || fail "SLA missing RPO/RTO"
grep -qi '24/7 nur bei ausdrücklicher Vereinbarung' /tmp/sla && pass "SLA avoids blanket 24/7 promise" || fail "SLA 24/7 boundary missing"

echo
echo "=== 6. KEY INTERNAL LINKS / ASSETS ==="
python3 scripts/market-link-audit.py
if [ "$?" = "0" ]; then pass "key internal links/assets resolve"; else fail "broken internal link/asset detected"; fi

echo
echo "=== 7. LIVE N8N PRODUCTION PATH ==="
demo_http="$(curl -sS --max-time 25 -o /tmp/demo.json -w '%{http_code}'   -X POST -H 'Origin: https://bais-solutions.de' -H 'Content-Type: application/json'   "${BASE_URL}/api/n8n-demo" --data '{"scenario":"automation","urgency":"planned"}' || true)"
if [ "$demo_http" = "200" ] && jq -e '.ok==true and .source=="live-n8n" and .requestAuth=="hmac-sha256" and (.executionId|length>0)' /tmp/demo.json >/dev/null 2>&1; then
  pass "signed BAIS -> n8n live execution"
  exec_id="$(jq -r '.executionId' /tmp/demo.json)"
  route="$(jq -r '.route' /tmp/demo.json)"
  echo "INFO  execution=${exec_id} route=${route}"
  if [ -n "${N8N_BASE_URL:-}" ] && [ -n "${N8N_API_KEY:-}" ]; then
    verify_http="$(curl -sS --max-time 20 -o /tmp/execution.json -w '%{http_code}'       -H "X-N8N-API-KEY: ${N8N_API_KEY}" -H 'Accept: application/json'       "${N8N_BASE_URL%/}/api/v1/executions/${exec_id}" || true)"
    if [ "$verify_http" = "200" ] && [ "$(jq -r '.id // empty' /tmp/execution.json)" = "$exec_id" ]; then
      pass "RepoCloud confirms execution ${exec_id}"
    else
      fail "RepoCloud execution verification failed"
    fi

    unsigned_http="$(curl -sS --max-time 20 -o /tmp/unsigned.json -w '%{http_code}'       -X POST -H 'Content-Type: application/json'       "${N8N_BASE_URL%/}/webhook/bais-lead-qualification"       --data '{"name":"Market Audit","email":"audit@example.com","company":"Audit GmbH","topic":"Automation / n8n","message":"Unsigned request must be rejected.","consent":true}' || true)"
    if [ "$unsigned_http" = "401" ] && jq -e '.error=="UNAUTHORIZED_WEBHOOK"' /tmp/unsigned.json >/dev/null 2>&1; then
      pass "direct unsigned n8n webhook blocked"
    else
      fail "direct unsigned n8n webhook not blocked as expected (HTTP ${unsigned_http})"
    fi
  else
    warn "n8n API secrets unavailable; execution cross-check skipped"
  fi
else
  fail "live n8n demo failed (HTTP ${demo_http})"
  cat /tmp/demo.json 2>/dev/null || true
fi

echo
echo "=== 8. SALES-READINESS SIGNALS (NON-BLOCKING) ==="
curl -LsS --max-time 20 "${BASE_URL}/" >/tmp/home || true
grep -qi 'Demo statt Kundenreferenz\|Demonstrator' /tmp/home && pass "claims distinguish demos from real references" || warn "demo/reference boundary not obvious"
grep -qi 'AGB' /tmp/home && pass "AGB linked from home" || warn "AGB not linked from home"
grep -qi 'AVV / DPA\|Auftragsverarbeitung' /tmp/home && pass "AVV/DPA surfaced" || warn "AVV/DPA not surfaced"
grep -qi 'SLA\|Service Level' /tmp/home && pass "SLA surfaced" || warn "SLA not surfaced"
grep -qi 'Kundenreferenz\|Case Study' /tmp/home && pass "customer proof surfaced" || warn "no real customer case study surfaced"

echo
echo "=== SUMMARY ==="
echo "FAILURES=${FAIL}"
echo "WARNINGS=${WARN}"
if [ "${FAIL}" -gt 0 ]; then
  echo "TECHNICAL_VERDICT=NO-GO"
  exit 1
fi
if [ "${WARN}" -gt 0 ]; then
  echo "TECHNICAL_VERDICT=GO_WITH_COMMERCIAL_FIXES"
else
  echo "TECHNICAL_VERDICT=GO"
fi
