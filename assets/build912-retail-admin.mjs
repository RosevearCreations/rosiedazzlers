// Rosie 912 staff workbench. Session permissions are enforced server-side.
const $=id=>document.getElementById(id);
const div=text=>{const n=document.createElement('div');n.className='record';n.textContent=text;return n};
const request=async(method,data)=>{
 const res=await fetch('/api/admin/retail_ops_v912',{method,credentials:'same-origin',cache:'no-store',
  ...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
 const body=await res.json().catch(()=>({ok:false,error:'Invalid response'}));
 if(!res.ok||!body.ok)throw Error(body.error||'Original source not accepted');
 return body;
};
const date=v=>v?new Date(v).toLocaleString('en-CA'):'no time restriction';
const money=n=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(n/100);
function renderRows(root,rows,format,empty='No original records yet.'){
 const node=$(root);node.replaceChildren();
 if(!rows.length)node.append(div(empty));
 else rows.forEach(row=>node.append(div(format(row))));
}
async function refresh(){
 $('status').textContent='Reading original Rosie retail source…';
 try{
  const data=await request('GET');
  renderRows('products',data.products,p=>p.sku+' — '+p.title+' · '+money(p.price_cents)+
   ' · stock '+p.stock_on_hand+' · public '+(p.active&&p.publish_approved?'approved':'HOLD')+
   (p.supplier_review_id?' · private supplier link '+p.supplier_review_id:''));
  renderRows('locations',data.locations,l=>l.name+' · '+l.mode+' · '+l.service_area+
   (l.active?' · active':' · paused'));
  renderRows('specials',data.specials,s=>s.code+' · '+s.title+' · '+s.percent_off+'% proposed'+
   ' · '+(s.active?'active':'paused')+' · quote required, until '+date(s.ends_at));
  const sl=$('remoteLocation');sl.replaceChildren(new Option('Select original remote-service location',''));
  data.locations.filter(l=>l.mode==='remote_service').forEach(l=>sl.append(new Option(l.name+' · '+l.service_area,l.id)));
  const orders=$('orders');orders.replaceChildren();
  if(!data.orders.length)orders.append(div('No original retail request rows.'));
  for(const order of data.orders){
   const wrapper=document.createElement('div');wrapper.className='record';
   wrapper.append(div(order.id+' · '+order.mode+' · '+money(order.subtotal_cents)+
    ' merchandise only · '+order.status+' · '+date(order.created_at)));
   if(order.status==='awaiting_staff_review'){
    for(const state of ['quoted','cancelled']){
     const btn=document.createElement('button');btn.type='button';btn.textContent=state==='quoted'?
      'Mark internally reviewed':'Cancel request';
     btn.addEventListener('click',async()=>{
      btn.disabled=true;
      try{await request('POST',{action:'order_review',data:{order_id:order.id,status:state}});await refresh();}
      catch(e){$('status').textContent=e.message;btn.disabled=false;}
     });wrapper.append(btn);
    }
   }
   orders.append(wrapper);
  }
  renderRows('interest',data.interest_aggregate,a=>a.product_id+' · '+a.kind+
   ' · '+a.count+' deduplicated daily receipt(s) in latest bounded source window',
   'No customer-approved interest records; no inferred demand.');
  $('status').textContent='Original Rosie source loaded. No charges, stock reservations or publishing were made.';
 }catch(e){$('status').textContent=e.message||'Retail source unavailable. Do not assume changes were saved.';}
}
function values(form){
 const f=new FormData(form);
 const data=Object.fromEntries([...f.entries()].map(([k,v])=>[k,String(v).trim()]));
 for(const checkbox of form.querySelectorAll('input[type="checkbox"]'))
  data[checkbox.name]=checkbox.checked;
 for(const field of form.querySelectorAll('input[type="number"]'))
  data[field.name]=Number(field.value);
 for(const field of form.querySelectorAll('input[type="datetime-local"]'))
  data[field.name]=field.value?new Date(field.value).toISOString():'';
 if('supplier_review_id'in data&&!data.supplier_review_id)delete data.supplier_review_id;
 if('starts_at'in data&&!data.starts_at)delete data.starts_at;
 if('ends_at'in data&&!data.ends_at)delete data.ends_at;
 return data;
}
for(const [id,action] of [['productForm','product'],['locationForm','location'],['specialForm','special']]){
 const form=$(id);
 form.addEventListener('submit',async event=>{
  event.preventDefault();const btn=form.querySelector('button[type=submit]');btn.disabled=true;
  try{
   const data=values(form);
   await request('POST',{action,data});
   $('status').textContent=action+' saved in original Rosie source.';
   form.reset();await refresh();
  }catch(e){$('status').textContent=e.message||'Original save failed.';}
  finally{btn.disabled=false;}
 });
}
$('reload').addEventListener('click',refresh);refresh();
