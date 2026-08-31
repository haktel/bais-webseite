# BAIS – Backup / Recovery / Monitoring Runbook

> Reusable operations template for projects where **MOD-03 – Wartung/Hosting-Setup** is part of the signed SOW.  
> Unknown provider, backup, retention, RTO/RPO, alerting, support or SLA values remain as `[PLACEHOLDER]` and must never be invented.

---

# Language Assumption

- **Section A – Internal Technical Runbook:** English, because command names, provider consoles, incident tooling and engineering procedures are typically easier to maintain consistently in English.
- **Section B – Kunden-Zusammenfassung:** German, because this part may be shared with DACH customers as a plain-language operational summary.
- Project-specific documentation may override the internal language via **[RUNBOOK_INTERNAL_LANGUAGE]** if explicitly required.

---

# Document Family / Scope Relationship

This Runbook belongs to the same delivery family:

**Angebot / SOW → Kunden-Onboarding → Backup / Recovery / Monitoring Runbook → Abnahme / Betrieb**

Canonical module names remain unchanged:

| Module ID | Canonical Module |
|---|---|
| MOD-01 | **Website-Entwicklung** |
| MOD-02 | **Project Portal** |
| MOD-03 | **Wartung/Hosting-Setup** |
| MOD-04 | **Content-Pflege** |

> **Activation rule:** This Runbook is operationally mandatory only if **MOD-03 – Wartung/Hosting-Setup** or an equivalent expressly agreed operations service is in scope.

---

# Project Metadata

**Customer Number:** [KUNDEN_NUMMER]  
**Project Number:** [PROJEKT_NUMMER]  
**SOW Number:** [ANGEBOTSNUMMER]  
**Project Name:** [PROJEKT_NAME]  
**Customer / Auftraggeber:** [KUNDENFIRMA]  
**Provider / Auftragnehmer:** [ANBIETER_FIRMA]  
**Runbook Owner:** [RUNBOOK_OWNER]  
**Technical Owner:** [TECHNICAL_OWNER]  
**Last Reviewed:** [RUNBOOK_LAST_REVIEWED]  
**Next Review:** [RUNBOOK_NEXT_REVIEW]  
**Version:** [RUNBOOK_VERSION]

---

# A. INTERNAL TECHNICAL RUNBOOK

> **INTERNAL USE. Do not send this complete section to the customer unless explicitly approved.**

# 1. Overview & Scope

## 1.1 Covered Systems

Mark only systems actually operated under the signed SOW.

| In Scope | Component | Service / Environment | Owner | Criticality |
|:---:|---|---|---|---|
| [ ] | Website | [WEBSITE_SERVICE] | [OWNER] | [CRITICALITY] |
| [ ] | Project Portal | [PORTAL_SERVICE] | [OWNER] | [CRITICALITY] |
| [ ] | Application Runtime | [RUNTIME_SERVICE] | [OWNER] | [CRITICALITY] |
| [ ] | Database | [DATABASE_SERVICE] | [OWNER] | [CRITICALITY] |
| [ ] | Object/File Storage | [STORAGE_SERVICE] | [OWNER] | [CRITICALITY] |
| [ ] | DNS / Domain | [DNS_PROVIDER] | [OWNER] | [CRITICALITY] |
| [ ] | CDN / WAF | [CDN_WAF_PROVIDER] | [OWNER] | [CRITICALITY] |
| [ ] | Transactional E-Mail | [MAIL_PROVIDER] | [OWNER] | [CRITICALITY] |
| [ ] | Monitoring / Alerting | [MONITORING_PROVIDER] | [OWNER] | [CRITICALITY] |
| [ ] | CI/CD | [CICD_SYSTEM] | [OWNER] | [CRITICALITY] |
| [ ] | Other | [OTHER_COMPONENT] | [OWNER] | [CRITICALITY] |

## 1.2 Environments

- Production: [PRODUCTION_ENVIRONMENT]
- Staging: [STAGING_ENVIRONMENT]
- Development: [DEVELOPMENT_ENVIRONMENT]
- DR / Recovery Environment: [RECOVERY_ENVIRONMENT]
- Region / Data Location: [REGION_DATA_LOCATION]

## 1.3 Explicitly Out of Scope

