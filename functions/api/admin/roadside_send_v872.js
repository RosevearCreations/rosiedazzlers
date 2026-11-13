// Rosie 872: explicitly authorized, exactly-one-attempt quote email dispatch.
// Provider acceptance != signed delivery proof. Never retries after ambiguity.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {dispatchNotificationThroughProvider} from '../_lib/provider-dispatch.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const failure=(e,status=400)=>json({ok:false,build:872,error:e,delivery_confirmed:false,booking_created:false},status,h);
const text=(x,n=180)=>String(x??'').trim().slice(0,n);
const configured=env=>/^https:\/\//.test(env.SUPABASE_URL||'')&&!!env.SUPABASE_SERVICE_ROLE_KEY;
async function db(env,entity,method='GET',query='',data){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+entity+query,{
  method,redirect:'error',
  headers:{...serviceHeaders(env),...(method==='GET'?{}:{Prefer:'return=representation'})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})});
 const out=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(out))throw Error('Original quote delivery ledger unavailable');
 return out;
}
async function digest(s){
 const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
 return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function providerRef(result){
 const r=result?.provider_response;
 const value=typeof r==='object'&&r?(r.message_id||r.id||r.request_id||null):null;
 const key=typeof value==='string'?value.trim():'';
 return /^[A-Za-z0-9._:-]{8,160}$/.test(key)?key:null;
}
export const onRequestOptions=()=>new Response(null,{status:204,headers:h});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return failure('Unsupported method',405);
 if(!configured(env))return failure('Original private storage not configured',503);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>3000)return failure('Request too large',413);
 let body={};
 if(request.method==='POST')try{
  body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();
 }catch{return failure('JSON object required');}
 const auth=await requireStaffAccess({request,env,body,capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session')return failure('Original staff session required',403);
 const actor=text(auth.actor?.email||auth.actor?.id,140);
 if(actor.length<3)return failure('Original staff identity required',403);
 const draftId=text(request.method==='GET'?
  new URL(request.url).searchParams.get('draft_id'):body.draft_id,80);
 if(!isUuid(draftId))return failure('Original draft ID required');
 try{
  if(request.method==='GET'){
   const items=await db(env,'rosie_roadside_dispatches_v872','GET',
    '?select=id,share_id,channel,provider,state,provider_accepted_at,receipt_at,created_at'+
    '&draft_id=eq.'+encodeURIComponent(draftId)+'&order=created_at.desc&limit=10');
   return json({ok:true,build:872,dispatches:items,
    no_customer_delivery_inferred:true},200,h);
  }
  if(body.action!=='send_consented_email'||body.confirm_customer_email_delivery!==true||
    body.confirm_one_attempt_no_automatic_retry!==true)
   return failure('Explicit single-attempt customer-consented email send required',400);
  if(!isUuid(body.share_id))return failure('Original quote share required');
  const token=text(body.share_token,80);
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return failure('Original private link token unavailable',409);
  const id=crypto.randomUUID(),hash=await digest(token);
  // Original SQL row lock checks saved email, quote, share consent, token and
  // uniqueness before returning recipient email. No plaintext token stored.
  const claim=await db(env,'rpc/rosie872_claim_quote_dispatch','POST','',{
   p_id:id,p_draft_id:draftId,p_share_id:body.share_id,p_token_hash:hash,
   p_channel:'email',p_recipient_hash:await digest(
    text(body.recipient_confirmed_email,180).toLowerCase()),
   p_actor:actor});
  if(claim.length!==1||claim[0].outcome!=='CLAIMED_ONCE')
   throw Error('Original one-time delivery claim unavailable');
  const recipient=text(claim[0].recipient_email,180);
  if(!recipient||recipient.toLowerCase()!==text(body.recipient_confirmed_email,180).toLowerCase()){
   await db(env,'rosie_roadside_dispatches_v872','PATCH','?id=eq.'+id,{state:'dispatch_unknown'});
   return failure('Saved consented recipient changed; no provider send attempted',409);
  }
  const quoteLink='https://rosiedazzlers.ca/roadside-quote.html#share='+token;
  // Provider connector is the existing original Rosie notification sender.
  // It may return a provider message ID (accepted), but it cannot assert inbox delivery.
  let result;
  try{result=await dispatchNotificationThroughProvider(env,{
   id,channel:'email',event_type:'roadside_consented_quote_v872',
   recipient_email:recipient,subject:'Your Rosie Dazzlers detailing estimate',
   body_text:'Here is the private quote link you requested. This is an estimate, not a booking or a payment. The link expires in seven days. '+quoteLink,
   payload:{quote_dispatch_id:id,share_id:body.share_id,source_build:872,
    booking_created:false,deposit_collected:false}
  });}catch{result={ok:false};}
  const reference=result?.ok?providerRef(result):null;
  const provider=result?.ok?text(result.provider||'email',80):null;
  const patch=await db(env,'rosie_roadside_dispatches_v872','PATCH',
   '?id=eq.'+encodeURIComponent(id)+'&state=eq.claimed',{
    state:reference?'provider_accepted':'dispatch_unknown',
    provider:provider||null,provider_message_id:reference,
    provider_accepted_at:reference?new Date().toISOString():null});
  if(patch.length!==1)throw Error('Delivery attempt outcome could not be reconciled');
  if(!reference)
   return json({ok:true,build:872,dispatch_id:id,status:'dispatch_unknown',
    delivery_confirmed:false,provider_accepted:false,
    warning:'Provider delivery is unknown or not configured. Do not retry this link automatically. Reconcile with provider first.',
    booking_created:false,deposit_collected:false},202,h);
  return json({ok:true,build:872,dispatch_id:id,status:'provider_accepted',
   provider_message_id:reference,delivery_confirmed:false,provider_accepted:true,
   warning:'Provider accepted the message only. A separately signed delivery callback must confirm delivery.',
   booking_created:false,deposit_collected:false},202,h);
 }catch(e){return failure(e?.message||'Original quote delivery unavailable',409);}
}
