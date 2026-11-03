import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestGet as sourceRead753} from './economic_retest_v753.js';
import {verifyOwnerEconomicProof754} from '../_lib/owner-receipt-verification-v754.js';
import {reviewEconomicSourceRecord755} from '../_lib/economic-source-intake-v755.js';

const hold=(error,status=400)=>json({ok:false,build:755,error,evidence_status:'HOLD',
  source_record_custody_verified:false,owner_closure_audit_persisted:false,closure_recorded:false,
  closure_allowed:false,automatic_business_write:false},status);
const readonly=()=>hold('This endpoint only evaluates source evidence; it cannot save an approval, edit a source record or close an economic case.',405);
async function authorized(request,env){
  const access=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!access.ok)return {denied:access.response};
  if(access.auth_mode!=='session')return {denied:hold('A capability-bound signed-in staff session is required.',403)};
  return {actor:access.actor};
}

export async function onRequestGet({request,env}){
  const auth=await authorized(request,env);
  if(auth.denied)return auth.denied;
  return json({ok:true,build:755,read_only:true,evidence_status:'HOLD_PENDING_REAL_SOURCE_PROOF',
    source_record_format:'rosie-economic-source-record-v755',
    requires_independent_signed_owner_and_source_witness:true,requires_current_economic_retest:true,
    requires_owning_system_custody_proof:true,source_record_custody_verified:false,
    audit_kind:'derived_unsigned_session_packet',owner_closure_audit_persisted:false,
    closure_recorded:false,closure_allowed:false,automatic_business_write:false});
}

export async function onRequestPost({request,env,context}){
  const auth=await authorized(request,env);
  if(auth.denied)return auth.denied;
  if(!request.headers.get('origin')||request.headers.get('origin')!==new URL(request.url).origin)
    return hold('A same-origin request is required.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return hold('Submit JSON evidence only.',415);
  if(Number(request.headers.get('content-length')||0)>32000)return hold('Evidence payload exceeds 32 KB.',413);
  let body;
  try{
    const raw=await request.text();if(raw.length>32000)throw Error('oversize');body=JSON.parse(raw);
  }catch{return hold('A valid JSON evidence packet smaller than 32 KB is required.');}
  const period=body?.period,bookingId=body?.booking_id;
  if(typeof period!=='string'||!/^20\d{2}-(0[1-9]|1[012])$/.test(period)||
    typeof bookingId!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(bookingId)||
    body?.owner_receipt?.payload?.booking_id!==bookingId||body?.owner_receipt?.payload?.period!==period||
    body?.source_attestation?.payload?.booking_id!==bookingId||body?.source_attestation?.payload?.period!==period||
    body?.source_record?.booking_id!==bookingId||body?.source_record?.period!==period)
    return hold('Source record, signed receipts, booking and period must have the same exact scope.');
  const [year,month]=period.split('-');
  const sourceUrl=new URL('/api/admin/economic_retest_v753',request.url);
  sourceUrl.searchParams.set('month',String(Number(month)));sourceUrl.searchParams.set('year',year);
  const currentRequest=new Request(sourceUrl,{headers:{cookie:request.headers.get('cookie')||''}});
  const response=await sourceRead753({request:currentRequest,env,context});
  if(!response.ok)return hold('Authoritative current economic source is unavailable.',503);
  let live;
  try{live=await response.json();}catch{return hold('Current economic source returned invalid evidence.',503);}
  if(!live?.ok)return hold('Current economic source is ambiguous or unavailable.',503);
  try{
    const verified=await verifyOwnerEconomicProof754({owner_receipt:body.owner_receipt,
      source_attestation:body.source_attestation,live,env});
    const outcome=await reviewEconomicSourceRecord755({record:body.source_record,
      owner_receipt:body.owner_receipt,source_attestation:body.source_attestation,
      receipt_verification:verified,live});
    return json(outcome);
  }catch{return hold('Signed source-record review could not be completed.',503);}
}
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
