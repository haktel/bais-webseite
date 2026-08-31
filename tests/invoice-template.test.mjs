import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("invoice template contains all requested legal and commercial sections",()=>{
 const source=read("docs/finance/rechnung-zahlungsbedingungen-vorlage.md");
 for(const required of[
  "1. Kopfzeile",
  "2. Rechnungspositionen",
  "3. Summen",
  "4. Zahlungsinformationen",
  "5. Rechtliche Rechnungsangaben",
  "6. Wiederkehrende Rechnung",
  "7. Zahlungsziel & Fälligkeit",
  "8. Zahlungsverzug / Mahnwesen",
  "9. Zahlungsmethoden",
  "10. Besondere Bedingungen bei Projektpausierung / Projektabbruch"
 ]) assert.ok(source.includes(required),"missing "+required);
});

test("invoice template aligns with canonical SOW modules and payment lifecycle",()=>{
 const source=read("docs/finance/rechnung-zahlungsbedingungen-vorlage.md");
 for(const required of[
  "MOD-01 – Website-Entwicklung",
  "MOD-02 – Project Portal",
  "MOD-03 – Wartung/Hosting-Setup",
  "MOD-04 – Content-Pflege",
  "ANZAHLUNGSRECHNUNG",
  "SCHLUSSRECHNUNG",
  "WIEDERKEHRENDE RECHNUNG",
  "[ABNAHME_REFERENZ]"
 ]) assert.ok(source.includes(required),"missing "+required);
});

test("invoice template preserves unknown tax and payment values as placeholders",()=>{
 const source=read("docs/finance/rechnung-zahlungsbedingungen-vorlage.md");
 for(const required of[
  "[STEUERSTATUS]",
  "[UST_SATZ]",
  "[IBAN]",
  "[ZAHLUNGSZIEL_TAGE]",
  "[RECHNUNGSFORMAT]",
  "[E_RECHNUNGSSTANDARD]",
  "[PROJEKTABBRUCH_REGELUNG]"
 ]) assert.ok(source.includes(required),"missing "+required);
 assert.ok(source.includes("§ 19 UStG"));
 assert.ok(source.includes("§ 288 BGB"));
 assert.ok(source.includes("Rechnungsangaben und Steuersätze bitte vor erstmaligem Einsatz mit dem Steuerberater abgleichen"));
});

test("invoice admin view is protected by parent admin middleware and linked from control center",()=>{
 const page=read("admin/rechnung/index.html");
 const admin=read("admin/index.html");
 const middleware=read("functions/admin/_middleware.js");
 assert.ok(page.includes("Rechnung erstellen & drucken"));
 assert.ok(admin.includes("/admin/rechnung/"));
 assert.ok(middleware.includes("requireAdmin"));
 assert.ok(page.includes("noindex,nofollow,noarchive"));
});
