# BAIS – Rechnung Vorlage + Zahlungsbedingungen

> Wiederverwendbare Rechnungsvorlage für Deutschland.  
> Unbekannte steuerliche, kaufmännische, bankbezogene oder projektspezifische Angaben bleiben als `[PLACEHOLDER]` stehen und dürfen nicht automatisch erfunden werden.  
> Für Österreich oder die Schweiz ist die Vorlage vor Verwendung separat an das jeweilige Rechnungs- und Steuerrecht anzupassen: `[LAND_RECHNUNGSRECHT]`.

---

# Dokumentfamilie / Zahlungslogik

Diese Vorlage gehört zur BAIS-Dokumentfamilie:

**Angebot / SOW → Projekt / Meilenstein → Abnahmeprotokoll → Rechnung**

Verbindliche Modulnamen:

| Modul-ID | Modulname |
|---|---|
| MOD-01 | **Website-Entwicklung** |
| MOD-02 | **Project Portal** |
| MOD-03 | **Wartung/Hosting-Setup** |
| MOD-04 | **Content-Pflege** |

> **Regel:** Die Rechnung darf keine neue Zahlungslogik erfinden. Anzahlung, Raten, Meilensteinzahlung, Schlusszahlung, Zahlungsziel und ggf. wiederkehrende Abrechnung müssen aus dem unterschriebenen SOW / Vertrag übernommen werden.

---

# A. RECHNUNG VORLAGE

# 1. Kopfzeile

## Auftragnehmer / leistendes Unternehmen

**[FIRMA_ADI]**  
[ANBIETER_STRASSE_HAUSNUMMER]  
[ANBIETER_PLZ_ORT]  
[ANBIETER_LAND]

**Inhaber / Vertretungsberechtigte Person:** [ANBIETER_VERTRETUNG]  
**Steuernummer:** [STEUERNUMMER]  
**USt-IdNr.:** [UST_IDNR]  
**Kleinunternehmer-ID – falls vorhanden/relevant:** [KLEINUNTERNEHMER_ID]  
**E-Mail:** [ANBIETER_EMAIL]  
**Telefon:** [ANBIETER_TELEFON]

> Nicht vorhandene bzw. nicht einschlägige Steuer-ID-Felder entfernen. Mindestens die gesetzlich einschlägige Steuer-ID angeben.

## Rechnungsempfänger / Leistungsempfänger

**[KUNDENFIRMA_ODER_NAME]**  
[KUNDE_STRASSE_HAUSNUMMER]  
[KUNDE_PLZ_ORT]  
[KUNDE_LAND]

**Ansprechpartner:** [KUNDE_ANSPRECHPARTNER]  
**Kunden-Nr.:** [KUNDEN_NUMMER]  
**Projekt-Nr.:** [PROJEKT_NUMMER]

---

# RECHNUNG

**Rechnungsnummer:** [RECHNUNGSNUMMER]  
**Empfohlenes Schema:** `RE-[JAHR]-[LAUFENDE_NUMMER]`  
**Rechnungsdatum / Ausstellungsdatum:** [RECHNUNGSDATUM]  
**Leistungsdatum / Leistungszeitraum:** [LEISTUNGSDATUM_ODER_ZEITRAUM]  
**SOW / Angebots-Nr.:** [ANGEBOTSNUMMER]  
**Abnahmeprotokoll / Referenz – falls relevant:** [ABNAHME_REFERENZ]  
**Bestellnummer / PO – falls vorhanden:** [PO_NUMMER]  
**Währung:** [WAEHRUNG]

> Rechnungsnummern müssen fortlaufend und eindeutig sein. Das konkrete interne Nummernsystem muss einmal festgelegt und danach konsistent verwendet werden.

---

# 2. Rechnungspositionen

## 2.1 Standardrechnung / Projektleistung

