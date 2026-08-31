# BAIS – Kunden-Onboarding Vorlage

> Wiederverwendbare B2B-Onboarding-Vorlage für den Übergang **Angebot / SOW → Projektstart → spätere Abnahme**.  
> Unbekannte kunden-, projekt-, termin-, zugangs- oder toolbezogene Angaben bleiben als `[PLACEHOLDER]` stehen und dürfen nicht automatisch erfunden werden.

---

# Verbindliche Dokumentfamilie / Modulnomenklatur

Diese vier Modulnamen werden in **Angebot / SOW, Kunden-Onboarding und Abnahmeprotokoll identisch** verwendet:

| Modul-ID | Verbindlicher Modulname | Im SOW beauftragt | Im Onboarding relevant | Spätere Abnahme |
|---|---|:---:|:---:|:---:|
| MOD-01 | **Website-Entwicklung** | [ ] | [ ] | [ ] |
| MOD-02 | **Project Portal** | [ ] | [ ] | [ ] |
| MOD-03 | **Wartung/Hosting-Setup** | [ ] | [ ] | [ ] |
| MOD-04 | **Content-Pflege** | [ ] | [ ] | [ ] |

> **Regel:** Nicht beauftragte Module werden im Onboarding nicht künstlich aktiviert.  
> Zusatzleistungen außerhalb dieser vier Basismodule werden nur aufgenommen, wenn sie im SOW ausdrücklich als Zusatzleistung vereinbart wurden.

---

# Stammdaten / Projektkontext

**Kunden-Nr.:** [KUNDEN_NUMMER]  
**Projekt-Nr.:** [PROJEKT_NUMMER]  
**Angebots-/SOW-Nr.:** [ANGEBOTSNUMMER]  
**Projekt:** [PROJEKT_NAME]  
**Auftraggeber:** [KUNDENFIRMA]  
**Auftragnehmer:** [ANBIETER_FIRMA]  
**Geplanter Projektstart:** [PROJEKTSTART]  
**Onboarding-Owner Auftragnehmer:** [ONBOARDING_OWNER]

> **Systemhinweis:** Kunden-Nr., Projekt-Nr. und bekannte Stammdaten sollen in einem digitalen BAIS-Prozess aus dem angemeldeten Kunden-/Projektkontext übernommen werden. Sie werden nicht geraten oder manuell neu erfunden.

---

# 1. Onboarding Übersicht

| Schritt | Aktivität | Verantwortlich | Frist / Timing | Status |
|---|---|---|---|:---:|
| 1 | SOW / Auftragseingang prüfen | Auftragnehmer | unmittelbar nach Auftragseingang | [ ] |
| 2 | Kundenkonto / Kunden-Nr. prüfen | Auftragnehmer | [TIMING_KUNDENKONTO] | [ ] |
| 3 | Willkommens-E-Mail senden | Auftragnehmer | [TIMING_WELCOME_MAIL] | [ ] |
| 4 | Kickoff-Termin abstimmen | beide | [TIMING_KICKOFF_PLANUNG] | [ ] |
| 5 | Modulare Informations-/Zugangs-Checkliste bereitstellen | Auftragnehmer | vor Kickoff | [ ] |
| 6 | Kundeninformationen / Zugänge vollständig einholen | Auftraggeber | [FRIST_KUNDENINPUT] | [ ] |
| 7 | Kickoff-Call durchführen | beide | [KICKOFF_DATUM] | [ ] |
| 8 | Kommunikationskanäle / Ansprechpartner bestätigen | beide | im Kickoff | [ ] |
| 9 | Projektzeitplan / Meilensteine bestätigen | beide | nach Kickoff | [ ] |
| 10 | Interne Projektumgebung vorbereiten | Auftragnehmer | vor Delivery-Start | [ ] |
| 11 | Startvoraussetzungen prüfen | Auftragnehmer | [STARTCHECK_DATUM] | [ ] |
| 12 | Onboarding abschließen / Projekt freigeben | Auftragnehmer | [ONBOARDING_ABSCHLUSS] | [ ] |

## Onboarding-Status

- [ ] Noch nicht gestartet
- [ ] In Bearbeitung
- [ ] Warten auf Auftraggeber
- [ ] Startvoraussetzungen vollständig
- [ ] Onboarding abgeschlossen
- [ ] Projektstart freigegeben

