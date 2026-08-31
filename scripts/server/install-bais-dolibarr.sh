#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/bais/dolibarr"
COMPOSE_FILE="$BASE/docker-compose.yml"
ENV_FILE="$BASE/.env"

log(){ printf '\n[BAIS] %s\n' "$*"; }
die(){ printf '\n[BAIS][FEHLER] %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "Docker ist nicht installiert."
docker compose version >/dev/null 2>&1 || die "Docker Compose ist nicht verfügbar."
command -v openssl >/dev/null 2>&1 || die "openssl fehlt."

if ss -ltn | grep -q ':8085 '; then
  die "Port 8085 ist bereits belegt."
fi

log "Erstelle BAIS Dolibarr-Verzeichnisstruktur"
sudo mkdir -p "$BASE"/{db,documents,custom,backups}
sudo chown -R "$USER:$USER" /opt/bais
cd "$BASE"

if [[ -e "$ENV_FILE" || -e "$COMPOSE_FILE" ]]; then
  die "Bestehende .env/docker-compose.yml gefunden. Abbruch, damit nichts überschrieben wird."
fi

HOST_UID="$(id -u)"
HOST_GID="$(id -g)"
DB_PASSWORD="$(openssl rand -hex 24)"
DB_ROOT_PASSWORD="$(openssl rand -hex 32)"
DOLI_ADMIN_PASSWORD="$(openssl rand -base64 24 | tr -d '\n' | tr '/+' '_-')"
DOLI_INSTANCE_UNIQUE_ID="$(openssl rand -hex 32)"

umask 077
cat > "$ENV_FILE" <<EOF
COMPOSE_PROJECT_NAME=bais-dolibarr
HOST_UID=$HOST_UID
HOST_GID=$HOST_GID

DOLIBARR_IMAGE=dolibarr/dolibarr:24.0.0
MARIADB_IMAGE=mariadb:11.4

DB_NAME=dolidb
DB_USER=doliuser
DB_PASSWORD=$DB_PASSWORD
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD

DOLI_ADMIN_LOGIN=admin
DOLI_ADMIN_PASSWORD=$DOLI_ADMIN_PASSWORD
DOLI_INSTANCE_UNIQUE_ID=$DOLI_INSTANCE_UNIQUE_ID
DOLI_URL_ROOT=http://127.0.0.1:8085
EOF
chmod 600 "$ENV_FILE"

cat > "$COMPOSE_FILE" <<'YAML'
services:
  mariadb:
    image: ${MARIADB_IMAGE}
    container_name: bais-dolibarr-db
    restart: unless-stopped
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --innodb-buffer-pool-size=256M
      - --max-connections=50
    environment:
      MARIADB_DATABASE: ${DB_NAME}
      MARIADB_USER: ${DB_USER}
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - ./db:/var/lib/mysql
    networks:
      - backend
    mem_limit: 600m
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 20s

  dolibarr:
    image: ${DOLIBARR_IMAGE}
    container_name: bais-dolibarr
    restart: unless-stopped
    depends_on:
      mariadb:
        condition: service_healthy
    ports:
      - "127.0.0.1:8085:80"
    environment:
      DOLI_INSTALL_AUTO: "1"
      DOLI_INIT_DEMO: "0"
      DOLI_PROD: "1"
      DOLI_DB_HOST: mariadb
      DOLI_DB_NAME: ${DB_NAME}
      DOLI_DB_USER: ${DB_USER}
      DOLI_DB_PASSWORD: ${DB_PASSWORD}
      DOLI_URL_ROOT: ${DOLI_URL_ROOT}
      DOLI_ADMIN_LOGIN: ${DOLI_ADMIN_LOGIN}
      DOLI_ADMIN_PASSWORD: ${DOLI_ADMIN_PASSWORD}
      DOLI_INSTANCE_UNIQUE_ID: ${DOLI_INSTANCE_UNIQUE_ID}
      DOLI_COMPANY_NAME: "BAIS - Bünyamin Atik - IT Solutions"
      DOLI_CRON: "0"
      WWW_USER_ID: ${HOST_UID}
      WWW_GROUP_ID: ${HOST_GID}
      PHP_INI_DATE_TIMEZONE: Europe/Berlin
      PHP_INI_MEMORY_LIMIT: 256M
      PHP_INI_UPLOAD_MAX_FILESIZE: 16M
      PHP_INI_POST_MAX_SIZE: 20M
    volumes:
      - ./documents:/var/www/documents
      - ./custom:/var/www/html/custom
    networks:
      - backend
    mem_limit: 850m

networks:
  backend:
    driver: bridge
YAML
chmod 600 "$COMPOSE_FILE"

log "Docker Compose-Konfiguration wird validiert"
docker compose config >/dev/null

log "Dolibarr 24.0.0 + MariaDB 11.4 werden geladen"
docker compose pull

log "Stack wird gestartet"
docker compose up -d

log "Warte auf Container-Start"
sleep 12

printf '\n===== BAIS DOLIBARR STATUS =====\n'
docker compose ps

printf '\n===== LOCAL HTTP CHECK =====\n'
if curl -fsS --max-time 10 -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:8085/; then
  :
else
  echo "HTTP noch nicht bereit. Container-Logs:"
  docker compose logs --tail=80 dolibarr || true
fi

printf '\n===== ZUGANG =====\n'
echo "URL lokal auf dem Server: http://127.0.0.1:8085"
echo "Admin-Login: admin"
echo "Das Admin-Passwort wird NICHT ausgegeben."
echo "Privat auf dem Server anzeigen mit:"
echo "  cd $BASE && grep '^DOLI_ADMIN_PASSWORD=' .env"
echo
echo "WICHTIG: Passwort/komplette .env nicht in Chat oder Screenshots teilen."
echo
echo "Vorhandene Dienste (Apache, Pi-hole, Portainer usw.) wurden nicht geändert."
echo "Dolibarr ist nur an 127.0.0.1:8085 gebunden; MariaDB hat keinen Host-Port."
echo "Nächster Schritt: Cloudflare Tunnel + erp.bais-solutions.de."