| Pos. | Modul / Beschreibung | Leistungsreferenz | Menge | Einheit | Einzelpreis netto | Gesamt netto |
|---:|---|---|---:|---|---:|---:|
| 1 | **MOD-01 – Website-Entwicklung** – [LEISTUNGSBESCHREIBUNG_WEBSITE] | [SOW_REFERENZ] | [MENGE] | [EINHEIT] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 2 | **MOD-02 – Project Portal** – [LEISTUNGSBESCHREIBUNG_PORTAL] | [SOW_REFERENZ] | [MENGE] | [EINHEIT] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 3 | **MOD-03 – Wartung/Hosting-Setup** – [LEISTUNGSBESCHREIBUNG_HOSTING] | [SOW_REFERENZ] | [MENGE] | [EINHEIT] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 4 | **MOD-04 – Content-Pflege** – [LEISTUNGSBESCHREIBUNG_CONTENT] | [SOW_REFERENZ] | [MENGE] | [EINHEIT] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 5 | Zusatzleistung – [ZUSATZLEISTUNG] | [SOW_ODER_CHANGE_REQUEST_REFERENZ] | [MENGE] | [EINHEIT] | [EINZELPREIS] € | [GESAMTPREIS] € |

> Nur tatsächlich erbrachte / abrechenbare Positionen verwenden. Nicht beauftragte oder nicht fällige Module entfernen.

## 2.2 Anzahlungsrechnung – Variante

**Dokumenttyp:** ANZAHLUNGSRECHNUNG

**Grundlage:** SOW / Vertrag Nr. [ANGEBOTSNUMMER]  
**Vereinbarte Anzahlung:** [ANZAHLUNG_PROZENT] % bzw. [ANZAHLUNG_BETRAG] €  
**Geplanter Leistungsbeginn:** [PROJEKTSTART]

| Pos. | Beschreibung | Betrag netto |
|---:|---|---:|
| 1 | Anzahlung gemäß SOW Nr. [ANGEBOTSNUMMER] für [PROJEKT_NAME] | [ANZAHLUNG_NETTO] € |

**Hinweis:** Bei Anzahlungen sind die einschlägigen steuerlichen Anforderungen für vereinnahmte Teilentgelte zu beachten.

## 2.3 Zwischen-/Meilensteinrechnung – Variante

**Dokumenttyp:** ZWISCHENRECHNUNG / MEILENSTEINRECHNUNG

**Abgerechneter Meilenstein:** [MEILENSTEIN]  
**Fälligkeit gemäß SOW:** [SOW_ZAHLUNGSREFERENZ]

| Pos. | Beschreibung | Betrag netto |
|---:|---|---:|
| 1 | Meilenstein [MEILENSTEIN] – [LEISTUNGSBESCHREIBUNG] | [TEILBETRAG_NETTO] € |

## 2.4 Abschlussrechnung – Variante

**Dokumenttyp:** SCHLUSSRECHNUNG

**Abnahme-Referenz:** [ABNAHME_REFERENZ]  
**Abnahmedatum:** [ABNAHMEDATUM]

### Gesamtleistung

| Beschreibung | Betrag |
|---|---:|
| Gesamtwert der abrechenbaren Leistung netto | [GESAMTLEISTUNG_NETTO] € |
| abzüglich bereits berechneter / vereinnahmter Anzahlungen netto | - [BEREITS_GEZAHLTE_ANZAHLUNGEN_NETTO] € |
| abzüglich bereits berechneter Zwischen-/Meilensteinzahlungen netto | - [BEREITS_GEZAHLTE_RATEN_NETTO] € |
| verbleibender Rechnungsbetrag netto | **[RESTBETRAG_NETTO] €** |

> Bei einer Schlussrechnung sind bereits vereinnahmte Teilentgelte und die darauf entfallenden Steuerbeträge nach der steuerlich zutreffenden Methode abzusetzen.

---

# 3. Summen

## Variante A – Regelbesteuerung / Umsatzsteuer wird ausgewiesen

**Nur verwenden, wenn diese steuerliche Behandlung tatsächlich gilt.**

| Summe | Betrag |
|---|---:|
| Zwischensumme netto | [NETTOBETRAG] € |
| vereinbarte Minderung / Rabatt – falls vorhanden | - [MINDERUNG_BETRAG] € |
| steuerpflichtiges Entgelt | [STEUERPFLICHTIGES_ENTGELT] € |
| Umsatzsteuer [UST_SATZ] % | [UST_BETRAG] € |
| **Gesamtbetrag brutto** | **[GESAMTBETRAG_BRUTTO] €** |

Bei mehreren Steuersätzen:

| Steuerbasis | Steuersatz | Steuerbetrag |
|---|---:|---:|
| [NETTO_STEUERBASIS_1] € | [UST_SATZ_1] % | [UST_BETRAG_1] € |
| [NETTO_STEUERBASIS_2] € | [UST_SATZ_2] % | [UST_BETRAG_2] € |

## Variante B – Kleinunternehmerregelung

