// Rosie 876: owner-uploaded historical JSON dossier verified against original
// source-of-truth rows. No file persistence, no customer export, no payment changes.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {validateClosureEnvelope,verifyClosurePayloadDigest,compareOriginalClosureEvidence}
 from '../_lib/roadside-artifact-verify-v876.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:876,error,
 historical_artifact_revalidated:false,current_payment_clearance:false},status,h);
async function rows(env,path){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+path,{
  headers:serviceHeaders(env),redirect:'error'});
 const data=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(data))throw Error('Original private closure custody unavailable');
 return data;
}
async function one(env,table,fields,id){
 const result=await rows(env,table+'?select='+fields+'&id=eq.'+encodeURIComponent(id)+'&limit=2');
 return result.length===1?result[0]:null;
}
export async function onRequestPost({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original Supabase source authority unavailable',503);
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return fail('Signed-in owner/Admin required',403);
 const raw=await request.text().catch(()=>'');
 if(raw.length<20||raw.length>75000)return fail('Original artifact file outside safe size bounds',413);
 let packet;
 try{packet=JSON.parse(raw)}catch{return fail('A valid JSON artifact is required');}
 const draftId=packet?.draft_id,artifact=packet?.artifact;
 if(!isUuid(draftId)||!validateClosureEnvelope(artifact,draftId).ok)
  return fail('Owner artifact envelope does not match exact original draft',422);
 if(!await verifyClosurePayloadDigest(artifact))
  return fail('Original owner artifact SHA-256 integrity mismatch',422);
 try{
  const id=artifact.closure;
  const [closure,dispatch,device,net,receipts,cases]=await Promise.all([
   one(env,'rosie_roadside_pilot_closures_v873',
    'id,draft_id,dispatch_id,device_challenge_id,net_check_id,owner_actor,owner_note,closed_at,outcome',id.id),
   one(env,'rosie_roadside_dispatches_v872',
    'id,draft_id,share_id,provider,provider_message_id,state,receipt_at',id.dispatch_id),
   one(env,'rosie_roadside_device_challenges_v872',
    'id,draft_id,state,issued_at,completed_at,media_id,owner_accepted_by,owner_accepted_at',id.device_challenge_id),
   one(env,'rosie_roadside_net_deposit_checks_v871',
    'id,draft_id,booking_id,provider,source,state,gross_cents,refunded_cents,net_cents,net_verified,checked_at',
    id.net_check_id),
   rows(env,'rosie_roadside_provider_receipts_v872?select=id,dispatch_id,provider_event_id,'+
    'provider_message_id,event_type,effective_state,received_at,signature_verified'+
    '&dispatch_id=eq.'+encodeURIComponent(id.dispatch_id)+'&order=received_at.desc&limit=100'),
   rows(env,'rosie_roadside_refund_cases_v872?select=id,state,issue_code,opened_at,closed_at,'+
    'closed_source_check_id&draft_id=eq.'+encodeURIComponent(draftId)+
    '&order=opened_at.desc&limit=100')
  ]);
  if(!closure||closure.draft_id!==draftId||!dispatch||dispatch.draft_id!==draftId||
   !device||device.draft_id!==draftId||!net||net.draft_id!==draftId||
   receipts.length>=100||cases.length>=100||
   !compareOriginalClosureEvidence(artifact,{closure,dispatch,device,net,receipts,cases}))
   return fail('Original source records cannot independently revalidate the owner artifact',409);
  const driftOrHold=cases.some(x=>['open','reviewed_hold'].includes(x.state));
  return json({ok:true,build:876,state:'HISTORICAL_ARTIFACT_REVALIDATED',
   historical_artifact_revalidated:true,
   original_source_references_match:true,
   current_refund_case_hold:driftOrHold,
   current_payment_clearance:false,
   future_refund_absence_not_proven:true,
   independent_offsite_signature_verified:false,
   original_native_provider_signature_not_inferred:true,
   owner_reconciliation_required_for_current_financial_state:true,
   no_file_saved:true,no_booking_or_payment_mutation:true},200,h);
 }catch{return fail('Original owner artifact source inspection unavailable',503);}
}
export const onRequestOptions=()=>fail('Signed-in owner POST required',405);
