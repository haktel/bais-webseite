import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("AVV contains the mandatory Art. 28 operational sections",()=>{
 const html=read("avv/index.html").toLowerCase();
 for(const needle of[
  "art. 28 dsgvo",
  "weisungen des auftraggebers",
  "vertraulichkeit",
  "technische und organisatorische maßnahmen",
  "verletzungen des schutzes personenbezogener daten",
  "weitere auftragsverarbeiter / subprozessoren",
  "drittlandübermittlungen",
  "nachweise und kontrollen",
  "löschung, rückgabe",
  "anlage 1",
  "anlage 2",
  "anlage 3"
 ])assert.equal(html.includes(needle),true,"missing AVV section: "+needle);
});

test("AVV does not claim blanket approval for unknown AI or SaaS subprocessors",()=>{
 const html=read("avv/index.html");
 assert.match(html,/Weitere AI-\/Cloud-\/SaaS-Anbieter/i);
 assert.match(html,/nicht pauschal genehmigt/i);
 assert.match(html,/nur nach Freigabe/i);
});

test("privacy notice discloses RepoCloud n8n and data minimization",()=>{
 const html=read("datenschutz/index.html");
 assert.match(html,/RepoCloud, LLC/i);
 assert.match(html,/Privacy-minimierte Qualifizierung/i);
 assert.match(html,/Name, E-Mail-Adresse, Telefonnummer und Unternehmen/i);
 assert.match(html,/AVV \/ DPA/i);
});

test("AVV is discoverable contextually without being a global homepage footer link",()=>{
 const home=read("index.html"),privacy=read("datenschutz/index.html"),offer=read("angebot/index.html"),sitemap=read("sitemap.xml");
 assert.doesNotMatch(home,/avv\/index\.html[^>]*>AVV \/ DPA/i);
 assert.match(privacy,/AVV \/ DPA/i);
 assert.match(offer,/href="\.\.\/avv\/"[^>]*>AVV \/ DPA/i);
 assert.match(sitemap,/https:\/\/bais-solutions\.de\/avv\//i);
});
