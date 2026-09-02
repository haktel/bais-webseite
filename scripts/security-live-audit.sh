#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE_URL:-https://bais-solutions.de}"
failures=0
pass(){ echo "PASS $*"; }
fail(){ echo "FAIL $*"; failures=$((failures+1)); }
status(){ curl -sS --max-time 20 -o /tmp/body -D /tmp/headers -w '%{http_code}' "$@"; }

check_redirect(){
 local path="$1" expected="$2" code
 code="$(status "${BASE}${path}" || true)"
 if [ "$code" = "302" ] && grep -qi "location:.*${expected}" /tmp/headers; then pass "${path} anonymous redirect protected"; else fail "${path} expected protected redirect, got HTTP ${code}"; fi
}

check_redirect "/admin/" "/academy/konto/"
check_redirect "/admin/runbook/" "/academy/konto/"
check_redirect "/admin/rechnung/" "/academy/konto/"
check_redirect "/angebot/" "/academy/konto/"
check_redirect "/abnahme/" "/academy/konto/"
check_redirect "/project-portal/kunde/" "/academy/konto/"
check_redirect "/kundenbereich/betrieb/" "/academy/konto/"

code="$(status "${BASE}/api/admin/mfa" || true)"
[ "$code" = "401" ] && pass "admin MFA API blocks anonymous access" || fail "admin MFA API expected 401, got ${code}"

code="$(status -X POST -H 'Origin: https://bais-solutions.de' -H 'Content-Type: application/json' --data '{"displayName":"Probe","company":"Probe GmbH","email":"probe@example.invalid","password":"not-a-real-password-123"}' "${BASE}/api/customer/auth/register" || true)"
if [ "$code" = "400" ] && grep -qi '^x-bais-customer-register: identity-v5-email-verification' /tmp/headers; then pass "customer registration identity v5 email verification is live and Turnstile protected"; else fail "customer registration v5 expected 400 + build marker, got HTTP ${code}"; fi

code="$(status "${BASE}/api/customer/portal" || true)"
[ "$code" = "401" ] && pass "customer portal API blocks anonymous access" || fail "customer portal API expected 401, got ${code}"

for route in /api/customer/documents/upload-url /api/customer/documents/upload /api/customer/documents/finalize /api/customer/documents/download /api/customer/documents/file; do
  code="$(status "${BASE}${route}" || true)"
  [ "$code" = "401" ] && pass "${route} blocks anonymous access" || fail "${route} expected 401, got ${code}"
done

code="$(status "${BASE}/api/admin/customer-access" || true)"
[ "$code" = "401" ] && pass "customer access admin API blocks anonymous access" || fail "customer access admin API expected 401, got ${code}"

code="$(status "${BASE}/api/commercial/context" || true)"
[ "$code" = "401" ] && pass "commercial customer context blocks anonymous access" || fail "commercial context expected 401, got ${code}"

code="$(status "${BASE}/api/commercial/sow?projectId=security-probe" || true)"
[ "$code" = "401" ] && pass "SOW API blocks anonymous access" || fail "SOW API expected 401, got ${code}"

code="$(status "${BASE}/api/admin/project-integrations" || true)"
[ "$code" = "401" ] && pass "project integration control plane blocks anonymous access" || fail "project integrations expected 401, got ${code}"

code="$(status -X POST -H 'Origin: https://bais-solutions.de' -H 'Content-Type: application/json' --data '{"name":"Synthetic","email":"synthetic@example.com","company":"Demo","budget":5000}' "${BASE}/api/n8n-module-01" || true)"
[ "$code" = "401" ] && pass "n8n Academy lab requires authenticated enrollment" || fail "n8n Academy lab expected 401, got ${code}"

code="$(status -X POST -H 'Origin: https://bais-solutions.de' -H 'Content-Type: application/json' --data '{"scenario":"interner Entwurf"}' "${BASE}/api/kif-module-06" || true)"
[ "$code" = "401" ] && pass "KI-Fuehrerschein lab requires authenticated enrollment" || fail "KIF lab expected 401, got ${code}"

code="$(status -H 'X-API-Key: bais-demo-key-read' "${BASE}/api/academy/auth-lab-resource" || true)"
[ "$code" = "401" ] && pass "auth lab demo credentials do not bypass Academy session" || fail "auth lab expected 401, got ${code}"

code="$(status "${BASE}/api/health" || true)"
if [ "$code" = "200" ]; then
  pass "public health endpoint remains available"
  grep -Eq '"ok"[[:space:]]*:[[:space:]]*true' /tmp/body && pass "production database health is ok" || fail "health endpoint does not report database ok"
  grep -Eq '"database"[[:space:]]*:[[:space:]]*"ok"' /tmp/body && pass "production D1 binding is reachable" || fail "production D1 binding is not reachable"
  grep -Eq '"documentStorage"[[:space:]]*:[[:space:]]*"ok"' /tmp/body && pass "production R2 document binding is reachable" || fail "production R2 document binding is not reachable"
  grep -Eq '"service"[[:space:]]*:[[:space:]]*"bais-platform-api"' /tmp/body && pass "health response identifies BAIS platform" || fail "health response service marker is missing"
  grep -qi '^cache-control:.*no-store' /tmp/headers && pass "health response is not cached" || fail "health response must use Cache-Control no-store"
  if grep -Eqi '(api[_-]?key|secret|password|token|authorization|bucket|account[_-]?id)' /tmp/body; then fail "health response may expose sensitive configuration"; else pass "health response exposes no sensitive configuration"; fi
else
  fail "health expected 200, got ${code}"
fi

code="$(status "${BASE}/api/definitely-not-a-real-route" || true)"
if [ "$code" = "403" ] || [ "$code" = "404" ]; then pass "unknown API route fails closed"; else fail "unknown API route expected 403/404, got ${code}"; fi

echo "FAILURES=${failures}"
[ "$failures" -eq 0 ]
