// Build 862 original-owner-only review. Never sends to a Master or closes consent incidents.
import {onRequest as checkOriginal861} from './jobday_exception_861.js';
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842} from '../_lib/jobday-social-842.js';
import {hash860} from '../_lib/jobday-intake-860.js';
import {CONTRACT_862,HOLD_862,ACTIONS_862,verifyWitness862,
 slaRecheck862,digest862} from '../_lib/jobday-witness-862.js';
const fail=(error,status=409)=>json({ok:false,build:862,decision:'HOLD',error,...HOLD_862},status);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const revision=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const exact=(x,id,kind,tx)=>x?.id===id&&x?.kind===kind&&x?.transaction_review_id===tx;
async function row(env,table,select,filter){
 const records=await rest(env,table+'?select='+select+'&'+filter+'&limit=2');
 if(!Array.isArray(records)||records.length!==1)throw Error('Exactly one original scoped custody row required.');
 return records[0];
}
async function persist(env,{scope,kind,nonce:reviewNonce,checked=null,discrepancy=null,
 sla,ownerAction=null,previous=null,previousExport=null,snapshotSha=null,actor}){
 const p={p_project_id:scope.project.id,p_booking_id:scope.bookingId,
 p_post_id:scope.postId,p_transaction_review_id:scope.tx.id,
 p_handoff_858_id:scope.handoff.id,p_owner_decision_859_id:scope.ownerDecision.id,
 p_owner_exception_860_id:scope.ownerException.id,
 p_owner_escalation_861_id:scope.ownerEscalation.id,p_kind:kind,
 p_plane:checked?.plane||null,p_discrepancy_861_id:discrepancy?.id||null,
 p_source_revision:scope.env.CF_PAGES_COMMIT_SHA,
 p_receipt_sha256:checked?.receipt_sha256||null,
 p_signer_id:checked?.signer_id||null,
 p_review_digest_sha256:scope.digest,p_review_nonce:reviewNonce,
 p_sla_status:sla.sla_status,p_age_hours:sla.original_exception_age_hours,
 p_owner_action:ownerAction,p_snapshot_sha256:snapshotSha,
 p_previous_id:previous?.id||null,
 p_previous_sha256:previous?.review_digest_sha256||null,
 p_previous_export_id:previousExport?.id||null,
 p_previous_export_sha256:previousExport?.review_digest_sha256||null,
 p_actor_staff_email:actor};
 const records=await rest(env,'rpc/rosie862_append_hold_custody',
  {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(p)});
 if(!Array.isArray(records)||records.length!==1||records[0].outcome!=='INSERTED'||
  !isUuid(records[0].review_id))
  throw Error('Owner evidence predecessor/duplicate/source mismatch; HOLD.');
 return {id:records[0].review_id,recorded_at:records[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Private owner HOLD review only.',405);
 if(Number(request.headers.get('content-length'))>16000)return fail('Payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>16000)return fail('Payload too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const u=new URL(request.url),src=request.method==='POST'?body:Object.fromEntries(u.searchParams);
 const bookingId=clean(src.booking_id,80),postId=clean(src.post_id,80);
 const caseId=clean(src.owner_case_reference,80),incident=clean(src.incident_reference,80),
  txRef=clean(src.transaction_reference,96);
 if(!isUuid(bookingId)||!isUuid(postId)||!caseId||!incident||!txRef)
  return fail('Original incident reference set required.',400);
 if(!serviceReady(env)||!revision(env.CF_PAGES_COMMIT_SHA))
  return fail('Exact original Rosie private source revision unavailable.',503);
 try{
  // Reuse the complete original 861 authenticated revoked-consent/855–860 validation.
  const authUrl=new URL('/api/admin/jobday_exception_861',u);
  for(const [key,value] of Object.entries({booking_id:bookingId,post_id:postId,
   owner_case_reference:caseId,incident_reference:incident,transaction_reference:txRef}))
   authUrl.searchParams.set(key,value);
  const headers=new Headers(request.headers);
  headers.delete('content-length');headers.delete('content-type');
  const prerequisite=await checkOriginal861({
   request:new Request(authUrl.toString(),{method:'GET',headers}),env});
  if(!prerequisite.ok)return prerequisite;
  const original=await prerequisite.json();
  if(!original?.ok||original?.source_revision!==env.CF_PAGES_COMMIT_SHA)
   return fail('Original 861 source/consent custody rejected.',409);
  const filter='booking_id=eq.'+encodeURIComponent(bookingId)+
   '&post_id=eq.'+encodeURIComponent(postId)+
   '&transaction_reference=eq.'+encodeURIComponent(txRef);
  const tx=await row(env,'rosie_master_transaction_review_v855',
   'id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference',filter);
  if(tx.case_reference!==caseId||tx.incident_reference!==incident)
   return fail('Original case and incident mismatch.');
  const txFilter='transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const [handoff,ownerDecision,ownerException,ownerEscalation,witnesses,slaRows,exports]=await Promise.all([
   row(env,'rosie_recovery_custody_v858','id,transaction_review_id,kind,review_digest_sha256',
    txFilter+'&kind=eq.conflict_escalation_handoff'),
   row(env,'rosie_incident_continuity_v859','id,transaction_review_id,kind,review_digest_sha256',
    'id=eq.'+encodeURIComponent(original.original_owner_decision_id)),
   row(env,'rosie_external_intake_custody_v860','id,transaction_review_id,kind,review_digest_sha256',
    'id=eq.'+encodeURIComponent(original.latest_860_exception_id)),
   row(env,'rosie_intake_discrepancy_v861',
    'id,transaction_review_id,kind,review_digest_sha256,recorded_at',
    'id=eq.'+encodeURIComponent(original.owner_hold_escalation_history?.[0]?.id||'')),
   rest(env,'rosie_discrepancy_review_v862?select=id,kind,plane,transaction_review_id,discrepancy_861_id,receipt_sha256,review_digest_sha256,recorded_at&'+
    txFilter+'&kind=eq.signed_resolution_review_witness&order=recorded_at.desc&limit=100'),
   rest(env,'rosie_discrepancy_review_v862?select=id,kind,transaction_review_id,review_digest_sha256,sla_status,age_hours,owner_action,previous_id,recorded_at&'+
    txFilter+'&kind=eq.owner_aging_sla_recheck&order=recorded_at.desc&limit=25'),
   rest(env,'rosie_discrepancy_review_v862?select=id,kind,transaction_review_id,review_digest_sha256,snapshot_sha256,previous_id,recorded_at&'+
    txFilter+'&kind=eq.master_hold_custody_export&order=recorded_at.desc&limit=25')
  ]);
  if(handoff.transaction_review_id!==tx.id||ownerDecision.transaction_review_id!==tx.id||
   ownerException.transaction_review_id!==tx.id||ownerEscalation.transaction_review_id!==tx.id||
   !exact(ownerDecision,original.original_owner_decision_id,'owner_recovery_decision',tx.id)||
   !exact(ownerException,original.latest_860_exception_id,'owner_continuity_exception_review',tx.id)||
   !exact(ownerEscalation,original.owner_hold_escalation_history?.[0]?.id,
    'owner_hold_escalation_review',tx.id)||
   !Array.isArray(witnesses)||witnesses.length>=100||
   !Array.isArray(slaRows)||!Array.isArray(exports)||
   ![witnesses,slaRows,exports].every(a=>a.every(r=>r.transaction_review_id===tx.id)))
   return fail('Incomplete exact 861→862 immutable original custody window.',503);
  const summary=slaRecheck862({aging:original.intake_exception_aging,
   latestEscalation:ownerEscalation,witnesses,now:Date.now()});
  const previousSla=slaRows[0]||null,previousExport=exports[0]||null;
  if(request.method==='GET')return json({ok:true,build:862,contract:CONTRACT_862,
   source_revision:env.CF_PAGES_COMMIT_SHA,transaction_reference:txRef,
   latest_original_owner_escalation_id:ownerEscalation.id,
   signed_resolution_review_witnesses:witnesses,
   original_owner_sla_recheck:summary,owner_sla_history:slaRows,
   durable_master_hold_export_history:exports,
   history_may_be_truncated:slaRows.length>=25||exports.length>=25,
   original_history_may_be_truncated:original.owner_history_window_may_be_truncated,
   ...HOLD_862});
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',
   allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Original Rosie owner session required.',403);
  const reviewNonce=clean(body.review_nonce,100);
  if(!nonce(reviewNonce)||summary.decision!=='ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY')
   return fail('New owner nonce and exact SLA source required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const scope={project:{id:tx.project_id},bookingId,postId,tx,handoff,ownerDecision,
   ownerException,ownerEscalation,env,digest:null};
  let checked=null,discrepancy=null,snapshotSha=null,bundle=null,
   previous=null,ownerAction=null,kind;
  if(body.action==='record_independent_resolution_witness'){
   if(body.confirm_independent_signature_review!==true||
     body.acknowledge_no_operational_resolution!==true)
    return fail('Explicit owner evidence and non-resolution HOLD confirmation required.');
   const discrepancyId=clean(body.discrepancy_861_id,80),plane=clean(body.plane,40);
   if(!isUuid(discrepancyId))return fail('Exact immutable 861 discrepancy ID required.',400);
   discrepancy=await row(env,'rosie_intake_discrepancy_v861',
    'id,kind,plane,transaction_review_id,review_digest_sha256,discrepancy_code',
    'id=eq.'+encodeURIComponent(discrepancyId));
   if(!exact(discrepancy,discrepancyId,'signed_external_custodian_discrepancy',tx.id)||
    discrepancy.plane!==plane)
    return fail('Independent witness does not match original disputed plane.');
   checked=await verifyWitness862(env,body.receipt||{},body.signature,{
    plane,tx,handoff,ownerDecision,ownerException,ownerEscalation,discrepancy,
    bookingId,projectId:tx.project_id,postId,now:Date.now()});
   if(!checked.ok)return fail(checked.reason);
   kind='signed_resolution_review_witness';
  }else if(body.action==='record_owner_aging_sla_recheck'){
   if(body.confirm_original_incident_open!==true||
    body.acknowledge_sla_recheck_is_hold_only!==true)
    return fail('Original owner must acknowledge unresolved incident and HOLD.');
   ownerAction=clean(body.owner_action,90);
   if(!ACTIONS_862.includes(ownerAction))return fail('Non-authorizing SLA follow-up required.');
   previous=previousSla;kind='owner_aging_sla_recheck';
  }else if(body.action==='create_durable_master_hold_custody_export'){
   if(body.confirm_private_durable_export_no_master_delivery!==true)
    return fail('Private custody-only export acknowledgement required.');
   if(!previousSla||original.owner_history_window_may_be_truncated)
    return fail('Current owner SLA recheck and complete bounded owner history required.');
   previous=previousSla;kind='master_hold_custody_export';
   bundle={format:'rosie.master-hold-custody.v862',
    generated_at:new Date().toISOString(),source_revision:env.CF_PAGES_COMMIT_SHA,
    transaction_review_id:tx.id,incident_reference:tx.incident_reference,
    owner_exception_860_id:ownerException.id,
    owner_escalation_861_id:ownerEscalation.id,
    current_sla:summary,
    witness_hashes:witnesses.map(w=>({id:w.id,plane:w.plane,
     discrepancy_861_id:w.discrepancy_861_id,receipt_sha256:w.receipt_sha256,
     review_digest_sha256:w.review_digest_sha256})),
    last_sla_id:previousSla.id,last_sla_sha256:previousSla.review_digest_sha256,
    previous_export_id:previousExport?.id||null,
    previous_export_sha256:previousExport?.review_digest_sha256||null,
    bounded_sla_history:slaRows.map(r=>({id:r.id,review_digest_sha256:r.review_digest_sha256})),
    history_may_be_truncated:slaRows.length>=25||exports.length>=25,
    delivery_state:'NOT_TRANSMITTED_HOLD_ONLY',...HOLD_862};
   snapshotSha=await hash860('ROSIE-862-DURABLE-MASTER-HOLD-EXPORT-V1\n'+JSON.stringify(bundle));
  }else return fail('Unsupported Build 862 owner-only HOLD action.',405);
  const digest=await digest862({kind,tx,handoff,ownerDecision,ownerException,
   ownerEscalation,nonce:reviewNonce,checked,discrepancy,sla:summary,
   ownerAction,previous,snapshotSha});
  scope.digest=digest;
  const saved=await persist(env,{scope,kind,nonce:reviewNonce,checked,discrepancy,
   sla:summary,ownerAction,previous,previousExport:kind==='master_hold_custody_export'?previousExport:null,
   snapshotSha,actor});
  return json({ok:true,build:862,decision:kind==='signed_resolution_review_witness'?
   checked.decision:kind==='owner_aging_sla_recheck'?
   'ORIGINAL_OWNER_SLA_RECHECK_RECORDED_HOLD_ONLY':'DURABLE_PRIVATE_MASTER_HOLD_EXPORT',
   record_id:saved.id,recorded_at:saved.recorded_at,review_digest_sha256:digest,
   owner_sla_status:summary.sla_status,
   ...(bundle?{bundle,bundle_sha256:snapshotSha}:{}),...HOLD_862});
 }catch(error){return fail(error?.message||'Original owner protected 862 custody unavailable.',503);}
}
