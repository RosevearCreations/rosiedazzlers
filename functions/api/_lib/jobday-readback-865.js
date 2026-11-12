// Rosie 865: original-owner private continuity snapshot readback, critical
// follow-up freshness, and bounded two-plane discrepancy escalation. All HOLD.
import {hash860} from './jobday-intake-860.js';
import {HOLD_864} from './jobday-continuity-864.js';
export const CONTRACT_865='rosie.ai-data.comms.owner-snapshot-freshness-two-plane-hold.v865';
export const HOLD_865={...HOLD_864,
 owner_incident_closed:false,external_master_delivery_verified:false,
 external_master_receiver_ack_verified:false,
 private_snapshot_verified_as_external_delivery:false,master_connected:false};
export const ACTIONS_865=['maintain_hold','request_fresh_original_owner_sla',
 'escalate_to_independent_custodians'];
export const PLANES_865=['ai-data-platform','rosevear-comms-hub'];
export const KINDS_865=['owner_continuity_snapshot_readback',
 'owner_critical_followup_freshness','owner_two_plane_discrepancy_escalation'];
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const nonce=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(x);
const stamp=x=>typeof x==='string'?Date.parse(x):NaN;
const safeStamp=(x,now)=>Number.isFinite(stamp(x))&&stamp(x)<=now+300000;
export async function readbackSnapshot865({bundle,exportRow,tx,latestSla,
 latestPrivateExport,now=Date.now()}={}){
 if(!exportRow||exportRow.kind!=='owner_incident_continuity_export'||
  !uuid(exportRow.id)||!sha(exportRow.snapshot_sha256)||
  exportRow.transaction_review_id!==tx?.id||!uuid(tx?.id)||
  !uuid(latestSla?.id)||!sha(latestSla.review_digest_sha256)||
  !uuid(latestPrivateExport?.id)||!sha(latestPrivateExport.snapshot_sha256)||
  !bundle||typeof bundle!=='object'||Array.isArray(bundle)||
  Object.keys(bundle).length>42||Object.keys(bundle).length<15||
  bundle.format!=='rosie.original-owner-critical-continuity-hold.v864'||
  bundle.source_revision!==exportRow.source_revision||
  bundle.transaction_review_id!==tx.id||
  bundle.incident_reference!==tx.incident_reference||
  bundle.latest_sla_862_id!==latestSla.id||
  bundle.latest_sla_862_sha256!==latestSla.review_digest_sha256||
  bundle.private_export_862_id!==latestPrivateExport.id||
  bundle.private_export_snapshot_862_sha256!==latestPrivateExport.snapshot_sha256||
  bundle.latest_864_recovery_id!==exportRow.latest_recovery_864_id||
  bundle.latest_864_drift_id!==exportRow.latest_drift_864_id||
  bundle.latest_863_owner_reconciliation_id!==exportRow.reconciliation_863_id||
  bundle.latest_863_owner_critical_followup_id!==exportRow.critical_followup_863_id||
  bundle.previous_continuity_export_id!==(exportRow.previous_export_id||null)||
  bundle.previous_continuity_export_sha256!==(exportRow.previous_export_sha256||null)||
  bundle.delivery_state!=='NOT_TRANSMITTED_HOLD_ONLY'||
  bundle.source_history_truncated!==false||
  bundle.master_connected!==false||
  bundle.original_owner_incident_closed!==false||
  bundle.external_master_delivery_verified===true||
  bundle.external_handoff_completed!==false||
  !safeStamp(bundle.generated_at,now)||
  !safeStamp(exportRow.recorded_at,now)||
  stamp(bundle.generated_at)>stamp(exportRow.recorded_at)+300000||
  stamp(bundle.generated_at)<stamp(exportRow.recorded_at)-300000)
  return {ok:false,reason:'Original private v864 snapshot lineage/format/HOLD proof incomplete',...HOLD_865};
 try{
  const digest=await hash860('ROSIE-864-PRIVATE-ORIGINAL-OWNER-CONTINUITY-HOLD-V1\n'+
   JSON.stringify(bundle));
  if(digest!==exportRow.snapshot_sha256)return {
   ok:false,reason:'Private original owner v864 snapshot SHA256 mismatch',...HOLD_865};
  return {ok:true,decision:'PRIVATE_OWNER_CONTINUITY_SNAPSHOT_READBACK_HOLD_ONLY',
   continuity_export_864_id:exportRow.id,verified_snapshot_sha256:digest,
   signed_external_receiver_ack:false,transport_verified:false,...HOLD_865};
 }catch{return {ok:false,reason:'Malformed private owner continuity snapshot',...HOLD_865};}
}
export function freshness865({criticalRecovery,criticalFollowup,latestSla,
 earliestExceptionAgeHours,now=Date.now()}={}){
 if(!Number.isFinite(now)||!Number.isInteger(earliestExceptionAgeHours)||
  earliestExceptionAgeHours<48||
  !uuid(latestSla?.id)||!sha(latestSla.review_digest_sha256)||
  latestSla.kind!=='owner_aging_sla_recheck'||latestSla.sla_status!=='CRITICAL_HOLD'||
  !safeStamp(latestSla.recorded_at,now)||
  !uuid(criticalRecovery?.id)||!sha(criticalRecovery.review_digest_sha256)||
  criticalRecovery.kind!=='owner_critical_recovery_recheck'||
  criticalRecovery.latest_sla_862_id!==latestSla.id||
  !safeStamp(criticalRecovery.recorded_at,now)||
  criticalFollowup&&(!uuid(criticalFollowup.id)||!sha(criticalFollowup.review_digest_sha256)||
   criticalFollowup.kind!=='owner_critical_sla_follow_up'||
   criticalFollowup.latest_sla_862_id!==latestSla.id||
   !safeStamp(criticalFollowup.recorded_at,now)))
  return {decision:'HOLD',reason:'Original 862→864 critical SLA lineage missing',...HOLD_865};
 const hours=t=>Math.max(0,Math.floor((now-stamp(t))/3600000));
 const slaAge=hours(latestSla.recorded_at),recAge=hours(criticalRecovery.recorded_at);
 const followAge=criticalFollowup?hours(criticalFollowup.recorded_at):null;
 const missing=!criticalFollowup,stale=slaAge>=24||recAge>=24||
  (followAge!==null&&followAge>=24);
 const status=missing?'MISSING_CRITICAL_FOLLOWUP_HOLD':
  stale?'STALE_CRITICAL_FOLLOWUP_HOLD':'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD';
 return {decision:'CRITICAL_ORIGINAL_OWNER_SLA_FRESHNESS_RECHECK_HOLD_ONLY',status,
  oldest_exception_age_hours:earliestExceptionAgeHours,
  latest_sla_age_hours:slaAge,latest_recovery_age_hours:recAge,
  latest_followup_age_hours:followAge,
  original_owner_followup_required:missing||stale,
  issues:['ORIGINAL_CRITICAL_INCIDENT_OPEN','NO_MASTER_ACK_OR_OPERATIONAL_RECOVERY',
   ...(missing?['MISSING_SIGNED_OWNER_CRITICAL_FOLLOWUP']:[]),
   ...(stale?['OWNER_CRITICAL_FOLLOWUP_STALE']:[])],...HOLD_865};
}
export function escalation865({drift,discrepancies=[],latestSigned=[],txId,
 now=Date.now()}={}){
 if(!uuid(txId)||!drift||drift.decision!==
  'PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY'||
  !['BOTH_PLANES_HASH_MATCH_HOLD','MISSING_SIGNED_PLANE_HOLD',
    'STALE_SIGNED_REFERENCE_HOLD','CROSS_MASTER_HASH_DRIFT_HOLD'].includes(drift.status)||
  !Array.isArray(discrepancies)||discrepancies.length>=100||
  discrepancies.some(x=>!uuid(x?.id)||x.transaction_review_id!==txId||
   x.kind!=='signed_external_custodian_discrepancy'||!PLANES_865.includes(x.plane)||
   !sha(x.review_digest_sha256))||
  !Array.isArray(latestSigned)||latestSigned.length>=25||
  latestSigned.some(r=>!uuid(r?.id)||r.transaction_review_id!==txId||
   r.kind!=='signed_master_hold_export_readback'||!PLANES_865.includes(r.plane)||
   !sha(r.receipt_sha256)||!sha(r.review_digest_sha256)||
   !safeStamp(r.recorded_at,now)))
  return {decision:'HOLD',reason:'Missing exact original independent two-plane discrepancy custody',...HOLD_865};
 const planes=PLANES_865.map(plane=>{
  const count=discrepancies.filter(d=>d.plane===plane).length;
  const r=latestSigned.find(r=>r.plane===plane);
  const status=drift.planes?.find(p=>p.plane===plane)?.status||'MISSING';
  return {plane,original_discrepancy_claim_count:count,
   latest_offline_signed_reference_id:r?.id||null,
   latest_offline_signed_reference_sha256:r?.review_digest_sha256||null,
   status};
 });
 const missingDiscrepancy=planes.some(p=>p.original_discrepancy_claim_count===0);
 const status=missingDiscrepancy?'MISSING_DISCREPANCY_CUSTODY_HOLD':
  drift.status==='BOTH_PLANES_HASH_MATCH_HOLD'?
   'TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD':
   drift.status==='MISSING_SIGNED_PLANE_HOLD'?'MISSING_INDEPENDENT_REFERENCE_HOLD':
   drift.status==='STALE_SIGNED_REFERENCE_HOLD'?'STALE_TWO_PLANE_REFERENCE_HOLD':
   'TWO_PLANE_REFERENCE_DRIFT_HOLD';
 return {decision:'TWO_PLANE_ORIGINAL_DISCREPANCY_ESCALATION_HOLD_ONLY',
  status,planes,source_drift_status:drift.status,
  open_discrepancy_count:discrepancies.length,
  issues:['EXTERNAL_DISCREPANCIES_NOT_OPERATIONALLY_CLOSED',
   'SIGNED_REFERENCE_DOES_NOT_CONSTITUTE_MASTER_ACK',
   ...(missingDiscrepancy?['MISSING_INDEPENDENT_DISCREPANCY_CUSTODY']:[]),
   ...(status==='TWO_PLANE_REFERENCE_DRIFT_HOLD'?['INDEPENDENT_REFERENCE_HASH_DRIFT']:[])],
  live_master_receiver_ack:false,incident_closed:false,...HOLD_865};
}
export async function digest865({kind,tx,latestSla,export864,recovery864,
 drift864,nonce:reviewNonce,previous=null,action=null,readback=null,
 freshness=null,escalation=null}={}){
 if(!KINDS_865.includes(kind)||!uuid(tx?.id)||!uuid(latestSla?.id)||
  !sha(latestSla.review_digest_sha256)||!uuid(recovery864?.id)||
  !sha(recovery864.review_digest_sha256)||!nonce(reviewNonce)||
  previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
  throw Error('Exact original protected owner 862→865 predecessor and nonce required.');
 let data;
 if(kind==='owner_continuity_snapshot_readback'){
  if(!readback?.ok||!uuid(export864?.id)||!sha(readback.verified_snapshot_sha256))
   throw Error('Independent private owner v864 snapshot readback required.');
  data=[export864.id,readback.verified_snapshot_sha256,
   previous?.id||null,previous?.review_digest_sha256||null];
 }else if(kind==='owner_critical_followup_freshness'){
  if(freshness?.decision!=='CRITICAL_ORIGINAL_OWNER_SLA_FRESHNESS_RECHECK_HOLD_ONLY'||
   !ACTIONS_865.includes(action))throw Error('Original owner critical followup freshness required.');
  data=[freshness.status,freshness.latest_sla_age_hours,
   freshness.latest_recovery_age_hours,freshness.latest_followup_age_hours,
   action,previous?.id||null,previous?.review_digest_sha256||null];
 }else{
  if(escalation?.decision!=='TWO_PLANE_ORIGINAL_DISCREPANCY_ESCALATION_HOLD_ONLY'||
   !ACTIONS_865.includes(action)||!uuid(drift864?.id)||!sha(drift864.review_digest_sha256))
   throw Error('Independent per-plane dispute and owner HOLD escalation required.');
  data=[drift864.id,drift864.review_digest_sha256,
   escalation.status,escalation.source_drift_status,escalation.planes,action,
   previous?.id||null,previous?.review_digest_sha256||null];
 }
 return hash860('ROSIE-865-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
  tx.id,tx.transaction_reference,latestSla.id,latestSla.review_digest_sha256,
  recovery864.id,recovery864.review_digest_sha256,data,reviewNonce]));
}
