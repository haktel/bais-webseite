const eur=new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"});
const dateFmt=value=>value?new Intl.DateTimeFormat("de-DE").format(new Date(value+"T00:00:00")):"";
const valueOf=name=>document.querySelector('[data-field="'+name+'"]')?.value?.trim()||"";
const preview=(name,value)=>{const el=document.querySelector('[data-preview="'+name+'"]');if(el)el.textContent=value||("["+name.toUpperCase()+"]");};
const num=value=>{const n=Number.parseFloat(String(value).replace(",","."));return Number.isFinite(n)?n:0;};
const lines=document.querySelector("[data-line-editor]"),tbody=document.querySelector("[data-preview-lines]");
let lineId=0;

const addLine=(preset={})=>{
 const id=++lineId;
 const row=document.createElement("div");
 row.className="invoiceLineRow";
 row.dataset.lineId=String(id);
 row.innerHTML=`<label>Beschreibung<input data-line="description" value="${preset.description||""}" placeholder="z. B. MOD-01 – Website-Entwicklung"></label><label>Menge<input data-line="qty" type="number" step="0.01" min="0" value="${preset.qty??1}"></label><label>Einzelpreis €<input data-line="price" type="number" step="0.01" min="0" value="${preset.price??""}"></label><button type="button" class="invoiceRemove" data-remove-line aria-label="Position entfernen">×</button>`;
 lines.append(row);
 row.addEventListener("input",render);
 row.querySelector("[data-remove-line]").addEventListener("click",()=>{row.remove();render();});
 render();
};

const render=()=>{
 const sellerName=valueOf("sellerName"),sellerAddress=valueOf("sellerAddress"),taxId=valueOf("taxId");
 const sellerBlock=[sellerName,sellerAddress].filter(Boolean).join("\n");
 const sellerEl=document.querySelector('[data-preview="sellerBlock"]');if(sellerEl)sellerEl.innerText=sellerBlock||"[FIRMA_ADI]\n[ANBIETER_VOLLSTAENDIGE_ANSCHRIFT]";
 preview("customerName",valueOf("customerName"));
 const customerAddress=document.querySelector('[data-preview="customerAddress"]');if(customerAddress)customerAddress.innerText=valueOf("customerAddress")||"[KUNDE_VOLLSTAENDIGE_ANSCHRIFT]";
 preview("invoiceNumber",valueOf("invoiceNumber")||"[RECHNUNGSNUMMER]");
 preview("invoiceDate",dateFmt(valueOf("invoiceDate"))||"[RECHNUNGSDATUM]");
 preview("servicePeriod",valueOf("servicePeriod")||"[LEISTUNGSDATUM_ODER_ZEITRAUM]");
 preview("customerNumber",valueOf("customerNumber")||"[KUNDEN_NUMMER]");
 preview("projectNumber",valueOf("projectNumber")||"[PROJEKT_NUMMER]");
 preview("sowNumber",valueOf("sowNumber")||"[ANGEBOTSNUMMER]");
 preview("acceptanceRef",valueOf("acceptanceRef")||"[ABNAHME_REFERENZ]");
 preview("paymentDays",valueOf("paymentDays")||"[ZAHLUNGSZIEL_TAGE]");
 preview("dueDate",dateFmt(valueOf("dueDate"))||"[FAELLIGKEITSDATUM]");
 preview("iban",valueOf("iban")||"[IBAN]");
 preview("bic",valueOf("bic")||"[BIC]");
 preview("note",valueOf("note"));
 preview("usage",[valueOf("invoiceNumber")||"[RECHNUNGSNUMMER]",valueOf("customerNumber")||"[KUNDEN_NUMMER]",valueOf("projectNumber")||"[PROJEKT_NUMMER]"].join(" / "));
 const legal=document.querySelector('[data-preview="sellerLegal"]');if(legal)legal.textContent=[sellerName||"[FIRMA_ADI]",taxId||"[STEUERNUMMER_ODER_UST_IDNR]"].join(" · ");

 tbody.replaceChildren();
 let net=0,pos=0;
 for(const row of lines.querySelectorAll(".invoiceLineRow")){
  const description=row.querySelector('[data-line="description"]').value.trim();
  const qty=num(row.querySelector('[data-line="qty"]').value),price=num(row.querySelector('[data-line="price"]').value),total=qty*price;
  if(!description&&!price)continue;
  pos++;
  net+=total;
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${pos}</td><td></td><td class="num">${qty.toLocaleString("de-DE")}</td><td class="num">${eur.format(price)}</td><td class="num">${eur.format(total)}</td>`;
  tr.children[1].textContent=description||"—";
  tbody.append(tr);
 }
 if(!pos){const tr=document.createElement("tr");tr.innerHTML='<td>1</td><td>[LEISTUNGSBESCHREIBUNG]</td><td class="num">1</td><td class="num">0,00 €</td><td class="num">0,00 €</td>';tbody.append(tr);}

 const taxMode=valueOf("taxMode"),vatRate=num(valueOf("vatRate")),vat=taxMode==="regular"?net*vatRate/100:0,gross=net+vat;
 preview("netTotal",eur.format(net));
 preview("vatTotal",eur.format(vat));
 preview("grossTotal",eur.format(gross));
 preview("vatRateLabel",taxMode==="regular"&&valueOf("vatRate")?"("+valueOf("vatRate")+" %)":"");
 const taxRow=document.querySelector("[data-tax-row]"),taxNote=document.querySelector("[data-tax-note]");
 if(taxMode==="small"){
  taxRow.hidden=true;
  taxNote.textContent="Für diese Leistung gilt die Steuerbefreiung für Kleinunternehmer gemäß § 19 UStG; Umsatzsteuer wird nicht gesondert ausgewiesen.";
 }else{
  taxRow.hidden=false;
  taxNote.textContent=taxMode==="regular"?"Umsatzsteuer gemäß gewähltem Steuersatz.":"Steuerstatus vor Versand auswählen.";
 }
};

document.querySelectorAll("[data-field]").forEach(el=>el.addEventListener("input",render));
document.querySelector("[data-add-line]").addEventListener("click",()=>addLine());
document.querySelector("[data-print]").addEventListener("click",()=>{
 const required=["sellerName","sellerAddress","customerName","customerAddress","invoiceNumber","invoiceDate","servicePeriod","taxMode","paymentDays","iban"];
 const missing=required.filter(name=>!valueOf(name));
 if(missing.length&&!confirm("Es fehlen noch Pflicht-/Prüffelder: "+missing.join(", ")+". Trotzdem Druckvorschau öffnen?"))return;
 window.print();
});
document.querySelector("[data-clear]").addEventListener("click",()=>{
 if(!confirm("Alle eingegebenen Rechnungsdaten leeren?"))return;
 document.querySelectorAll("[data-field]").forEach(el=>{if(el.tagName==="SELECT")el.selectedIndex=0;else el.value="";});
 lines.replaceChildren();lineId=0;addLine();render();
});

addLine({description:"MOD-01 – Website-Entwicklung",qty:1});
render();