**Blockierende Punkte:**  
[BLOCKER]

---

# 2. Willkommens-E-Mail (Vorlage)

## Betreff

**Projektstart [PROJEKT_NAME] – nächste Schritte und Kickoff**

## E-Mail-Text

Hallo [KUNDE_ANSPRECHPARTNER],

vielen Dank für die Beauftragung und das entgegengebrachte Vertrauen. Wir freuen uns auf die Zusammenarbeit an **[PROJEKT_NAME]**.

Damit wir strukturiert und ohne unnötige Verzögerungen starten können, führen wir vor dem eigentlichen Projektbeginn ein kurzes Onboarding durch. Dabei stimmen wir Ansprechpartner, Kommunikationswege, benötigte Informationen und Zugänge sowie die ersten Meilensteine gemeinsam ab.

Für Ihr Projekt sind gemäß Angebot / SOW Nr. **[ANGEBOTSNUMMER]** folgende Module vorgesehen:

- [ ] Website-Entwicklung
- [ ] Project Portal
- [ ] Wartung/Hosting-Setup
- [ ] Content-Pflege
- [ ] Zusatzleistung(en): [ZUSATZLEISTUNGEN]

### Ihre nächsten Schritte

1. Bitte prüfen Sie die bereitgestellte Informations- und Zugangs-Checkliste.
2. Stellen Sie die für die beauftragten Module erforderlichen Inhalte und Zugänge bis **[FRIST_KUNDENINPUT]** bereit.
3. Für unseren Kickoff schlagen wir folgenden Termin vor: **[KICKOFF_TERMIN]**.
4. Rückfragen oder vertrauliche Projektinformationen senden Sie bitte über den vereinbarten Kanal **[KOMMUNIKATIONSKANAL]**.

Ihre Kunden-Nr. lautet: **[KUNDEN_NUMMER]**  
Ihre Projekt-Nr. lautet: **[PROJEKT_NUMMER]**

Sofern ein geschützter Kundenbereich / Project Portal Bestandteil des Projekts ist, erhalten Sie dafür ausschließlich die für Ihr Kundenkonto freigegebenen Zugriffe. Nicht freigegebene Projektinhalte bleiben gesperrt.

Sollten einzelne Informationen aktuell noch nicht vorliegen, markieren Sie diese bitte als offen. Wir klären dann gemeinsam, ob sie den Projektstart blockieren oder in einer späteren Phase nachgereicht werden können.

Viele Grüße  
[ANBIETER_ANSPRECHPARTNER]  
[ANBIETER_FIRMA]  
[ANBIETER_EMAIL]  
[ANBIETER_TELEFON]

---

# 3. Kickoff-Call Agenda

**Projekt:** [PROJEKT_NAME]  
**Datum:** [KICKOFF_DATUM]  
**Uhrzeit:** [KICKOFF_UHRZEIT]  
**Format:** [KICKOFF_FORMAT]  
**Geplante Dauer:** [KICKOFF_DAUER]

## Teilnehmer

### Auftraggeber
- [KUNDE_TEILNEHMER_1]
- [KUNDE_TEILNEHMER_2]
- [WEITERE_KUNDE_TEILNEHMER]

### Auftragnehmer
- [ANBIETER_TEILNEHMER_1]
- [ANBIETER_TEILNEHMER_2]
- [WEITERE_ANBIETER_TEILNEHMER]

## Agenda

| Nr. | Thema | Richtwert | Ergebnis |
|---|---|---:|---|
| 1 | Begrüßung, Teilnehmer, Rollen | [MINUTEN] | Ansprechpartner bestätigt |
| 2 | Ausgangslage & Projektziel aus dem SOW | [MINUTEN] | gemeinsames Zielbild |
| 3 | Beauftragte Module / Scope | [MINUTEN] | Scope bestätigt |
| 4 | Zielgruppen / Nutzer / Stakeholder | [MINUTEN] | Nutzerkontext geklärt |
| 5 | Informations- und Zugangsstatus | [MINUTEN] | offene Inputs identifiziert |
| 6 | Rollen & Entscheidungswege | [MINUTEN] | Freigabeweg festgelegt |
| 7 | Kommunikationskanäle & Reaktionszeiten | [MINUTEN] | Kommunikationsmodell bestätigt |
| 8 | Meilensteine / Zeitplan | [MINUTEN] | Terminrahmen bestätigt |
| 9 | Risiken / Abhängigkeiten / Blocker | [MINUTEN] | Risiken dokumentiert |
| 10 | Nächste Schritte / Owner / Fristen | [MINUTEN] | konkrete To-dos |

