import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PILOT_SCHEMA_831,PILOT_HANDOFFS_831,bookingWorksitePaymentPilot831,normalizePayment831}
  from '../assets/build831-booking-worksite-payment.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/booking_worksite_payment_pilot_v831.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const observedAt='2026-11-09T16:00:00.000Z';
const booking=(n=1,status='confirmed',job_status='scheduled')=>({id:id(n),created_at:observedAt,status,job_status,
  customer_name:'SHOULD-NOT-LEAK',customer_email:'private@example.invalid'});
const update=(n=3,booking_id=id(1),extra={})=>({id:id(n),booking_id,created_at:observedAt,...extra});
const signoff=(n=4,booking_id=id(1),signed_at=observedAt)=>({id:id(n),booking_id,created_at:observedAt,signed_at,
  signature_data_url:'private-binary-signature'});
const deposit=(n=5,status='paid',provider='stripe',extra={})=>normalizePayment831({
  id:id(n),booking_id:id(1),confirmed_booking_id:null,payment_status:status,provider,
  amount_cents:5000,paid_amount_cents:5000,currency:'CAD',paid_at:observedAt,
  provider_event_id:'evt_PRIVATE',created_at:observedAt,...extra},'deposit');
const balance=(n=6,status='paid',extra={})=>normalizePayment831({
  id:id(n),booking_id:id(1),status,provider:'stripe',amount_cents:9000,
  paid_amount_cents:9000,currency:'CAD',paid_at:observedAt,created_at:observedAt,...extra},'final_balance');
const report=more=>bookingWorksitePaymentPilot831({bookings:[booking()],...more});
const status=more=>report(more).rows[0].status;

const empty=bookingWorksitePaymentPilot831();
assert.equal(empty.schema,PILOT_SCHEMA_831);assert.equal(empty.sampleBookingCount,0);
assert.equal(empty.sourceId,'rosiedazzlers');assert.equal(empty.shellBoundary,'owned_business_shell');
for(const field of ['originalBookingConsentVerified','independentWorksiteWitnessVerified',
  'providerWebhookSignatureVerified','independentPaymentProviderReceiptVerified',
  'accountingReconciliationVerified','ownerPilotSignedOff','dataSentToAIPlatform',
  'dataSentToCommsHub','paymentProviderContacted','customerNotified','bookingChanged',
  'financeChanged','canonicalHoldChanged'])assert.equal(empty[field],false,field);
assert.equal(empty.completionPercent,null);assert.equal(empty.approvedDenominator,null);
assert.equal(empty.sourceConnectionState,'DISCONNECTED / HOLD');
assert.equal(status({}),'BOOKING_HANDOFF_PENDING');
assert.equal(status({bookings:[booking(1,'completed','completed')]}),'WORKSITE_SIGNOFF_MISSING');
assert.equal(status({bookings:[booking(1,'completed','completed')],
  signoffs:[signoff(4,id(1),null)]}),'WORKSITE_SIGNOFF_MISSING');
assert.equal(status({bookings:[booking(1,'completed','completed')],
  signoffs:[signoff()]}),'PAYMENT_REQUEST_MISSING');
const paid=report({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  updates:[update()],payments:[deposit(),balance()]});
assert.equal(paid.rows[0].status,'PROVIDER_RECEIPT_REVIEW_REQUIRED');
assert.equal(paid.rows[0].localDepositRequestCount,1);
assert.equal(paid.rows[0].localFinalBalanceRequestCount,1);
assert.equal(paid.rows[0].providerEventReferencePresent,true);
assert.equal(paid.rows[0].originalProviderReceiptVerified,false);
assert.equal(paid.rows[0].localAmountReconciliation,'LOCAL_MATCH_NOT_PROVIDER_PROOF');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[deposit(5,'paid','manual')]}),'MANUAL_PAYMENT_REVIEW_REQUIRED');
assert.equal(status({payments:[deposit()]}),'EARLY_PAYMENT_REVIEW');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[deposit(5,'pending','stripe',{paid_at:null,paid_amount_cents:0})]}),'PAYMENT_PENDING_REVIEW');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[deposit(5,'paid','stripe',{paid_amount_cents:4999})]}),'PAYMENT_EXCEPTION_REVIEW');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[deposit(5,'paid','stripe',{refunded_amount_cents:100})]}),'PAYMENT_EXCEPTION_REVIEW');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[deposit(5,'paid','stripe',{currency:'BTC'})]}),'PAYMENT_EXCEPTION_REVIEW');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[deposit(5,'failed','stripe',{paid_at:null,paid_amount_cents:0}),balance()]}),'PAYMENT_EXCEPTION_REVIEW');
assert.equal(status({updates:[update(3,id(1),{customer_action_required:true})]}),'WORKSITE_EXCEPTION_REVIEW');
assert.equal(status({updates:[update(3,id(1),{review_status:'blocked'})]}),'WORKSITE_EXCEPTION_REVIEW');
assert.equal(status({updates:[update()]}),'WORKSITE_IN_PROGRESS');
assert.equal(status({updates:[update(),update()]}),'SOURCE_CONFLICT');
assert.equal(status({bookings:[booking(),booking()]}),'SOURCE_CONFLICT');
assert.equal(status({bookings:[booking(1,'completed','completed')],signoffs:[signoff()],
  payments:[normalizePayment831({...deposit(),confirmed_booking_id:id(1),booking_id:id(2)},'deposit')]}),'SOURCE_CONFLICT');
