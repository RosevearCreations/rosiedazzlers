// Rosie 912 public retail request UI. All dynamic product text uses textContent.
const $=id=>document.getElementById(id);
const model={products:[],locations:[],specials:[],cart:new Map(),requestKey:crypto.randomUUID()};
const money=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(n||0)/100);
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;if(cls)node.className=cls;return node};
function newKey(){model.requestKey=crypto.randomUUID();}
async function postJson(url,data){
 const res=await fetch(url,{method:'POST',credentials:'same-origin',
  headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const value=await res.json().catch(()=>({ok:false,error:'Unexpected server response'}));
 if(!res.ok||!value.ok)throw Error(value.error||'Request was not accepted');
 return value;
}
async function interest(product_id,interest_kind){
 if(!$('interestOptIn').checked)return;
 try{await postJson('/api/client/retail_interest_v912',
  {product_id,interest_kind,analytics_consent:true});}
 catch{/* Interest measurement must never block shopping or create hidden tracking. */}
}
function summary(){
 const lines=[...model.cart.entries()].filter(([,q])=>q>0);
 let total=0;for(const [id,q] of lines){const p=model.products.find(x=>x.id===id);if(p)total+=p.price_cents*q;}
 $('cartSummary').textContent=lines.length?lines.length+' product line(s), '+money(total)+
  ' merchandise subtotal; estimated Ontario HST and final payment require staff confirmation.':'Cart empty.';
}
function renderProducts(){
 const root=$('products');root.replaceChildren();
 if(!model.products.length){root.append(el('p','No retail items have been approved for sale yet.'));return;}
 for(const p of model.products){
  const card=el('article',null,'panel');
  card.append(el('h3',p.title),el('p',p.description||'Approved Rosie item'),
   el('p',p.sku+' · '+money(p.price_cents)+' CAD price · original stock subject to confirmation'));
  const label=el('label','Quantity for request');
  const input=el('input');input.type='number';input.min='0';input.max='10';input.step='1';
  input.value=String(model.cart.get(p.id)||0);input.setAttribute('aria-label','Quantity of '+p.title);
  input.addEventListener('change',()=>{
   const qty=Number(input.value);
   if(!Number.isInteger(qty)||qty<0||qty>10){input.value='0';model.cart.delete(p.id);}
   else if(qty===0)model.cart.delete(p.id);
   else model.cart.set(p.id,qty);
   newKey();summary();if(model.cart.has(p.id))interest(p.id,'cart');
  });
  label.append(input);card.append(label);root.append(card);
 }
}
function renderLocations(){
 const mode=$('mode').value,sel=$('location');
 sel.replaceChildren();
 const active=model.locations.filter(l=>l.mode===mode);
 sel.append(new Option(active.length?'Choose an available location':'No current locations — ask Rosie',''));
 for(const l of active)sel.append(new Option(l.name+' · '+l.service_area,l.id));
 newKey();
}
function renderSpecials(){
 const root=$('remoteSpecials');root.replaceChildren();
 if(!model.specials.length){root.append(el('p','No approved remote-location specials are currently active.'));return;}
 const list=el('ul');
 for(const s of model.specials){
  const loc=model.locations.find(l=>l.id===s.location_id);
  const li=el('li',s.title+' ('+s.percent_off+'% proposed) · '+(loc?.service_area||'Approved zone')+
   ' · quote required · ends '+new Date(s.ends_at).toLocaleDateString('en-CA'));
  list.append(li);
 }
 root.append(list);
}
async function load(){
 try{
  const res=await fetch('/api/retail_catalog_v912',{credentials:'same-origin',cache:'no-store'});
  const data=await res.json();if(!res.ok||!data.ok)throw Error(data.error||'Catalog unavailable');
  model.products=data.products||[];model.locations=data.locations||[];model.specials=data.remote_specials||[];
  $('loadStatus').textContent='Original approved Rosie catalog; payment not yet accepted through this page.';
  renderProducts();renderLocations();renderSpecials();summary();
 }catch(e){$('loadStatus').textContent=e.message||'Catalog unavailable. No product requests were sent.';}
}
$('mode').addEventListener('change',renderLocations);
$('location').addEventListener('change',newKey);
$('retailForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const status=$('requestStatus'),btn=$('submitRetail');
 const items=[...model.cart.entries()].filter(([,q])=>q>0).map(([product_id,quantity])=>({product_id,quantity}));
 if(!items.length){status.textContent='Select at least one approved item.';return;}
 if(!$('location').value){status.textContent='Select an active pickup or stand location.';return;}
 btn.disabled=true;status.textContent='Submitting your request to Rosie…';
 try{
  const response=await postJson('/api/client/retail_order_v912',{
   mode:$('mode').value,location_id:$('location').value,items,idempotency_key:model.requestKey});
  status.textContent='Request '+response.request.id+' is saved for staff review.'+
   ' No money was charged, stock reserved, or pickup appointment confirmed.';
 }catch(e){status.textContent=e.message||'Request not accepted; please retry or contact Rosie.';}
 finally{btn.disabled=false;}
});
load();