## Im Kickoff zu bestätigende Kernfragen

- Was ist das wichtigste fachliche Ergebnis des Projekts?
- Wer darf auf Auftraggeberseite verbindliche Entscheidungen treffen?
- Wer gibt Design, Inhalte, Funktionen und Go-Live frei?
- Welche Systeme / Dienstleister / Drittanbieter sind abhängig?
- Welche Daten dürfen verarbeitet werden?
- Welche Daten oder Zugänge sind besonders schutzbedürftig?
- Gibt es feste externe Deadlines?
- Welche SOW-Annahmen müssen vor Build bestätigt werden?
- Welche offenen Punkte können den Projektstart blockieren?

## Kickoff-Protokoll

**Entscheidungen:**  
[KICKOFF_ENTSCHEIDUNGEN]

**Offene Punkte:**  
[KICKOFF_OFFENE_PUNKTE]

**Nächste Schritte:**  
[KICKOFF_NEXT_STEPS]

---

# 4. Informations- & Zugangs-Checkliste (modular)

> **Nur Module verwenden, die im SOW ausdrücklich beauftragt wurden.**  
> Zugänge niemals unverschlüsselt in frei zugänglichen Dokumenten oder E-Mails dokumentieren. Für Credentials ist [SICHERER_CREDENTIAL_KANAL] zu verwenden.

## 4.0 Allgemeine Basisdaten – für jedes Projekt

### Unternehmen & Ansprechpartner
- [ ] vollständiger Firmenname
- [ ] Rechnungsanschrift
- [ ] Ansprechpartner fachlich
- [ ] Ansprechpartner technisch
- [ ] Ansprechpartner kaufmännisch
- [ ] E-Mail-Adressen
- [ ] Telefonnummern
- [ ] Vertretungs-/Freigaberegelung
- [ ] Kunden-Nr. im System vorhanden
- [ ] Projekt-Nr. im System vorhanden

### Projektgrundlagen
- [ ] unterschriebenes Angebot / SOW vorhanden
- [ ] aktuelle Scope-Version bestätigt
- [ ] relevante Change Requests vorhanden
- [ ] Projektziel bestätigt
- [ ] gewünschtes Go-Live-Fenster
- [ ] bekannte Abhängigkeiten
- [ ] bekannte Risiken
- [ ] Datenschutz-/Compliance-Vorgaben
- [ ] besondere Sicherheitsanforderungen
- [ ] sonstige Vorgaben: [ALLGEMEINE_SONSTIGE_VORGABEN]

---

## 4.1 MOD-01 – Website-Entwicklung

**Nur verwenden, wenn Website-Entwicklung im SOW beauftragt wurde.**

### Marke / Design
- [ ] Logo – bevorzugt Vektorformat
- [ ] Corporate-Design-Richtlinien
- [ ] definierte Farben
- [ ] definierte Schriften / Lizenzstatus
- [ ] vorhandene Design-Dateien
- [ ] Referenz-Websites / gewünschte Stilrichtung
- [ ] bestehende UI-Komponenten / Designsystem

### Inhalte
- [ ] Seiten-/Navigationsstruktur
- [ ] Texte
- [ ] Bilder
- [ ] Videos
- [ ] Downloads / PDFs
- [ ] Ansprechpartner / Teamdaten
- [ ] Leistungen / Produkte
- [ ] Impressumsangaben
- [ ] Datenschutzerklärung / rechtliche Texte vom Auftraggeber bzw. dessen Rechtsberatung
- [ ] Mehrsprachigkeitsanforderungen
- [ ] vorhandene SEO-Metadaten
- [ ] Content-Owner / Freigabeverantwortlicher

### Bestehende Systeme
- [ ] bestehende Website-URL
- [ ] CMS / Shop / Backend
- [ ] Administrationszugang – falls erforderlich
- [ ] Analytics-Zugang – falls beauftragt
- [ ] Search Console – falls beauftragt
- [ ] bestehende Formulare
- [ ] Newsletter-/CRM-Anbindung
- [ ] externe APIs
- [ ] vorhandene Datenexporte / Migration

