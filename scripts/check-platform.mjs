import{readFile,readdir}from"node:fs/promises";
const required=["functions/api/contact.js","functions/api/academy/enrollments.js","functions/api/certificates/[code].js","functions/api/health.js","migrations/0001_platform_foundation.sql","wrangler.jsonc"];
for(const file of required){await readFile(file,"utf8");}
const migration=await readFile("migrations/0001_platform_foundation.sql","utf8");
for(const table of["contacts","courses","enrollments","lesson_progress","certificates","projects","invoices","audit_events"]){
 if(!migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) throw new Error(`Missing table: ${table}`);
}
const apiFiles=(await readdir("functions/api",{recursive:true})).filter(x=>x.endsWith(".js"));
if(apiFiles.length<4) throw new Error("Expected at least four API modules");
console.log(JSON.stringify({ok:true,apiModules:apiFiles.length,requiredTables:8}));
