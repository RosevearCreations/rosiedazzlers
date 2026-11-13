// Rosie 880: signed-in original Admin reads bounded private immutable histories and
// the current operator-trusted Ed25519 grace roster. No scheduled job is implied.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {pinnedIssuerRoster878,pinnedKeyId878} from '../_lib/roadside-provenance-pin-v878.js';
import {chainWindow880,graceExpiry880} from '../_lib/roadside-history-v880.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
async function rows(env,table,draftId){
 const url=env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+table+
  '?select=*&draft_id=eq.'+encodeURIComponent(draftId)+'&order=observed_at.desc,id.desc&limit=51';
 const r=await fetch(url,{headers:serviceHeaders(env),redirect:'error'});
 const data=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(data))throw Error('Private original history unavailable');
 return data;
}
export async function onRequestGet({request,env}){
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return json({ok:false,build:880,error:'Signed-in owner/Admin required'},403,h);
 const draftId=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(draftId))return json({ok:false,build:880,error:'Original draft ID required'},400,h);
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return json({ok:false,build:880,error:'Original private Supabase authority unavailable'},503,h);
 try{
  const [nativeAll,rotationAll]=await Promise.all([
   rows(env,'rosie_roadside_native_watch_v880',draftId),
   rows(env,'rosie_roadside_rotation_receipts_v880',draftId)]);
  const truncated=nativeAll.length>50||rotationAll.length>50;
  const native=nativeAll.slice(0,50),rotation=rotationAll.slice(0,50);
  const nativeChain=chainWindow880(native,'watch');
  const rotationChain=chainWindow880(rotation,'rotation');
  let roster=null;
  try{
   const fallback=JSON.parse(env.ROSIE_CLOSURE_ISSUER_ED25519_PUBLIC_JWK||'null');
   roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON,
    {fallbackPublicJwk:fallback});
   if(roster.ok)roster={...roster,rows:await Promise.all(roster.rows.map(async x=>({
    status:x.status,issuer_id:await pinnedKeyId878(x.public_jwk),
    verify_until:x.verify_until||null,issued_before:x.issued_before||null})))};
  }catch{roster={ok:false};}
  const expiry=graceExpiry880({receipts:rotation,roster});
  return json({ok:true,build:880,draft_id:draftId,
   native_history:native.map(x=>({id:x.id,observed_at:x.observed_at,
    delivery_state:x.delivery_state,source_chain_sha256:x.source_chain_sha256,
    latest_signed_event_at:x.latest_signed_event_at,owner_sla_state:x.owner_sla_state,
    source_check_id:x.source_check_id,entry_sha256:x.entry_sha256,
    previous_entry_sha256:x.previous_entry_sha256})),
   rotation_history:rotation.map(x=>({id:x.id,observed_at:x.observed_at,
    previous_issuer_key_id:x.previous_issuer_key_id,
    active_issuer_key_id:x.active_issuer_key_id,
    grace_verify_until:x.grace_verify_until,receipt_sha256:x.receipt_sha256,
    previous_receipt_sha256:x.previous_receipt_sha256})),
   native_chain_integrity:nativeChain,rotation_chain_integrity:rotationChain,
   historical_grace_watch:expiry,
   history_truncated:truncated,per_history_limit:50,
   original_provider_current_delivery_not_inferred:true,
   current_financial_clearance:false,independent_external_worm_anchor:false,
   no_customer_read_or_payment_mutation:true},200,h);
 }catch{return json({ok:false,build:880,error:'Original private history readback failed; HOLD'},503,h);}
}
export const onRequestOptions=()=>json({ok:false,build:880,error:'Owner GET required'},405,h);
