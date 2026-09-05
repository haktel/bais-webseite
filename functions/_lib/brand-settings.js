import{ApiError,cleanText}from"./api.js";

export const BRAND_DEFAULTS=Object.freeze({
 primaryNavy:"#0B2D45",
 teal:"#00B3A4",
 gold:"#D4A833",
 neutral:"#F4F7FA",
 fontBody:"Inter",
 fontHeading:"Georgia",
 radius:"8",
 containerWidth:"1280",
 brandTagline:"IT / AI / SECURITY",
 brandSlogan:"Intelligence Secures Progress",
 headerCtaLabel:"Projekt einordnen",
 issuerName:"BAIS Academy",
 signerName:"Bünyamin Atik",
 signerRole:"Inhaber, BAIS",
 verificationUrl:"https://bais-solutions.de/zertifikat",
 certificateIdPattern:"BAIS-{YYYY}-{RANDOM6}",
 certificateBorderStyle:"double-gold",
 certificateWatermark:"on",
 letterheadFooter:"BAIS · Bünyamin Atik – IT Solutions · bais-solutions.de",
 emailSignatureSlogan:"Sichere Technologie. Stärkere Möglichkeiten.",
 localeDefault:"de-DE"
});

const KEYS=new Set(Object.keys(BRAND_DEFAULTS));
const COLOR=/^#[0-9A-F]{6}$/i;
const FONT=/^[A-Za-z0-9 .,'-]{2,48}$/;
const ENUMS={certificateBorderStyle:new Set(["double-gold","single-gold","minimal"]),certificateWatermark:new Set(["on","off"]),localeDefault:new Set(["de-DE","en-US","tr-TR"])};

export async function ensureBrandSettingsSchema(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS brand_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
 )`).run();
}

function normalizeValue(key,value){
 const raw=String(value??"").trim();
 if(["primaryNavy","teal","gold","neutral"].includes(key)){
  if(!COLOR.test(raw))throw new ApiError(400,"invalid_brand_color",`Ungültiger Farbwert für ${key}.`);
  return raw.toUpperCase();
 }
 if(key==="radius"){
  const n=Number(raw);if(!Number.isInteger(n)||n<0||n>32)throw new ApiError(400,"invalid_brand_radius","Radius muss zwischen 0 und 32 px liegen.");return String(n);
 }
 if(key==="containerWidth"){
  const n=Number(raw);if(!Number.isInteger(n)||n<960||n>1600)throw new ApiError(400,"invalid_container_width","Container-Breite muss zwischen 960 und 1600 px liegen.");return String(n);
 }
 if(key==="fontBody"||key==="fontHeading"){
  if(!FONT.test(raw))throw new ApiError(400,"invalid_brand_font","Ungültige Schriftangabe.");return raw;
 }
 if(ENUMS[key]){
  if(!ENUMS[key].has(raw))throw new ApiError(400,"invalid_brand_option",`Ungültige Auswahl für ${key}.`);return raw;
 }
 if(key==="verificationUrl"){
  let url;try{url=new URL(raw);}catch{throw new ApiError(400,"invalid_verification_url","Ungültige Verifikations-URL.");}
  if(url.protocol!=="https:")throw new ApiError(400,"invalid_verification_url","Verifikations-URL muss HTTPS verwenden.");
  return url.toString().slice(0,240);
 }
 const max={brandTagline:80,brandSlogan:120,headerCtaLabel:60,issuerName:100,signerName:100,signerRole:100,certificateIdPattern:80,letterheadFooter:220,emailSignatureSlogan:140}[key]||160;
 const text=cleanText(raw,max);
 if(!text)throw new ApiError(400,"invalid_brand_value",`Wert für ${key} darf nicht leer sein.`);
 return text;
}

export function normalizeBrandPatch(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new ApiError(400,"invalid_brand_payload","Einstellungsobjekt wird erwartet.");
 const out={};
 for(const[key,value]of Object.entries(input)){
  if(!KEYS.has(key))throw new ApiError(400,"unknown_brand_setting",`Unbekannte Einstellung: ${key}`);
  out[key]=normalizeValue(key,value);
 }
 if(!Object.keys(out).length)throw new ApiError(400,"empty_brand_patch","Keine Änderungen übermittelt.");
 return out;
}

export async function getBrandSettings(db){
 await ensureBrandSettingsSchema(db);
 const result=await db.prepare("SELECT setting_key,setting_value FROM brand_settings").all();
 const settings={...BRAND_DEFAULTS};
 for(const row of result.results||[])if(KEYS.has(row.setting_key))settings[row.setting_key]=row.setting_value;
 return settings;
}

export async function updateBrandSettings(db,input){
 await ensureBrandSettingsSchema(db);
 const patch=normalizeBrandPatch(input),now=new Date().toISOString();
 const statements=Object.entries(patch).map(([key,value])=>db.prepare("INSERT INTO brand_settings(setting_key,setting_value,updated_at) VALUES(?,?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at").bind(key,value,now));
 if(statements.length)await db.batch(statements);
 return getBrandSettings(db);
}
