import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestGet as read753} from './economic_retest_v753.js';
import {verifyOwnerEconomicProof754} from '../_lib/owner-receipt-verification-v754.js';
import {reviewEconomicSourceRecord755} from '../_lib/economic-source-intake-v755.js';
import {readAuthoritativeEconomicSource756,probeOwnerDecisionPersistence756,reconcileEconomicClosure756} from '../_lib/economic-closure-review-v756.js';

const error=(message,status=400)=>json({ok:false,build:756,error:message,closure_review_status:'HOLD_CLOSURE_AUTHORIZATION',
  source_record_custody_verified:false,owner_closure_audit_persisted:false,closure_authorized:false,
  closure_recorded:false,closure_allowed:false,automatic_business_write:false},status);
const readonly=()=>error('Build 756 does not save audit entries, change source records or authorize a business closure.',405);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:error('A signed-in capability-bound finance/owner reviewer is required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:756,read_only:true,closure_review_status:'HOLD_CLOSURE_AUTHORIZATION',
    supported_readback:['accounting_records','bookings','job_time_entries','catalog_inventory_posting_rows'],
    current_row_cannot_prove_original_revision:true,
    dedicated_owner_audit_table:'economic_owner_closure_decision_audit',
    audit_storage_probe_only:true,source_record_custody_verified:false,
    owner_closure_audit_persisted:false,closure_authorized:false,closure_recorded:false,
    closure_allowed:false,automatic_business_write:false});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return error('Same-origin signed-in review required.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return error('Submit JSON only.',415);
  if(Number(request.headers.get('content-length')||0)>32000)return error('Evidence exceeds 32 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>32000)throw Error('large');body=JSON.parse(raw);}
  catch{return error('Submit valid evidence JSON under 32 KB.');}
  const period=body?.period,bookingId=body?.booking_id;
  if(typeof period!=='string'||!/^20\d{2}-(0[1-9]|1[012])$/.test(period)||
    typeof bookingId!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(bookingId)||
    body?.source_record?.booking_id!==bookingId||body?.source_record?.period!==period||
    body?.source_attestation?.payload?.booking_id!==bookingId||body?.source_attestation?.payload?.period!==period||
    body?.owner_receipt?.payload?.booking_id!==bookingId||body?.owner_receipt?.payload?.period!==period)
    return error('Booking, month, source record and both signed receipts must match.');
  const [year,month]=period.split('-');
  const url=new URL('/api/admin/economic_retest_v753',request.url);
  url.searchParams.set('year',year);url.searchParams.set('month',String(Number(month)));
  const source=new Request(url,{headers:{cookie:request.headers.get('cookie')||''}});
  const upstream=await read753({request:source,env,context});
  if(!upstream.ok)return error('Authenticated current economic source unavailable.',503);
  let live;
  try{live=await upstream.json();}catch{return error('Economic source returned invalid evidence.',503);}
  if(!live?.ok)return error('Authoritative economic source is unavailable or ambiguous.',503);
  try{
    const receipt=await verifyOwnerEconomicProof754({owner_receipt:body.owner_receipt,
      source_attestation:body.source_attestation,live,env});
    const prior_review=await reviewEconomicSourceRecord755({record:body.source_record,
      owner_receipt:body.owner_receipt,source_attestation:body.source_attestation,
      receipt_verification:receipt,live});
    // No extra arbitrary source reads until owner/witness signatures and the
    // original-document hash have already matched the current source scope.
    const eligible=prior_review.evidence_status==='MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD';
    const [readback,persistence]=eligible?await Promise.all([
      readAuthoritativeEconomicSource756(env,body.source_record),
      probeOwnerDecisionPersistence756(env)]):[null,null];
    const result=await reconcileEconomicClosure756({prior_review,readback,persistence});
    return json(result);
  }catch{return error('Authoritative source and closure readiness review failed safely.',503);}
}
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