**Nur verwenden, wenn die Voraussetzungen des § 19 UStG tatsächlich erfüllt sind. Keine Umsatzsteuer gesondert ausweisen.**

| Summe | Betrag |
|---|---:|
| Entgelt | [RECHNUNGSBETRAG_KLEINUNTERNEHMER] € |
| **Zahlbetrag** | **[ZAHLBETRAG_KLEINUNTERNEHMER] €** |

**Rechnungshinweis:**  
**„Für diese Leistung gilt die Steuerbefreiung für Kleinunternehmer gemäß § 19 UStG; Umsatzsteuer wird nicht gesondert ausgewiesen.“**

> Vor erstmaliger Verwendung muss der konkrete Steuerstatus mit Steuerberatung / Finanzamt-Unterlagen abgeglichen werden.

---

# 4. Zahlungsinformationen

**Zahlbar bis:** [FAELLIGKEITSDATUM]  
**Zahlungsziel:** [ZAHLUNGSZIEL_TAGE] Kalendertage netto ab [AUSLOESER_ZAHLUNGSZIEL]  
**Verwendungszweck:** [RECHNUNGSNUMMER] / [KUNDEN_NUMMER] / [PROJEKT_NUMMER]

## Bankverbindung

**Kontoinhaber:** [KONTOINHABER]  
**IBAN:** [IBAN]  
**BIC:** [BIC]  
**Bank:** [BANKNAME]

## Alternative Zahlungsmethoden – nur falls tatsächlich angeboten

- [ ] Überweisung
- [ ] PayPal: [PAYPAL_REFERENZ]
- [ ] Stripe / Zahlungslink: [STRIPE_REFERENZ]
- [ ] SEPA-Lastschrift – nur bei gültigem Mandat: [SEPA_MANDAT_REFERENZ]
- [ ] Sonstige: [ZAHLUNGSMETHODE_SONSTIG]

---

# 5. Rechtliche Rechnungsangaben / integrierte Pflichtangaben

Die Rechnungsvorlage enthält die für eine reguläre deutsche Rechnung erforderlichen Kernangaben gemäß § 14 UStG unmittelbar im Dokument:

**Leistendes Unternehmen:**  
[FIRMA_ADI], [ANBIETER_VOLLSTAENDIGE_ANSCHRIFT]

**Leistungsempfänger:**  
[KUNDENFIRMA_ODER_NAME], [KUNDE_VOLLSTAENDIGE_ANSCHRIFT]

**Steuerliche Identifikation des leistenden Unternehmens:**  
[STEUERNUMMER_ODER_UST_IDNR]

**Ausstellungsdatum:**  
[RECHNUNGSDATUM]

**Eindeutige Rechnungsnummer:**  
[RECHNUNGSNUMMER]

**Art und Umfang der Leistung:**  
Siehe Rechnungspositionen sowie SOW / Vertrag Nr. [ANGEBOTSNUMMER]. Die Beschreibung muss die konkret erbrachte Leistung erkennen lassen; ein bloßer Modulname ohne Leistungsbeschreibung genügt als interne Vorlage nicht.

**Leistungszeitpunkt / Leistungszeitraum:**  
[LEISTUNGSDATUM_ODER_ZEITRAUM]

**Entgelt nach Steuerbehandlung / Steuersätzen:**  
Siehe Abschnitt 3.

**Im Voraus vereinbarte Minderung – falls vorhanden:**  
[MINDERUNG_ODER_RABATT]

**Steuersatz / Steuerbetrag oder Steuerbefreiung:**  
- Regelbesteuerung: [UST_SATZ] % / [UST_BETRAG] €
- oder Kleinunternehmer: Hinweis gemäß § 19 UStG aus Variante B

## Hinweis bei bestimmten Leistungen an Privatpersonen

Nur wenn der konkrete Fall unter die gesetzliche zweijährige Aufbewahrungspflicht des nichtunternehmerischen Leistungsempfängers fällt:

**„Der Leistungsempfänger ist verpflichtet, diese Rechnung, einen Zahlungsbeleg oder eine andere beweiskräftige Unterlage zwei Jahre aufzubewahren.“**

> Diesen Hinweis nicht pauschal in jede B2C-Rechnung aufnehmen, sondern nur wenn die gesetzliche Fallgruppe tatsächlich einschlägig ist.

## Kleinbetragsrechnung – Kurzvariante

