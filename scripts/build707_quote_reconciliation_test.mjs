import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,reconcileQuoteBooking707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_booking_reconcile.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f';
const bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e';
const quote={id:quoteId,quote_number:'RD-707',customer_name:'Alex Example',status:'accepted',
  accepted_amount_cents:25000,booking_id:bookingId,updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_name:'Alex Example',status:'confirmed',job_status:'scheduled',
  service_date:'2026-11-04',start_slot:'morning',vehicle_size:'suv',package_code:'premium',updated_at:'2026-10-30T01:00:00Z'};
const snapshot=confirmationSnapshot707(quote,booking);
assert.equal(snapshot.quote_id,quoteId);
assert.equal(snapshot.booking_id,bookingId);
assert.equal(reconcileQuoteBooking707(quote,booking).ready_to_record,true);
assert.equal(reconcileQuoteBooking707(quote,booking).notification_ready,false);
const event={id:'e9df35b8-8743-4686-8af5-9b2b408216ac',event_type:CONFIRMATION_EVENT707,
  created_at:'2026-10-30T01:10:00Z',actor_name:'Staff',payload:{quote_id:quoteId,booking_id:bookingId,snapshot}};
assert.equal(reconcileQuoteBooking707(quote,booking,[],[event]).notification_ready,true);
assert.equal(reconcileQuoteBooking707(quote,{...booking,service_date:'2026-11-06'},[],[event]).notification_ready,false);
assert.equal(reconcileQuoteBooking707({...quote,accepted_amount_cents:22000},booking,[],[event]).notification_ready,false);
assert.equal(reconcileQuoteBooking707(quote,{...booking,job_status:'cancelled'},[],[event]).ready_to_record,false);
assert.equal(reconcileQuoteBooking707(quote,booking,[{id:'another'}],[event]).notification_ready,false);
assert.equal(reconcileQuoteBooking707({...quote,booking_id:null},booking,[],[event]).ready_to_record,false);

const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const credential={'x-admin-password':'test-only'};
const url=`https://rosiedazzlers.ca/api/admin/quote_booking_reconcile?quote_id=${quoteId}`;
const originalFetch=globalThis.fetch;
let events=[],duplicates=[],activeBooking={...booking},operations=[];
globalThis.fetch=async(input,options={})=>{
  const target=new URL(String(input));
  assert.equal(target.origin,env.SUPABASE_URL,'Only server-only Supabase source queries are permitted');
  const method=options.method||'GET';operations.push({path:target.pathname,method});
  assert.match(target.pathname,/^\/rest\/v1\/(quote_pipeline_items|bookings|booking_events)$/);
  if(method==='POST'){
    assert.equal(target.pathname,'/rest/v1/booking_events');
    const [record]=JSON.parse(options.body);
    assert.equal(record.event_type,CONFIRMATION_EVENT707);
    assert.equal(record.payload.customer_notified,false);
    const saved={...record,id:event.id,created_at:event.created_at};
    events.unshift(saved);
    return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([activeBooking]);
  if(target.pathname.endsWith('/booking_events'))return Response.json(events);
  if(target.searchParams.has('booking_id'))return Response.json(duplicates);
  return Response.json([quote]);
};
try {
  let response=await onRequestGet({request:new Request(url),env});
  assert.equal(response.status,401,'Unauthorized staff must not query Supabase');
  assert.equal(operations.length,0);
  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  assert.equal(response.status,200);
  let data=await response.json();
  assert.equal(data.ready_to_record,true);
  assert.equal(data.notification_ready,false);
  assert.equal(data.sends_message,false);
  assert.ok(operations.every(item=>item.method==='GET'));
  const postBody={quote_id:quoteId,booking_id:bookingId,confirm_actual_review:true};
  const postRequest=payload=>new Request(url,{method:'POST',headers:{...credential,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  response=await onRequestPost({request:postRequest({...postBody,confirm_actual_review:false}),env});
  assert.equal(response.status,400,'Explicit review acknowledgement is required');
  assert.equal(events.length,0);
  duplicates=[{id:'other-quote'}];
  response=await onRequestPost({request:postRequest(postBody),env});
  assert.equal(response.status,409,'Duplicate links block staff confirmation');
  duplicates=[];
  activeBooking={...booking,status:'cancelled'};
  response=await onRequestPost({request:postRequest(postBody),env});
  assert.equal(response.status,409,'Cancelled booking blocks staff confirmation');
  activeBooking={...booking};
  response=await onRequestPost({request:postRequest(postBody),env});
  data=await response.json();
  assert.equal(response.status,200);
  assert.equal(data.recorded,true);
  assert.equal(data.notification_ready,true);
  assert.equal(events.length,1);
  response=await onRequestPost({request:postRequest(postBody),env});
  assert.equal((await response.json()).already_current,true,'Repeated review must not duplicate current event');
  assert.equal(events.length,1);
  activeBooking={...booking,service_date:'2026-11-06'};
  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  data=await response.json();
  assert.equal(data.notification_ready,false,'Date changes invalidate prior staff review');
  assert.equal(data.staff_confirmation_current,false);
  assert.equal(data.ready_to_record,true);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qReconcileCheck707','qReconcileRecord707','qReconcileStatus707','qReconcileHistory707'])
  assert.match(read('admin-quotes.html'),new RegExp(`id="${id}"`));
const client=read('assets/admin-quotes-v298.js');
assert.match(client,/quote_booking_reconcile/);
assert.match(client,/reconciliation707\?\.notification_ready/);
assert.doesNotMatch(client,/localStorage|sessionStorage/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build707_quote_reconciliation_test\.mjs/);
console.log('Build 707 PASS: live link reconciliation, persistent staff history, stale-event guard, non-sending readiness');
