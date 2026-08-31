const ALPHABET="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CERTIFICATE_CODE_PATTERN=/^BAIS-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
export function createCertificateCode(){
 const bytes=new Uint8Array(12);crypto.getRandomValues(bytes);
 const chars=[...bytes].map(byte=>ALPHABET[byte%ALPHABET.length]).join("");
 return "BAIS-"+chars.slice(0,4)+"-"+chars.slice(4,8)+"-"+chars.slice(8,12);
}
export async function ensureCertificateSchema(db){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS certificates(id TEXT PRIMARY KEY,public_code TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL,course_id TEXT,title TEXT NOT NULL,issued_at TEXT NOT NULL,revoked_at TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id,issued_at)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id,issued_at)")
 ]);
}

export function maskCertificateHolder(value){
 const parts=String(value||"").trim().split(/\s+/).filter(Boolean);
 if(!parts.length)return "";
 return parts.map(part=>part.slice(0,1).toUpperCase()+".").join(" ");
}
