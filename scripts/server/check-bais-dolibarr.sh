#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/bais/dolibarr"
cd "$BASE"

echo "===== BAIS DOLIBARR READINESS ====="

for i in $(seq 1 60); do
  code="$(curl -sS -o /tmp/bais-dolibarr-check.html -w '%{http_code}' --max-time 5 http://127.0.0.1:8085/ 2>/dev/null || true)"
  if [[ "$code" =~ ^(200|301|302|303|307|308)$ ]]; then
    echo "READY: HTTP $code"
    break
  fi
  if (( i == 60 )); then
    echo "NOT READY after 5 minutes"
    echo
    docker compose ps
    echo
    docker compose logs --tail=120 dolibarr
    exit 1
  fi
  printf 'Warte auf Dolibarr... %d/60 (HTTP %s)\r' "$i" "${code:-000}"
  sleep 5
done

echo
echo "===== CONTAINERS ====="
docker compose ps

echo
echo "===== MEMORY ====="
free -h

echo
echo "===== TEMPERATURE ====="
for z in /sys/class/thermal/thermal_zone*; do
  t="$(cat "$z/type" 2>/dev/null || true)"
  v="$(cat "$z/temp" 2>/dev/null || true)"
  if [[ -n "$v" ]]; then
    awk -v t="$t" -v v="$v" 'BEGIN{printf "%-24s %.1f °C\n",t,v/1000}'
  fi
done

echo
echo "===== LOCAL ENDPOINT ====="
echo "http://127.0.0.1:8085"

echo
echo "===== READY FOR CLOUDFLARE TUNNEL ====="
