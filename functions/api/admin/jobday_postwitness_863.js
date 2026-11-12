// Rosie 863: original owner evidence review only; no external transport or Master ACK.
import {onRequest as original862} from './jobday_witness_862.js';
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842} from '../_lib/jobday-social-842.js';
import {CONTRACT_863,HOLD_863,PLANES_863,ACTIONS_863,
 reconcileWitnesses863,criticalFollowUp863,verifyReadback863,digest863}
 from '../_lib/jobday-postwitness-863.js';
const fail=(error,status=409)=>json({ok:false,build:863,decision:'HOLD',error,...HOLD_863},status);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const rev=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const scoped=(r,tx)=>r&&r.transaction_review_id===tx&&isUuid(r.id);
async function exactlyOne(env,table,columns,filters){
 const a=await rest(env,table+'?select='+columns+'&'+filters+'&limit=2');
 if(!Array.isArray(a)||a.length!==1)throw Error('Exactly one scoped original incident record required.');
 return a[0];
}
async function persist(env,{scope,kind,reviewNonce,status,ownerAction=null,
 checked=null,witness=null,latestExport=null,reconciliation=null,
 criticalFollowup=null,previous=null,digest,actor}){
 const p={
 p_project_id:scope.tx.project_id,p_booking_id:scope.bookingId,p_post_id:scope.postId,
 p_transaction_review_id:scope.tx.id,p_owner_exception_860_id:scope.ownerException.id,
 p_owner_escalation_861_id:scope.ownerEscalation.id,
 p_latest_sla_862_id:scope.latestSla.id,
 p_export_862_id:latestExport?.id||null,p_witness_862_id:witness?.id||null,
 p_reconciliation_863_id:reconciliation?.id||null,
 p_critical_followup_863_id:criticalFollowup?.id||null,
 p_kind:kind,p_plane:checked?.plane||null,p_source_revision:scope.env.CF_PAGES_COMMIT_SHA,
 p_review_status:status,p_owner_action:ownerAction,
 p_receipt_sha256:checked?.receipt_sha256||null,p_signer_id:checked?.signer_id||null,
 p_review_digest_sha256:digest,p_review_nonce:reviewNonce,
 p_age_hours:scope.sla.original_exception_age_hours,
 p_export_snapshot_sha256:checked?.export_snapshot_sha256||null,
 p_previous_id:previous?.id||null,p_previous_sha256:previous?.review_digest_sha256||null,
 p_actor_staff_email:actor};
 const result=await rest(env,'rpc/rosie863_append_hold_review',{
  method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(p)});
 if(!Array.isArray(result)||result.length!==1||result[0].outcome!=='INSERTED'||
  !isUuid(result[0].review_id))
  throw Error('Immutable owner evidence replay or custody tip changed; HOLD.');
 return {id:result[0].review_id,recorded_at:result[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original owner read/review only.',405);
 if(Number(request.headers.get('content-length'))>17000)return fail('Payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>17000)return fail('Payload too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const u=new URL(request.url),src=request.method==='POST'?body:Object.fromEntries(u.searchParams);
 const bookingId=clean(src.booking_id,80),postId=clean(src.post_id,80);
 const caseRef=clean(src.owner_case_reference,80),
 incidentRef=clean(src.incident_reference,80),txRef=clean(src.transaction_reference,96);
 if(!isUuid(bookingId)||!isUuid(postId)||!caseRef||!incidentRef||!txRef)
  return fail('Exact original booking/post/case/incident/transaction identifiers required.',400);
 if(!serviceReady(env)||!rev(env.CF_PAGES_COMMIT_SHA))
  return fail('Exact private original Rosie source revision unavailable.',503);
 try{
  // Authoritative 862 GET validates original 861→855 sources, revoked consent,
  // original route, incident and signed-in original-owner role. Never bypass it.
  const originalUrl=new URL('/api/admin/jobday_witness_862',u);
  for(const [k,v] of Object.entries({booking_id:bookingId,post_id:postId,
   owner_case_reference:caseRef,incident_reference:incidentRef,transaction_reference:txRef}))
   originalUrl.searchParams.set(k,v);
  const authHeaders=new Headers(request.headers);
  authHeaders.delete('content-type');authHeaders.delete('content-length');
  const sourceResponse=await original862({request:new Request(originalUrl.toString(),
   {method:'GET',headers:authHeaders}),env});
  if(!sourceResponse.ok)return sourceResponse;
  const original=await sourceResponse.json();
  if(!original?.ok||original.build!==862||original.source_revision!==env.CF_PAGES_COMMIT_SHA||
   original.transaction_reference!==txRef)
   return fail('Exact original 862 owner HOLD source not verified.');
  const filter='booking_id=eq.'+encodeURIComponent(bookingId)+
   '&post_id=eq.'+encodeURIComponent(postId)+
   '&transaction_reference=eq.'+encodeURIComponent(txRef);
  const tx=await exactlyOne(env,'rosie_master_transaction_review_v855',
   'id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference',filter);
  if(tx.case_reference!==caseRef||tx.incident_reference!==incidentRef)
   return fail('Original protected incident/case mismatch.');
  const scopedFilter='transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const witnesses=original.signed_resolution_review_witnesses,
   latestSla=original.owner_sla_history?.[0]||null,
   latestExport=original.durable_master_hold_export_history?.[0]||null;
  const [handoff,ownerEscalation,discrepancies,ownerReconciliations,criticalHistory,readbacks]=
   await Promise.all([
    exactlyOne(env,'rosie_recovery_custody_v858',
     'id,kind,transaction_review_id,review_digest_sha256',
     scopedFilter+'&kind=eq.conflict_escalation_handoff'),
    exactlyOne(env,'rosie_intake_discrepancy_v861',
     'id,kind,transaction_review_id,owner_exception_860_id,review_digest_sha256',
     'id=eq.'+encodeURIComponent(original.latest_original_owner_escalation_id||'')),
    rest(env,'rosie_intake_discrepancy_v861?select=id,kind,plane,transaction_review_id,review_digest_sha256&'+
      scopedFilter+'&kind=eq.signed_external_custodian_discrepancy&order=recorded_at.desc&limit=100'),
    rest(env,'rosie_postwitness_hold_v863?select=id,kind,transaction_review_id,review_digest_sha256,review_status,previous_id,recorded_at&'+
      scopedFilter+'&kind=eq.owner_post_witness_reconciliation&order=recorded_at.desc&limit=25'),
    rest(env,'rosie_postwitness_hold_v863?select=id,kind,transaction_review_id,review_digest_sha256,review_status,owner_action,previous_id,recorded_at&'+
      scopedFilter+'&kind=eq.owner_critical_sla_follow_up&order=recorded_at.desc&limit=25'),
    rest(env,'rosie_postwitness_hold_v863?select=id,kind,plane,transaction_review_id,export_862_id,witness_862_id,receipt_sha256,review_digest_sha256,recorded_at&'+
      scopedFilter+'&kind=eq.signed_master_hold_export_readback&order=recorded_at.desc&limit=25')
   ]);
  if(!scoped(handoff,tx.id)||handoff.kind!=='conflict_escalation_handoff'||
   !scoped(ownerEscalation,tx.id)||ownerEscalation.kind!=='owner_hold_escalation_review'||
   !isUuid(ownerEscalation.owner_exception_860_id)||
   !Array.isArray(witnesses)||witnesses.length>=100||
   !Array.isArray(discrepancies)||discrepancies.length>=100||
   ![ownerReconciliations,criticalHistory,readbacks].every(a=>Array.isArray(a)&&a.length<25&&
    a.every(r=>scoped(r,tx.id)))||
   !scoped(latestSla,tx.id)||latestSla.kind!=='owner_aging_sla_recheck')
   return fail('Complete independently sourced 861→863 original owner evidence window required.',503);
  const ownerException=await exactlyOne(env,'rosie_external_intake_custody_v860',
   'id,kind,transaction_review_id,review_digest_sha256',
   'id=eq.'+encodeURIComponent(ownerEscalation.owner_exception_860_id));
  if(!scoped(ownerException,tx.id)||ownerException.kind!=='owner_continuity_exception_review')
   return fail('Original 860 owner exception no longer matches.',503);
  const reconciliation=reconcileWitnesses863({discrepancies,witnesses,txId:tx.id});
  const sla=original.original_owner_sla_recheck;
  const critical=criticalFollowUp863({sla,latestSla,now:Date.now()});
  const latestRecon=ownerReconciliations[0]||null,
   latestCritical=criticalHistory[0]||null;
  const coverage=PLANES_863.map(plane=>({
   plane,review_witness_count:witnesses.filter(w=>w.plane===plane).length,
   signed_readback_count:readbacks.filter(r=>r.plane===plane).length,
   master_ingestion_verified:false,receiver_ack_verified:false}));
  if(request.method==='GET')return json({
   ok:true,build:863,contract:CONTRACT_863,
   source_revision:env.CF_PAGES_COMMIT_SHA,transaction_reference:txRef,
   original_post_witness_reconciliation:reconciliation,critical_owner_sla_follow_up:critical,
   latest_owner_sla_862_id:latestSla.id,latest_export_862_id:latestExport?.id||null,
   owner_reconciliation_history:ownerReconciliations,
   owner_critical_follow_up_history:criticalHistory,
   protected_cross_master_hold_readbacks:readbacks,per_master_reference_coverage:coverage,
   history_may_be_truncated:original.history_may_be_truncated||
    original.original_history_may_be_truncated,
   ...HOLD_863});
  const auth=await requireStaffAccess({request,env,body,capability:'manage_staff',
   allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Original Rosie owner session required, not legacy admin.',403);
  const reviewNonce=clean(body.review_nonce,100);
  if(!nonce(reviewNonce)||
   reconciliation.decision!=='ORIGINAL_POST_WITNESS_RECONCILIATION_HOLD_ONLY')
   return fail('New nonce and fully verified source-bound witness history required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const scope={tx,bookingId,postId,ownerException,ownerEscalation,latestSla,
   env,sla};
  let kind,checked=null,witness=null,referencedExport=null,
   referencedReconciliation=null,referencedCritical=null,
   previous=null,ownerAction=null,status;
  if(body.action==='record_post_witness_reconciliation'){
   if(body.confirm_witnesses_only_review_claims!==true||
    body.acknowledge_no_master_ack_or_incident_closure!==true)
    return fail('Original owner must acknowledge claims are not runtime/closure evidence.');
   kind='owner_post_witness_reconciliation';status=reconciliation.status;
   previous=latestRecon;
  }else if(body.action==='record_critical_owner_sla_follow_up'){
   if(body.confirm_original_incident_still_open!==true||
    body.confirm_critical_breach_owner_hold!==true||
    critical.decision!=='ORIGINAL_OWNER_CRITICAL_SLA_FOLLOW_UP_HOLD_ONLY')
    return fail('Current critical 48-hour owner SLA and explicit open incident required.');
   ownerAction=clean(body.owner_action,90);
   if(!ACTIONS_863.includes(ownerAction))return fail('Only bounded non-closing owner actions allowed.');
   kind='owner_critical_sla_follow_up';status='CRITICAL_BREACH_HOLD';previous=latestCritical;
  }else if(body.action==='record_protected_cross_master_hold_readback'){
   if(body.confirm_independent_signed_hash_reference!==true||
    body.acknowledge_no_external_delivery_or_receiver_ack!==true||
    body.acknowledge_original_owner_incident_open!==true)
    return fail('Signed claim cannot be interpreted as a Master delivery/ACK.');
   if(!latestExport||!latestRecon||!latestCritical||
    latestRecon.review_status!=='BOTH_PLANES_WITNESS_REVIEW_HOLD'||
    reconciliation.status!=='BOTH_PLANES_WITNESS_REVIEW_HOLD'||
    critical.decision!=='ORIGINAL_OWNER_CRITICAL_SLA_FOLLOW_UP_HOLD_ONLY')
    return fail('Current two-plane witness review, critical owner follow-up and 862 private export required.');
   const plane=clean(body.plane,40),witnessId=clean(body.witness_862_id,80);
   if(!PLANES_863.includes(plane)||!isUuid(witnessId))
    return fail('Exact independently witnessed Master plane required.',400);
   witness=witnesses.find(w=>w.id===witnessId&&w.plane===plane);
   if(!witness||witness.kind!=='signed_resolution_review_witness')
    return fail('Original signed 862 plane witness missing.',409);
   checked=await verifyReadback863(env,body.receipt||{},body.signature,{
    plane,tx,handoff,ownerException,ownerEscalation,witness,latestSla,latestExport,
    reconciliation:latestRecon,criticalFollowUp:latestCritical,
    bookingId,projectId:tx.project_id,postId,now:Date.now()});
   if(!checked.ok)return fail(checked.reason);
   kind='signed_master_hold_export_readback';status='CROSS_MASTER_REFERENCE_ONLY_HOLD';
   referencedExport=latestExport;referencedReconciliation=latestRecon;
   referencedCritical=latestCritical;
  }else return fail('Unsupported original owner 863 HOLD review action.',405);
  const digest=await digest863({kind,tx,ownerEscalation,latestSla,nonce:reviewNonce,
   reconciliation,critical,checked,previous,ownerAction});
  const saved=await persist(env,{scope,kind,reviewNonce,status,
   ownerAction,checked,witness,latestExport:referencedExport,
   reconciliation:referencedReconciliation,criticalFollowup:referencedCritical,
   previous,digest,actor});
  return json({ok:true,build:863,record_id:saved.id,recorded_at:saved.recorded_at,
   review_digest_sha256:digest,decision:kind==='signed_master_hold_export_readback'?
   checked.decision:kind==='owner_critical_sla_follow_up'?
   'OWNER_CRITICAL_SLA_BREACH_FOLLOW_UP_HOLD_ONLY':
   'OWNER_POST_WITNESS_RECONCILIATION_HOLD_ONLY',
   review_status:status,...HOLD_863});
 }catch(error){return fail(error?.message||'Protected original Rosie 863 custody unavailable.',503);}
}
