// Build 908: dispatch acceptance is not delivery. Only independently signed provider
// callbacks can witness delivery, and only with a separate owner-enrolled secret.
import { serviceHeaders } from './customer-session.js';
export const UUID908=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_OK=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function safeProviderReference908(delivery){
 const raw=delivery?.provider_response;
 const reference=raw&&typeof raw==='object'?(raw.message_id||raw.messageId||raw.id||raw.provider_message_id):null;
 return typeof reference==='string'&&/^[a-zA-Z0-9._:@-]{8,160}$/.test(reference)?reference:null;
}
export function deliveryEvidenceState908(delivery){
 return delivery?.ok===true?(safeProviderReference908(delivery)?'provider_accepted':'no_provider_reference'):'provider_unavailable';
}
export async function recordRecoveryDispatch908({env,customerProfileId,tokenRecordId,delivery}){
 if(!UUID_OK.test(String(customerProfileId||''))||!UUID_OK.test(String(tokenRecordId||'')))return false;
 const row={customer_profile_id:customerProfileId,auth_token_id:tokenRecordId,purpose:'password_reset',
  channel:'email',provider:String(delivery?.provider||'unknown').slice(0,80),
  provider_reference:safeProviderReference908(delivery),dispatch_state:deliveryEvidenceState908(delivery),
  provider_http_status:Number.isInteger(delivery?.status)?delivery.status:null,
  witness_state:'pending'};
 const response=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/customer_recovery_delivery_evidence_908',{
  method:'POST',headers:{...serviceHeaders(env),Prefer:'resolution=ignore-duplicates,return=minimal'},
  body:JSON.stringify([row])});
 if(!response.ok)throw Error('Private recovery evidence ledger unavailable');
 return true;
}
export async function verifyWitnessSignature908({secret,timestamp,body,signature,now=Date.now()}){
 if(typeof secret!=='string'||secret.length<32||typeof timestamp!=='string'||!/^\d{10}$/.test(timestamp)||
  !/^[a-f0-9]{64}$/i.test(String(signature||''))||Math.abs(now-Number(timestamp)*1000)>5*60*1000)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+body)));
 const expected=[...signed].map(b=>b.toString(16).padStart(2,'0')).join('');
 let difference=0;const claimed=String(signature).toLowerCase();
 for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^claimed.charCodeAt(i);
 return difference===0;
}
export function normalizeWitness908(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const keys=Object.keys(value).sort().join(',');
 if(keys!=='observed_at,provider_reference,status')return null;
 const reference=value.provider_reference,observed=value.observed_at,status=value.status;
 if(typeof reference!=='string'||!/^[a-zA-Z0-9._:@-]{8,160}$/.test(reference)||
  !['delivered','bounced','failed'].includes(status)||typeof observed!=='string')return null;
 const t=Date.parse(observed);
 if(!Number.isFinite(t)||Math.abs(Date.now()-t)>24*60*60*1000)return null;
 return {provider_reference:reference,status,observed_at:new Date(t).toISOString()};
}