- [OUT_OF_SCOPE_SYSTEM_1]
- [OUT_OF_SCOPE_SYSTEM_2]
- [OUT_OF_SCOPE_SYSTEM_3]

## 1.4 Operational Objectives

- Availability objective: [AVAILABILITY_OBJECTIVE]
- Recovery Time Objective (RTO): [RTO]
- Recovery Point Objective (RPO): [RPO]
- Maximum acceptable data loss: [MAX_ACCEPTABLE_DATA_LOSS]
- Support window: [SUPPORT_WINDOW]

> RTO/RPO are planning targets unless explicitly made contractually binding in SOW/SLA.

---

# 2. Backup Strategy

## 2.1 Backup Matrix

| Asset | Backup Method | Frequency | Retention | Storage Location | Encryption | Responsible |
|---|---|---|---|---|---|---|
| Database | [DB_BACKUP_METHOD] | [DB_BACKUP_FREQUENCY] | [DB_RETENTION] | [DB_BACKUP_LOCATION] | [DB_BACKUP_ENCRYPTION] | [DB_BACKUP_OWNER] |
| Uploaded Files | [FILES_BACKUP_METHOD] | [FILES_BACKUP_FREQUENCY] | [FILES_RETENTION] | [FILES_BACKUP_LOCATION] | [FILES_BACKUP_ENCRYPTION] | [FILES_BACKUP_OWNER] |
| Application Config | [CONFIG_BACKUP_METHOD] | [CONFIG_BACKUP_FREQUENCY] | [CONFIG_RETENTION] | [CONFIG_BACKUP_LOCATION] | [CONFIG_BACKUP_ENCRYPTION] | [CONFIG_BACKUP_OWNER] |
| Infrastructure Config | [IAC_BACKUP_METHOD] | [IAC_BACKUP_FREQUENCY] | [IAC_RETENTION] | [IAC_BACKUP_LOCATION] | [IAC_BACKUP_ENCRYPTION] | [IAC_BACKUP_OWNER] |
| DNS Configuration | [DNS_BACKUP_METHOD] | [DNS_BACKUP_FREQUENCY] | [DNS_RETENTION] | [DNS_BACKUP_LOCATION] | [DNS_BACKUP_ENCRYPTION] | [DNS_BACKUP_OWNER] |
| Secrets Metadata* | [SECRETS_BACKUP_METHOD] | [SECRETS_BACKUP_FREQUENCY] | [SECRETS_RETENTION] | [SECRET_MANAGER_REFERENCE] | [SECRETS_ENCRYPTION] | [SECRETS_OWNER] |

* Do not export plaintext secrets into this Runbook.

## 2.2 Backup Principles

- [ ] Backups are separated from the primary runtime where technically possible.
- [ ] Backup access follows least privilege.
- [ ] Backup data is encrypted in transit.
- [ ] Backup data is encrypted at rest where supported / required.
- [ ] Retention is aligned with [RETENTION_POLICY_REFERENCE].
- [ ] Personal data retention is aligned with [PRIVACY_RETENTION_REFERENCE].
- [ ] Backup deletion / lifecycle policies are documented.
- [ ] Backups are protected against accidental deletion where available.
- [ ] At least one restore path is independent of the current deployment.
- [ ] Backup jobs emit success/failure evidence.

## 2.3 Backup Failure Handling

If a scheduled backup fails:

1. Confirm whether the failure is real or a monitoring false positive.
2. Record incident / operational ticket: [TICKET_SYSTEM_REFERENCE].
3. Retry only if the cause is understood and retry is safe.
4. If the expected RPO may be violated, classify incident as at least [BACKUP_FAILURE_SEVERITY].
5. Notify [BACKUP_FAILURE_CONTACT].
6. Document the resulting backup gap.
7. Verify the next successful backup.
8. Escalate according to Section 7 if the gap exceeds [MAX_BACKUP_GAP].

---

# 3. Backup Verification

> A backup is not considered reliable only because the backup job returned “success”.

## 3.1 Verification Schedule

