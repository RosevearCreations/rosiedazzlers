// Rosie 876: source-bound, read-only provider-native receipt and Resend API readback.
// An HMAC-origin marker is written only after the Build 875 native Svix verifier.
const encoder=new TextEncoder();
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{8,160}$/.test(x);
export const NATIVE_RECEIPT_PREFIX='native-resend:';
export function nativeProviderEventKey(id){
 if(typeof id!=='string'||!/^[A-Za-z0-9_-]{8,140}$/.test(id))return null;
 return NATIVE_RECEIPT_PREFIX+id;
}
export function hasNativeReceiptProvenance(record){
 return record?.signature_verified===true&&
  typeof record.provider_event_id==='string'&&
  record.provider_event_id.startsWith(NATIVE_RECEIPT_PREFIX)&&
  nativeProviderEventKey(record.provider_event_id.slice(NATIVE_RECEIPT_PREFIX.length))===record.provider_event_id;
}
export async function verifyOriginalResendField({dispatch,receipts,email,consent,nowMs=Date.now()}={}){
 const hold=(reason)=>({state:'NATIVE_PROVIDER_HOLD',reason,
  original_native_signature_proven:false,provider_delivered:false,
  customer_read_proven:false,no_customer_message_sent:true});
 if(!dispatch||!['email','resend'].includes(dispatch.provider)||
    !validId(dispatch.provider_message_id)||dispatch.state!=='delivery_confirmed'||
    !dispatch.receipt_at||!dispatch.provider_accepted_at)
  return hold('No originally accepted and provider-confirmed dispatch to revalidate');
 if(!consent||consent.contact_permission!==true||consent.quote_share_withdrawn_at||
    consent.share_revoked_at||!Number.isFinite(Date.parse(consent.share_expires_at))||
    Date.parse(consent.share_expires_at)<=nowMs)
  return hold('Original quote sharing consent or link is no longer active');
 if(!Array.isArray(receipts)||!receipts.length||receipts.length>=100)
  return hold('Original signed native receipt timeline is unavailable or incomplete');
 const native=receipts.filter(x=>x.dispatch_id===dispatch.id&&
  x.provider_message_id===dispatch.provider_message_id&&
  x.event_type==='delivered'&&x.effective_state==='delivery_confirmed'&&hasNativeReceiptProvenance(x));
 if(!native.length)return hold('No separately attributable signed native Resend webhook receipt');
 if(!email||email.id!==dispatch.provider_message_id||!Array.isArray(email.to)||
   email.to.length!==1||typeof email.to[0]!=='string'||
   typeof email.last_event!=='string')
  return hold('Fresh original Resend email readback is missing identity or delivery state');
 const recipient=email.to[0].trim().toLowerCase();
 const hash=await crypto.subtle.digest('SHA-256',encoder.encode(recipient));
 const digest=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==dispatch.recipient_hash)return hold('Native provider recipient is not the consented original');
 if(email.last_event!=='delivered')
  return hold('Live provider delivery state no longer attests delivered');
 return {state:'NATIVE_PROVIDER_DELIVERED',reason:'Original native webhook and current provider readback match',
  original_native_signature_proven:true,provider_delivered:true,
  provider_event_count:native.length,customer_read_proven:false,
  no_customer_message_sent:true};
}