### Technische Anforderungen
- [ ] Browser-/Device-Anforderungen
- [ ] Accessibility-Anforderungen
- [ ] Performance-Anforderungen
- [ ] Tracking-/Consent-Vorgaben
- [ ] Formular-/E-Mail-Ziele
- [ ] Mehrsprachigkeit
- [ ] besondere Integrationen
- [ ] technische Ansprechpartner für Fremdsysteme

**Offene Punkte MOD-01:**  
[OFFENE_PUNKTE_WEBSITE]

---

## 4.2 MOD-02 – Project Portal

**Nur verwenden, wenn Project Portal im SOW beauftragt wurde.**

### Benutzer / Rollen
- [ ] Benutzergruppen
- [ ] Rollen
- [ ] Rechte je Rolle
- [ ] Auftraggeber-Administratoren
- [ ] weitere Benutzer
- [ ] Freigabeprozesse
- [ ] MFA-Anforderungen
- [ ] externe Benutzer / Partner

### Kunden-/Projektstruktur
- [ ] Kunden-Nr. bestätigt
- [ ] Projekt-Nr. bestätigt
- [ ] Projektname
- [ ] Projektphasen
- [ ] Meilensteine
- [ ] Statusmodell
- [ ] gewünschte Kundenaktionen
- [ ] Freigaben / Approvals
- [ ] Tickets / Aufgaben
- [ ] Dokumentenkategorien
- [ ] Reporting-Anforderungen

### Daten & Berechtigungen
- [ ] welche Daten darf der Kunde sehen?
- [ ] welche Daten darf der Kunde ändern?
- [ ] welche Daten sind intern?
- [ ] welche Dokumente sind je Kunde freigegeben?
- [ ] Aufbewahrungsanforderungen
- [ ] Löschanforderungen
- [ ] Audit-/Nachweisanforderungen
- [ ] Datenexport erforderlich?
- [ ] Datenschutz-/AVV-Relevanz geprüft

### Sicherheitsregel

- [ ] **Default Deny bestätigt**
- [ ] Kunde sieht nur Inhalte der eigenen Organisation / Kunden-Nr.
- [ ] Project-Portal-Inhalte sind explizit freigeschaltet
- [ ] direkte URL-Manipulation darf keine fremden Daten öffnen
- [ ] API-/Backend-Berechtigungen sind serverseitig
- [ ] Rollen-/Freigabematrix dokumentiert

**Offene Punkte MOD-02:**  
[OFFENE_PUNKTE_PORTAL]

---

## 4.3 MOD-03 – Wartung/Hosting-Setup

**Nur verwenden, wenn Wartung/Hosting-Setup im SOW beauftragt wurde.**

### Domain / DNS
- [ ] Domainname(n)
- [ ] Registrar
- [ ] DNS-Provider
- [ ] notwendiger DNS-Zugang
- [ ] bestehende DNS-Einträge dokumentiert
- [ ] verantwortliche Person beim Auftraggeber

### Hosting / Cloud
- [ ] Hosting-/Cloud-Provider
- [ ] Vertragsinhaber
- [ ] Zugang / Einladung für Auftragnehmer
- [ ] Projekt-/Account-ID
- [ ] Region / Datenstandort
- [ ] Produktionsumgebung
- [ ] Staging-/Testumgebung
- [ ] Datenbank
- [ ] Storage
- [ ] E-Mail-/Transactional-Mail-Provider
- [ ] CDN / WAF
- [ ] externe Secrets / API Keys über sicheren Kanal

### Betrieb
- [ ] Backup-Anforderung
- [ ] Restore-Anforderung
- [ ] Monitoring
- [ ] Logging
- [ ] Alerting
- [ ] Patch-/Update-Verantwortung
- [ ] Servicezeiten
- [ ] Reaktionszeiten
- [ ] Eskalationskontakt
- [ ] SLA / Wartungsvertrag referenziert
- [ ] RTO / RPO nur falls vertraglich vereinbart

### Security / Zugriff
- [ ] MFA für relevante Administrationskonten
- [ ] getrennte persönliche Admin-Accounts
- [ ] kein Shared Password, sofern vermeidbar
- [ ] Least Privilege
- [ ] Secrets nicht im normalen Projektchat
- [ ] Offboarding-/Entzugskonzept für temporäre Zugänge

