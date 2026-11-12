// Rosie 864: non-authorizing original-owner critical recovery evidence, existing
// signed HOLD-reference drift checks, and immutable owner continuity export digests.
// Past signature validation is represented by protected v863 ledger, never a fresh ACK.
import {HOLD_863,PLANES_863} from './jobday-postwitness-863.js';
import {hash860} from './jobday-intake-860.js';
export const CONTRACT_864='rosie.ai-data.comms.critical-revalidation-two-plane-hold-continuity.v864';
export const HOLD_864={...HOLD_863,critical_recovery_closed:false,
  original_owner_incident_closed:false,two_plane_master_ack_verified:false,
  external_handoff_completed:false,master_connected:false};
export const KINDS_864=['owner_critical_recovery_recheck','owner_two_plane_drift_review',
 'owner_incident_continuity_export'];
export const ACTIONS_864=['maintain_hold','request_fresh_independent_master_references',
 'escalate_owner_critical_sla_breach'];
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(s);
const stamp=s=>typeof s==='string'?Date.parse(s):NaN;
export function revalidateCritical864({latestSla,criticalHistory=[],aging,now=Date.now()}={}){
 if(!Number.isFinite(now)||!Array.isArray(criticalHistory)||criticalHistory.length>=25||
  criticalHistory.some(x=>!uuid(x?.id)||x.kind!=='owner_critical_sla_follow_up'||
   !sha(x.review_digest_sha256)||!Number.isFinite(stamp(x.recorded_at)))||
  !uuid(latestSla?.id)||latestSla.kind!=='owner_aging_sla_recheck'||
  !sha(latestSla.review_digest_sha256)||latestSla.sla_status!=='CRITICAL_HOLD'||
  !Number.isFinite(stamp(latestSla.recorded_at))||
  aging?.decision!=='ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY'||
  !Number.isInteger(aging.original_exception_age_hours))
  return {decision:'HOLD',reason:'INCOMPLETE_OR_UNVERIFIED_ORIGINAL_CRITICAL_SLA_SOURCE',...HOLD_864};
 const age=aging.original_exception_age_hours,critical=criticalHistory[0]||null;
 if(age<48)return {decision:'HOLD',reason:'NOT_CRITICAL_48H_ORIGINAL_OWNER_EXCEPTION',...HOLD_864};
 const ageSinceSla=Math.max(0,Math.floor((now-stamp(latestSla.recorded_at))/3600000));
 const ageSinceFollowup=critical?Math.max(0,Math.floor((now-stamp(critical.recorded_at))/3600000)):null;
 const issues=['ORIGINAL_CRITICAL_INCIDENT_OPEN','PROVIDER_AND_MASTER_ACK_UNVERIFIED'];
 if(!critical)issues.push('MISSING_CRITICAL_OWNER_FOLLOWUP');
 if(ageSinceSla>=24)issues.push('STALE_ORIGINAL_862_SLA_RECHECK');
 if(ageSinceFollowup!==null&&ageSinceFollowup>=24)issues.push('CRITICAL_OWNER_FOLLOWUP_OLDER_THAN_24H');
 // Recovery evidence review requires fresh original owner action; it never closes an incident.
 return {decision:'ORIGINAL_OWNER_CRITICAL_RECOVERY_EVIDENCE_HOLD_ONLY',
  status:!critical?'MISSING_FOLLOWUP_HOLD':
   ageSinceSla>=24||ageSinceFollowup>=24?'STALE_CRITICAL_RECHECK_HOLD':'CRITICAL_RECOVERY_RECHECK_HOLD',
  original_exception_age_hours:age,critical_breach_age_hours:age-48,
  latest_sla_id:latestSla.id,latest_sla_sha256:latestSla.review_digest_sha256,
  latest_critical_followup_id:critical?.id||null,
  latest_critical_followup_sha256:critical?.review_digest_sha256||null,
  latest_critical_followup_age_hours:ageSinceFollowup,
  latest_sla_age_hours:ageSinceSla,issues,
  operational_recovery_verified:false,...HOLD_864};
}
export function monitorReadbackDrift864({readbacks=[],latestExport,latestReconciliation,
 latestCritical,txId,now=Date.now()}={}){
 if(!uuid(txId)||!uuid(latestExport?.id)||!sha(latestExport.snapshot_sha256)||
  !sha(latestExport.review_digest_sha256)||
  !uuid(latestReconciliation?.id)||!sha(latestReconciliation.review_digest_sha256)||
  !uuid(latestCritical?.id)||!sha(latestCritical.review_digest_sha256)||
  !Number.isFinite(now)||!Array.isArray(readbacks)||readbacks.length>=25||
  readbacks.some(r=>!uuid(r?.id)||!uuid(r?.witness_862_id)||
   r.kind!=='signed_master_hold_export_readback'||r.transaction_review_id!==txId||
   !PLANES_863.includes(r.plane)||!sha(r.receipt_sha256)||
   !sha(r.review_digest_sha256)||!sha(r.export_snapshot_sha256)||
   !Number.isFinite(stamp(r.recorded_at))||stamp(r.recorded_at)>now+300000))
  return {decision:'HOLD',reason:'INCOMPLETE_OR_OUT_OF_SCOPE_SIGNED_HOLD_REFERENCE_WINDOW',...HOLD_864};
 const byPlane=PLANES_863.map(plane=>{
  const rows=readbacks.filter(r=>r.plane===plane);
  const latest=rows[0]||null;
  const bound=latest&&latest.export_862_id===latestExport.id&&
   latest.export_snapshot_sha256===latestExport.snapshot_sha256&&
   latest.reconciliation_863_id===latestReconciliation.id&&
   latest.critical_followup_863_id===latestCritical.id;
  const age=latest?Math.max(0,Math.floor((now-stamp(latest.recorded_at))/3600000)):null;
  return {plane,claim_count:rows.length,latest_readback_id:latest?.id||null,
   latest_readback_sha256:latest?.review_digest_sha256||null,
   status:!latest?'MISSING':!bound?'REFERENCE_DRIFT':age>=24?'STALE':'MATCHED_REFERENCE_ONLY',
   recorded_age_hours:age};
 });
 const matched=byPlane.filter(x=>x.status==='MATCHED_REFERENCE_ONLY').length;
 const missing=byPlane.some(x=>x.status==='MISSING');
 const drift=byPlane.some(x=>x.status==='REFERENCE_DRIFT');
 const stale=byPlane.some(x=>x.status==='STALE');
 const status=drift?'CROSS_MASTER_HASH_DRIFT_HOLD':
  missing?'MISSING_SIGNED_PLANE_HOLD':
  stale?'STALE_SIGNED_REFERENCE_HOLD':'BOTH_PLANES_HASH_MATCH_HOLD';
 const issues=['SIGNED_HASH_REFERENCE_IS_NOT_RECEIVER_ACK','ORIGINAL_OWNER_INCIDENT_OPEN'];
 if(missing)issues.push('MISSING_ORIGINAL_SIGNED_PLANE_REFERENCE');
 if(drift)issues.push('CROSS_MASTER_EXPORT_OR_OWNER_LINEAGE_DRIFT');
 if(stale)issues.push('OLDER_THAN_24H_SIGNED_REFERENCE');
 if(matched!==2)issues.push('FRESH_TWO_PLANE_REFERENCE_COVERAGE_NOT_VERIFIED');
 return {decision:'PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY',status,
  export_862_id:latestExport.id,export_snapshot_sha256:latestExport.snapshot_sha256,
  matched_plane_count:matched,planes:byPlane,issues,external_delivery_verified:false,
  receiver_ack_verified:false,...HOLD_864};
}
export async function digest864({kind,tx,latestSla,latestExport,reviewNonce,
 critical,drift,ownerAction=null,previous=null,previousExport=null,bundleSha=null}={}){
 if(!KINDS_864.includes(kind)||!uuid(tx?.id)||!uuid(latestSla?.id)||
  !sha(latestSla.review_digest_sha256)||!nonce(reviewNonce)||
  previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
  throw Error('Original source, non-authorizing review kind and immutable predecessor required.');
 let evidence;
 if(kind==='owner_critical_recovery_recheck'){
  if(critical?.decision!=='ORIGINAL_OWNER_CRITICAL_RECOVERY_EVIDENCE_HOLD_ONLY'||
   !ACTIONS_864.includes(ownerAction))
   throw Error('Original critical recovery evidence and non-closing owner action required.');
  evidence=[critical.status,critical.latest_critical_followup_id,
   critical.latest_critical_followup_sha256,critical.original_exception_age_hours,
   critical.issues,ownerAction,previous?.id||null,previous?.review_digest_sha256||null];
 }else if(kind==='owner_two_plane_drift_review'){
  if(drift?.decision!=='PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY'||
   !uuid(latestExport?.id)||!sha(latestExport.snapshot_sha256))
   throw Error('Original source-bound two-plane HOLD drift assessment required.');
  evidence=[latestExport.id,latestExport.snapshot_sha256,drift.status,
   drift.planes,drift.issues,previous?.id||null,previous?.review_digest_sha256||null];
 }else{
  if(!sha(bundleSha)||!uuid(latestExport?.id)||!sha(latestExport.snapshot_sha256)||
   !uuid(previous?.id)||previous.kind!=='owner_two_plane_drift_review'||
   previousExport&&(!uuid(previousExport.id)||!sha(previousExport.review_digest_sha256)))
   throw Error('Immutable drift review, source export and private continuity snapshot required.');
  evidence=[latestExport.id,latestExport.snapshot_sha256,bundleSha,
   previous.id,previous.review_digest_sha256,
   previousExport?.id||null,previousExport?.review_digest_sha256||null];
 }
 return hash860('ROSIE-864-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
  tx.id,tx.transaction_reference,latestSla.id,latestSla.review_digest_sha256,
  evidence,reviewNonce]));
}
