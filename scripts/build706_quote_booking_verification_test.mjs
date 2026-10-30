import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  FOLLOW_UP_COMPLETED_STAGE706, completedFollowUps706, quoteBookingEligibility706,
  bookingMatch706, customerConfirmationPreview706
} from '../assets/quote-booking-v706.mjs';
import {filterQuoteInbox704,quoteAttention704} from '../assets/quote-followup-v704.mjs';
import {onRequestGet} from '../functions/api/admin/quote_booking_verify.js';
import {onRequestPost as saveQuote} from '../functions/api/admin/quote_pipeline_save.js';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f';
const bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e';
const quote={id:quoteId,status:'accepted',customer_name:'  Alex   Example ',accepted_amount_cents:25000,
  quote_number:'RD-706',service_label:'Premium wash',town:'Tillsonburg'};
const booking={id:bookingId,customer_name:'Alex Example',status:'confirmed',job_status:'scheduled',
  service_date:'2026-11-04',start_slot:'morning',vehicle_size:'suv',package_code:'premium'};

assert.equal(quoteBookingEligibility706(quote).ready,true);
assert.equal(quoteBookingEligibility706({...quote,status:'requested'}).ready,false);
assert.equal(quoteBookingEligibility706({...quote,accepted_amount_cents:0}).ready,false);
assert.equal(bookingMatch706(quote,booking).verified,true);
assert.equal(bookingMatch706(quote,{...booking,customer_name:'Different Person'}).verified,false);
assert.equal(bookingMatch706(quote,{...booking,status:'cancelled'}).verified,false);
assert.equal(bookingMatch706(quote,{...booking,start_slot:null}).verified,false);
assert.equal(customerConfirmationPreview706(quote,booking,{verified:true,linked:true}).readyToCopy,true);
assert.equal(customerConfirmationPreview706(quote,booking,{verified:true,linked:false}).readyToCopy,false);
assert.equal(customerConfirmationPreview706(quote,{...booking,status:'pending'},{verified:true,linked:true}).readyToCopy,false);
assert.equal(customerConfirmationPreview706(quote,null).readyToCopy,false);
assert.doesNotMatch(customerConfirmationPreview706({...quote,customer_name:'Alex\nBad'},booking).text,/Alex\nBad/);
const followups=[{status:'sent',follow_up_stage:FOLLOW_UP_COMPLETED_STAGE706},
  {status:'accepted',follow_up_stage:FOLLOW_UP_COMPLETED_STAGE706},{status:'draft',follow_up_stage:'due'}];
assert.equal(completedFollowUps706(followups),2);
assert.equal(filterQuoteInbox704(followups,{filter:'completed_follow_up'}).length,2);
assert.equal(quoteAttention704(followups[0]),'completed');

const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const credential={'x-admin-password':'test-only'};
const url=`https://rosiedazzlers.ca/api/admin/quote_booking_verify?quote_id=${quoteId}&booking_id=${bookingId}`;
const originalFetch=globalThis.fetch;
let calls=[];
let otherLink=[];
let saved=[];
let returnedBooking=booking;
globalThis.fetch=async(input,opts={})=>{
  const target=new URL(String(input));
  calls.push({path:target.pathname,method:opts.method||'GET',url:String(input)});
  assert.equal(target.origin,env.SUPABASE_URL,'Must never query a public endpoint or gateway');
  assert.match(target.pathname,/^\/rest\/v1\/(?:bookings|quote_pipeline_items)$/);
  if(target.pathname.endsWith('bookings')) return Response.json([returnedBooking]);
  if((opts.method||'GET')==='PATCH') {saved.push(JSON.parse(opts.body));return Response.json([{...quote,...saved.at(-1)}]);}
  if(target.searchParams.get('booking_id'))return Response.json(otherLink);
  return Response.json([{...quote,customer_name:'Alex Example',booking_id:null}]);
};
try {
  let response=await onRequestGet({request:new Request(url),env});
  assert.equal(response.status,401,'Unauthenticated verification must fail before Supabase');
  assert.equal(calls.length,0);
  response=await onRequestGet({request:new Request(url.replace(bookingId,'invalid'),{headers:credential}),env});
  assert.equal(response.status,400);
  assert.equal(calls.length,0);

  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  assert.equal(response.status,200);
  const found=await response.json();
  assert.equal(found.verified,true);
  assert.equal(found.links_quote,false);
  assert.equal(found.sends_confirmation,false);
  assert.ok(calls.every(v=>v.method==='GET'),'Verification must be read-only');
  otherLink=[{id:'another-quote'}];
  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  assert.equal(response.status,409,'Existing link to another quote must block');
  otherLink=[];
  returnedBooking={...booking,customer_name:'Wrong customer'};
  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  assert.equal(response.status,409,'Wrong customer must block');
  returnedBooking=booking;

  const requestBody={id:quoteId,customer_name:'Alex Example',status:'accepted',accepted_amount_cents:25000,
    booking_id:bookingId,service_label:'Premium wash',quote_number:'RD-706'};
  response=await saveQuote({request:new Request('https://rosiedazzlers.ca/api/admin/quote_pipeline_save',{
    method:'POST',headers:{...credential,'Content-Type':'application/json'},body:JSON.stringify(requestBody)
  }),env});
  assert.equal(response.status,200,'A verified new link may be explicitly saved');
  assert.equal(saved.length,1);
  assert.equal(saved[0].booking_id,bookingId);
  assert.equal(calls.filter(v=>v.method==='PATCH').length,1);
  assert.ok(calls.every(v=>v.method==='GET'||v.path.endsWith('/quote_pipeline_items')),
    'No booking, payment or customer write');

  const unsafeBody={...requestBody,customer_name:'Wrong customer'};
  response=await saveQuote({request:new Request('https://rosiedazzlers.ca/api/admin/quote_pipeline_save',{
    method:'POST',headers:{...credential,'Content-Type':'application/json'},body:JSON.stringify(unsafeBody)
  }),env});
  assert.equal(response.status,409,'Quote edits and new booking link must be saved separately');
  assert.equal(saved.length,1);
}finally{globalThis.fetch=originalFetch;}

assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qBookingVerify706','qBookingVerifyStatus706','qFollowComplete706','qCustomerPreview706','qCopyConfirmation706'])
  assert.match(read('admin-quotes.html'),new RegExp('id="'+id+'"'));
const script=read('assets/admin-quotes-v298.js');
assert.match(script,/quote_booking_verify/);
assert.match(script,/verifiedBooking706/);
assert.match(script,/navigator\.clipboard\.writeText/);
assert.doesNotMatch(script,/localStorage|sessionStorage/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build706_quote_booking_verification_test\.mjs/);
assert.match(read('admin-gift-recovery-review.html'),/Gift testing paused/);
console.log('Build 706 PASS: real read-only booking match, source-save link guard, confirmation preview, explicit follow-up and Gift pause');