**Offene Punkte MOD-03:**  
[OFFENE_PUNKTE_HOSTING]

---

## 4.4 MOD-04 – Content-Pflege

**Nur verwenden, wenn Content-Pflege im SOW beauftragt wurde.**

### Content-Umfang
- [ ] Anzahl Seiten / Bereiche
- [ ] Texte
- [ ] Bilder
- [ ] Videos
- [ ] Downloads
- [ ] Produkt-/Leistungsdaten
- [ ] Blog-/News-Inhalte
- [ ] Ansprechpartnerdaten
- [ ] Mehrsprachige Inhalte

### Content-Quelle
- [ ] vom Auftraggeber geliefert
- [ ] aus bestehendem System migriert
- [ ] aus freigegebenem Dokumentbestand übernommen
- [ ] durch Dritte bereitgestellt
- [ ] sonstige Quelle: [CONTENT_QUELLE]

### Rechte / Freigaben
- [ ] Auftraggeber bestätigt Nutzungsrechte an gelieferten Medien
- [ ] Content-Freigabeverantwortlicher benannt
- [ ] Freigabeprozess definiert
- [ ] Korrekturschleifen definiert
- [ ] Redaktionsschluss / Content Freeze
- [ ] Umgang mit späteren Änderungen definiert

### Verarbeitung
- [ ] Formatvorgaben
- [ ] Bildgrößen / Auflösung
- [ ] Dateibenennung
- [ ] Metadaten
- [ ] Alt-Texte – falls vereinbart
- [ ] SEO-Metadaten – falls vereinbart
- [ ] Archivierung alter Inhalte
- [ ] Migration / Redirects – falls vereinbart

**Offene Punkte MOD-04:**  
[OFFENE_PUNKTE_CONTENT]

---

## 4.5 Zusatzleistungen aus SOW

> Nur aufnehmen, wenn ausdrücklich beauftragt.

- [ ] [ZUSATZLEISTUNG_1] – benötigte Inputs: [INPUTS_1]
- [ ] [ZUSATZLEISTUNG_2] – benötigte Inputs: [INPUTS_2]
- [ ] [ZUSATZLEISTUNG_3] – benötigte Inputs: [INPUTS_3]

---

# 5. Kommunikationskanäle & Ansprechpartner

## Kommunikationsmodell

| Zweck | Kanal | Ansprechpartner | Reaktions-/Nutzungsregel |
|---|---|---|---|
| allgemeine Projektkommunikation | [KANAL_ALLGEMEIN] | [OWNER_ALLGEMEIN] | [REGEL_ALLGEMEIN] |
| fachliche Entscheidungen | [KANAL_FACHLICH] | [OWNER_FACHLICH] | [REGEL_FACHLICH] |
| technische Fragen | [KANAL_TECHNISCH] | [OWNER_TECHNISCH] | [REGEL_TECHNISCH] |
| vertrauliche Credentials | [SICHERER_CREDENTIAL_KANAL] | [OWNER_CREDENTIALS] | keine Passwörter per ungeschützter E-Mail |
| Projektstatus / Dokumente | [PROJECT_PORTAL_NAME_ODER_URL] | [OWNER_PORTAL] | nur freigegebene Kundeninhalte |
| dringende Störung – sofern vereinbart | [SUPPORT_KANAL] | [SUPPORT_OWNER] | gemäß [SLA_ODER_SUPPORTREGEL] |

## Ansprechpartner Auftraggeber

| Rolle | Name | E-Mail | Telefon | Entscheidungskompetenz |
|---|---|---|---|---|
| Projektverantwortung | [NAME] | [EMAIL] | [TELEFON] | [KOMPETENZ] |
| Fachlich | [NAME] | [EMAIL] | [TELEFON] | [KOMPETENZ] |
| Technisch | [NAME] | [EMAIL] | [TELEFON] | [KOMPETENZ] |
| Kaufmännisch | [NAME] | [EMAIL] | [TELEFON] | [KOMPETENZ] |
| Datenschutz / Compliance | [NAME] | [EMAIL] | [TELEFON] | [KOMPETENZ] |

## Ansprechpartner Auftragnehmer