Für eine Rechnung bis zur jeweils geltenden gesetzlichen Kleinbetragsgrenze `[KLEINBETRAGS_GRENZE]` kann – soweit die Voraussetzungen der UStDV erfüllt sind – eine vereinfachte Rechnung verwendet werden.

### Kurzformat

**[FIRMA_ADI]**  
[ANBIETER_ANSCHRIFT]

**Datum:** [RECHNUNGSDATUM]

**Leistung:** [LEISTUNGSBESCHREIBUNG]

**Gesamtbetrag:** [GESAMTBETRAG] €

**Steuerhinweis:** [STEUERSATZ_ODER_BEFREIUNGSHINWEIS]

> Die aktuell geltende Grenze und Ausnahmen vor Verwendung prüfen.

## E-Rechnung / Rechnungsformat

**Rechnungsformat:** [RECHNUNGSFORMAT]  
**E-Rechnungsstandard – falls verwendet:** [E_RECHNUNGSSTANDARD]  
**Übermittlungsweg:** [RECHNUNGS_UEBERMITTLUNGSWEG]

> Für inländische B2B-Umsätze gelten seit 2025 neue E-Rechnungsregeln mit Übergangsfristen. Vor produktivem Einsatz prüfen, ob für den konkreten Umsatz bereits eine Pflicht zur strukturierten E-Rechnung besteht.

---

# 6. Wiederkehrende Rechnung – Abo / Wartung / Hosting

**Dokumenttyp:** WIEDERKEHRENDE RECHNUNG

**Vertrag / SOW:** [ANGEBOTSNUMMER]  
**Modul:** **MOD-03 – Wartung/Hosting-Setup**  
**Abrechnungszeitraum:** [ABRECHNUNGSZEITRAUM_VON] bis [ABRECHNUNGSZEITRAUM_BIS]  
**Abrechnungsintervall:** [MONATLICH_QUARTALSWEISE_JAEHRLICH]  
**Vertrags-/Leistungsperiode:** [VERTRAGSPERIODE]

| Pos. | Wiederkehrende Leistung | Menge | Einzelpreis netto | Gesamt netto |
|---:|---|---:|---:|---:|
| 1 | Wartung / Support – [PAKET_ODER_SCOPE] | [MENGE] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 2 | Hosting / Infrastruktur – [HOSTING_SCOPE] | [MENGE] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 3 | Monitoring / Backup – [OPERATIONS_SCOPE] | [MENGE] | [EINZELPREIS] € | [GESAMTPREIS] € |
| 4 | Zusatzverbrauch / Zusatzstunden – [BESCHREIBUNG] | [MENGE] | [EINZELPREIS] € | [GESAMTPREIS] € |

**Nächster Abrechnungszeitraum:** [NAECHSTER_ABRECHNUNGSZEITRAUM]

> Wiederkehrende Rechnungen werden nur im vertraglich vereinbarten Intervall erstellt. Automatische Verlängerungen oder Preisänderungen dürfen nicht aus der Rechnung selbst erfunden werden, sondern müssen sich aus Vertrag / SOW / Wartungsvereinbarung ergeben.

---

# B. ZAHLUNGSBEDINGUNGEN

# 7. Zahlungsziel & Fälligkeit

## Referenztext

Soweit im Angebot / Statement of Work, Einzelvertrag oder einer schriftlich freigegebenen Änderung nichts Abweichendes vereinbart ist, gelten für die jeweilige Rechnung die dort ausgewiesenen Zahlungsfristen.

**Zahlungsziel:** [ZAHLUNGSZIEL_TAGE] Kalendertage netto.  
**Fälligkeitsdatum:** [FAELLIGKEITSDATUM]

Für projektbezogene Zahlungen gelten die im SOW vereinbarten Auslöser:

- **Anzahlung:** [ANZAHLUNG_REGELUNG]
- **Zwischen-/Meilensteinzahlung:** [RATEN_REGELUNG]
- **Schlusszahlung:** [SCHLUSSZAHLUNGS_REGELUNG]
- **Wiederkehrende Leistungen:** [WIEDERKEHRENDE_ZAHLUNGSREGEL]

Bei Widersprüchen zwischen dieser allgemeinen Vorlage und dem individuell unterschriebenen SOW / Vertrag geht die individuell vereinbarte Regelung vor.

---

# 8. Zahlungsverzug / Mahnwesen

## 8.1 Eintritt des Verzugs

