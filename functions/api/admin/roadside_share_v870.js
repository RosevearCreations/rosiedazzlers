// Rosie 870: consent-scoped quote link issuance/revocation and original-provider deposit readback.
// Never writes booking status, payment status, quotes or captured media.
import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { onRequestGet as verifyCanonicalBooking } from '../booking_confirmation.js';
const headers={ 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer' };
const allowedPackages=new Set(['premium_wash','basic_detail','complete_detail','interior_detail','exterior_detail']);
const allowedSizes=new Set(['small','mid','oversize']);
const clean=(x,n=180)=>String(x??'').trim().slice(0,n);
const fail=(error,status=400)=>json({ok:false,build:870,error,booking_created:false,deposit_collected:false},status,headers);
const ready=e=>/^https:\/\//.test(e.SUPABASE_URL||'')&&Boolean(e.SUPABASE_SERVICE_ROLE_KEY);
async function db(env,table,method='GET',query='',data){
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+table+query,{
  method,headers:{...serviceHeaders(env),...(method==='GET'?{}:{Prefer:'return=representation'}),
   ...(data===undefined?{}:{'Content-Type':'application/json'})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})});
 const result=await response.json().catch(()=>null);
 if(!response.ok||!Array.isArray(result))throw Error('Private quote storage is unavailable');
 return result;
}
async function getDraft(env,id){
 const rows=await db(env,'rosie_detailing_intake_v868','GET','?select=id,status,expires_at,'+
  'contact_permission,customer_email,quote_cents,linked_booking_id,quote_share_withdrawn_at'+
  '&id=eq.'+encodeURIComponent(id)+'&limit=2');
 return rows.length===1&&rows[0].status==='intake_draft'?rows[0]:null;
}
async function shares(env,id){
 return db(env,'rosie_roadside_quote_shares_v870','GET','?select=id,created_at,expires_at,'+
  'revoked_at,quote_snapshot_cents,package_code,vehicle_size'+
  '&draft_id=eq.'+encodeURIComponent(id)+'&order=created_at.desc&limit=10');
}
async function sha256(value){
 const bytes=new TextEncoder().encode(value),digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function token(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function activeLink(rows){return rows.find(x=>!x.revoked_at&&Date.parse(x.expires_at)>Date.now())||null;}
async function deposit(env,bookingId){
 const rows=await db(env,'bookings','GET','?select=id,status,payment_provider,deposit_cents,'+
  'stripe_session_id,stripe_payment_intent_id,paypal_order_id,paypal_capture_id'+
  '&id=eq.'+encodeURIComponent(bookingId)+'&limit=2');
 if(rows.length!==1)return {state:'hold_unverified',provider:'unknown',verified:false};
 const b=rows[0],provider=clean(b.payment_provider,30).toLowerCase();
 if(provider==='gift')return {state:'gift_covered_no_cash_deposit',provider:'gift',verified:false};
 if(!['stripe','paypal'].includes(provider))
  return {state:'hold_unverified',provider:'unknown',verified:false};
 const params=new URLSearchParams({booking_id:bookingId,provider});
 if(provider==='stripe'){
  if(!b.stripe_session_id)return {state:'pending_provider',provider,verified:false};
  params.set('session_id',b.stripe_session_id);
 }else{
  if(!b.paypal_order_id)return {state:'pending_provider',provider,verified:false};
  params.set('order_id',b.paypal_order_id);
 }
 // Reuse the canonical provider verification, including booking identity,
 // CAD currency, exact payable amount and Stripe live-session check.
 const request=new Request('https://rosiedazzlers.ca/api/booking_confirmation?'+params);
 const response=await verifyCanonicalBooking({request,env});
 const verdict=await response.json().catch(()=>null);
 if(!response.ok||verdict?.ok!==true)
  return {state:'hold_unverified',provider,verified:false};
 const sourceReceipt=provider==='stripe'?Boolean(b.stripe_payment_intent_id):
  Boolean(b.paypal_capture_id);
 const confirmed=b.status==='confirmed'&&verdict.booking_confirmed===true;
 const verified=verdict.payment_verified===true&&confirmed&&sourceReceipt;
 return {state:verified?'verified_original_deposit':
   verdict.payment_verified===true?'settlement_pending':'pending_provider',
  provider,verified,
  original_deposit_cad:Number(b.deposit_cents||0)/100,
  booking_confirmed:confirmed,
  note:'Original deposit only; refunds and current net balance require separate provider review.'};
}
export const onRequestOptions=()=>new Response(null,{status:204,headers});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Unsupported request',405);
 if(!ready(env))return fail('Original private Supabase authority unavailable',503);
 const body=request.method==='POST'?await request.text().catch(()=>''):'';
 if(body.length>6000)return fail('Request too large',413);
 let data={};
 if(request.method==='POST')try{
  data=JSON.parse(body);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();
 }catch{return fail('JSON object required');}
 const auth=await requireStaffAccess({request,env,body:data,
  capability:'manage_bookings',allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session')return fail('Signed-in booking staff required',403);
 const actor=clean(auth.actor?.email||auth.actor?.id,140);
 if(actor.length<3)return fail('Original staff identity required',403);
 const id=clean(request.method==='GET'?new URL(request.url).searchParams.get('draft_id'):
  data.draft_id,80);
 if(!isUuid(id))return fail('Original private draft ID required');
 try{
  const draft=await getDraft(env,id);
  if(!draft)return fail('Original detailing draft unavailable',404);
  if(Date.parse(draft.expires_at)<=Date.now())
   return fail('Original draft expired; owner retention review required',409);
  if(request.method==='GET'){
   const links=await shares(env,id);
   return json({ok:true,build:870,share:activeLink(links),links:links.map(x=>({
    ...x,active:!x.revoked_at&&Date.parse(x.expires_at)>Date.now()})),
    quote_consent_withdrawn:Boolean(draft.quote_share_withdrawn_at),
    deposit:draft.linked_booking_id?await deposit(env,draft.linked_booking_id):
     {state:'not_booked',verified:false},
    booking_created:false,deposit_collected:false},200,headers);
  }
  const action=clean(data.action,40);
  if(action==='issue'){
   if(data.confirm_customer_quote_sharing!==true||
      data.confirm_customer_receive_link!==true)
    return fail('Customer must explicitly agree to quote sharing and this one-link delivery',400);
   if(draft.quote_share_withdrawn_at)return fail('Customer withdrew quote sharing; begin a fresh consented intake',409);
   if(draft.contact_permission!==true||!draft.customer_email||
      !Number.isInteger(draft.quote_cents)||draft.quote_cents<1)
    return fail('A saved contact-consented quote with customer email is required',409);
   if(draft.linked_booking_id)return fail('Draft already linked to a booking',409);
   const previous=await shares(env,id);
   if(previous.some(x=>!x.revoked_at))return fail(
    'A link already exists (possibly expired). Revoke the old link before issuing another.',409);
   const packageCode=clean(data.package_code,40),size=clean(data.vehicle_size,20);
   if(packageCode&&!allowedPackages.has(packageCode)||size&&!allowedSizes.has(size))
    return fail('Unknown booking preference',400);
   const value=token(),digest=await sha256(value),now=new Date(),
    expiry=new Date(now.getTime()+7*24*60*60*1000);
   const row={id:crypto.randomUUID(),draft_id:id,token_hash:digest,
    quote_snapshot_cents:draft.quote_cents,package_code:packageCode||null,
    vehicle_size:size||null,consent_attested:true,consent_recorded_at:now.toISOString(),
    created_by_staff:actor,expires_at:expiry.toISOString()};
   const added=await db(env,'rpc/rosie871_issue_roadside_share','POST','',{
    p_share_id:row.id,p_draft_id:id,p_token_hash:digest,
    p_package_code:row.package_code,p_vehicle_size:row.vehicle_size,p_actor:actor});
   if(added.length!==1||added[0].outcome!=='ISSUED_CONSENTED')
    throw Error('Atomic consent-bound quote issuance unavailable');
   // Fragment keeps the bearer secret out of HTTP requests, server access logs,
   // redirects, and canonical booking query strings.
   const link='https://rosiedazzlers.ca/roadside-quote.html#share='+value;
   return json({ok:true,build:870,share_url:link,share_id:row.id,
    expires_at:added[0].valid_until,quote_cad:Number(added[0].quote_amount_cents)/100,
    customer_delivery_performed:false,booking_created:false,deposit_collected:false},201,headers);
  }
  if(action==='revoke'){
   const shareId=clean(data.share_id,80);
   if(!isUuid(shareId))return fail('Exact share ID required');
   const revoked=await db(env,'rosie_roadside_quote_shares_v870','PATCH',
    '?id=eq.'+encodeURIComponent(shareId)+'&draft_id=eq.'+encodeURIComponent(id)+
    '&revoked_at=is.null',{revoked_at:new Date().toISOString()});
   if(revoked.length!==1)return fail('Link is already revoked or no longer exists',409);
   return json({ok:true,build:870,revoked:true,deposit_collected:false},200,headers);
  }
  if(action==='reconcile'){
   if(!isUuid(draft.linked_booking_id))return fail('Canonical booking link is required',409);
   const result=await deposit(env,draft.linked_booking_id);
   await db(env,'rosie_roadside_deposit_checks_v870','POST','',[{
    id:crypto.randomUUID(),draft_id:id,booking_id:draft.linked_booking_id,
    checked_by_staff:actor,provider:result.provider,result:result.state,
    source_is_canonical:true}]);
   return json({ok:true,build:870,deposit:result,
    deposit_collected:result.verified,booking_created:false,
    no_booking_or_payment_mutation:true},200,headers);
  }
  return fail('Unsupported quote-sharing action',405);
 }catch(e){return fail(e?.message||'Private roadside service unavailable',503);}
}