| Verification | Frequency | Environment | Evidence | Owner |
|---|---|---|---|---|
| Backup job status review | [BACKUP_STATUS_REVIEW_FREQUENCY] | [ENVIRONMENT] | [EVIDENCE_LOCATION] | [OWNER] |
| Database restore test | [DB_RESTORE_TEST_FREQUENCY] | [RESTORE_TEST_ENVIRONMENT] | [EVIDENCE_LOCATION] | [OWNER] |
| File restore test | [FILE_RESTORE_TEST_FREQUENCY] | [RESTORE_TEST_ENVIRONMENT] | [EVIDENCE_LOCATION] | [OWNER] |
| Full recovery exercise | [FULL_RECOVERY_TEST_FREQUENCY] | [RECOVERY_ENVIRONMENT] | [EVIDENCE_LOCATION] | [OWNER] |

## 3.2 Database Restore Verification

Checklist:

- [ ] Select restore point: [RESTORE_POINT]
- [ ] Restore into non-production target: [RESTORE_TARGET]
- [ ] Validate schema / migrations
- [ ] Validate row counts / integrity checks
- [ ] Validate critical application queries
- [ ] Validate authentication / authorization tables where applicable
- [ ] Validate customer / tenant isolation
- [ ] Record actual restore duration
- [ ] Compare against [RTO]
- [ ] Record recovery point achieved
- [ ] Compare against [RPO]
- [ ] Destroy test restore after validation according to [TEST_DATA_DELETION_POLICY]

## 3.3 Restore Test Result

**Date:** [RESTORE_TEST_DATE]  
**Backup ID / Snapshot:** [BACKUP_ID]  
**Tester:** [RESTORE_TESTER]  
**Result:** [PASS_FAIL]  
**Restore Duration:** [ACTUAL_RESTORE_DURATION]  
**Recovered Up To:** [RECOVERY_POINT]  
**Issues:** [RESTORE_TEST_ISSUES]  
**Evidence:** [RESTORE_TEST_EVIDENCE_LINK]

---

# 4. Monitoring & Alerting

## 4.1 Monitoring Matrix

| Signal | Metric / Check | Warning Threshold | Critical Threshold | Window | Owner |
|---|---|---|---|---|---|
| Availability | [UPTIME_CHECK] | [UPTIME_WARNING] | [UPTIME_CRITICAL] | [WINDOW] | [OWNER] |
| Response Time | [RESPONSE_TIME_METRIC] | [RESPONSE_WARNING] | [RESPONSE_CRITICAL] | [WINDOW] | [OWNER] |
| HTTP Errors | [HTTP_ERROR_METRIC] | [ERROR_WARNING] | [ERROR_CRITICAL] | [WINDOW] | [OWNER] |
| CPU | [CPU_METRIC] | [CPU_WARNING] | [CPU_CRITICAL] | [WINDOW] | [OWNER] |
| Memory | [MEMORY_METRIC] | [MEMORY_WARNING] | [MEMORY_CRITICAL] | [WINDOW] | [OWNER] |
| Disk / Storage | [DISK_METRIC] | [DISK_WARNING] | [DISK_CRITICAL] | [WINDOW] | [OWNER] |
| Database | [DB_HEALTH_METRIC] | [DB_WARNING] | [DB_CRITICAL] | [WINDOW] | [OWNER] |
| Backup Job | [BACKUP_JOB_METRIC] | [BACKUP_WARNING] | [BACKUP_CRITICAL] | [WINDOW] | [OWNER] |
| TLS Certificate | [TLS_METRIC] | [TLS_WARNING] | [TLS_CRITICAL] | [WINDOW] | [OWNER] |
| DNS | [DNS_METRIC] | [DNS_WARNING] | [DNS_CRITICAL] | [WINDOW] | [OWNER] |
| Security Events | [SECURITY_METRIC] | [SECURITY_WARNING] | [SECURITY_CRITICAL] | [WINDOW] | [OWNER] |

## 4.2 Alert Routing

- Monitoring system: [MONITORING_SYSTEM]
- Primary alert channel: [ALERT_CHANNEL_PRIMARY]
- Secondary alert channel: [ALERT_CHANNEL_SECONDARY]
- On-call recipient: [ON_CALL_CONTACT]
- Customer notification channel: [CUSTOMER_NOTIFICATION_CHANNEL]
- Ticket / Incident system: [INCIDENT_SYSTEM]
- Status page: [STATUS_PAGE_URL]

