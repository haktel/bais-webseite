#!/usr/bin/env bash
set -Eeuo pipefail

OPS="/opt/bais/ops"
REPO="$OPS/repo"
AGENT="$OPS/bais-autodeploy.sh"
USER_NAME="${SUDO_USER:-$USER}"

sudo mkdir -p "$OPS"
sudo chown -R "$USER_NAME:$USER_NAME" "$OPS"

if [ ! -d "$REPO/.git" ]; then
  git clone --filter=blob:none --no-checkout https://github.com/haktel/bais-webseite.git "$REPO"
fi

cat > "$AGENT" <<'AGENT'
#!/usr/bin/env bash
set -Eeuo pipefail
OPS="/opt/bais/ops"
REPO="$OPS/repo"
STATE="$OPS/last-deployed-sha"
LOCK="$OPS/deploy.lock"
exec 9>"$LOCK"
flock -n 9 || exit 0
cd "$REPO"
git fetch -q origin main
NEW="$(git rev-parse origin/main)"
OLD="$(cat "$STATE" 2>/dev/null || true)"
if [ "$NEW" = "$OLD" ]; then
  exit 0
fi
if [ -z "$OLD" ]; then
  CHANGED="dolibarr/custom/bais/"
else
  CHANGED="$(git diff --name-only "$OLD" "$NEW" || true)"
fi
if printf '%s\n' "$CHANGED" | grep -Eq '^(dolibarr/custom/bais/|scripts/server/deploy-bais-dolibarr-module\.sh$)'; then
  curl -fsSL https://raw.githubusercontent.com/haktel/bais-webseite/main/scripts/server/deploy-bais-dolibarr-module.sh | bash
fi
printf '%s\n' "$NEW" > "$STATE"
AGENT
chmod 750 "$AGENT"

SERVICE="/etc/systemd/system/bais-autodeploy.service"
TIMER="/etc/systemd/system/bais-autodeploy.timer"

sudo tee "$SERVICE" >/dev/null <<EOF
[Unit]
Description=BAIS safe Dolibarr module auto-deploy
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=$USER_NAME
ExecStart=$AGENT
EOF

sudo tee "$TIMER" >/dev/null <<'EOF'
[Unit]
Description=Check BAIS GitHub module updates every 2 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now bais-autodeploy.timer
sudo systemctl start bais-autodeploy.service

echo "===== BAIS AUTODEPLOY ====="
systemctl --no-pager --full status bais-autodeploy.timer | sed -n '1,12p'
echo "Safe scope: only dolibarr/custom/bais and its deploy script trigger deployment."
