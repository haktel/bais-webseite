#!/usr/bin/env bash
set -Eeuo pipefail

KEY_FILE="/opt/bais/secrets/dolibarr-bais-api.key"
URL="https://erp.bais-solutions.de/api/index.php/thirdparties?sortfield=t.rowid&sortorder=ASC&limit=1"

test -r "$KEY_FILE" || { echo "FEHLER: Dolibarr API-Key nicht lesbar: $KEY_FILE" >&2; exit 1; }
DOLAPIKEY="$(cat "$KEY_FILE")"

echo "===== BAIS CLOUDFLARE ACCESS DIREKTTEST ====="
echo "Die Werte werden NICHT gespeichert und NICHT ausgegeben."
read -r -p "Cloudflare Client ID einfügen: " CF_ID </dev/tty
read -r -s -p "Cloudflare Client Secret einfügen: " CF_SECRET </dev/tty
echo

CF_ID="${CF_ID#CF-Access-Client-Id:}"
CF_ID="${CF_ID#CF-Access-Client-ID:}"
CF_SECRET="${CF_SECRET#CF-Access-Client-Secret:}"
CF_ID="$(printf '%s' "$CF_ID" | xargs)"
CF_SECRET="$(printf '%s' "$CF_SECRET" | xargs)"

HDR="$(mktemp)"
BODY="$(mktemp)"
trap 'rm -f "$HDR" "$BODY"' EXIT

HTTP="$(curl -sS --max-time 20 -D "$HDR" -o "$BODY" -w '%{http_code}' \
  -H "CF-Access-Client-Id: $CF_ID" \
  -H "CF-Access-Client-Secret: $CF_SECRET" \
  -H "DOLAPIKEY: $DOLAPIKEY" \
  "$URL" || true)"

LOCATION="$(awk 'BEGIN{IGNORECASE=1}/^location:/{sub(/^[^:]*:[[:space:]]*/,"");gsub(/\r/,"");print;exit}' "$HDR")"
CTYPE="$(awk 'BEGIN{IGNORECASE=1}/^content-type:/{sub(/^[^:]*:[[:space:]]*/,"");gsub(/\r/,"");print;exit}' "$HDR")"

echo
echo "HTTP         : $HTTP"
echo "Content-Type : ${CTYPE:-unbekannt}"
if [ -n "$LOCATION" ]; then
  if printf '%s' "$LOCATION" | grep -q 'cloudflareaccess.com/cdn-cgi/access/login'; then
    echo "Access       : FEHLER - Cloudflare Login Redirect"
  else
    echo "Location     : $LOCATION"
  fi
else
  echo "Access       : Kein Cloudflare Login Redirect"
fi

if [ "$HTTP" = "404" ] && grep -q 'No third parties found' "$BODY"; then
  echo "ERGEBNIS     : PASS - Service Token + Dolibarr API funktionieren."
elif [ "$HTTP" = "200" ] && grep -qi 'application/json' <<<"$CTYPE"; then
  echo "ERGEBNIS     : PASS - Service Token + Dolibarr API funktionieren."
elif [ "$HTTP" = "302" ] && printf '%s' "$LOCATION" | grep -q 'cloudflareaccess.com'; then
  echo "ERGEBNIS     : FAIL - Service Token wird von Cloudflare Access abgelehnt."
else
  echo "ERGEBNIS     : PRÜFEN - Antwort ist nicht eindeutig."
  sed -n '1,5p' "$BODY" | sed 's/[[:cntrl:]]//g'
fi