## 4.3 Alert Quality Rules

- [ ] Every critical alert has an owner.
- [ ] Every alert has a documented action.
- [ ] Duplicate/noisy alerts are reviewed.
- [ ] Monitoring credentials are stored in [PASSWORD_MANAGER_REFERENCE].
- [ ] Alerts do not expose secrets or personal data.
- [ ] Alert acknowledgement is recorded.
- [ ] Missing telemetry is itself monitored where applicable.

---

# 5. Incident Severity Levels

> Reaction times must be copied from the signed SLA/SOW if contractually agreed. Do not invent values.

| Severity | Definition | Example | Target Reaction Time | Update Cadence | Customer Notification |
|---|---|---|---|---|---|
| **P1 – Critical** | Complete outage, severe security event, or major business-critical loss of service | [P1_EXAMPLE] | [REAKTIONSZEIT_P1] | [UPDATE_INTERVAL_P1] | [P1_NOTIFICATION_RULE] |
| **P2 – High** | Major degradation or important function unavailable; workaround may exist | [P2_EXAMPLE] | [REAKTIONSZEIT_P2] | [UPDATE_INTERVAL_P2] | [P2_NOTIFICATION_RULE] |
| **P3 – Normal** | Limited defect, non-critical function affected, no major operational impact | [P3_EXAMPLE] | [REAKTIONSZEIT_P3] | [UPDATE_INTERVAL_P3] | [P3_NOTIFICATION_RULE] |
| **P4 – Low / Request** | Cosmetic issue, improvement, maintenance request | [P4_EXAMPLE] | [REAKTIONSZEIT_P4] | [UPDATE_INTERVAL_P4] | [P4_NOTIFICATION_RULE] |

## Severity Decision Questions

1. Is production unavailable?
2. Is customer data unavailable, corrupted or at risk?
3. Is there evidence of unauthorized access?
4. Is there active business impact?
5. Is a safe workaround available?
6. Is the incident expanding?
7. Is an agreed RTO/RPO at risk?

If uncertain between two levels, initially classify as the higher severity and downgrade only with evidence.

---

# 6. Recovery Procedures

## Global Incident Rules

For every recovery scenario:

- Do not destroy evidence before root cause is understood.
- Do not perform destructive recovery steps without a verified restore point.
- Prefer reversible changes.
- Record timestamps in [INCIDENT_TIMELINE_LOCATION].
- Maintain one incident owner.
- Separate incident communication from technical execution.
- Never paste production secrets into tickets, chat logs or this Runbook.

---

## 6A. Scenario A – Website / Server Completely Down

### First 15 Minutes

**0–5 min**

1. Acknowledge alert / report.
2. Open incident [INCIDENT_ID].
3. Assign incident owner: [INCIDENT_COMMANDER].
4. Confirm outage independently using [EXTERNAL_HEALTH_CHECK].
5. Check whether DNS, CDN/WAF, runtime or origin is failing.
6. Classify severity.

**5–10 min**

7. Check last deploy / configuration change.
8. Check provider status: [HOSTING_PROVIDER_STATUS_PAGE].
9. Check application logs: [APPLICATION_LOG_LOCATION].
10. Check infrastructure metrics: [INFRA_DASHBOARD].
11. Decide: rollback, restart/failover, or provider escalation.

**10–15 min**

12. Start the safest recovery action.
13. Notify [INTERNAL_ESCALATION_CONTACT].
14. Notify customer according to [CUSTOMER_NOTIFICATION_RULE].
15. Record next update time.

### Diagnostic Checklist

- [ ] DNS resolves correctly
- [ ] TLS certificate valid
- [ ] CDN/WAF reachable
- [ ] origin/runtime healthy
- [ ] deployment present
- [ ] application process healthy
- [ ] database reachable
- [ ] storage reachable
- [ ] dependency/provider outage checked
- [ ] recent changes identified

### Recovery Procedure

1. [WEBSITE_RECOVERY_STEP_1]
2. [WEBSITE_RECOVERY_STEP_2]
3. [WEBSITE_RECOVERY_STEP_3]
4. [WEBSITE_RECOVERY_STEP_4]
5. [WEBSITE_RECOVERY_STEP_5]

