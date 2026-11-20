// Rosie 913: exact provider event/payment contract. No browser/owner-entered status can authorize a paid sale.
import {UUID912} from './build912-retail-contract.mjs';
export const RETAIL_MODE_913='gated_stripe_original_only';
const validCents=v=>Number.isSafeInteger(v)&&v>0&&v<=11300000;
export function providerEvent913(event){
 if(!event||typeof event!=='object'||typeof event.id!=='string'||!/^evt_[A-Za-z0-9_]{6,180}$/.test(event.id))
  throw Error('Invalid original provider event');
 const type=event.type,ob=event.data?.object;
 if(!ob||typeof ob!=='object')throw Error('Missing original Stripe object');
 if(type==='checkout.session.completed'){
  const order_id=String(ob.metadata?.rosie_retail_order_id||'');
  if(!UUID912.test(order_id)||ob.object!=='checkout.session'||ob.mode!=='payment'||
   ob.payment_status!=='paid'||ob.currency?.toLowerCase()!=='cad'||
   !validCents(ob.amount_total)||!/^cs_[A-Za-z0-9_]+$/.test(String(ob.id||''))||
   !/^pi_[A-Za-z0-9_]+$/.test(String(ob.payment_intent||'')))
   throw Error('Provider checkout cannot establish a verified CAD retail payment');
  return {kind:'checkout_paid',event_id:event.id,order_id,session_id:ob.id,
   payment_intent:ob.payment_intent,amount_cents:ob.amount_total};
 }
 if(type==='refund.updated' && ob.object==='refund' && ob.status==='succeeded'){
  if(!/^re_[A-Za-z0-9_]+$/.test(String(ob.id||''))||!validCents(ob.amount)||
    ob.currency?.toLowerCase()!=='cad')
   throw Error('Invalid original Stripe refund event');
  return {kind:'refund_succeeded',event_id:event.id,refund_id:ob.id,
   amount_cents:ob.amount};
 }
 return {kind:'ignored',event_id:event.id};
}
export function normalizeRefundCommand913(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
 Object.keys(raw).some(k=>!['action','order_id','amount_cents','reason','refund_id','pin','note','customer_present_attested'].includes(k)))
 throw Error('Unsupported privileged retail fields');
 const order_id=String(raw.order_id||'');
 if(!UUID912.test(order_id))throw Error('Valid original order UUID required');
 if(raw.action==='request_refund'){
  const reason=String(raw.reason||'').trim();
  if(!validCents(raw.amount_cents)||reason.length<8||reason.length>400)throw Error('Refund amount and reason required');
  return {action:raw.action,order_id,amount_cents:raw.amount_cents,reason};
 }
 if(raw.action==='send_refund'){
  if(!UUID912.test(String(raw.refund_id||'')))throw Error('Valid original refund request required');
  return {action:raw.action,order_id,refund_id:raw.refund_id};
 }
 if(raw.action==='handoff'){
  const pin=String(raw.pin||'').trim().toUpperCase(),note=String(raw.note||'').trim();
  if(!/^[A-F0-9]{24}$/.test(pin)||raw.customer_present_attested!==true||
   note.length<12||note.length>400)
   throw Error('Customer code and physical custody attestation required');
  return {action:raw.action,order_id,pin,note,customer_present_attested:true};
 }
 throw Error('Unsupported retail financial action');
}
export function financeGuard913(env,action){
 const enabled=String(env?.ROSIE_RETAIL_FINANCE_ENABLED_913||'')==='true';
 if(!enabled)return {ok:false,reason:'OWNER_GATED_RETAIL_FINANCE_OFF'};
 if(!env?.STRIPE_SECRET_KEY||!env?.STRIPE_RETAIL_WEBHOOK_SECRET_913||
    !String(env.STRIPE_SECRET_KEY).startsWith('sk_'))
  return {ok:false,reason:'ORIGINAL_STRIPE_CREDENTIALS_NOT_ENROLLED'};
 if(String(env?.ROSIE_RETAIL_HST_APPROVED_913||'')!=='true')
  return {ok:false,reason:'OWNER_HST_MAPPING_APPROVAL_PENDING'};
 if(action==='refund'&&String(env?.ROSIE_RETAIL_REFUNDS_ENABLED_913||'')!=='true')
  return {ok:false,reason:'REFUND_AUTHORITY_NOT_ACTIVATED'};
 return {ok:true,reason:'CONFIGURED_NOT_PROVIDER_CERTIFIED'};
}
export async function sha256Retail913(text){
 const bytes=new TextEncoder().encode(String(text));
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function verifyStripeSignature913(raw,signature,secret,nowSeconds=Math.floor(Date.now()/1000)){
 if(typeof raw!=='string'||raw.length>100000||typeof secret!=='string'||secret.length<12||!signature)
 return false;
 const segments=String(signature).split(',').map(x=>x.trim()).filter(Boolean);
 const timestamp=segments.find(x=>/^t=\d{10}$/.test(x))?.slice(2);
 const candidates=segments.filter(x=>/^v1=[a-f0-9]{64}$/i.test(x)).map(x=>x.slice(3).toLowerCase());
 if(!timestamp||!candidates.length||Math.abs(nowSeconds-Number(timestamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const output=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+raw)));
 const expected=[...output].map(b=>b.toString(16).padStart(2,'0')).join('');
 let any=0;
 for(const candidate of candidates){
  let mismatch=0;
  for(let i=0;i<expected.length;i++)mismatch|=candidate.charCodeAt(i)^expected.charCodeAt(i);
  any|=Number(mismatch===0);
 }
 return any===1;
}
