// Rosie 874: owner-only read-only export of original Build 873 closure evidence.
// A digest detects changed bytes, but is NOT an independent digital signature.
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:874,error,owner_closure_exported:false},status,h);
async function db(env,query){
 const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+query,
  {redirect:'error',headers:serviceHeaders(env)});
 const v=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(v))throw Error('Original closure evidence unavailable');
 return v;
}
async function one(env,table,select,field,id){
 const rows=await db(env,table+'?select='+select+'&'+field+'=eq.'+encodeURIComponent(id)+'&limit=2');
 return rows.length===1?rows[0]:null;
}
export const onRequestOptions=()=>new Response(null,{status:204,headers:h});
export async function onRequestGet({request,env}){
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original Supabase authority unavailable',503);
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return fail('Signed-in owner/Admin required',403);
 const draftId=new URL(request.url).searchParams.get('draft_id')||'';
 if(!isUuid(draftId))return fail('Exact original roadside draft ID required');
 try{
  const closure=await one(env,'rosie_roadside_pilot_closures_v873',
   'id,draft_id,dispatch_id,device_challenge_id,net_check_id,owner_actor,owner_note,closed_at,outcome',
   'draft_id',draftId);
  if(!closure)return fail('No independently accepted original pilot closure exists; remain on HOLD',409);
  const [dispatch,device,net,receipts,cases]=await Promise.all([
   one(env,'rosie_roadside_dispatches_v872',
    'id,draft_id,share_id,provider,provider_message_id,state,receipt_at','id',closure.dispatch_id),
   one(env,'rosie_roadside_device_challenges_v872',
    'id,draft_id,state,issued_at,completed_at,media_id,owner_accepted_by,owner_accepted_at','id',closure.device_challenge_id),
   one(env,'rosie_roadside_net_deposit_checks_v871',
    'id,draft_id,booking_id,provider,source,state,gross_cents,refunded_cents,net_cents,net_verified,checked_at','id',closure.net_check_id),
   db(env,'rosie_roadside_provider_receipts_v872?select=id,dispatch_id,provider_event_id,event_type,effective_state,received_at,signature_verified'+
    '&dispatch_id=eq.'+encodeURIComponent(closure.dispatch_id)+'&order=received_at.desc&limit=100'),
   db(env,'rosie_roadside_refund_cases_v872?select=id,state,issue_code,opened_at,closed_at,closed_source_check_id'+
    '&draft_id=eq.'+encodeURIComponent(draftId)+'&order=opened_at.desc&limit=100')
  ]);
  if(!dispatch||dispatch.draft_id!==draftId||!device||device.draft_id!==draftId||
     !net||net.draft_id!==draftId||!net.booking_id||
     !receipts.some(x=>x.signature_verified===true&&x.effective_state==='delivery_confirmed'))
   return fail('Original closure evidence incomplete or inconsistent',409);
  const evidence={schema:'rosie-roadside-closure-export-v874',
   exported_at:new Date().toISOString(),
   closure,dispatch,
   independent_provider_receipts:receipts,
   original_device_witness:device,original_deposit_snapshot:net,
   refund_case_history:cases,
   current_case_hold:cases.some(x=>['open','reviewed_hold'].includes(x.state)),
   claims:{original_closure_recorded:true,receipt_was_provider_reported_not_customer_read:true,
    refund_or_payment_performed_by_export:false,
    manufacturer_hardware_attestation:false,
    independent_external_signature:false}};
  const serialized=JSON.stringify(evidence);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized));
  const digest=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const output={...evidence,integrity:{algorithm:'SHA-256',canonical_payload:'JSON.stringify(evidence_without_integrity)',
    digest_sha256:digest,independently_signed:false}};
  return new Response(JSON.stringify(output,null,2),{status:200,
   headers:{...h,'Content-Type':'application/json; charset=utf-8',
    'Content-Disposition':'attachment; filename="rosie-roadside-closure-874.json"'}});
 }catch{return fail('Original source-bound closure evidence unavailable',503);}
}
