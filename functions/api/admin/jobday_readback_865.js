// Rosie 865: original Rosie owner only. No Master network delivery or ACK.
import {onRequest as original864} from './jobday_continuity_864.js';
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {rest,clean,serviceReady} from '../_lib/creative-projects.js';
import {ownerActor842} from '../_lib/jobday-social-842.js';
import {CONTRACT_865,HOLD_865,ACTIONS_865,readbackSnapshot865,
 freshness865,escalation865,digest865} from '../_lib/jobday-readback-865.js';
const fail=(error,status=409)=>json({ok:false,build:865,decision:'HOLD',error,...HOLD_865},status);
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(s);
const revision=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const scoped=(r,id)=>r&&isUuid(r.id)&&r.transaction_review_id===id;
async function exact(env,table,cols,filter){
 const rows=await rest(env,table+'?select='+cols+'&'+filter+'&limit=2');
 if(!Array.isArray(rows)||rows.length!==1)throw Error('Exactly one original scoped private row required.');
 return rows[0];
}
async function append(env,{scope,kind,reviewNonce,reviewDigest,status,previous=null,
 ownerAction=null,export864=null,privateExport862=null,critical863=null,
 reconciliation863=null,drift864=null,snapshotSha=null,actor}){
 const body={
  p_project_id:scope.tx.project_id,p_booking_id:scope.bookingId,
  p_post_id:scope.postId,p_transaction_review_id:scope.tx.id,
  p_owner_exception_860_id:scope.escalation861.owner_exception_860_id,
  p_owner_escalation_861_id:scope.escalation861.id,
  p_latest_sla_862_id:scope.latestSla.id,
  p_latest_export_862_id:privateExport862?.id||null,
  p_latest_critical_863_id:critical863?.id||null,
  p_latest_reconciliation_863_id:reconciliation863?.id||null,
  p_latest_recovery_864_id:scope.recovery864.id,
  p_latest_drift_864_id:drift864?.id||null,
  p_latest_export_864_id:export864?.id||null,
  p_kind:kind,p_review_status:status,
  p_source_revision:scope.env.CF_PAGES_COMMIT_SHA,
  p_snapshot_sha256:snapshotSha,
  p_review_digest_sha256:reviewDigest,p_review_nonce:reviewNonce,
  p_original_exception_age_hours:scope.freshness.oldest_exception_age_hours,
  p_owner_action:ownerAction,p_previous_id:previous?.id||null,
  p_previous_sha256:previous?.review_digest_sha256||null,
  p_actor_staff_email:actor};
 const rows=await rest(env,'rpc/rosie865_append_owner_hold',
  {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});
 if(!Array.isArray(rows)||rows.length!==1||rows[0].outcome!=='INSERTED'||
   !isUuid(rows[0].review_id))
  throw Error('Immutable owner 865 predecessor, nonce, source or status moved.');
 return {id:rows[0].review_id,recorded_at:rows[0].accepted_at};
}
export const onRequestOptions=()=>new Response('',{status:204});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return fail('Original Rosie owner read/review only.',405);
 if(Number(request.headers.get('content-length'))>24000)return fail('Payload too large.',413);
 const raw=request.method==='POST'?await request.text().catch(()=>''):'';
 if(raw.length>24000)return fail('Payload too large.',413);
 let body={};
 if(request.method==='POST'){
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('JSON object required.',400);}
 }
 const url=new URL(request.url),src=request.method==='POST'?body:Object.fromEntries(url.searchParams);
 const bookingId=clean(src.booking_id,80),postId=clean(src.post_id,80),
  caseRef=clean(src.owner_case_reference,80),incidentRef=clean(src.incident_reference,80),
  txRef=clean(src.transaction_reference,96);
 if(!isUuid(bookingId)||!isUuid(postId)||!caseRef||!incidentRef||!txRef)
  return fail('Exact original booking/post/case/incident/transaction required.',400);
 if(!serviceReady(env)||!revision(env.CF_PAGES_COMMIT_SHA))
  return fail('Exact deployed original Rosie revision or private service unavailable.',503);
 try{
  // Original 864 GET itself revalidates original 863→862→861→855 owner session,
  // revoked consent, case source, route, provider dispute and 24/48h status.
  const originalUrl=new URL('/api/admin/jobday_continuity_864',url);
  for(const [k,v] of Object.entries({booking_id:bookingId,post_id:postId,
   owner_case_reference:caseRef,incident_reference:incidentRef,transaction_reference:txRef}))
   originalUrl.searchParams.set(k,v);
  const h=new Headers(request.headers);
  h.delete('content-type');h.delete('content-length');
  const protectedResponse=await original864({
   request:new Request(originalUrl.toString(),{method:'GET',headers:h}),env});
  if(!protectedResponse.ok)return protectedResponse;
  const original=await protectedResponse.json();
  if(!original?.ok||original.build!==864||
   original.source_revision!==env.CF_PAGES_COMMIT_SHA||
   original.transaction_reference!==txRef||
   original.history_may_be_truncated!==false)
   return fail('Original owner 864 source/consent custody not verified.',409);
  const tx=await exact(env,'rosie_master_transaction_review_v855',
   'id,project_id,booking_id,post_id,case_reference,incident_reference,transaction_reference',
   'booking_id=eq.'+encodeURIComponent(bookingId)+
   '&post_id=eq.'+encodeURIComponent(postId)+
   '&transaction_reference=eq.'+encodeURIComponent(txRef));
  if(tx.case_reference!==caseRef||tx.incident_reference!==incidentRef)
   return fail('Original protected owner incident/case mismatch.');
  const filter='transaction_review_id=eq.'+encodeURIComponent(tx.id);
  const [latestSla,privateExport862,recoveryRows,driftRows,
   exportRows,criticalRows,reconciliationRows,discrepancies,readbacks,
   snapshotHistory,freshnessHistory,escalationHistory]=await Promise.all([
    exact(env,'rosie_discrepancy_review_v862',
     'id,kind,transaction_review_id,owner_escalation_861_id,review_digest_sha256,sla_status,recorded_at',
     'id=eq.'+encodeURIComponent(original.latest_original_sla_862_id)),
    original.latest_private_862_export_id?
     exact(env,'rosie_discrepancy_review_v862',
      'id,kind,transaction_review_id,review_digest_sha256,snapshot_sha256,previous_id',
      'id=eq.'+encodeURIComponent(original.latest_private_862_export_id)):Promise.resolve(null),
    rest(env,'rosie_owner_continuity_v864?select=id,kind,transaction_review_id,latest_sla_862_id,review_digest_sha256,review_status,recorded_at&'+
     filter+'&kind=eq.owner_critical_recovery_recheck&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_owner_continuity_v864?select=id,kind,transaction_review_id,latest_sla_862_id,latest_export_862_id,reconciliation_863_id,critical_followup_863_id,review_digest_sha256,review_status,recorded_at&'+
     filter+'&kind=eq.owner_two_plane_drift_review&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_owner_continuity_v864?select=id,kind,transaction_review_id,source_revision,review_digest_sha256,snapshot_sha256,previous_export_id,previous_export_sha256,latest_recovery_864_id,latest_drift_864_id,latest_export_862_id,reconciliation_863_id,critical_followup_863_id,recorded_at&'+
     filter+'&kind=eq.owner_incident_continuity_export&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_postwitness_hold_v863?select=id,kind,transaction_review_id,latest_sla_862_id,review_digest_sha256,recorded_at&'+
     filter+'&kind=eq.owner_critical_sla_follow_up&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_postwitness_hold_v863?select=id,kind,transaction_review_id,review_digest_sha256,recorded_at&'+
     filter+'&kind=eq.owner_post_witness_reconciliation&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_intake_discrepancy_v861?select=id,kind,plane,transaction_review_id,review_digest_sha256&'+
     filter+'&kind=eq.signed_external_custodian_discrepancy&order=recorded_at.desc,id.desc&limit=100'),
    rest(env,'rosie_postwitness_hold_v863?select=id,kind,plane,transaction_review_id,receipt_sha256,review_digest_sha256,recorded_at&'+
     filter+'&kind=eq.signed_master_hold_export_readback&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_owner_readback_v865?select=id,kind,transaction_review_id,review_digest_sha256,review_status,previous_id,recorded_at&'+
     filter+'&kind=eq.owner_continuity_snapshot_readback&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_owner_readback_v865?select=id,kind,transaction_review_id,review_digest_sha256,review_status,owner_action,previous_id,recorded_at&'+
     filter+'&kind=eq.owner_critical_followup_freshness&order=recorded_at.desc,id.desc&limit=25'),
    rest(env,'rosie_owner_readback_v865?select=id,kind,transaction_review_id,review_digest_sha256,review_status,owner_action,previous_id,recorded_at&'+
     filter+'&kind=eq.owner_two_plane_discrepancy_escalation&order=recorded_at.desc,id.desc&limit=25')
  ]);
  const escalation=await exact(env,'rosie_intake_discrepancy_v861',
   'id,kind,transaction_review_id,owner_exception_860_id,review_digest_sha256',
   'id=eq.'+encodeURIComponent(latestSla.owner_escalation_861_id));
  if(!scoped(latestSla,tx.id)||latestSla.kind!=='owner_aging_sla_recheck'||
   latestSla.sla_status!=='CRITICAL_HOLD'||!scoped(escalation,tx.id)||
   escalation.kind!=='owner_hold_escalation_review'||!isUuid(escalation.owner_exception_860_id)||
   ![recoveryRows,driftRows,exportRows,criticalRows,reconciliationRows,
    readbacks,snapshotHistory,freshnessHistory,escalationHistory]
   .every(a=>Array.isArray(a)&&a.length<25&&a.every(r=>scoped(r,tx.id)))||
   !Array.isArray(discrepancies)||discrepancies.length>=100||
   discrepancies.some(r=>!scoped(r,tx.id))||
   original.private_original_incident_continuity_export_history?.[0]?.id!==exportRows[0]?.id||
   original.owner_two_plane_drift_history?.[0]?.id!==driftRows[0]?.id||
   original.owner_recovery_recheck_history?.[0]?.id!==recoveryRows[0]?.id||
   original.latest_private_862_export_id!==privateExport862?.id)
   return fail('Original 861–865 complete private owner custody history or newest tip required.',503);
  const recovery864=recoveryRows[0],drift864=driftRows[0]||null,
   export864=exportRows[0]||null,critical863=criticalRows[0]||null,
   reconciliation863=reconciliationRows[0]||null;
  if(!recovery864||recovery864.latest_sla_862_id!==latestSla.id||
   critical863?.id!==original.latest_owner_863_critical_followup_id||
   reconciliation863?.id!==original.latest_owner_863_reconciliation_id||
   (export864&&(!privateExport862||!drift864||
    export864.latest_recovery_864_id!==recovery864.id||
    export864.latest_drift_864_id!==drift864.id||
    export864.latest_export_862_id!==privateExport862.id)))
   return fail('Exact current original private continuity source moved.',503);
  const criticalAge=original.critical_recovery_evidence_revalidation?.original_exception_age_hours;
  const fresh=freshness865({criticalRecovery:recovery864,criticalFollowup:critical863,
   latestSla,earliestExceptionAgeHours:criticalAge,now:Date.now()});
  const escal=escalation865({drift:original.signed_two_plane_hold_readback_drift,
   discrepancies,latestSigned:readbacks,txId:tx.id,now:Date.now()});
  if(request.method==='GET')return json({ok:true,build:865,contract:CONTRACT_865,
   source_revision:env.CF_PAGES_COMMIT_SHA,transaction_reference:txRef,
   latest_original_owner_private_snapshot_864_id:export864?.id||null,
   latest_original_owner_private_snapshot_sha256:export864?.snapshot_sha256||null,
   snapshot_readback_requires_original_private_bundle:true,
   original_critical_owner_sla_freshness:fresh,
   signed_two_plane_discrepancy_escalation:escal,
   owner_snapshot_readback_history:snapshotHistory,
   owner_critical_freshness_history:freshnessHistory,
   owner_two_plane_hold_escalation_history:escalationHistory,
   history_may_be_truncated:false,...HOLD_865});
  const auth=await requireStaffAccess({request,env,body,
   capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  if(auth.auth_mode!=='session'||!ownerActor842(auth.actor))
   return fail('Current original Rosie owner session required, not legacy admin.',403);
  const reviewNonce=clean(body.review_nonce,100);
  if(!nonce(reviewNonce)||fresh.decision!==
    'CRITICAL_ORIGINAL_OWNER_SLA_FRESHNESS_RECHECK_HOLD_ONLY')
   return fail('Fresh owner nonce and exact critical source required.',400);
  const actor=clean(auth.actor?.email,140)||clean(auth.actor?.id,140)||'OriginalOwner';
  const scope={tx,bookingId,postId,latestSla,escalation861:escalation,
   recovery864,env,freshness:fresh};
  let kind,status,ownerAction=null,readback=null,previous=null,
   persistExport864=null,persistPrivate862=null,persistCritical863=null,
   persistRecon863=null,persistDrift864=null,snapshotSha=null;
  if(body.action==='record_private_continuity_snapshot_readback'){
   if(body.confirm_owner_supplied_original_bundle===true&&
    body.acknowledge_no_external_delivery_or_ack===true&&export864&&privateExport862){
    readback=await readbackSnapshot865({bundle:body.bundle,exportRow:export864,
     tx,latestSla,latestPrivateExport:privateExport862,now:Date.now()});
    if(!readback.ok)return fail(readback.reason);
   }else return fail('Original private owner bundle and no-delivery acknowledgement required.');
   kind='owner_continuity_snapshot_readback';status='PRIVATE_SNAPSHOT_MATCH_HOLD';
   previous=snapshotHistory[0]||null;persistExport864=export864;
   persistPrivate862=privateExport862;persistCritical863=critical863;
   persistRecon863=reconciliation863;persistDrift864=drift864;
   snapshotSha=readback.verified_snapshot_sha256;
  }else if(body.action==='record_protected_critical_followup_freshness'){
   if(body.confirm_original_critical_incident_open!==true||
     body.acknowledge_no_operational_recovery!==true)
    return fail('Original owner critical open incident and no-recovery acknowledgement required.');
   ownerAction=clean(body.owner_action,90);
   if(!ACTIONS_865.includes(ownerAction))
    return fail('Only non-closing original owner critical follow-up actions permitted.');
   kind='owner_critical_followup_freshness';status=fresh.status;
   previous=freshnessHistory[0]||null;persistCritical863=critical863;
  }else if(body.action==='record_two_plane_hold_discrepancy_escalation'){
   if(body.confirm_discrepancies_still_open===true&&
    body.acknowledge_offline_readback_not_master_ack===true&&
    escal.decision==='TWO_PLANE_ORIGINAL_DISCREPANCY_ESCALATION_HOLD_ONLY'){
    ownerAction=clean(body.owner_action,90);
    if(!ACTIONS_865.includes(ownerAction))return fail('Non-closing owner escalation action required.');
   }else return fail('Original independent two-plane HOLD dispute evidence and explicit owner acknowledgement required.');
   if(!privateExport862||!drift864||!reconciliation863||!critical863)
    return fail('Exact original 862/863/864 two-plane drift/HOLD custody required.');
   kind='owner_two_plane_discrepancy_escalation';status=escal.status;
   previous=escalationHistory[0]||null;persistPrivate862=privateExport862;
   persistCritical863=critical863;persistRecon863=reconciliation863;
   persistDrift864=drift864;
  }else return fail('Unsupported 865 owner-only HOLD action.',405);
  const reviewDigest=await digest865({kind,tx,latestSla,export864,
   recovery864,drift864,nonce:reviewNonce,previous,action:ownerAction,
   readback,freshness:fresh,escalation:escal});
  const saved=await append(env,{scope,kind,reviewNonce,reviewDigest,status,
   previous,ownerAction,export864:persistExport864,
   privateExport862:persistPrivate862,critical863:persistCritical863,
   reconciliation863:persistRecon863,drift864:persistDrift864,
   snapshotSha,actor});
  return json({ok:true,build:865,record_id:saved.id,recorded_at:saved.recorded_at,
   review_digest_sha256:reviewDigest,review_status:status,
   decision:kind==='owner_continuity_snapshot_readback'?
    'INDEPENDENT_PRIVATE_OWNER_SNAPSHOT_READBACK_HOLD_ONLY':
    kind==='owner_critical_followup_freshness'?
    'ORIGINAL_OWNER_CRITICAL_FRESHNESS_RECORDED_HOLD_ONLY':
    'INDEPENDENT_TWO_PLANE_DISCREPANCY_ESCALATED_HOLD_ONLY',
   ...HOLD_865});
 }catch(e){return fail(e?.message||'Protected original Rosie 865 custody unavailable.',503);}
}
