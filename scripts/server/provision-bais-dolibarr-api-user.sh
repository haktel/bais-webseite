#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/bais/dolibarr"
SECRETS="/opt/bais/secrets"
KEY_FILE="$SECRETS/dolibarr-bais-api.key"
TMP_PHP="$BASE/custom/.bais-provision-api-user.php"

cd "$BASE"
test -f docker-compose.yml || { echo "FEHLER: $BASE/docker-compose.yml fehlt." >&2; exit 1; }
docker inspect bais-dolibarr >/dev/null 2>&1 || { echo "FEHLER: bais-dolibarr Container fehlt." >&2; exit 1; }

mkdir -p "$SECRETS"
chmod 700 "$SECRETS"

cat > "$TMP_PHP" <<'PHP'
<?php
require_once dirname(__DIR__).'/master.inc.php';
require_once DOL_DOCUMENT_ROOT.'/user/class/user.class.php';

global $db, $conf;

$sql = "SELECT rowid FROM ".$db->prefix()."user WHERE admin=1 AND statut=1 AND entity IN (0,".((int) $conf->entity).") ORDER BY rowid ASC LIMIT 1";
$resql = $db->query($sql);
if (!$resql) {
    fwrite(STDERR, "Unable to find active administrator\n");
    exit(2);
}
$row = $db->fetch_object($resql);
if (!$row) {
    fwrite(STDERR, "No active administrator found\n");
    exit(3);
}

$actor = new User($db);
if ($actor->fetch((int) $row->rowid) <= 0) {
    fwrite(STDERR, "Unable to load administrator\n");
    exit(4);
}
$actor->loadRights();

$login = 'bais-api';
$service = new User($db);
$found = $service->fetch(0, $login);

$db->begin();

if ($found <= 0) {
    $service = new User($db);
    $service->login = $login;
    $service->lastname = 'BAIS API';
    $service->firstname = 'Service';
    $service->employee = 0;
    $service->admin = 0;
    $service->status = 1;
    $service->entity = (int) $conf->entity;
    $service->api_key = bin2hex(random_bytes(32));
    $newid = $service->create($actor, 1);
    if ($newid <= 0) {
        $db->rollback();
        fwrite(STDERR, "Unable to create BAIS API user: ".$service->error."\n");
        exit(5);
    }
    $service->id = $newid;
    if ($service->setStatut(1) < 0) {
        $db->rollback();
        fwrite(STDERR, "Unable to activate BAIS API user\n");
        exit(6);
    }
} else {
    $service->admin = 0;
    if (empty($service->api_key)) {
        $service->api_key = bin2hex(random_bytes(32));
        $sql = "UPDATE ".$db->prefix()."user SET api_key='".$db->escape($service->api_key)."', admin=0, statut=1 WHERE rowid=".((int) $service->id);
        if (!$db->query($sql)) {
            $db->rollback();
            fwrite(STDERR, "Unable to update BAIS API key\n");
            exit(7);
        }
    } else {
        $sql = "UPDATE ".$db->prefix()."user SET admin=0, statut=1 WHERE rowid=".((int) $service->id);
        if (!$db->query($sql)) {
            $db->rollback();
            fwrite(STDERR, "Unable to enforce BAIS API account state\n");
            exit(8);
        }
    }
}

/*
 * Least privilege for phase 1:
 * 121 = read third parties
 * 122 = create/update third parties
 * 262 = read all third parties for internal users
 * No delete/export/accounting/project/invoice permission is granted.
 */
foreach (array(121, 122, 262) as $rightId) {
    $result = $service->addrights($rightId, '', '', (int) $conf->entity, 1);
    if ($result < 0) {
        $db->rollback();
        fwrite(STDERR, "Unable to grant right ".$rightId."\n");
        exit(9);
    }
}

$verify = new User($db);
if ($verify->fetch((int) $service->id) <= 0 || empty($verify->api_key)) {
    $db->rollback();
    fwrite(STDERR, "Unable to verify BAIS API user\n");
    exit(10);
}

$db->commit();
echo $verify->api_key;
PHP

chmod 600 "$TMP_PHP"

API_KEY="$(docker exec bais-dolibarr php /var/www/html/custom/.bais-provision-api-user.php)"
rm -f "$TMP_PHP"

if [ -z "$API_KEY" ] || [ "${#API_KEY}" -lt 32 ]; then
  echo "FEHLER: API-Key konnte nicht erzeugt werden." >&2
  exit 1
fi

printf '%s' "$API_KEY" > "$KEY_FILE"
chmod 600 "$KEY_FILE"

HTTP_CODE="$(curl -sS -o /tmp/bais-api-test.json -w '%{http_code}' --max-time 15   -H "DOLAPIKEY: $API_KEY"   "http://127.0.0.1:8085/api/index.php/thirdparties?sortfield=t.rowid&sortorder=ASC&limit=1" || true)"

if [ "$HTTP_CODE" = "200" ]; then
  API_TEST_RESULT="HTTP 200"
elif [ "$HTTP_CODE" = "404" ] && grep -q 'No third parties found' /tmp/bais-api-test.json; then
  # Dolibarr returns 404 for an authenticated third-party list request when the table is empty.
  # This still proves that the API key is valid and the service user can reach the endpoint.
  API_TEST_RESULT="HTTP 404 (API authentifiziert, noch keine Dritten vorhanden)"
else
  echo "FEHLER: Dolibarr API-Test ergab HTTP $HTTP_CODE" >&2
  sed -n '1,8p' /tmp/bais-api-test.json >&2 || true
  exit 1
fi

rm -f /tmp/bais-api-test.json

echo "===== BAIS DOLIBARR API ====="
echo "Service user : bais-api"
echo "Admin        : NEIN"
echo "Rechte       : Dritte lesen + erstellen/aktualisieren"
echo "Löschen      : NEIN"
echo "API-Test     : $API_TEST_RESULT"
echo "API-Key      : sicher gespeichert, nicht ausgegeben"
echo "Datei        : $KEY_FILE"
echo
echo "Zum einmaligen Kopieren in BAIS Control Center:"
echo "  sudo cat $KEY_FILE"
echo
echo "WICHTIG: Den API-Key nicht in Chat, GitHub oder Screenshots veröffentlichen."
