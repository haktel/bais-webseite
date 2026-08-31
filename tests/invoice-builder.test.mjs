import test from"node:test";
import assert from"node:assert/strict";
import fs from"node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("invoice admin page is a real form plus A4 preview",()=>{
 const html=read("admin/rechnung/index.html");
 assert.match(html,/data-field="sellerName"/);
 assert.match(html,/data-field="customerName"/);
 assert.match(html,/data-field="invoiceNumber"/);
 assert.match(html,/data-line-editor/);
 assert.match(html,/data-print/);
 assert.match(html,/data-invoice-preview/);
 assert.match(html,/invoice-builder\.js\?v=1\.0/);
});

test("invoice builder calculates line totals and supports both tax modes",()=>{
 const js=read("assets/invoice-builder.js");
 assert.match(js,/qty\*price/);
 assert.match(js,/taxMode==="regular"/);
 assert.match(js,/taxMode==="small"/);
 assert.match(js,/§ 19 UStG/);
 assert.match(js,/window\.print\(\)/);
 assert.match(js,/confirm\("Es fehlen noch Pflicht-\/Prüffelder/);
});

test("invoice print CSS emits clean A4 output",()=>{
 const css=read("assets/invoice-view.css");
 assert.match(css,/@page\{size:A4;margin:0\}/);
 assert.match(css,/@media print/);
 assert.match(css,/\.noPrint\{display:none!important\}/);
 assert.match(css,/width:210mm!important/);
 assert.match(css,/min-height:297mm!important/);
});

test("invoice builder remains protected by admin middleware",()=>{
 const middleware=read("functions/admin/_middleware.js");
 assert.match(middleware,/requireAdmin/);
 assert.match(middleware,/no-store/);
});
