# BAIS Security Runtime Setup

Stand: 31.08.2026

Diese Konfiguration ist zwingend für Administrator-MFA, sicheren First-Admin-Bootstrap und den Versand einmaliger Academy-Einladungen. Fehlende Secrets werden **nicht** durch Klartextwerte, schwächere Fallbacks oder andere bestehende Secrets ersetzt.

## 1. Erforderliche GitHub Actions Secrets

Im Repository unter **Settings → Secrets and variables → Actions** müssen vorhanden sein:

- `CLOUDFLARE_API_TOKEN` – Cloudflare API Token mit Zugriff auf das BAIS Pages-Projekt und Berechtigung zum Ändern der Pages-Projektkonfiguration.
- `RESEND_API_KEY` – Resend API Key für transaktionale Einladungsmails.
- `R2_ACCESS_KEY_ID` – S3 Access Key eines dedizierten R2-Tokens mit Object Read & Write auf `bais-project-documents`.
- `R2_SECRET_ACCESS_KEY` – zugehöriges R2 S3 Secret; niemals als normale Variable oder im Frontend ablegen.

Alternativ erkennt der Workflow für Cloudflare auch `CF_API_TOKEN` oder `CLOUDFLARE_TOKEN`; bevorzugt wird `CLOUDFLARE_API_TOKEN`.

Secret-Werte gehören niemals in Git, HTML, JavaScript, D1-Audit-Metadaten oder Workflow-Logs.

## 2. Automatisch erzeugte Cloudflare Runtime-Secrets

Der Workflow `.github/workflows/security-runtime-provision.yml` provisioniert bzw. erhält in **Production und Preview**:

- `MFA_ENCRYPTION_KEY` – dedizierter AES-GCM Root Key für verschlüsselte TOTP-Secrets.
- `ADMIN_BOOTSTRAP_SECRET` – separater Secret-Wert für den einmaligen First-Admin-Bootstrap.
- `RESEND_API_KEY` – transaktionaler Mail-Provider-Key.
- `PUBLIC_BASE_URL=https://bais-solutions.de`
- `TRANSACTIONAL_EMAIL_FROM=BAIS <info@bais-solutions.de>`

Bestehende `MFA_ENCRYPTION_KEY`- und `ADMIN_BOOTSTRAP_SECRET`-Werte werden nicht rotiert. Eine unbeabsichtigte Rotation des MFA-Keys würde bereits eingerichtete TOTP-Secrets unbrauchbar machen.

## 3. Workflow ausführen

Nach dem Setzen der GitHub-Secrets:

1. GitHub → **Actions**
2. **BAIS Security Runtime Provisioning** öffnen
3. **Run workflow** auf `main`
4. Der Lauf muss mit folgenden Statusmeldungen erfolgreich enden:

```text
CONFIG_STATUS=CLOUDFLARE_SECURITY_PROVISIONED
MFA_STATUS=DEDICATED_KEY_CONFIGURED
BOOTSTRAP_STATUS=SECRET_CONFIGURED
MAIL_STATUS=RESEND_CONFIGURED
```

Fehlt Cloudflare- oder Resend-Zugriff, endet der Workflow absichtlich mit Fehler. Das ist Fail-Closed-Verhalten.

## 4. Funktionsprüfung

Nach erfolgreicher Provisionierung:

- Admin anmelden.
- Im Konto **Administrator-MFA** öffnen.
- TOTP mit einer Authenticator-App einrichten.
- Recovery-Codes einmalig offline sichern.
- `/admin/` erneut öffnen; ohne frische MFA-Bestätigung darf der Zugriff nicht funktionieren.
- Eine Test-Academy-Anfrage freigeben. Der Einladungslink darf nur per transaktionaler E-Mail an die freigegebene Adresse zugestellt werden und darf weder in Admin-API-Antworten noch in Browser-Clipboard-Automation oder Logs erscheinen.

## 5. Sicherheitsregeln

- Kein Fallback von `MFA_ENCRYPTION_KEY` auf Turnstile-, n8n- oder andere Secrets.
- MFA-Step-up verfällt nach spätestens vier Stunden und muss erneut bestätigt werden.
- TOTP-Replay wird über den letzten akzeptierten Counter blockiert.
- Recovery-Codes werden nur gehasht gespeichert und sind einmal verwendbar.
- Academy-Invite-Tokens werden nur gehasht gespeichert, sind zeitlich begrenzt, request-/email-/kursgebunden und einmal verwendbar.
- Schlägt der Mailversand fehl, wird die Freigabe zurückgerollt und der Invite invalidiert.
- Unklassifizierte zukünftige `/api/*`-Routen werden durch den zentralen API-Firewall standardmäßig abgewiesen.


## 6. Project Portal – R2 Dokumentenspeicher

Der Workflow `.github/workflows/r2-runtime-provision.yml` richtet den privaten Project-Portal-Speicher ein:

- Bucket: `bais-project-documents`
- Bucket bleibt privat; es wird kein Public Bucket aktiviert.
- Production-CORS erlaubt nur `https://bais-solutions.de`.
- Browser-Uploads verwenden nur kurzlebige presigned PUT-URLs mit signiertem `Content-Type`.
- Upload-URLs gelten 180 Sekunden, Download-URLs 300 Sekunden.
- Temporäre Objekte unter `incoming/customer-documents/` werden per Lifecycle spätestens nach einem Tag bereinigt.
- Pages Runtime erhält nur `R2_ACCOUNT_ID`, `R2_BUCKET_NAME` sowie die zwei R2-S3-Credentials.
- Ein Upload wird erst nach serverseitigem HEAD-Check (MIME + tatsächliche Größe) und CopyObject in den finalen tenant-scoped Pfad als Dokument registriert.
- Finale Pfade folgen `customers/<organization_id>/projects/<project_id>/documents/<document_id>/...`.
- HTML, SVG, JavaScript, ausführbare Dateien und nicht passende MIME-/Dateiendungs-Kombinationen werden nicht freigegeben.
- Maximalgröße: 25 MiB pro Datei.

Die R2-S3-Credentials sollen ausschließlich auf diesen Bucket beschränkt sein. Der allgemeine Cloudflare API Token wird **nicht** in die Pages Runtime kopiert.

Nach erfolgreicher Provisionierung muss der Workflow ausgeben:

```text
R2_STATUS=PROJECT_PORTAL_STORAGE_PROVISIONED
R2_BUCKET=bais-project-documents
R2_CORS=PRODUCTION_ORIGIN_ONLY
R2_INCOMING_CLEANUP=86400_SECONDS
```
