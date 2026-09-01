# BAIS Security Runtime Setup

Stand: 31.08.2026

Diese Konfiguration ist zwingend für Administrator-MFA, sicheren First-Admin-Bootstrap und den Versand einmaliger Academy-Einladungen. Fehlende Secrets werden **nicht** durch Klartextwerte, schwächere Fallbacks oder andere bestehende Secrets ersetzt.

## 1. Erforderliche GitHub Actions Secrets

Im Repository unter **Settings → Secrets and variables → Actions** müssen vorhanden sein:

- `CLOUDFLARE_API_TOKEN` – Cloudflare API Token mit Zugriff auf das BAIS Pages-Projekt und Berechtigung zum Ändern der Pages-Projektkonfiguration.
- `RESEND_API_KEY` – Resend API Key für transaktionale Einladungsmails.
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` – **optional**. Nur für den zusätzlichen aws4fetch/S3-Direct-Modus; der normale Project-Portal-Betrieb verwendet das native `PROJECT_DOCUMENTS` R2-Binding ohne S3-Schlüssel im Runtime-Code.

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

Der produktive Standardpfad verwendet das native Cloudflare-R2-Binding `PROJECT_DOCUMENTS`, das in `wrangler.jsonc` deklariert ist. Für diesen Laufzeitpfad werden keine R2-S3-Schlüssel an Browser oder Pages Function übergeben.

- Maximalgröße: 25 MiB pro Datei.
- Erlaubte Dateitypen werden über MIME-Typ **und** Dateiendung geprüft.
- Uploads laufen authentifiziert und projekt-/mandantenbezogen.
- Vor der Registrierung wird die tatsächliche R2-Größe und der gespeicherte MIME-Typ geprüft.
- Der Übergang `pending → finalizing → ready` verhindert parallele Finalisierung.
- Die finale Ablage folgt `customers/<organization_id>/projects/<project_id>/documents/<document_id>/...`.
- Downloads werden erneut gegen Kunde, Organisation, Projekt und `project_portal`-Freigabe geprüft und mit `private, no-store` ausgeliefert.
- `aws4fetch` bleibt als optionaler S3-Direct-Modus erhalten. Dieser Modus benötigt `R2_ACCESS_KEY_ID` und `R2_SECRET_ACCESS_KEY`; das manuelle Workflow `.github/workflows/r2-runtime-provision.yml` konfiguriert ihn nur, wenn die Secrets vorhanden sind.
- Fehlen diese optionalen Secrets, ist das **kein Production-Fehler**; das native Binding bleibt der Standardpfad.

Secret-Werte gehören niemals in Git, HTML, Browser-JavaScript, D1-Audit-Metadaten oder Logs.


## 7. SOW → Dolibarr → Jira Projektintegration

BAIS D1 ist die fachliche Quelle für Kunden-Nr., Projekt-Nr. und die im SOW beauftragten Basismodule.

**Verbindliche Modul-IDs**

- `MOD-01 – Website-Entwicklung`
- `MOD-02 – Project Portal`
- `MOD-03 – Wartung/Hosting-Setup`
- `MOD-04 – Content-Pflege`

Externe Systeme werden erst synchronisiert, wenn der SOW den Status **Unterschrieben** trägt. Ein unterschriebener SOW ist danach unveränderlich; Scope-Änderungen müssen über einen separaten Change-Request-Prozess erfolgen.

### Dolibarr

Der BAIS Service-User benötigt zusätzlich das Custom-Recht `bais.project.write` (Recht-ID `50032103`). Die BAIS Dolibarr API legt das Projekt idempotent mit derselben sichtbaren BAIS Projekt-Nr. `PR-YYYY-NNNNNN` an bzw. aktualisiert es. Die Kundenverknüpfung erfolgt über die BAIS Kunden-Nr. in `societe.ref_ext`.

Nach Deployment von BAIS Modul 0.3.0 muss `scripts/server/provision-bais-dolibarr-api-user.sh` erneut ausgeführt werden, damit der bestehende Service-User das neue Least-Privilege-Recht erhält.

### Jira Cloud

Für Jira Project-Sync werden serverseitig benötigt:

- `JIRA_BASE_URL` – z. B. `https://<tenant>.atlassian.net`
- `JIRA_EMAIL` – dedizierter Jira-Service-Account
- `JIRA_API_TOKEN` – API-Token dieses Service-Accounts
- `JIRA_PROJECT_KEY` – Zielprojekt, z. B. `BAIS`
- `JIRA_PROJECT_ISSUE_TYPE` – optional, Standard `Epic`
- `JIRA_MODULE_ISSUE_TYPE` – optional, Standard `Task`

Der Parent-Work-Item trägt die BAIS Projekt-Nr. im Summary. Jedes beauftragte Basismodul wird genau einmal als Child-Work-Item verknüpft. Remote IDs/Keys werden in D1 gespeichert, damit Retries keine Duplikate erzeugen.

Fehlen Jira-Credentials, bleibt der Jira-Job **pending**; der unterschriebene SOW und der Dolibarr-Sync werden dadurch nicht zurückgerollt. Secrets dürfen nicht in Browser-JavaScript, SOW-JSON, Audit-Metadaten oder Logs geschrieben werden.
