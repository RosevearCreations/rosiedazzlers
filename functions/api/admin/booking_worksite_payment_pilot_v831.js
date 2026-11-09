// Build 831: signed-supervisor, read-only joined booking/worksite/payment pilot.
// Never exposes customer PII, provider tokens or original signature blobs.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {bookingWorksitePaymentPilot831,normalizePayment831}
  from '../../../assets/build831-booking-worksite-payment.mjs';

const QUERY={
  bookings:'bookings?select=id,created_at,status,job_status&order=created_at.desc,id.desc&limit=40',
  updates:'job_updates?select=id,booking_id,created_at,stage,review_status,customer_action_required&order=created_at.desc,id.desc&limit=200',
  signoffs:'job_signoffs?select=id,booking_id,created_at,signed_at&order=created_at.desc,id.desc&limit=200',
  deposits:'quote_deposit_payment_requests?select=id,booking_id,confirmed_booking_id,provider,payment_status,provider_status,amount_cents,paid_amount_cents,refunded_amount_cents,refund_status,currency,paid_at,provider_event_id,created_at&order=created_at.desc,id.desc&limit=200',
  balances:'final_balance_payment_requests?select=id,booking_id,provider,status,provider_status,amount_cents,paid_amount_cents,currency,paid_at,provider_event_id,created_at&order=created_at.desc,id.desc&limit=200'
};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer'
}});
const allowed=actor=>['admin','operations_manager'].includes(String(actor?.role_code||'').toLowerCase())&&
  hasActionAccess(actor,'operations.assignment.manage');
async function read(env,query,limit){
  const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+query,{
    method:'GET',headers:serviceHeaders(env),redirect:'error'});
  if(!r.ok)throw Error('Source read failed');
  const rows=await r.json();
  if(!Array.isArray(rows)||rows.length>limit)throw Error('Invalid source response');
  return rows;
}
const linked=(ids,field)=>field+'=in.('+[...ids].join(',')+')';
export const onRequestOptions=()=>respond({ok:false,error:'Method not allowed.'},405);
export const onRequestPost=()=>respond({ok:false,error:'Read-only pilot.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!allowed(access.actor))return respond({ok:false,error:'Signed operations supervisor required.'},403);
  try{
    const bookings=await read(env,QUERY.bookings,40);
    const ids=new Set(bookings.map(row=>row.id));
    const bookingFilter=linked(ids,'booking_id');
    const quoteFilter='or=('+linked(ids,'booking_id')+','+
      linked(ids,'confirmed_booking_id')+')';
    const [updates,signoffs,deposits,balances]=ids.size?await Promise.all([
      read(env,QUERY.updates+'&'+bookingFilter,200),
      read(env,QUERY.signoffs+'&'+bookingFilter,200),
      read(env,QUERY.deposits+'&'+quoteFilter,200),
      read(env,QUERY.balances+'&'+bookingFilter,200)
    ]):[[],[],[],[]];
    const report=bookingWorksitePaymentPilot831({bookings,updates,signoffs,
      payments:[...deposits.map(row=>normalizePayment831(row,'deposit')),
        ...balances.map(row=>normalizePayment831(row,'final_balance'))],
      sourceWindowAtLimit:deposits.length===200||balances.length===200,
      generatedAt:new Date().toISOString(),sourceRevision:env.CF_PAGES_COMMIT_SHA});
    return respond({ok:true,build:831,report,scope:'signed_supervisor_local_pilot_only',
      sourceAuthority:{server_only_select:true,request_method:'GET',
        booking_count_bounded:true,provider_contacts:0,customer_contacted:false,
        no_payment_or_booking_change:true,no_master_submission:true,
        canonical_hold_changed:false}});
  }catch{return respond({ok:false,error:'Private booking/worksite/payment source unavailable or incomplete; no pilot outcome inferred.'},503);}
}
