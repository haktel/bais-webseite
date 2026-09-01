#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/bais/dolibarr"
TARGET="$BASE/custom/bais"
TMP="$(mktemp -d)"
BACKUP=""
trap 'rm -rf "$TMP"' EXIT

cd "$BASE"

echo "===== BAIS MODULE DEPLOY ====="

test -f docker-compose.yml || { echo "FEHLER: $BASE/docker-compose.yml fehlt" >&2; exit 1; }
docker inspect bais-dolibarr >/dev/null 2>&1 || { echo "FEHLER: bais-dolibarr Container fehlt" >&2; exit 1; }

curl -fsSL https://github.com/haktel/bais-webseite/archive/refs/heads/main.tar.gz -o "$TMP/repo.tar.gz"
tar -xzf "$TMP/repo.tar.gz" -C "$TMP"
SOURCE="$TMP/bais-webseite-main/dolibarr/custom/bais"
test -f "$SOURCE/core/modules/modBAIS.class.php" || { echo "FEHLER: BAIS Modul im Repository nicht gefunden" >&2; exit 1; }

if [ -d "$TARGET" ]; then
  BACKUP="$BASE/backups/bais-module-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BASE/backups"
  cp -a "$TARGET" "$BACKUP"
  echo "Backup: $BACKUP"
fi

rm -rf "$TARGET.new"
cp -a "$SOURCE" "$TARGET.new"
rm -rf "$TARGET"
mv "$TARGET.new" "$TARGET"

if ! docker exec bais-dolibarr sh -lc 'find /var/www/html/custom/bais -type f -name "*.php" -print0 | xargs -0 -n1 php -l'; then
  echo "FEHLER: PHP-Lint fehlgeschlagen. Restore wird ausgeführt." >&2
  rm -rf "$TARGET"
  if [ -n "$BACKUP" ] && [ -d "$BACKUP" ]; then
    cp -a "$BACKUP" "$TARGET"
  fi
  exit 1
fi

cat > "$BASE/custom/.bais-activate.php" <<'PHP'
<?php
require_once dirname(__DIR__).'/master.inc.php';
require_once DOL_DOCUMENT_ROOT.'/core/lib/admin.lib.php';
foreach (array('modApi', 'modBAIS') as $module) {
    try {
        activateModule($module);
        echo $module.": activated\n";
    } catch (Throwable $e) {
        fwrite(STDERR, $module.": activation failed: ".$e->getMessage()."\n");
        exit(1);
    }
}
PHP

if ! docker exec bais-dolibarr php /var/www/html/custom/.bais-activate.php; then
  rm -f "$BASE/custom/.bais-activate.php"
  echo "FEHLER: Modulaktivierung fehlgeschlagen" >&2
  exit 1
fi
rm -f "$BASE/custom/.bais-activate.php"

echo
printf 'HTTP check: '
curl -sS -o /dev/null -w '%{http_code}\n' --max-time 10 http://127.0.0.1:8085/

echo "BAIS module deployed and activated."
echo "Dolibarr: https://erp.bais-solutions.de"