### Commands / Provider Procedures

```text
[WEBSITE_RECOVERY_COMMANDS_OR_PROVIDER_STEPS]
```

### Recovery Validation

- [ ] homepage returns expected status
- [ ] critical application route works
- [ ] login works if applicable
- [ ] Project Portal authorization works if applicable
- [ ] database-backed function works
- [ ] external monitoring is green
- [ ] error rate normalized
- [ ] customer-visible validation completed

---

## 6B. Scenario B – Database Corrupted / Lost

### First 15 Minutes

**0–5 min**

1. Declare incident and freeze risky writes if possible.
2. Preserve logs and evidence.
3. Identify affected database / tenant scope.
4. Identify last known good state.
5. Confirm latest verified backup.

**5–10 min**

6. Determine whether corruption is logical, partial or total.
7. Estimate current data-loss window.
8. Compare against [RPO].
9. Select restore target [DB_RESTORE_TARGET].
10. Prevent accidental overwrite of the last usable copy.

**10–15 min**

11. Begin restore according to approved DB procedure.
12. Notify [DB_ESCALATION_CONTACT].
13. Communicate expected impact according to [CUSTOMER_NOTIFICATION_RULE].
14. Preserve pre-restore copy if technically possible.
15. Record every destructive action before execution.

### Database Recovery Procedure

1. Stop or isolate writes: [DB_WRITE_FREEZE_PROCEDURE]
2. Create emergency snapshot if possible: [DB_EMERGENCY_SNAPSHOT_PROCEDURE]
3. Select backup: [DB_BACKUP_SELECTION_PROCEDURE]
4. Restore to validation target: [DB_RESTORE_VALIDATION_TARGET]
5. Run integrity checks: [DB_INTEGRITY_CHECKS]
6. Validate schema version: [DB_SCHEMA_VALIDATION]
7. Validate critical data: [DB_DATA_VALIDATION]
8. Validate tenant isolation: [DB_TENANT_VALIDATION]
9. Promote restored database: [DB_PROMOTION_PROCEDURE]
10. Re-enable writes: [DB_WRITE_ENABLE_PROCEDURE]
11. Monitor error rate and consistency.

### Commands / Provider Procedures

```text
[DATABASE_RECOVERY_COMMANDS_OR_PROVIDER_STEPS]
```

### Recovery Validation

- [ ] schema valid
- [ ] application connects
- [ ] authentication works
- [ ] customer records isolated by tenant
- [ ] critical row/data checks passed
- [ ] writes succeed
- [ ] backups resume
- [ ] achieved recovery point documented
- [ ] actual RTO/RPO result documented

---

## 6C. Scenario C – Bad Deployment / Rollback

### First 15 Minutes

**0–5 min**

1. Stop further production deployments.
2. Identify bad release: [BAD_RELEASE_ID].
3. Identify last known good release: [LAST_GOOD_RELEASE_ID].
4. Confirm whether the release contains a database migration.
5. Classify severity.

**5–10 min**

6. Check whether code-only rollback is safe.
7. Check forward/backward DB compatibility.
8. Preserve logs and deployment metadata.
9. Decide rollback vs. hotfix.
10. Announce deployment freeze internally.

**10–15 min**

11. Execute approved rollback.
12. Run smoke tests.
13. Confirm monitoring recovery.
14. Notify customer if required.
15. Keep deployment freeze until incident owner releases it.

### Rollback Procedure

1. [ROLLBACK_STEP_1]
2. [ROLLBACK_STEP_2]
3. [ROLLBACK_STEP_3]
4. [ROLLBACK_STEP_4]
5. [ROLLBACK_STEP_5]

### Commands / CI/CD Procedure

```text
[ROLLBACK_COMMANDS_OR_CICD_STEPS]
```

### Database Migration Warning

If the bad release includes a database migration:

- [ ] confirm migration reversibility
- [ ] confirm backup/snapshot exists
- [ ] do not blindly revert application code
- [ ] use [DB_MIGRATION_ROLLBACK_PROCEDURE]
- [ ] validate application/database compatibility

### Rollback Validation

