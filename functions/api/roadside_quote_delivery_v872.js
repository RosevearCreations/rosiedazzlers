// Signed independent delivery callback from the configured notification provider.
// No public read; rejects unsigned, replayed, stale and unrelated callbacks.
import {serviceHeaders,json,isUuid} from './_lib/staff-auth.js';
const h={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
const fail=(e,status=400)=>json({ok:false,build:872,error:e},status,h);
const safe=(x,n=160)=>String(x??'').trim().slice(0,n);
async function shaHmac(secret,body){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const hash=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body));
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function equal(a,b){
 if(a.length!==b.length)return false;
 let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);
 return x===0;
}
async function rpc(env,data){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
  '/rest/v1/rpc/rosie872_admit_provider_receipt',{
   method:'POST',redirect:'error',headers:serviceHeaders(env),
   body:JSON.stringify(data)});
 const v=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(v))throw Error('Original signed receipt ledger rejected the callback');
 return v;
}
export async function onRequestPost({request,env}){
 const secret=env.ROSIE_QUOTE_RECEIPT_WEBHOOK_SECRET||'';
 if(secret.length<32||!/^https:\/\//.test(env.SUPABASE_URL||'')||
   !env.SUPABASE_SERVICE_ROLE_KEY)return fail('Provider receipt integration not enrolled',503);
 const timestamp=request.headers.get('x-rosie-quote-timestamp')||'',
  signature=request.headers.get('x-rosie-quote-signature')||'';
 if(!/^[0-9]{10}$/.test(timestamp)||!/^sha256=[a-f0-9]{64}$/.test(signature))
  return fail('Signed provider callback required',401);
 if(Math.abs(Math.floor(Date.now()/1000)-Number(timestamp))>300)
  return fail('Provider receipt timestamp expired',401);
 const body=await request.text().catch(()=>'');
 if(body.length<2||body.length>2000)return fail('Callback outside receipt envelope',413);
 const expected=await shaHmac(secret,timestamp+'.'+body);
 if(!equal(signature.slice(7),expected))return fail('Provider signature mismatch',401);
 let payload;
 try{payload=JSON.parse(body)}catch{return fail('JSON payload required');}
 const dispatchId=safe(payload.dispatch_id,80),eventId=safe(payload.provider_event_id),
  reference=safe(payload.provider_message_id),event=safe(payload.event_type,32);
 if(!isUuid(dispatchId)||!(/^[A-Za-z0-9._:-]{8,160}$/.test(eventId))||
   !(/^[A-Za-z0-9._:-]{8,160}$/.test(reference))||
   !['delivered','failed','bounced'].includes(event))return fail('Invalid provider receipt reference');
 try{
  const result=await rpc(env,{
   p_receipt_id:crypto.randomUUID(),p_dispatch_id:dispatchId,
   p_provider_event_id:eventId,p_provider_message_id:reference,p_event_type:event});
  if(result.length!==1||!['delivery_confirmed','delivery_failed','receipt_after_withdrawal'].includes(result[0].outcome))
   throw Error('Source-bound provider callback not acknowledged');
  return json({ok:true,build:872,state:result[0].outcome,
   receipt_verified:true,booking_created:false,deposit_collected:false},200,h);
 }catch{
  // A cryptographically valid duplicate callback is safe to acknowledge only
  // if the original saved provider event ID matches the same dispatch.
  const url=env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/rosie_roadside_provider_receipts_v872?select=dispatch_id,event_type,provider_message_id&provider_event_id=eq.'+
   encodeURIComponent(eventId)+'&limit=2';
  const existing=await fetch(url,{headers:serviceHeaders(env)}).then(x=>x.ok?x.json():[]).catch(()=>[]);
  if(existing.length===1&&existing[0].dispatch_id===dispatchId&&
     existing[0].provider_message_id===reference&&existing[0].event_type===event)
   return json({ok:true,build:872,replayed:true,receipt_verified:true},200,h);
  return fail('Signed receipt identity unresolved; keep provider delivery on HOLD',409);
 }
}
export const onRequestOptions=()=>fail('Signed POST required',405);
