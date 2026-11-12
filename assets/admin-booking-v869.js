// Rosie 869: fast roadside photo-to-quote intake. No new deposit processor:
// existing /book remains the only customer booking, consent and payment flow.
const $=id=>document.getElementById(id);
let selected=null;
let working=false;
function notice(message,error=false){
 const el=$('rdQuickQuoteStatus');if(!el)return;
 el.textContent=message;el.className=error?'notice error mini':'notice mini';
}
const cad=bytes=>(bytes/(1024*1024)).toFixed(1);
async function read(id=''){
 const url='/api/admin/detailing_intake_v869'+
  (id?'?draft_id='+encodeURIComponent(id):'');
 const r=await fetch(url,{credentials:'include',cache:'no-store'});
 const j=await r.json().catch(()=>({}));
 if(!r.ok||!j.ok)throw Error(j.error||'Private quote review is unavailable');
 return j;
}
async function write(action,payload={}){
 const r=await fetch('/api/admin/detailing_intake_v869',{
  method:'POST',credentials:'include',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action,...payload})});
 const j=await r.json().catch(()=>({}));
 if(!r.ok||!j.ok)throw Error(j.error||'Private quote review was not saved');
 return j;
}
function storageView(storage){
 if(!storage)return;
 const el=$('rdQuotaStatus'),progress=$('rdQuotaProgress');
 const value=Math.min(100,Math.round(100*storage.reserved_bytes/storage.budget_bytes));
 progress.value=value;
 el.textContent='Private Supabase budget: '+cad(storage.reserved_bytes)+
  ' of '+cad(storage.budget_bytes)+' MiB reserved ('+value+'%). '+
  cad(storage.stored_bytes)+' MiB stored; '+cad(storage.pending_bytes)+
  ' MiB pending. '+(storage.uploads_on_hold?'New uploads paused for owner review.':
   storage.warning?'Approaching our pilot budget.':'Room for more private captures.');
 el.style.color=storage.warning?'#f5c46b':'';
}
async function refreshStorage(){
 try{storageView((await read()).storage);}
 catch{const el=$('rdQuotaStatus');if(el)el.textContent=
  'Private storage meter requires an authorized staff session.';}
}
async function selectDraft(id){
 if(!id)return;
 selected=id;
 try{
  const data=await read(id),d=data.draft;
  if(!d)return;
  $('rdQuoteDraftName').textContent=d.temporary_label;
  $('rdQuickName').value=d.customer_name||'';
  $('rdQuickPhone').value=d.customer_phone||'';
  $('rdQuickEmail').value=d.customer_email||'';
  $('rdContactPermission').checked=d.contact_permission===true;
  $('rdPrivatePhotoConsent').checked=d.private_photo_permission===true||
   $('rdPrivatePhotoConsent').checked;
  $('rdQuickQuote').value=d.quote_cents==null?'':(d.quote_cents/100).toFixed(2);
  $('rdQuoteReviewState').textContent=d.linked_booking_id?
   'Linked to booking '+d.linked_booking_id:
   d.quote_review_state==='estimate_prepared'?
    'Estimate prepared — complete canonical booking and payment separately.':
    'Needs a quick quote or Admin review.';
  $('rdLinkedBookingId').value=d.linked_booking_id||'';
  $('rdSaveQuickQuote').disabled=Boolean(d.linked_booking_id);
  $('rdLinkCanonicalBooking').disabled=Boolean(d.linked_booking_id);
  $('rdQuotePanel').hidden=false;
  storageView(data.storage);
 }catch(e){notice(e.message,true);}
}
async function saveQuote(){
 if(!selected||working)return;
 working=true;$('rdSaveQuickQuote').disabled=true;
 try{
  const saved=await write('save_quick_quote',{draft_id:selected,
   customer_name:$('rdQuickName').value,
   customer_phone:$('rdQuickPhone').value,
   customer_email:$('rdQuickEmail').value,
   contact_permission:$('rdContactPermission').checked,
   quote_cad:$('rdQuickQuote').value.trim()});
  notice('Roadside quote saved privately. The amount is an estimate, not a checkout price.');
  await selectDraft(saved.draft.id);
 }catch(e){notice(e.message,true);}
 finally{working=false;if(!$('rdLinkedBookingId').value)
  $('rdSaveQuickQuote').disabled=false;}
}
async function linkBooking(){
 if(!selected||working)return;
 const bookingId=$('rdLinkedBookingId').value.trim();
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(bookingId)){
  notice('Enter the UUID from the completed canonical booking, not the temporary intake label.',true);
  return;
 }
 if(!window.confirm('Only link an EXISTING booking made through normal checkout. This does not prove a deposit was paid. Continue?'))return;
 working=true;$('rdLinkCanonicalBooking').disabled=true;
 try{
  const j=await write('link_existing_booking',{
   draft_id:selected,booking_id:bookingId,
   confirm_canonical_checkout_completed:true,
   acknowledge_deposit_not_verified_here:true});
  notice('Linked to canonical booking. Booking total $'+
   Number(j.canonical_booking_total_cad||0).toFixed(2)+
   ' CAD; planned deposit $'+
   Number(j.canonical_planned_deposit_cad||0).toFixed(2)+
   ' CAD. Verify actual deposit with Stripe/PayPal payment records.');
  await selectDraft(selected);
 }catch(e){notice(e.message,true);}
 finally{working=false;if(!$('rdQuoteReviewState').textContent.includes('Linked'))
  $('rdLinkCanonicalBooking').disabled=false;}
}
function boot(){
 if(!$('rdQuotePanel'))return;
 $('rdSaveQuickQuote').addEventListener('click',saveQuote);
 $('rdLinkCanonicalBooking').addEventListener('click',linkBooking);
 $('rdOpenCanonicalBooking').addEventListener('click',()=>{
  notice('Continue through normal availability, pricing, customer waiver and secure deposit checkout. Return here to link the booking UUID.');
 });
 window.addEventListener('rosie:intake-selected',e=>selectDraft(e.detail?.id));
 window.addEventListener('rosie:intake-media-updated',refreshStorage);
 $('rdContactPermission').addEventListener('change',()=>{
  if(!$('rdContactPermission').checked)notice(
   'To retain a name, phone or email, first confirm permission to contact the customer.');
 });
 if($('rdIntakeId')?.value)selectDraft($('rdIntakeId').value);
 refreshStorage();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
