// Rosie 877 — read-only authenticated original Resend registration evidence.
// An enabled webhook is not by itself a valid signed delivery or key-binding proof.
const webhookId=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const expectedEvents=['email.delivered','email.bounced','email.failed'];
const url='https://rosiedazzlers.ca/api/roadside_native_resend_v875';
export function assessOriginalResendEnrollment({configured,remote,hasMore=false,requestedId=null}={}){
 const hold=(reason)=>({state:'ENROLLMENT_HOLD',enrollment_verified:false,
   signing_key_binding_verified:false,real_signed_delivery_observed:false,reason});
 if(configured?.provider!=='resend_svix'||!configured?.apiKeyPresent||
  !configured?.signingSecretPresent)return hold('Original provider API and callback-signing authority not enrolled');
 if(!remote||remote.object!=='webhook'||!webhookId(remote.id)||
    (requestedId&&remote.id!==requestedId))
  return hold('Original provider registration ID unavailable or does not match');
 if(hasMore)return hold('Provider registration list is incomplete');
 if(remote.endpoint!==url)return hold('Original provider webhook endpoint is not the canonical production receiver');
 if(remote.status!=='enabled')return hold('Original provider webhook is disabled');
 if(!Array.isArray(remote.events)||!expectedEvents.every(e=>remote.events.includes(e)))
  return hold('Original provider registration is missing required delivery/failure events');
 return {state:'REGISTRATION_VERIFIED',enrollment_verified:true,
  signing_key_binding_verified:false,real_signed_delivery_observed:false,
  webhook_id:remote.id,endpoint_match:true,required_events_covered:true,
  reason:'Live original Resend account registration matches endpoint, status and subscribed events; native signature proof remains separate'};
}
export async function compareRemoteSigningSecret(remoteSecret,originalSecret){
 if(typeof remoteSecret!=='string'||!/^whsec_/.test(remoteSecret)||
   typeof originalSecret!=='string'||originalSecret.length<32)return false;
 const enc=new TextEncoder(),digest=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)));
 const [a,b]=await Promise.all([digest(remoteSecret),digest(originalSecret)]);
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 return diff===0;
}