Der Zahlungsverzug richtet sich nach den gesetzlichen Voraussetzungen, insbesondere § 286 BGB, soweit vertraglich nichts Wirksames Abweichendes vereinbart wurde.

**Optionaler Rechnungshinweis bei Verbrauchern – nur verwenden, wenn rechtlich passend:**

„Der Rechnungsbetrag ist spätestens innerhalb von [ZAHLUNGSZIEL_TAGE] Tagen zu zahlen. Auf die gesetzlichen Voraussetzungen des Zahlungsverzugs wird hingewiesen.“

> Bei Verbrauchern ist der gesetzliche 30-Tage-Mechanismus nur unter den gesetzlichen Voraussetzungen und mit dem erforderlichen Hinweis relevant.

## 8.2 Mahnstufen

### Stufe 1 – Zahlungserinnerung

**Zeitpunkt:** [MAHNSTUFE_1_ZEITPUNKT]

Betreff: **Zahlungserinnerung zu Rechnung [RECHNUNGSNUMMER]**

Guten Tag [KUNDE_ANSPRECHPARTNER],

nach unseren Unterlagen ist die Rechnung **[RECHNUNGSNUMMER]** vom **[RECHNUNGSDATUM]** über **[OFFENER_BETRAG] €** noch offen.

Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie diese Nachricht bitte als gegenstandslos. Andernfalls bitten wir um Zahlung bis **[NEUE_FRIST_1]** unter Angabe der Rechnungsnummer.

Vielen Dank.

Freundliche Grüße  
[ANBIETER_FIRMA]

### Stufe 2 – Mahnung

**Zeitpunkt:** [MAHNSTUFE_2_ZEITPUNKT]

Betreff: **Mahnung – Rechnung [RECHNUNGSNUMMER]**

Guten Tag [KUNDE_ANSPRECHPARTNER],

die Rechnung **[RECHNUNGSNUMMER]** über **[OFFENER_BETRAG] €** ist weiterhin offen.

Bitte überweisen Sie den ausstehenden Betrag bis spätestens **[NEUE_FRIST_2]**.

Etwaige gesetzliche Verzugszinsen und weitere Verzugsschäden bleiben vorbehalten, soweit die gesetzlichen Voraussetzungen vorliegen.

Freundliche Grüße  
[ANBIETER_FIRMA]

### Stufe 3 – Letzte Mahnung / Fristsetzung

**Zeitpunkt:** [MAHNSTUFE_3_ZEITPUNKT]

Betreff: **Letzte Mahnung / Fristsetzung – Rechnung [RECHNUNGSNUMMER]**

Guten Tag [KUNDE_ANSPRECHPARTNER],

trotz vorheriger Erinnerung ist der offene Betrag aus Rechnung **[RECHNUNGSNUMMER]** in Höhe von **[OFFENER_BETRAG] €** noch nicht ausgeglichen.

Wir setzen Ihnen letztmalig eine Zahlungsfrist bis **[LETZTE_FRIST]**.

Nach fruchtlosem Ablauf behalten wir uns die weitere rechtliche Durchsetzung der Forderung sowie die Geltendmachung gesetzlicher Verzugsfolgen vor.

Freundliche Grüße  
[ANBIETER_FIRMA]

## 8.3 Verzugszinsen / Verzugsschaden

Soweit die gesetzlichen Voraussetzungen erfüllt sind, können Verzugszinsen gemäß § 288 BGB verlangt werden.

- Bei einem Rechtsgeschäft mit Beteiligung eines Verbrauchers: gesetzlicher Verzugszinssatz gemäß § 288 Abs. 1 BGB.
- Bei Entgeltforderungen zwischen Unternehmen ohne Verbraucher: gesetzlicher Verzugszinssatz gemäß § 288 Abs. 2 BGB.
- Bei B2B-Forderungen kann außerdem die gesetzliche Verzugspauschale gemäß § 288 Abs. 5 BGB einschlägig sein.
- Weiterer nachweisbarer Verzugsschaden bleibt im gesetzlichen Rahmen vorbehalten.

**Mahnkosten / sonstige Kosten:** [MAHNKOSTEN_REGELUNG]

> Keine frei erfundenen Pauschalen einsetzen. Kosten müssen gesetzlich bzw. vertraglich zulässig sein.

---

# 9. Zahlungsmethoden

Akzeptierte Zahlungsmethoden:

