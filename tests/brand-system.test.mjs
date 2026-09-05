import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(path,"utf8");

test("brand settings API stays admin-only and MFA-protected through requireAdmin",()=>{
 const api=read("functions/api/admin/brand-settings.js");
 assert.match(api,/requireAdmin\(db,request\)/);
 assert.match(api,/readJson\(request,8192\)/);
 assert.match(api,/method_not_allowed/);
});

test("brand settings schema is allowlisted and has safe production defaults",()=>{
 const lib=read("functions/_lib/brand-settings.js");
 assert.match(lib,/CREATE TABLE IF NOT EXISTS brand_settings/);
 assert.match(lib,/primaryNavy:"#0B2D45"/);
 assert.match(lib,/teal:"#00B3A4"/);
 assert.match(lib,/gold:"#D4A833"/);
 assert.match(lib,/unknown_brand_setting/);
 assert.match(lib,/https:/);
});

test("public theme endpoint exposes CSS only and degrades to defaults",()=>{
 const endpoint=read("functions/api/brand-theme.js");
 assert.match(endpoint,/text\/css/);
 assert.match(endpoint,/BRAND_DEFAULTS/);
 assert.doesNotMatch(endpoint,/requireAdmin/);
});

test("admin control center exposes branding and document settings",()=>{
 const html=read("admin/index.html");
 assert.match(html,/data-tab="branding"/);
 assert.match(html,/data-tab="documents"/);
 assert.match(html,/admin-brand-system\.js/);
 assert.match(html,/admin-brand-system\.css/);
});

test("design system loads runtime theme and approved concept colors",()=>{
 const css=read("assets/bais-design-system.css");
 assert.match(css,/@import url\("\/api\/brand-theme"\)/);
 assert.match(css,/--bais-navy:#0B2D45/);
 assert.match(css,/--bais-teal:#00B3A4/);
 assert.match(css,/--bais-gold:#D4A833/);
});

test("logo family includes production variants",()=>{
 for(const file of ["assets/bais-wordmark.svg","assets/bais-wordmark-light.svg","assets/bais-wordmark-dark.svg","assets/bais-wordmark-mono.svg","assets/bais-mark.svg","assets/bais-favicon.svg"])assert.ok(fs.existsSync(file),`${file} missing`);
 const primary=read("assets/bais-wordmark.svg");
 assert.match(primary,/IT \/ AI \/ SECURITY/);
 assert.match(primary,/#00B3A4/);
});

test("HTML middleware injects the BAIS favicon and mobile browser theme color globally",()=>{
 const middleware=read("functions/_middleware.js");
 assert.match(middleware,/\/assets\/bais-favicon\.svg/);
 assert.match(middleware,/rel="icon"/);
 assert.match(middleware,/name="theme-color"/);
 assert.match(middleware,/#0B2D45/);
 assert.match(middleware,/rewriter\.on\("head"/);
});
