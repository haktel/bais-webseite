import{spawnSync}from"node:child_process";
const email=process.argv[2]||process.env.ADMIN_EMAIL;
if(!email){console.error("Usage: node scripts/promote-admin.mjs <email>  (or set ADMIN_EMAIL)");process.exit(1);}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){console.error(`Not a valid email: ${email}`);process.exit(1);}
const remote=!process.argv.includes("--local");
const sql=`UPDATE users SET role='admin' WHERE email='${email.trim().toLowerCase().replace(/'/g,"''")}';`;
const args=["d1","execute","bais-platform",remote?"--remote":"--local","--command",sql];
console.log(`Running: wrangler ${args.join(" ")}`);
const result=spawnSync("npx",["wrangler",...args],{stdio:"inherit"});
process.exit(result.status??1);