- [ ] Banküberweisung an [IBAN]
- [ ] SEPA-Lastschrift bei gültigem Mandat [SEPA_MANDAT_REFERENZ]
- [ ] PayPal [PAYPAL_REFERENZ]
- [ ] Stripe / Karten- oder Zahlungslink [STRIPE_REFERENZ]
- [ ] Sonstige: [ZAHLUNGSMETHODE_SONSTIG]

**Gebührenregelung:** [ZAHLUNGSGEBUEHREN_REGELUNG]

> Zahlungsanbieter, Gebührenübernahme und zulässige Aufschläge nicht automatisch annehmen.

---

# 10. Besondere Bedingungen bei Projektpausierung / Projektabbruch

## Referenztext

Wird ein Projekt auf Wunsch oder aus dem Verantwortungsbereich des Auftraggebers pausiert, verschoben oder vorzeitig beendet, gelten die hierfür individuell im SOW / Vertrag vereinbarten Regelungen.

Insbesondere können – soweit vertraglich vereinbart und rechtlich zulässig – abrechenbar sein:

- bis zum Stichtag tatsächlich erbrachte Leistungen,
- bereits erreichte bzw. fällige Meilensteine,
- ausdrücklich beauftragte externe Kosten / Lizenzen,
- reservierte oder nicht mehr stornierbare Drittleistungen,
- vereinbarte Übergabe-/Dokumentationsleistungen.

**Pausierungsregelung:** [PROJEKTPAUSE_REGELUNG]  
**Abbruch-/Kündigungsregelung:** [PROJEKTABBRUCH_REGELUNG]  
**Abrechnung bereits erbrachter Leistungen:** [ABRECHNUNG_BEI_ABBRUCH]  
**Externe Kosten:** [EXTERNE_KOSTEN_REGELUNG]

> Diese Vorlage erzeugt keine pauschale Kündigungsentschädigung oder Stornogebühr. Solche Ansprüche müssen aus dem konkreten Vertrag und dem anwendbaren Recht folgen.

---

# Nutzungshinweise

1. **Steuerstatus vor der ersten Rechnung festlegen.** Regelbesteuerung und Kleinunternehmerregelung dürfen nicht gleichzeitig verwendet werden.
2. **Rechnungsnummern unverwechselbar und konsistent vergeben.** Ein einmal definiertes Schema sollte nicht beliebig gewechselt werden.
3. **SOW-Zahlungslogik übernehmen.** Anzahlung, Meilenstein, Schlusszahlung und wiederkehrende Rechnung dürfen nicht von der Rechnungsvorlage abweichen.
4. **Leistungsdatum und Leistungsbeschreibung konkret halten.** „IT-Leistung“ oder nur ein Modulname ist für eine saubere Rechnung zu unbestimmt.
5. **E-Rechnungsstatus prüfen.** Bei inländischen B2B-Umsätzen kann je nach Zeitpunkt und Übergangsregel eine strukturierte E-Rechnung erforderlich sein.
6. **Grenzüberschreitende Fälle gesondert prüfen.** Reverse Charge, Leistungsort, USt-IdNr. und DACH-/EU-Sonderfälle gehören nicht in eine automatische Standardannahme.

---

# Vor erstmaligem Einsatz zwingend ausfüllen / klären

- [LAND_RECHNUNGSRECHT]
- [FIRMA_ADI]
- [ANBIETER_VOLLSTAENDIGE_ANSCHRIFT]
- [STEUERNUMMER_ODER_UST_IDNR]
- [STEUERSTATUS]
- [UST_SATZ] – nur wenn Regelbesteuerung
- [RECHNUNGSNUMMER_SCHEMA]
- [IBAN]
- [BIC]
- [BANKNAME]
- [ZAHLUNGSZIEL_TAGE]
- [MAHNKOSTEN_REGELUNG]
- [RECHNUNGSFORMAT]
- [E_RECHNUNGSSTANDARD]
- akzeptierte Zahlungsmethoden
- SOW-Anzahlungs-/Raten-/Schlusszahlungslogik
- wiederkehrende Abrechnungsintervalle
- Projektpausierungs-/Abbruchregelung
- Kleinunternehmerstatus – falls relevant
- grenzüberschreitende / Reverse-Charge-Fälle – falls relevant

---

> **Standardhinweis:** Rechnungsangaben und Steuersätze bitte vor erstmaligem Einsatz mit dem Steuerberater abgleichen.