assert.throws(()=>report({updates:[update(3,id(2))]}),/Out-of-scope/);
assert.throws(()=>report({payments:[{...deposit(),booking_id:'not-uuid'}]}),/Out-of-scope/);
assert.throws(()=>report({bookings:[{...booking(),created_at:'bad-date'}]}),/Malformed/);
assert.throws(()=>report({bookings:Array.from({length:41},(_,n)=>booking(n+1))}),/Bounded/);
assert.equal(report({sourceWindowAtLimit:true}).sourceWindowMayOmitHistory,true);
assert.equal(report({sourceRevision:'f'.repeat(40)}).currentDeploymentRevisionClaim,'f'.repeat(40));
assert.equal(report({sourceRevision:'bad'}).currentDeploymentRevisionClaim,null);
assert.equal(Object.keys(PILOT_HANDOFFS_831).length,11);
assert.doesNotMatch(JSON.stringify(paid),/SHOULD-NOT-LEAK|private@example.invalid|signature_data_url|evt_PRIVATE/);

let signed=false,role='detailer',allowed=true,sourceOk=true,reads=[];
const a='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const req=new Request('https://rosiedazzlers.ca/api/admin/booking_worksite_payment_pilot_v831',
  {headers:{Cookie:'rd_staff_session=token'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  CF_PAGES_COMMIT_SHA:'e'.repeat(40)};
const old=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(input),table=url.pathname.split('/').pop();reads.push({table,method:init.method||'GET',query:url.search});
  if(table==='staff_auth_sessions')return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',
    revoked_at:null,staff_user:{id:a,role_code:role,is_active:true,can_manage_bookings:true,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':allowed}}}}]:[]);
  if(!sourceOk&&table==='job_signoffs')return Response.json({error:'offline'},{status:503});
  const data={bookings:[booking(1,'completed','completed')],job_updates:[update()],
    job_signoffs:[signoff()],quote_deposit_payment_requests:[{
      ...deposit(),status:undefined,payment_status:'paid',confirmed_booking_id:null}],
    final_balance_payment_requests:[]};
  if(!Object.hasOwn(data,table))throw Error('Unexpected source '+table);
  assert.equal(init.method,'GET');
  assert.equal(init.headers.apikey,'server-only');
  return Response.json(data[table]);
};
try{
  assert.equal((await onRequestGet({request:req,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request:req,env})).status,403);
  role='operations_manager';allowed=false;assert.equal((await onRequestGet({request:req,env})).status,403);
  allowed=true;const res=await onRequestGet({request:req,env});assert.equal(res.status,200);
  assert.match(res.headers.get('Cache-Control'),/no-store/);
  const body=await res.json();assert.equal(body.report.schema,PILOT_SCHEMA_831);
  assert.equal(body.report.rows[0].status,'PROVIDER_RECEIPT_REVIEW_REQUIRED');
  assert.equal(body.report.currentDeploymentRevisionClaim,'e'.repeat(40));
  assert.equal(body.sourceAuthority.no_payment_or_booking_change,true);
  assert.ok(reads.some(x=>x.table==='quote_deposit_payment_requests'&&x.query.includes('confirmed_booking_id=in.')));
  assert.ok(reads.some(x=>x.table==='final_balance_payment_requests'));
  assert.ok(reads.every(x=>x.method==='GET'));
  assert.equal((await onRequestPost()).status,405);
  sourceOk=false;const err=await onRequestGet({request:req,env});assert.equal(err.status,503);
  assert.equal(Object.hasOwn(await err.json(),'report'),false);
}finally{globalThis.fetch=old;}

const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build831Pilot','build831Heading','build831Filter','build831Refresh',
  'build831Status','build831Count','build831Rows'])
  assert.ok(page.includes('id="'+id+'"'),'Missing accessible Build 831 '+id);
assert.match(page,/build831-pilot-ui\.mjs\?v=build831/);
assert.match(read('../assets/build831-pilot.css'),/@media\(max-width:650px\)/);
assert.doesNotMatch(read('../assets/build831-pilot-ui.mjs'),/localStorage|sessionStorage|innerHTML|method:\s*['"]POST/);
assert.doesNotMatch(read('../functions/api/admin/booking_worksite_payment_pilot_v831.js'),/method:\s*['"](?:POST|PATCH|DELETE)/);
assert.match(read('./current_booking_wizard_regression.sh'),/build831_booking_worksite_payment_pilot_test\.mjs/);
console.log('Build 831 PASS: real source-bound local joins, deposit/final split, supervisor-only privacy, negative/partial/signoff recovery, no provider or owner trust invention.');
