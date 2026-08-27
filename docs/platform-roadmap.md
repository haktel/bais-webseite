# BAIS Platform – Backend Roadmap

## Status
Die statische Website bleibt unverändert. Dieses Fundament fügt noch keine öffentliche Login-, Admin- oder Zahlungsoberfläche hinzu.

## Architektur
- Cloudflare Pages: bestehendes Frontend
- Pages Functions: API unter `/api/*`
- D1 (`DB`): relationale Geschäfts- und Academy-Daten
- Turnstile (`TURNSTILE_SECRET`): Schutz öffentlicher Schreiboperationen
- R2 (Folgestufe): Dokumente, Lernmaterial und PDF-Nachweise
- Stripe (Folgestufe): Checkout, Rechnungsstatus und Webhooks
- Cloudflare Access / OIDC (Folgestufe): Adminzugang; Kunden- und Schülerauthentifizierung wird separat umgesetzt

## Aktivierungsreihenfolge
1. D1 `bais-platform` erstellen und als `DB` an das Pages-Projekt binden.
2. Migration `0001_platform_foundation.sql` remote anwenden.
3. Turnstile-Widget erstellen und `TURNSTILE_SECRET` als Secret setzen.
4. Health-Endpunkt prüfen.
5. Kontaktformular und Academy-Anmeldung in separatem PR an die API anschließen.
6. Authentifizierung und Autorisierung vor Admin-, Schüler- und Kundenrouten aktivieren.
7. R2 und Stripe erst nach Auth- und Audit-Grundlage anbinden.

## Öffentliche API
- `GET /api/health`
- `POST /api/contact`
- `POST /api/academy/enrollments`
- `GET /api/certificates/:code`

## Sicherheitsgrenzen
- Keine Admin-, Schüler- oder Projekt-Lese-API ohne Authentifizierung.
- Keine Passwörter in D1; Identity Provider / passwortlose Anmeldung verwenden.
- Keine Zahlungsdaten speichern; Stripe hostet Zahlungsabwicklung.
- Dokumente nicht öffentlich aus R2 ausliefern; kurzlebige autorisierte Downloads verwenden.
- TURNSTILE_SECRET und künftige Stripe-Secrets nie in Git speichern.
