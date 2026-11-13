// Rosie 878: independent read-only correlation of original signed Resend events.
// Native signature validation happened at the opt-in callback BEFORE receipt admission.
// This helper does not accept a plain generic Build 872 HMAC receipt as native.
import {hasNativeReceiptProvenance} from './roadside-native-field-v876.js';
const text=new TextEncoder();
const hold=(reason)=>({state:'NATIVE_EVENT_HOLD',delivery_corroborated:false,
 signed_webhook_seen:false,reason,customer_read_confirmed:false,
 external_provider_account_not_inferred:false,no_message_sent:true});
export async function assessNativeEventDelivery878({
 nativeField,enrollment,receipts,dispatchId,nowMs=Date.now()
}={}){
 if(!enrollment?.enrollment_verified||!enrollment?.provider_api_queried)
  return hold('Original provider webhook registration has not been independently read from its account');
 if(!nativeField?.provider_api_queried||!nativeField?.original_native_signature_proven||
  !nativeField?.provider_delivered||nativeField?.state!=='NATIVE_PROVIDER_DELIVERED'||
  nativeField?.original_dispatch_id!==dispatchId)
  return hold('Original signed native webhook and live provider email readback do not corroborate delivery');
 if(!Array.isArray(receipts)||receipts.length===0||receipts.length>=100)
  return hold('Original signed native event history absent or truncated');
 const native=receipts.filter(r=>r?.dispatch_id===dispatchId&&
  hasNativeReceiptProvenance(r)&&
  ['delivered','failed','bounced'].includes(r.event_type)&&
  ['delivery_confirmed','delivery_failed','receipt_after_withdrawal'].includes(r.effective_state)&&
  Number.isFinite(Date.parse(r.received_at))&&Date.parse(r.received_at)<=nowMs);
 if(native.length===0)return hold('No native signed original provider events in private ledger');
 if(native.length!==receipts.filter(r=>r?.dispatch_id===dispatchId&&
    typeof r.provider_event_id==='string'&&r.provider_event_id.startsWith('native-resend:')).length)
  return hold('Native event provenance record is malformed or contains future timestamps');
 const sorted=[...native].sort((a,b)=>Date.parse(b.received_at)-Date.parse(a.received_at));
 if(sorted[0].event_type!=='delivered'||sorted[0].effective_state!=='delivery_confirmed')
  return {...hold('Latest signed native provider event is not a consented delivered receipt'),
   signed_webhook_seen:true};
 const unique=new Set(native.map(r=>r.provider_event_id));
 if(unique.size!==native.length)
  return hold('Signed native event ID duplicated in original evidence readback');
 const canonical=JSON.stringify([...native].sort((a,b)=>a.provider_event_id.localeCompare(b.provider_event_id))
  .map(r=>[r.provider_event_id,r.provider_message_id,r.event_type,r.effective_state,r.received_at]));
 const digest=await crypto.subtle.digest('SHA-256',text.encode(canonical));
 const sha=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
 return {state:'ORIGINAL_NATIVE_DELIVERY_CORROBORATED',delivery_corroborated:true,
  signed_webhook_seen:true,live_provider_readback:true,webhook_registration_readback:true,
  receipt_count:native.length,latest_signed_event_at:sorted[0].received_at,
  original_native_event_chain_sha256:sha,
  provider_signing_secret_remote_binding_verified:enrollment.signing_key_binding_verified===true,
  customer_read_confirmed:false,independent_customer_attestation:false,
  external_provider_account_not_inferred:false,no_message_sent:true};
}