- [ ] correct release active
- [ ] health checks green
- [ ] error rate normalized
- [ ] core business workflow works
- [ ] customer login / Project Portal works if applicable
- [ ] monitoring stable for [POST_ROLLBACK_OBSERVATION_WINDOW]

---

# 7. Escalation Path

## 7.1 Escalation Matrix

| Trigger | Escalate To | Time / Condition | Channel | Owner |
|---|---|---|---|---|
| P1 declared | [P1_INTERNAL_ESCALATION] | immediately / [P1_ESCALATION_TIME] | [CHANNEL] | [OWNER] |
| RTO at risk | [RTO_ESCALATION_CONTACT] | [RTO_ESCALATION_CONDITION] | [CHANNEL] | [OWNER] |
| RPO at risk | [RPO_ESCALATION_CONTACT] | [RPO_ESCALATION_CONDITION] | [CHANNEL] | [OWNER] |
| Provider outage | [PROVIDER_SUPPORT] | [PROVIDER_ESCALATION_CONDITION] | [CHANNEL] | [OWNER] |
| Security suspicion | [SECURITY_CONTACT] | immediately / [SECURITY_ESCALATION_RULE] | [CHANNEL] | [OWNER] |
| Customer business impact | [CUSTOMER_ESCALATION_CONTACT] | [CUSTOMER_ESCALATION_RULE] | [CHANNEL] | [OWNER] |
| Legal/privacy concern | [PRIVACY_LEGAL_CONTACT] | [PRIVACY_ESCALATION_RULE] | [CHANNEL] | [OWNER] |

## 7.2 Escalation Message Template

**Incident:** [INCIDENT_ID]  
**Severity:** [SEVERITY]  
**Started:** [INCIDENT_START]  
**Affected System:** [AFFECTED_SYSTEM]  
**Customer Impact:** [CUSTOMER_IMPACT]  
**Current Status:** [CURRENT_STATUS]  
**Actions Taken:** [ACTIONS_TAKEN]  
**Next Action:** [NEXT_ACTION]  
**Next Update:** [NEXT_UPDATE_TIME]  
**Incident Owner:** [INCIDENT_COMMANDER]

---

# 8. Post-Incident Review

## 8.1 When Required

A Post-Incident Review is required for:

- [ ] every P1
- [ ] every P2 matching [PIR_P2_RULE]
- [ ] any confirmed data loss
- [ ] any unauthorized-access event
- [ ] any RTO/RPO breach
- [ ] repeated incidents with the same cause
- [ ] customer-requested review where contractually applicable

## 8.2 PIR Template

**Incident ID:** [INCIDENT_ID]  
**Date:** [INCIDENT_DATE]  
**Severity:** [SEVERITY]  
**Duration:** [INCIDENT_DURATION]  
**Affected Systems:** [AFFECTED_SYSTEMS]  
**Customer Impact:** [CUSTOMER_IMPACT]

### Timeline

| Time | Event / Action | Owner |
|---|---|---|
| [TIME] | [EVENT] | [OWNER] |
| [TIME] | [EVENT] | [OWNER] |
| [TIME] | [EVENT] | [OWNER] |

### Root Cause

[ROOT_CAUSE]

### Contributing Factors

- [CONTRIBUTING_FACTOR_1]
- [CONTRIBUTING_FACTOR_2]
- [CONTRIBUTING_FACTOR_3]

### What Worked

- [WHAT_WORKED_1]
- [WHAT_WORKED_2]

### What Failed / Was Missing

- [GAP_1]
- [GAP_2]

### Corrective Actions

| Action | Owner | Due Date | Priority | Status |
|---|---|---|---|---|
| [ACTION_1] | [OWNER] | [DATE] | [PRIORITY] | [STATUS] |
| [ACTION_2] | [OWNER] | [DATE] | [PRIORITY] | [STATUS] |

### Runbook Update Required

- [ ] No
- [ ] Yes → section(s): [RUNBOOK_UPDATE_SECTIONS]

---

# 9. Communication & Access References

> Store references only. Never store plaintext passwords, API tokens, recovery codes or private keys in this Runbook.

## 9.1 Access References

