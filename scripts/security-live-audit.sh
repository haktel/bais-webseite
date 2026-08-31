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
check_redirect "/angebot/" "/academy/konto/"
check_redirect "/abnahme/" "/academy/konto/"

code="$(status "${BASE}/api/admin/mfa" || true)"
[ "$code" = "401" ] && pass "admin MFA API blocks anonymous access" || fail "admin MFA API expected 401, got ${code}"

code="$(status -X POST -H 'Origin: https://bais-solutions.de' -H 'Content-Type: application/json' --data '{"name":"Synthetic","email":"synthetic@example.com","company":"Demo","budget":5000}' "${BASE}/api/n8n-module-01" || true)"
[ "$code" = "401" ] && pass "n8n Academy lab requires authenticated enrollment" || fail "n8n Academy lab expected 401, got ${code}"

code="$(status -X POST -H 'Origin: https://bais-solutions.de' -H 'Content-Type: application/json' --data '{"scenario":"interner Entwurf"}' "${BASE}/api/kif-module-06" || true)"
[ "$code" = "401" ] && pass "KI-Fuehrerschein lab requires authenticated enrollment" || fail "KIF lab expected 401, got ${code}"

code="$(status -H 'X-API-Key: bais-demo-key-read' "${BASE}/api/academy/auth-lab-resource" || true)"
[ "$code" = "401" ] && pass "auth lab demo credentials do not bypass Academy session" || fail "auth lab expected 401, got ${code}"

code="$(status "${BASE}/api/health" || true)"
[ "$code" = "200" ] && pass "public health endpoint remains available" || fail "health expected 200, got ${code}"

code="$(status "${BASE}/api/definitely-not-a-real-route" || true)"
if [ "$code" = "403" ] || [ "$code" = "404" ]; then pass "unknown API route fails closed"; else fail "unknown API route expected 403/404, got ${code}"; fi

echo "FAILURES=${failures}"
[ "$failures" -eq 0 ]
