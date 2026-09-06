import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("admin control center uses pinned AdminLTE 4 stylesheet with local BAIS shell",()=>{
 const html=read("admin/index.html");
 assert.match(html,/admin-lte@4\.9\.1\/dist\/css\/adminlte\.min\.css/);
 assert.match(html,/assets\/admin-dashboard\.css\?v=1\.2/);
 assert.match(html,/assets\/admin-dashboard\.js\?v=1\.1/);
 assert.match(html,/class="app-sidebar/);
 assert.match(html,/data-system-health/);
 assert.match(html,/data-tab="customers"/);
 assert.match(html,/data-tab="erp"/);
 assert.doesNotMatch(html,/class="[^"]*(?:layout-fixed|sidebar-expand-lg)/);
 assert.doesNotMatch(html,/admin-lte@[^4]/);
});

test("AdminLTE is CSS-only and CSP does not trust external dashboard scripts",()=>{
 const html=read("admin/index.html");
 const headers=read("_headers");
 assert.doesNotMatch(html,/cdn\.jsdelivr\.net[^\"]+adminlte\.min\.js/);
 assert.match(headers,/style-src 'self' 'unsafe-inline' https:\/\/cdn\.jsdelivr\.net;/);
 assert.match(headers,/script-src 'self' https:\/\/challenges\.cloudflare\.com;/);
 assert.doesNotMatch(headers,/script-src[^\n]+cdn\.jsdelivr\.net/);
});

test("system health endpoint is admin protected and never exposes secrets",()=>{
 const endpoint=read("functions/api/admin/system-health.js");
 assert.match(endpoint,/requireAdmin\(db,request\)/);
 assert.match(endpoint,/SELECT 1 AS ok/);
 assert.match(endpoint,/PROJECT_DOCUMENTS\.list/);
 assert.match(endpoint,/getErpIntegrationConfig/);
 assert.match(endpoint,/RESEND_API_KEY/);
 assert.doesNotMatch(endpoint,/apiKey\s*:/);
 assert.doesNotMatch(endpoint,/ERP_DOLAPIKEY\s*:/);
 assert.doesNotMatch(endpoint,/RESEND_API_KEY\s*:/);
});

test("dashboard owns one responsive layout and mobile sidebar cannot crush content",()=>{
 const js=read("assets/admin-dashboard.js");
 const css=read("assets/admin-dashboard.css");
 assert.match(js,/\/api\/admin\/system-health/);
 assert.match(js,/textContent=/);
 assert.doesNotMatch(js,/innerHTML\s*=/);
 assert.match(js,/mobileSidebarQuery/);
 assert.match(js,/sidebar-open/);
 assert.match(css,/grid-template-columns:var\(--bais-admin-sidebar-width\) minmax\(0,1fr\)!important/);
 assert.match(css,/@media\(max-width:991\.98px\)/);
 assert.match(css,/grid-template-columns:1fr!important/);
 assert.match(css,/width:min\(320px,calc\(100vw - 44px\)\)!important/);
 assert.match(css,/translateX\(-104%\)!important/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