| Rolle | Name | E-Mail | Telefon | Verantwortungsbereich |
|---|---|---|---|---|
| Projektleitung | [NAME] | [EMAIL] | [TELEFON] | [BEREICH] |
| Entwicklung | [NAME] | [EMAIL] | [TELEFON] | [BEREICH] |
| Security / Infrastruktur | [NAME] | [EMAIL] | [TELEFON] | [BEREICH] |
| Support / Betrieb | [NAME] | [EMAIL] | [TELEFON] | [BEREICH] |

---

# 6. Projektzeitplan-Vorschau

> Die Vorschau übernimmt die im SOW vereinbarten Meilensteine. Keine neuen Termine erfinden.

| Phase / Meilenstein | SOW-Referenz | Geplant | Voraussetzung / Kundenaktion | Status |
|---|---|---|---|:---:|
| Onboarding abgeschlossen | [SOW_REFERENZ] | [DATUM] | Inputs / Zugänge vollständig | [ ] |
| Discovery / M1 | [SOW_M1] | [DATUM] | [VORAUSSETZUNG] | [ ] |
| Design / Architektur / M2 | [SOW_M2] | [DATUM] | [VORAUSSETZUNG] | [ ] |
| Build / M3 | [SOW_M3] | [DATUM] | [VORAUSSETZUNG] | [ ] |
| Test / M4 | [SOW_M4] | [DATUM] | Testdaten / Feedback | [ ] |
| Launch / Handover / M5 | [SOW_M5] | [DATUM] | Go-Live-Freigabe | [ ] |
| Abnahme | [ABNAHME_REFERENZ] | [DATUM] | Abnahmekandidat | [ ] |

## Hinweise zu Terminverschiebungen

Der dargestellte Zeitplan setzt voraus, dass vereinbarte Mitwirkungsleistungen, Inhalte, Zugänge und Freigaben rechtzeitig vorliegen.

Fehlende oder verspätete Inputs können:
- nachgelagerte Arbeitspakete verschieben,
- reservierte Kapazitäten beeinflussen,
- Change Requests auslösen, wenn Anforderungen nachträglich geändert werden,
- einen geplanten Go-Live-Termin gefährden.

---

# 7. Rollen & Verantwortlichkeiten

## Auftraggeber

Der Auftraggeber ist insbesondere verantwortlich für:

- [ ] fachlich richtige Anforderungen
- [ ] rechtzeitige Bereitstellung vereinbarter Inhalte
- [ ] rechtzeitige Bereitstellung notwendiger Zugänge
- [ ] Benennung entscheidungsbefugter Ansprechpartner
- [ ] rechtzeitige Design-/Funktionsfreigaben
- [ ] Prüfung bereitgestellter Zwischenergebnisse
- [ ] Bereitstellung notwendiger Testdaten
- [ ] Bestätigung der Rechte an gelieferten Inhalten
- [ ] rechtliche Texte / rechtliche Beratung, soweit nicht ausdrücklich anders vereinbart
- [ ] Mitwirkung gemäß SOW Abschnitt [SOW_MITWIRKUNG_REFERENZ]

## Auftragnehmer

Der Auftragnehmer ist insbesondere verantwortlich für:

- [ ] strukturierte Projektführung
- [ ] technische Umsetzung des beauftragten Scopes
- [ ] angemessene Dokumentation
- [ ] transparente Kommunikation von Risiken / Blockern
- [ ] Schutz anvertrauter Zugänge und Informationen
- [ ] serverseitige Berechtigungsprüfung bei geschützten Kundeninhalten
- [ ] Test und Qualitätssicherung im vereinbarten Umfang
- [ ] Vorbereitung von Handover und späterer Abnahme
- [ ] Change Requests kenntlich machen, bevor Out-of-Scope-Leistungen umgesetzt werden

## Entscheidungs- / Freigabematrix

| Thema | Auftraggeber entscheidet | Auftragnehmer entscheidet | gemeinsam |
|---|:---:|:---:|:---:|
| Fachliche Ziele | [ ] | [ ] | [ ] |
| Scope-Änderung | [ ] | [ ] | [ ] |
| UI/Design-Freigabe | [ ] | [ ] | [ ] |
| technische Detailarchitektur | [ ] | [ ] | [ ] |
| Drittanbieter-Auswahl | [ ] | [ ] | [ ] |
| Security-Ausnahmen | [ ] | [ ] | [ ] |
| Go-Live | [ ] | [ ] | [ ] |
| Abnahme | [ ] | [ ] | [ ] |

