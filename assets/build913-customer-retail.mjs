// Build 913: account-owned review, hosted provider redirect, and ephemeral physical handoff code.
const $=id=>document.getElementById(id);
const mk=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n};
const money=cents=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(cents||0)/100);
let selected=null;
async function get(url){
 const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});
 const result=await response.json().catch(()=>({ok:false,error:'Invalid response'}));
 if(!response.ok||!result.ok)throw Error(result.error||'Original source currently unavailable');
 return result;
}
async function post(url,body){
 const response=await fetch(url,{method:'POST',credentials:'same-origin',
 headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const result=await response.json().catch(()=>({ok:false,error:'Invalid response'}));
 if(!response.ok||!result.ok)throw Error(result.error||
  (result.reason?'Activation HOLD: '+result.reason:'Original source did not confirm this action'));
 return result;
}
async function show(order){
 selected=order.id;$('oneTimeCode').textContent='';$('pinSection').hidden=true;
 const root=$('receipt');root.replaceChildren(mk('p','Checking original provider and invoice evidence…'));
 try{
  const data=await get('/api/client/retail_receipt_v913?order_id='+encodeURIComponent(order.id));
  root.replaceChildren();
  root.append(mk('p','Order '+order.id+' · '+order.mode+' · '+(data.finance?.payment_state||'No provider payment recorded')));
  root.append(mk('p','Paid: '+money(data.finance?.amount_paid_cents)+
   ' · Refunded: '+money(data.finance?.amount_refunded_cents)));
  if(data.invoice){
   root.append(mk('h3','Issued invoice '+data.invoice.invoice_number));
   root.append(mk('p','Merchandise '+money(data.invoice.subtotal_cents)+
    ' · Ontario HST recorded '+money(data.invoice.hst_cents)+
    ' · total '+money(data.invoice.total_cents)));
   root.append(mk('p','Issued '+new Date(data.invoice.issued_at).toLocaleString('en-CA')+
    ' · tax filing/accountant approval is not claimed'));
  }else root.append(mk('p','No numbered issued retail invoice until original payment is verified.'));
  for(const refund of data.refunds||[])
   root.append(mk('p','Refund '+money(refund.amount_cents)+' · '+refund.status+
    ' · '+(refund.succeeded_at?'confirmed '+new Date(refund.succeeded_at).toLocaleString('en-CA'):'not yet provider-confirmed')));
  if(data.fulfillment.staff_handoff_recorded)
   root.append(mk('p','Staff-attested handoff '+data.fulfillment.handoff_at));
  $('pinSection').hidden=data.finance?.payment_state!=='paid'||
   data.fulfillment.staff_handoff_recorded;
 }catch(e){root.replaceChildren(mk('p',e.message));}
}
async function load(){
 const root=$('requests');root.replaceChildren();
 try{
  const data=await get('/api/client/retail_order_v912');
  if(!data.requests.length)root.append(mk('p','No original retail requests in this account.'));
  for(const item of data.requests){
   const div=mk('div');div.className='record';
   div.append(mk('p',item.id+' · '+item.mode+' · '+item.status+
     ' · merchandise '+money(item.subtotal_cents)+' (plus reviewed HST)'));
   const review=mk('button','Review original invoice');review.type='button';
   review.addEventListener('click',()=>show(item));div.append(review);
   if(item.status==='quoted'){
    const btn=mk('button','Pay quoted order with Stripe');btn.type='button';
    btn.addEventListener('click',async()=>{
     btn.disabled=true;$('message').textContent='Checking original quoted order and provider availability…';
     try{
      const r=await post('/api/client/retail_checkout_v913',{order_id:item.id});
      if(!/^https:\/\/checkout\.stripe\.com\//.test(r.checkout_url||''))
       throw Error('Provider checkout destination not confirmed');
      location.assign(r.checkout_url);
     }catch(e){$('message').textContent=e.message;btn.disabled=false;}
    });
    div.append(btn);
   }
   root.append(div);
  }
  $('message').textContent='Original requests loaded. Staff must verify pricing and availability before payment.';
 }catch(e){root.append(mk('p',e.message));$('message').textContent='No payment was attempted.';}
}
$('makeCode').addEventListener('click',async()=>{
 const b=$('makeCode');b.disabled=true;
 try{
  const result=await post('/api/client/retail_receipt_v913',
   {action:'issue_handoff_code',order_id:selected});
  const code=mk('code',result.one_time_handoff_code);
  $('oneTimeCode').replaceChildren(
   mk('span','Show the following one-time code to our staff in person: '),code);
 }catch(e){$('oneTimeCode').textContent=e.message;}
 finally{b.disabled=false;}
});
load();
