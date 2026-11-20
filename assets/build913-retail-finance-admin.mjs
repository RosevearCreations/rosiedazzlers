// Build 913: staff-safe rendering and deliberate provider/physical-custody actions.
const $=id=>document.getElementById(id),record=text=>{
 const n=document.createElement('p');n.className='record';n.textContent=text;return n};
const money=v=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(v||0)/100);
async function api(method,data){
 const res=await fetch('/api/admin/retail_finance_v913',{method,credentials:'same-origin',cache:'no-store',
  ...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{})});
 const j=await res.json().catch(()=>({ok:false,error:'Invalid source response'}));
 if(!res.ok||!j.ok)throw Error(j.error+(j.reason?' ('+j.reason+')':''));
 return j;
}
const render=(name,rows,fn)=>{
 const root=$(name);root.replaceChildren();
 if(!rows.length)root.append(record('No original source records to review.'));
 else rows.forEach(item=>root.append(record(fn(item))));
};
async function load(){
 $('status').textContent='Reading original signed-staff source…';
 try{
  const d=await api('GET');
  $('activation').replaceChildren(record('Checkout: '+d.activation.reason),
   record('Refunds: '+d.refund_activation.reason),
   record('Bank settlement/merchant payout: NOT INDEPENDENTLY CERTIFIED'),
   record('Tax filing/accountant signoff: HOLD'),record('Terminal POS and real device witness: HOLD'));
  $('events').replaceChildren(record('Signed paid events: '+(d.provider_event_counts.checkout_paid||0)+
   ' · signed refund outcomes: '+(d.provider_event_counts.refund_succeeded||0)));
  render('invoices',d.invoices,i=>i.invoice_number+' · '+money(i.subtotal_cents)+' merchandise + '+
   money(i.hst_cents)+' recorded HST = '+money(i.total_cents)+' · '+i.tax_review_state);
  render('orders',d.orders,o=>o.id+' · '+o.mode+' · staff status '+o.status+
   ' · merchandise '+money(o.subtotal_cents));
  render('finance',d.finance,f=>f.order_id+' · '+f.payment_state+
   ' · paid '+money(f.amount_paid_cents)+' / refunded '+money(f.amount_refunded_cents));
  render('refunds',d.refunds,r=>r.id+' · order '+r.order_id+' · '+money(r.amount_cents)+
   ' · '+r.status+' · provider reference '+(r.provider_refund_id||'not initiated'));
  render('handoffs',d.handoffs,h=>h.order_id+' · '+
   (h.handoff_at?'Staff-attested '+h.handoff_at:'Not yet physically transferred')+
   ' · attempts '+h.attempts);
  $('status').textContent='Original source refreshed. No money moved or inventory changed by this read.';
 }catch(e){$('status').textContent=e.message||'Original finance source unavailable.';}
}
function values(form){
 const d=Object.fromEntries(new FormData(form).entries());
 for(const el of form.querySelectorAll('input[type="number"]'))d[el.name]=Number(el.value);
 for(const el of form.querySelectorAll('input[type="checkbox"]'))d[el.name]=el.checked;
 return d;
}
for(const [id,action] of [['refundRequest','request_refund'],['refundSend','send_refund'],['handoffForm','handoff']]){
 const form=$(id);
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const data={action,...values(form)};
  const warning=action==='send_refund'?
   'This sends a REAL monetary refund to Stripe if activated; continue?':
   action==='handoff'?'Confirm an ACTUAL in-person handoff and deduct inventory exactly once?':
   'Record a staff refund request in the original private ledger?';
  if(!window.confirm(warning))return;
  const btn=form.querySelector('button[type=submit]');btn.disabled=true;
  $('status').textContent='Validating original source and signed staff action…';
  try{
   const result=await api('POST',data);
   $('status').textContent=action==='send_refund'?
    'Original provider accepted request. Actual refund outcome remains pending signed confirmation.':
    action==='handoff'?'Original staff handoff recorded and original stock movement committed.':
    'Private refund request saved. No payment provider contacted.';
   form.reset();await load();
  }catch(e){$('status').textContent=e.message||'No completion claimed.';}
  finally{btn.disabled=false;}
 });
}
$('refresh').addEventListener('click',load);load();
