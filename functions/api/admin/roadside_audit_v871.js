// Build 871: staff-only delivery attestation, irrevocable quote consent withdrawal,
// current original-provider refund readback. Never refunds, bills or confirms bookings.
import { requireStaffAccess,serviceHeaders,json,isUuid } from '../_lib/staff-auth.js';
import { onRequestGet as verifyCanonicalBooking } from '../booking_confirmation.js';
import { assessStripeRefunds,assessPaypalCapture,holdResult } from '../_lib/roadside-refund-871.js';
const headers={ 'Cache-Control':'no-store','Referrer-Policy':'no-referrer' };
const txt=(x,n=180)=>String(x??'').trim().slice(0,n);
const fail=(error,status=400)=>json({ok:false,build:871,error,
 booking_created:false,deposit_collected:false},status,headers);
function configured(env){return /^https:\/\//.test(env.SUPABASE_URL||'')&&!!env.SUPABASE_SERVICE_ROLE_KEY;}
async function db(env,table,{method='GET',query='',data}={}){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+table+query,
  {method,headers:{...serviceHeaders(env),...(method==='GET'?{}:{Prefer:'return=representation'}),
   ...(data===undefined?{}:{'Content-Type':'application/json'})},
   ...(data===undefined?{}:{body:JSON.stringify(data)})});
 const result=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(result))throw Error('Private Rosie custody storage unavailable');
 return result;
}
async function draft(env,id){
 const rows=await db(env,'rosie_detailing_intake_v868',{query:'?select=id,status,linked_booking_id,'+
  'quote_share_withdrawn_at,private_capture_withdrawn_at'+
  '&id=eq.'+encodeURIComponent(id)+'&limit=2'});
 return rows.length===1&&rows[0].status==='intake_draft'?rows[0]:null;
}
async function evidenceGet(env,table,select,filter,limit=15){
 return db(env,table,{query:'?select='+select+'&draft_id=eq.'+encodeURIComponent(filter)+
  '&order='+encodeURIComponent(table==='rosie_roadside_delivery_audit_v871'?
   'occurred_at.desc':'checked_at.desc')+'&limit='+limit});
}
async function jsonGet(url,headers){
 const r=await fetch(url,{headers});
 const data=await r.json().catch(()=>null);
 if(!r.ok||!data)return null;
 return data;
}
function centsToCad(c){return c===null||c===undefined?null:Number(c)/100;}
async function refundReadback(env,bookingId){
 const rows=await db(env,'bookings',{query:'?select=id,status,deposit_cents,payment_provider,'+
  'stripe_session_id,stripe_payment_intent_id,paypal_order_id,paypal_capture_id'+
  '&id=eq.'+encodeURIComponent(bookingId)+'&limit=2'});
 if(rows.length!==1)return {...holdResult('Original booking does not exist'),
  state:'deposit_unverified_hold',provider:'unknown'};
 const booking=rows[0],provider=txt(booking.payment_provider,20).toLowerCase();
 const base={provider,appointment_confirmed:booking.status==='confirmed',
  booking_is_cancelled:booking.status==='cancelled'};
 if(provider==='gift')
  return {...base,state:'gift_only_no_cash_deposit',net_verified:false,
   gross_cents:null,refunded_cents:null,net_cents:null,source:'original_booking',
   reason:'Gift settlement is not a cash deposit; review gift authority separately.'};
 if(!Number.isSafeInteger(booking.deposit_cents)||booking.deposit_cents<1)
  return {...base,...holdResult('Missing canonical planned deposit'),
   state:'deposit_unverified_hold'};
 if(provider==='stripe'){
  if(!env.STRIPE_SECRET_KEY||!booking.stripe_session_id||
     !booking.stripe_payment_intent_id)
   return {...base,...holdResult('Original Stripe credentials or identifiers unavailable'),
    state:'provider_unavailable_hold'};
  const query=new URLSearchParams({booking_id:bookingId,provider:'stripe',
   session_id:booking.stripe_session_id});
  const canonical=await verifyCanonicalBooking({request:
   new Request('https://rosiedazzlers.ca/api/booking_confirmation?'+query),env});
  const verdict=await canonical.json().catch(()=>null);
  if(!canonical.ok||verdict?.payment_verified!==true)
   return {...base,...holdResult('Canonical Stripe booking settlement not verified','stripe_live'),
    state:'deposit_unverified_hold'};
  const sk={Authorization:'Bearer '+env.STRIPE_SECRET_KEY};
  const session=await jsonGet('https://api.stripe.com/v1/checkout/sessions/'+
   encodeURIComponent(booking.stripe_session_id),sk);
  if(!session||session.id!==booking.stripe_session_id||
     session.payment_intent!==booking.stripe_payment_intent_id||
     session.metadata?.booking_id!==bookingId)
   return {...base,...holdResult('Stripe checkout/booking payment identity mismatch','stripe_live')};
  const pi=encodeURIComponent(booking.stripe_payment_intent_id);
  const [charges,refunds]=await Promise.all([
   jsonGet('https://api.stripe.com/v1/charges?payment_intent='+pi+'&limit=100',sk),
   jsonGet('https://api.stripe.com/v1/refunds?payment_intent='+pi+'&limit=100',sk)
  ]);
  const result=assessStripeRefunds({session,charges,refunds,
   paymentIntentId:booking.stripe_payment_intent_id});
  return {...base,...result,net_cad:centsToCad(result.net_cents),
   refunded_cad:centsToCad(result.refunded_cents),
   note:result.note||result.reason||null};
 }
 if(provider==='paypal'){
  if(!env.PAYPAL_CLIENT_ID||!(env.PAYPAL_CLIENT_SECRET||env.PAYPAL_SECRET)||
   !booking.paypal_capture_id||!booking.paypal_order_id)
   return {...base,...holdResult('Original PayPal credentials/capture unavailable'),
    state:'provider_unavailable_hold'};
  const auth=btoa(env.PAYPAL_CLIENT_ID+':'+(env.PAYPAL_CLIENT_SECRET||env.PAYPAL_SECRET));
  const root=txt(env.PAYPAL_API_BASE,120)||'https://api-m.paypal.com';
  if(!/^https:\/\/api-m(?:\.sandbox)?\.paypal\.com$/.test(root))
   return {...base,...holdResult('Untrusted PayPal endpoint'),
    state:'provider_unavailable_hold'};
 const login=await fetch(root+'/v1/oauth2/token',{method:'POST',
   headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'},
   body:'grant_type=client_credentials'});
  const tokenData=await login.json().catch(()=>null);
  if(!login.ok||!tokenData?.access_token)
   return {...base,...holdResult('PayPal token unavailable','paypal_live'),
    state:'provider_unavailable_hold'};
  const headers={Authorization:'Bearer '+tokenData.access_token};
  const [order,capture]=await Promise.all([
   jsonGet(root+'/v2/checkout/orders/'+encodeURIComponent(booking.paypal_order_id),headers),
   jsonGet(root+'/v2/payments/captures/'+encodeURIComponent(booking.paypal_capture_id),headers)
  ]);
  if(!order||order.id!==booking.paypal_order_id)
   return {...base,...holdResult('PayPal original order readback unavailable','paypal_live')};
  const result=assessPaypalCapture({order,capture,bookingId,
   captureId:booking.paypal_capture_id,expectedCents:booking.deposit_cents});
  return {...base,...result,net_cad:centsToCad(result.net_cents),
   refunded_cad:centsToCad(result.refunded_cents),
   note:result.note||result.reason||null};
 }
 return {...base,...holdResult('Unsupported canonical payment provider'),
  state:'deposit_unverified_hold',provider:'unknown'};
}
export const onRequestOptions=()=>new Response(null,{status:204,headers});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Unsupported method',405);
 if(!configured(env))return fail('Original Supabase project unavailable',503);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>5000)return fail('Request too large',413);
 let data={};
 if(request.method==='POST')try{
  data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error();
 }catch{return fail('JSON object required');}
 const access=await requireStaffAccess({request,env,body:data,
  capability:'manage_bookings',allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session')return fail('Signed-in booking staff required',403);
 const actor=txt(access.actor?.email||access.actor?.id,140);
 if(actor.length<3)return fail('Staff identity required',403);
 const id=txt(request.method==='GET'?
  new URL(request.url).searchParams.get('draft_id'):data.draft_id,80);
 if(!isUuid(id))return fail('Saved original draft ID required');
 try{
  const current=await draft(env,id);
  if(!current)return fail('Original private draft not found',404);
  if(request.method==='GET'){
   const [deliveries,netChecks]=await Promise.all([
    evidenceGet(env,'rosie_roadside_delivery_audit_v871',
     'id,event_type,channel,actor,occurred_at,independent_provider_delivery_proof,stopped_future_capture',id),
    evidenceGet(env,'rosie_roadside_net_deposit_checks_v871',
     'id,booking_id,checked_at,provider,state,gross_cents,refunded_cents,net_cents,net_verified,source',id,5)
   ]);
   return json({ok:true,build:871,quote_consent_withdrawn:Boolean(current.quote_share_withdrawn_at),
    private_capture_withdrawn:Boolean(current.private_capture_withdrawn_at),
    delivery_audit:deliveries,net_history:netChecks,
    booking_linked:Boolean(current.linked_booking_id),
    provider_checked_live:false,booking_created:false,deposit_collected:false},200,headers);
  }
  const action=txt(data.action,48);
  if(action==='record_delivery'){
   if(data.confirm_staff_witnessed_event!==true)
    return fail('Staff must explicitly attest to the manual delivery event',400);
   const shareId=txt(data.share_id,80);
   if(!isUuid(shareId))return fail('Exact active share ID required');
   const channel=txt(data.channel,30),event=txt(data.event_type,35);
   const rows=await db(env,'rpc/rosie871_record_quote_delivery',{method:'POST',data:{
    p_event_id:crypto.randomUUID(),p_draft_id:id,p_share_id:shareId,
    p_actor:actor,p_event_type:event,p_channel:channel}});
   if(rows.length!==1||!rows[0].outcome?.startsWith('STAFF_ATTESTATION'))
    throw Error('Delivery attestation not committed');
   return json({ok:true,build:871,staff_attested:true,
    provider_delivery_confirmed:false,customer_message_sent:false,
    booking_created:false,deposit_collected:false},200,headers);
  }
  if(action==='withdraw_consent'){
   if(data.confirm_customer_withdrawal_request!==true||
      data.confirm_revoke_all_quote_links!==true)
    return fail('Explicit customer withdrawal and link revocation confirmation required',400);
   const rows=await db(env,'rpc/rosie871_withdraw_quote_consent',{method:'POST',data:{
    p_event_id:crypto.randomUUID(),p_draft_id:id,p_actor:actor,
    p_stop_private_capture:data.stop_future_private_capture===true}});
   if(rows.length!==1||!['WITHDRAWN_AND_REVOKED','ALREADY_WITHDRAWN'].includes(rows[0].outcome))
    throw Error('Customer withdrawal not committed');
   return json({ok:true,build:871,outcome:rows[0].outcome,
    quote_consent_withdrawn:true,links_revoked:rows[0].links_revoked,
    private_capture_withdrawn:rows[0].private_capture_stopped,
    existing_media_retained_for_owner_review:true,
    booking_created:false,deposit_collected:false},200,headers);
  }
  if(action==='reconcile_net_deposit'){
   if(!isUuid(current.linked_booking_id))return fail('Canonical linked booking required',409);
   let result;
   try{result=await refundReadback(env,current.linked_booking_id);}
   catch{result={...holdResult('Provider readback unavailable'),
    state:'provider_unavailable_hold',provider:'unknown'};}
   const state=result.state;
   const allowed=new Set(['net_deposit_intact','partial_refund_verified','full_refund_verified',
    'refund_review_hold','provider_unavailable_hold','deposit_unverified_hold','gift_only_no_cash_deposit']);
   if(!allowed.has(state))return fail('Unsupported refund evidence status',503);
   const records=await db(env,'rosie_roadside_net_deposit_checks_v871',{method:'POST',data:[{
    id:crypto.randomUUID(),draft_id:id,booking_id:current.linked_booking_id,
    checked_by_staff:actor,provider:['stripe','paypal','gift'].includes(result.provider)?
     result.provider:'unknown',state,
    gross_cents:result.net_verified?result.gross_cents:null,
    refunded_cents:result.net_verified?result.refunded_cents:null,
    net_cents:result.net_verified?result.net_cents:null,
    net_verified:result.net_verified===true,
    source:['stripe_live','paypal_live'].includes(result.source)?
     result.source:'original_booking'
   }]});
   if(records.length!==1)throw Error('Verified net ledger audit write failed');
   return json({ok:true,build:871,deposit:result,
    original_booking_confirmed:result.appointment_confirmed===true,
    booking_created:false,deposit_collected:false,
    no_booking_or_payment_mutation:true},200,headers);
  }
  return fail('Unsupported original roadside action',405);
 }catch(e){return fail(e?.message||'Roadside audit unavailable',503);}
}
