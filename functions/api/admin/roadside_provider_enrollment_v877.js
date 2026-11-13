// Rosie 877 — original provider account readback, owner/Admin session only.
// Never creates a webhook, rotates a secret, sends a message or accepts a receipt.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {assessOriginalResendEnrollment,compareRemoteSigningSecret}
 from '../_lib/roadside-provider-enrollment-v877.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:877,error,enrollment_verified:false},status,h);
export async function onRequestGet({request,env}){
 const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||access.actor?.is_admin!==true)
  return fail('Signed-in owner/Admin required',403);
 const configured={provider:env.ROSIE_ROADSIDE_NATIVE_PROVIDER,
  apiKeyPresent:typeof env.RESEND_API_KEY==='string'&&env.RESEND_API_KEY.length>=24,
  signingSecretPresent:typeof env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET==='string'&&
   /^whsec_[A-Za-z0-9+/]+={0,2}$/.test(env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET)};
 if(!configured.apiKeyPresent||!configured.signingSecretPresent||
   configured.provider!=='resend_svix')
  return json({ok:true,build:877,
   ...assessOriginalResendEnrollment({configured}),provider_api_queried:false},200,h);
 const id=env.ROSIE_ROADSIDE_RESEND_WEBHOOK_ID||'';
 if(id&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  return json({ok:true,build:877,state:'ENROLLMENT_HOLD',enrollment_verified:false,
   reason:'Original provider webhook ID is malformed',provider_api_queried:false},200,h);
 try{
  const path=id?'/webhooks/'+encodeURIComponent(id):'/webhooks?limit=100';
  const r=await fetch('https://api.resend.com'+path,{redirect:'error',
   headers:{Authorization:'Bearer '+env.RESEND_API_KEY}});
  const obj=r.ok?await r.json().catch(()=>null):null;
  if(!r.ok||!obj)return json({ok:true,build:877,state:'ENROLLMENT_HOLD',
   enrollment_verified:false,provider_api_queried:true,
   reason:'Original provider account webhook readback unavailable; do not infer enrollment'},200,h);
  let remote=null,hasMore=false;
  if(id){remote=obj;}
  else if(obj.object==='list'&&Array.isArray(obj.data)){
   hasMore=obj.has_more===true;
   const matched=obj.data.filter(x=>x?.endpoint==='https://rosiedazzlers.ca/api/roadside_native_resend_v875');
   if(matched.length===1)remote={...matched[0],object:'webhook'};
   // Multiple identical registrations remain a HOLD until owner pins exact ID.
  }
  let outcome=assessOriginalResendEnrollment({configured,remote,hasMore,requestedId:id||null});
  // Resend may omit signing_secret from list/get replies. Do not treat an
  // enrolled endpoint as proof the local verifier has the correct secret.
  const keyBound=outcome.enrollment_verified===true&&
   await compareRemoteSigningSecret(remote?.signing_secret,env.ROSIE_ROADSIDE_RESEND_WEBHOOK_SECRET);
  outcome={...outcome,signing_key_binding_verified:keyBound};
  return json({ok:true,build:877,...outcome,provider_api_queried:true,
   original_account_queried:true,webhook_events_not_sent:true,
   no_private_key_disclosed:true,customer_read_confirmed:false},200,h);
 }catch{return json({ok:true,build:877,state:'ENROLLMENT_HOLD',
   enrollment_verified:false,provider_api_queried:true,
   reason:'Independent account readback failed; remain on HOLD'},200,h);}
}
export const onRequestOptions=()=>fail('Owner GET required',405);