---

# 8. INTERN – Onboarding-Checkliste Auftragnehmer

> **INTERNE VERWENDUNG – NICHT AN DEN KUNDEN SENDEN**

## 8.1 Vertrags-/Kundendaten

- [ ] unterschriebenes Angebot / SOW abgelegt
- [ ] richtige SOW-Version markiert
- [ ] Kunden-Nr. im System vorhanden
- [ ] Projekt-Nr. im System vorhanden
- [ ] Auftraggeber-Stammdaten geprüft
- [ ] Rechnungsdaten geprüft
- [ ] Ansprechpartner angelegt
- [ ] Zahlungs-/Abrechnungsmodell aus SOW übernommen
- [ ] AGB / AVV / SLA-Verweise geprüft
- [ ] beauftragte Module im System markiert

## 8.2 Kundenkonto / Berechtigungen

- [ ] Kundenkonto registriert / identifiziert
- [ ] Kunden-Nr. mit Account verknüpft
- [ ] **Default Deny aktiv**
- [ ] nur beauftragte / benötigte geschützte Bereiche freigeschaltet
- [ ] Angebot / SOW – Freigabe geprüft
- [ ] Abnahmeprotokoll – nicht vorzeitig freigeschaltet
- [ ] Project Portal – nur falls vereinbart freigeschaltet
- [ ] Wartung/Hosting-Setup – nur falls relevant
- [ ] Content-Pflege – nur falls relevant
- [ ] Cross-Tenant-Zugriff technisch ausgeschlossen
- [ ] Berechtigungsänderungen auditierbar

## 8.3 Projektstruktur

- [ ] Projektordner erstellt: [PROJEKTORDNER]
- [ ] Repository erstellt / zugeordnet: [REPOSITORY]
- [ ] Branch-/Deployment-Modell festgelegt
- [ ] Entwicklungsumgebung vorbereitet
- [ ] Staging vorbereitet
- [ ] Produktionsumgebung dokumentiert
- [ ] Backups / Restore nur falls Scope
- [ ] Secrets über sicheren Secret Store
- [ ] keine produktiven Credentials im normalen Chat / Markdown

## 8.4 Project Portal

- [ ] Projekt dem richtigen Kunden / organization_id zugeordnet
- [ ] gewünschte Meilensteine angelegt
- [ ] Dokumentbereiche angelegt
- [ ] Freigaben / Approvals angelegt
- [ ] Portal-Rechte getestet
- [ ] Kunde A kann Kunde B nicht sehen
- [ ] no-store / noindex für geschützte Bereiche geprüft

## 8.5 Kommunikation / Delivery

- [ ] Welcome-Mail gesendet
- [ ] Kickoff geplant
- [ ] Kommunikationskanal festgelegt
- [ ] interne Owner festgelegt
- [ ] Projektkalender / Meilensteine angelegt
- [ ] interne Risiken erfasst
- [ ] Blocker erfasst
- [ ] Change-Request-Prozess klar
- [ ] Abnahmeprozess vorbereitet

## 8.6 Kaufmännisch / Administration

- [ ] Kunde in [RECHNUNGSSYSTEM] angelegt
- [ ] SOW-Preis-/Abrechnungsmodell hinterlegt
- [ ] Anzahlung – falls vereinbart – Status geprüft
- [ ] Rechnungsadresse geprüft
- [ ] USt.-/Steuerdaten geprüft
- [ ] Bestellnummer / PO – falls erforderlich
- [ ] interne Kostenschätzung / Kapazitätsplanung
- [ ] externe Lizenz-/Providerkosten dokumentiert

## 8.7 Datenschutz / Security

- [ ] Datenkategorien bekannt
- [ ] personenbezogene Daten identifiziert
- [ ] AVV-Bedarf geprüft
- [ ] Drittanbieter / Unterauftragnehmer dokumentiert
- [ ] Zugriff nur Need-to-Know
- [ ] MFA für administrative Systeme
- [ ] Credential-Handling geprüft
- [ ] Lösch-/Aufbewahrungsanforderungen dokumentiert
- [ ] Logging / Audit-Anforderungen dokumentiert
- [ ] Security-Ausnahmen schriftlich dokumentiert