| System | Account / Scope | Credential Location | Access Owner | MFA |
|---|---|---|---|:---:|
| Hosting | [HOSTING_ACCOUNT] | [PASSWORD_MANAGER_HOSTING_LINK] | [OWNER] | [ ] |
| DNS | [DNS_ACCOUNT] | [PASSWORD_MANAGER_DNS_LINK] | [OWNER] | [ ] |
| Database | [DB_ACCOUNT] | [PASSWORD_MANAGER_DB_LINK] | [OWNER] | [ ] |
| Storage | [STORAGE_ACCOUNT] | [PASSWORD_MANAGER_STORAGE_LINK] | [OWNER] | [ ] |
| Monitoring | [MONITORING_ACCOUNT] | [PASSWORD_MANAGER_MONITORING_LINK] | [OWNER] | [ ] |
| CI/CD | [CICD_ACCOUNT] | [PASSWORD_MANAGER_CICD_LINK] | [OWNER] | [ ] |
| E-Mail Provider | [MAIL_ACCOUNT] | [PASSWORD_MANAGER_MAIL_LINK] | [OWNER] | [ ] |

## 9.2 Onboarding References

- Kunden-Onboarding record: [ONBOARDING_RECORD_LINK]
- Secure credential channel: [SICHERER_CREDENTIAL_KANAL]
- Project Portal: [PROJECT_PORTAL_NAME_ODER_URL]
- SOW / Scope: [SOW_DOCUMENT_LINK]
- SLA / Support agreement: [SLA_DOCUMENT_LINK]
- AVV / DPA: [AVV_DOCUMENT_LINK]

## 9.3 Incident Contacts

- Internal primary: [INTERNAL_PRIMARY_CONTACT]
- Internal secondary: [INTERNAL_SECONDARY_CONTACT]
- Customer primary: [CUSTOMER_PRIMARY_CONTACT]
- Customer emergency contact: [CUSTOMER_EMERGENCY_CONTACT]
- Hosting provider support: [HOSTING_SUPPORT_CONTACT]
- Security contact: [SECURITY_CONTACT]
- Privacy / legal contact: [PRIVACY_LEGAL_CONTACT]

---

# B. KUNDEN-ZUSAMMENFASSUNG

> **Diese Kurzfassung kann dem Kunden bereitgestellt oder dem SOW / Wartungsvertrag als verständliche Betriebsübersicht beigefügt werden.**

# 10. Was ist abgedeckt?

Für das Projekt **[PROJEKT_NAME]** gelten im Rahmen des beauftragten Moduls **MOD-03 – Wartung/Hosting-Setup** die nachfolgend dokumentierten Betriebsmaßnahmen.

## Backup

Gesichert werden – soweit für Ihr Projekt beauftragt und technisch relevant:

- [ ] Datenbank
- [ ] hochgeladene Dateien / Dokumente
- [ ] relevante System-/Anwendungskonfiguration
- [ ] Infrastrukturkonfiguration
- [ ] weitere Daten: [WEITERE_BACKUP_DATEN]

**Backup-Häufigkeit:** [BACKUP_SIKLIGI]  
**Aufbewahrungsdauer:** [BACKUP_RETENTION]  
**Backup-Speicher:** [BACKUP_SPEICHER_KURZBESCHREIBUNG]

Die Wiederherstellbarkeit wird gemäß **[RESTORE_TEST_INTERVALL]** geprüft.

## Monitoring

Überwacht werden – soweit beauftragt:

- Erreichbarkeit
- Antwortzeiten
- Fehlerzustände
- relevante Systemressourcen
- Datenbankzustand
- Backup-Status
- [WEITERE_MONITORING_PUNKTE]

## Störungsbearbeitung

Störungen werden nach ihrer Auswirkung priorisiert.

| Priorität | Bedeutung | Vereinbarte / geplante Reaktionszeit |
|---|---|---|
| P1 | kritischer Ausfall / schwerwiegende Beeinträchtigung | [REAKTIONSZEIT_P1] |
| P2 | erhebliche Beeinträchtigung | [REAKTIONSZEIT_P2] |
| P3 | normale Störung ohne kritischen Gesamtausfall | [REAKTIONSZEIT_P3] |