## Interne Onboarding-Freigabe

**Onboarding geprüft durch:** [INTERN_PRUEFER]  
**Datum:** [INTERN_PRUEFDATUM]

- [ ] Startfreigabe erteilt
- [ ] Startfreigabe mit offenen, nicht-blockierenden Punkten
- [ ] Projektstart blockiert

**Begründung / Restpunkte:**  
[INTERNE_RESTPUNKTE]

---

# 9. Nächste Schritte & Abschluss

Das Onboarding gilt als abgeschlossen, wenn:

- [ ] Kundenkonto / Kunden-Nr. korrekt zugeordnet ist
- [ ] Projekt-Nr. vorhanden ist
- [ ] beauftragte SOW-Module eindeutig markiert sind
- [ ] notwendige Auftraggeber-Ansprechpartner bestätigt sind
- [ ] notwendige Informationen und Zugänge vollständig oder bewusst als nicht-blockierend dokumentiert sind
- [ ] Kommunikationskanäle festgelegt sind
- [ ] Kickoff durchgeführt wurde
- [ ] Zeitplan / Meilensteine bestätigt wurden
- [ ] kritische Blocker geklärt sind
- [ ] interne Projektumgebung vorbereitet ist
- [ ] Berechtigungen / Kundenisolation geprüft sind
- [ ] Projektstart intern freigegeben wurde

## Abschlussstatus

- [ ] **Onboarding abgeschlossen – Projekt kann starten**
- [ ] **Onboarding unter Vorbehalt – nicht-blockierende Restpunkte offen**
- [ ] **Onboarding nicht abgeschlossen – Projektstart blockiert**

**Offene Restpunkte:**  
[ONBOARDING_RESTPUNKTE]

**Owner:** [RESTPUNKTE_OWNER]  
**Frist:** [RESTPUNKTE_FRIST]

## Übergang in die Projektphase

Nach Abschluss des Onboardings beginnt die im SOW definierte Delivery-Phase:

**Nächster Meilenstein:** [NAECHSTER_MEILENSTEIN]  
**Geplanter Beginn:** [NAECHSTER_SCHRITT_DATUM]

Die spätere Abnahme erfolgt anhand:
1. des beauftragten SOW,
2. der dokumentierten Change Requests,
3. der vereinbarten Acceptance Criteria,
4. des **Abnahmeprotokolls** mit denselben Modulnamen.

---

# Nutzungshinweise

1. **Kickoff zeitnah nach Auftragseingang planen**, aber nicht so früh, dass das SOW oder die grundlegenden Ansprechpartner noch unklar sind.
2. **Nicht jede fehlende Information blockiert den Projektstart.** Blocker ausdrücklich markieren; unkritische Restpunkte mit Owner und Frist dokumentieren.
3. **Credentials nicht per normaler E-Mail oder im Onboarding-Dokument sammeln.** Immer einen freigegebenen sicheren Kanal verwenden.
4. **Nur beauftragte SOW-Module aktivieren.** Onboarding darf den Scope nicht stillschweigend erweitern.
5. **Kundenkonto ≠ Vollzugriff.** Registrierung erzeugt Identität/Kunden-Nr.; geschützte Projektinhalte werden nur explizit und kundenbezogen freigeschaltet.
6. **Onboarding und Abnahme müssen dieselben Modulnamen verwenden.** Dadurch bleibt nachvollziehbar, was verkauft, vorbereitet, umgesetzt und später abgenommen wurde.

---

# Vor Verwendung zwingend zu befüllen

- [KUNDEN_NUMMER]
- [PROJEKT_NUMMER]
- [ANGEBOTSNUMMER]
- [PROJEKT_NAME]
- [KUNDENFIRMA]
- [ANBIETER_FIRMA]
- [KUNDE_ANSPRECHPARTNER]
- [ANBIETER_ANSPRECHPARTNER]
- [PROJEKTSTART]
- [KICKOFF_TERMIN]
- [FRIST_KUNDENINPUT]
- beauftragte Module
- Kommunikationskanäle
- sicherer Credential-Kanal
- Ansprechpartner / Rollen
- SOW-Meilensteine
- interne Tools wie [RECHNUNGSSYSTEM], [REPOSITORY], [PROJECT_PORTAL_NAME_ODER_URL] nur wenn tatsächlich bekannt