> **Wichtiger Hinweis:** Die oben genannten Zeiten sind nur dann verbindliche SLA-Zusagen, wenn sie ausdrücklich im unterschriebenen SOW, Wartungsvertrag oder SLA vereinbart wurden. Andernfalls dienen sie als betriebliche Zielwerte.

## Wiederherstellung

Für technische Ausfälle bestehen dokumentierte Verfahren insbesondere für:

- vollständigen Ausfall der Website / Laufzeitumgebung,
- Wiederherstellung der Datenbank,
- Rollback nach fehlerhaftem Deployment.

**RTO / angestrebte Wiederherstellungszeit:** [RTO]  
**RPO / angestrebter Wiederherstellungspunkt:** [RPO]

Auch RTO/RPO sind nur dann garantierte Vertragswerte, wenn dies ausdrücklich vereinbart wurde.

---

# 11. Was sollte der Kunde im Notfall tun?

Wenn Sie eine Störung feststellen:

1. Prüfen Sie kurz, ob das Problem auch auf einem zweiten Gerät / Anschluss reproduzierbar ist, sofern dies ohne Verzögerung möglich ist.
2. Melden Sie die Störung über **[KUNDEN_SUPPORT_KANAL]**.
3. Geben Sie – soweit bekannt – folgende Informationen an:
   - betroffene URL / Funktion,
   - Zeitpunkt der Beobachtung,
   - kurze Fehlerbeschreibung,
   - Screenshot ohne Passwörter oder vertrauliche Daten,
   - betroffene Benutzer / Geschäftsprozess,
   - Dringlichkeit / Geschäftsauswirkung.
4. Bei einem als kritisch vereinbarten Notfall verwenden Sie **[KUNDEN_NOTFALL_KANAL]**.
5. Senden Sie niemals Passwörter, API-Schlüssel oder Recovery-Codes per normaler E-Mail.

## Kunden-Störungsmeldung – Kurzvorlage

**Projekt:** [PROJEKT_NAME]  
**Kunden-Nr.:** [KUNDEN_NUMMER]  
**Betroffene Funktion:** [BETROFFENE_FUNKTION]  
**Seit wann:** [STOERUNG_SEIT]  
**Fehlerbeschreibung:** [FEHLERBESCHREIBUNG]  
**Geschäftsauswirkung:** [GESCHAEFTSAUSWIRKUNG]  
**Kontakt für Rückfragen:** [KUNDEN_KONTAKT]

---

# Usage Notes / Nutzungshinweise

1. **Review this Runbook regularly** – at minimum according to [RUNBOOK_REVIEW_INTERVAL] and after material architecture/provider changes.
2. **Test restores before a real incident.** A backup strategy without a successful restore test is incomplete.
3. **Do not invent SLA, RTO, RPO, backup or retention values.** Copy them from the signed SOW/SLA or leave placeholders until approved.
4. **Keep credentials outside the Runbook.** Store only references to the approved password/secret manager.
5. **Update after incidents.** Every significant incident should verify whether monitoring thresholds, escalation paths or recovery steps need revision.
6. **Keep terminology aligned** with SOW, Kunden-Onboarding and Abnahmeprotokoll, especially **MOD-03 – Wartung/Hosting-Setup**.

---

# Mandatory Fields Before Operational Use

- [KUNDEN_NUMMER]
- [PROJEKT_NUMMER]
- [ANGEBOTSNUMMER]
- [PROJEKT_NAME]
- [HOSTING_PROVIDER]
- [DATABASE_SERVICE]
- [BACKUP_SIKLIGI]
- [DB_BACKUP_FREQUENCY]
- [FILES_BACKUP_FREQUENCY]
- [BACKUP_RETENTION]
- [RTO]
- [RPO]
- [REAKTIONSZEIT_P1]
- [REAKTIONSZEIT_P2]
- [REAKTIONSZEIT_P3]
- [MONITORING_SYSTEM]
- [ALERT_CHANNEL_PRIMARY]
- [INCIDENT_SYSTEM]
- [SICHERER_CREDENTIAL_KANAL]
- [PASSWORD_MANAGER_REFERENCE]
- [CUSTOMER_NOTIFICATION_CHANNEL]
- [KUNDEN_SUPPORT_KANAL]
- [KUNDEN_NOTFALL_KANAL]
- provider status pages / escalation contacts actually in use
