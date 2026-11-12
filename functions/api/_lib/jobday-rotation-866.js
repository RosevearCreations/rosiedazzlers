// Rosie Dazzlers 866: private owner custody reference rotation, 863 offline
// receipt correlation and two-plane signed-reference exception recheck.
// None of these local checks proves delivery, Master ACK or incident closure.
import {hash860} from './jobday-intake-860.js';
import {HOLD_865,PLANES_865} from './jobday-readback-865.js';
export const CONTRACT_866='rosie.ai-data.comms.private-owner-custody-sla-receipt-two-plane-hold.v866';
export const HOLD_866={...HOLD_865,master_connected:false,owner_incident_closed:false,
 external_master_delivery_verified:false,external_master_receiver_ack_verified:false,
 private_snapshot_verified_as_external_delivery:false,
 offline_receipt_is_external_ack:false,cryptographic_key_rotated:false};
export const KINDS_866=['owner_private_snapshot_custody_rotation',
 'owner_sla_offline_receipt_correlation','owner_signed_two_plane_exception_recheck'];
export const ACTIONS_866=['maintain_hold','request_independent_sla_receipt',
 'escalate_independent_two_plane_exception'];
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const nonce=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(x);
const timestamp=x=>typeof x==='string'?Date.parse(x):NaN;
const validTime=(x,now)=>Number.isFinite(timestamp(x))&&timestamp(x)<=now+300000;
const ageHours=(x,now)=>Math.max(0,(now-timestamp(x))/3600000);
const hold=(reason)=>({decision:'HOLD',reason,...HOLD_866});
export function rotateCustody866({verified,ownerExport864,ownerReadback865,
 txId,previousRotation=null,now=Date.now()}={}){
 if(!uuid(txId)||!verified?.ok||!sha(verified.verified_snapshot_sha256)||
  verified.transport_verified!==false||verified.master_connected!==false||
  !uuid(ownerExport864?.id)||ownerExport864.kind!=='owner_incident_continuity_export'||
  ownerExport864.transaction_review_id!==txId||
  ownerExport864.snapshot_sha256!==verified.verified_snapshot_sha256||
  !validTime(ownerExport864.recorded_at,now)||
  !uuid(ownerReadback865?.id)||
  ownerReadback865.kind!=='owner_continuity_snapshot_readback'||
  ownerReadback865.transaction_review_id!==txId||
  ownerReadback865.review_status!=='PRIVATE_SNAPSHOT_MATCH_HOLD'||
  ownerReadback865.latest_export_864_id!==ownerExport864.id||
  ownerReadback865.snapshot_sha256!==verified.verified_snapshot_sha256||
  !sha(ownerReadback865.review_digest_sha256)||
  !validTime(ownerReadback865.recorded_at,now)||
  previousRotation&&(!uuid(previousRotation.id)||!sha(previousRotation.review_digest_sha256)||
   previousRotation.kind!=='owner_private_snapshot_custody_rotation'||
   previousRotation.transaction_review_id!==txId))
  return hold('Immutable 864 export and independently verified 865 owner readback required');
 return {decision:'OWNER_PRIVATE_SNAPSHOT_REFERENCE_ROTATION_HOLD_ONLY',
  status:'PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD',
  original_export_864_id:ownerExport864.id,
  original_verified_snapshot_sha256:verified.verified_snapshot_sha256,
  original_readback_865_id:ownerReadback865.id,
  previous_rotation_866_id:previousRotation?.id||null,
  private_bundle_stored:false,cryptographic_key_rotated:false,...HOLD_866};
}
function refs866({refs,txId,now}){
 if(!Array.isArray(refs)||refs.length>=25||!uuid(txId)||
  refs.some(r=>!uuid(r?.id)||r.transaction_review_id!==txId||
   r.kind!=='signed_master_hold_export_readback'||!PLANES_865.includes(r.plane)||
   !sha(r.receipt_sha256)||!sha(r.review_digest_sha256)||
   !validTime(r.recorded_at,now)))return null;
 return PLANES_865.map(plane=>{
  const r=refs.find(row=>row.plane===plane);
  return {plane,id:r?.id||null,receipt_sha256:r?.receipt_sha256||null,
   review_digest_sha256:r?.review_digest_sha256||null,
   age_hours:r?Math.floor(ageHours(r.recorded_at,now)):null,
   stale:!r||ageHours(r.recorded_at,now)>=24};
 });
}
export function correlateSlaReceipt866({freshness,latestFreshness865,
 latestEscalation865,refs=[],txId,now=Date.now()}={}){
 const planes=refs866({refs,txId,now});
 if(!planes||freshness?.decision!==
   'CRITICAL_ORIGINAL_OWNER_SLA_FRESHNESS_RECHECK_HOLD_ONLY'||
  !['MISSING_CRITICAL_FOLLOWUP_HOLD','STALE_CRITICAL_FOLLOWUP_HOLD',
    'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD'].includes(freshness.status)||
  !uuid(latestFreshness865?.id)||
  latestFreshness865.kind!=='owner_critical_followup_freshness'||
  latestFreshness865.transaction_review_id!==txId||
  latestFreshness865.review_status!==freshness.status||
  !sha(latestFreshness865.review_digest_sha256)||
  !validTime(latestFreshness865.recorded_at,now)||
  latestEscalation865&&(!uuid(latestEscalation865.id)||
   latestEscalation865.kind!=='owner_two_plane_discrepancy_escalation'||
   latestEscalation865.transaction_review_id!==txId||
   !sha(latestEscalation865.review_digest_sha256)||
   !validTime(latestEscalation865.recorded_at,now)))
  return hold('Original owner 865 SLA and immutable offline reference custody missing');
 const missing=planes.some(p=>!p.id),stale=planes.some(p=>p.stale);
 const status=!latestEscalation865?'MISSING_OWNER_ESCALATION_RECEIPT_HOLD':
   missing?'MISSING_OFFLINE_SLA_REFERENCE_HOLD':
   stale?'STALE_OFFLINE_SLA_REFERENCE_HOLD':
   freshness.status!=='CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD'?
     'SLA_ESCALATION_REFERENCE_MISMATCH_HOLD':
     'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD';
 return {decision:'INDEPENDENT_OFFLINE_SLA_ESCALATION_REFERENCE_CORRELATION_HOLD_ONLY',
  status,latest_owner_sla_865_id:latestFreshness865.id,
  latest_owner_escalation_865_id:latestEscalation865?.id||null,planes,
  offline_receipt_is_external_ack:false,external_transport_tested:false,...HOLD_866};
}
export function recheckTwoPlane866({escalation,latestEscalation865,drift864,
 refs=[],txId,now=Date.now()}={}){
 const planes=refs866({refs,txId,now});
 if(!planes||escalation?.decision!==
   'TWO_PLANE_ORIGINAL_DISCREPANCY_ESCALATION_HOLD_ONLY'||
  !uuid(latestEscalation865?.id)||
  latestEscalation865.kind!=='owner_two_plane_discrepancy_escalation'||
  latestEscalation865.transaction_review_id!==txId||
  latestEscalation865.review_status!==escalation.status||
  !sha(latestEscalation865.review_digest_sha256)||
  !validTime(latestEscalation865.recorded_at,now)||
  !uuid(drift864?.id)||drift864.kind!=='owner_two_plane_drift_review'||
  drift864.transaction_review_id!==txId||
  !sha(drift864.review_digest_sha256)||
  !Array.isArray(escalation.planes)||escalation.planes.length!==2)
  return hold('Original 864 drift, 865 escalation and source-bound signed HOLD references required');
 const missing=planes.some(p=>!p.id),stale=planes.some(p=>p.stale);
 const inconsistent=planes.some(p=>{
  const current=escalation.planes.find(e=>e.plane===p.plane);
  return !current||current.latest_offline_signed_reference_id!==p.id||
   current.latest_offline_signed_reference_sha256!==p.review_digest_sha256;
 });
 const status=missing?'MISSING_SIGNED_TWO_PLANE_REFERENCE_HOLD':
  inconsistent?'INCONSISTENT_TWO_PLANE_HOLD':
  stale?'STALE_SIGNED_TWO_PLANE_REFERENCE_HOLD':
  escalation.status!=='TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD'?
   'INCONSISTENT_TWO_PLANE_HOLD':'SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD';
 return {decision:'SIGNED_TWO_PLANE_HOLD_EXCEPTION_REFERENCE_RECHECK_ONLY',
  status,original_drift_864_id:drift864.id,
  original_escalation_865_id:latestEscalation865.id,
  planes,external_signed_receipt_verified:false,incident_closed:false,...HOLD_866};
}
export async function digest866({kind,tx,sourceRevision,nonce:reviewNonce,
 previous=null,ownerAction,rotation,correlation,recheck}={}){
 if(!KINDS_866.includes(kind)||!uuid(tx?.id)||
  typeof tx.transaction_reference!=='string'||
  !/^[a-f0-9]{40}$/.test(sourceRevision)||!nonce(reviewNonce)||
  !ACTIONS_866.includes(ownerAction)||
  previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
  throw Error('Original owner nonce, action, transaction and predecessor required');
 const result=kind===KINDS_866[0]?rotation:
  kind===KINDS_866[1]?correlation:recheck;
 const allowed=kind===KINDS_866[0]?
  'OWNER_PRIVATE_SNAPSHOT_REFERENCE_ROTATION_HOLD_ONLY':
  kind===KINDS_866[1]?
  'INDEPENDENT_OFFLINE_SLA_ESCALATION_REFERENCE_CORRELATION_HOLD_ONLY':
  'SIGNED_TWO_PLANE_HOLD_EXCEPTION_REFERENCE_RECHECK_ONLY';
 if(result?.decision!==allowed||!result.status?.endsWith('_HOLD')||
   result.master_connected!==false||result.owner_incident_closed!==false)
  throw Error('Non-closing original owner HOLD proof required');
 const evidence=kind===KINDS_866[0]?
  [result.original_export_864_id,result.original_verified_snapshot_sha256,
   result.original_readback_865_id,result.previous_rotation_866_id]:
  kind===KINDS_866[1]?
   [result.latest_owner_sla_865_id,result.latest_owner_escalation_865_id,
    result.planes]:[result.original_drift_864_id,
    result.original_escalation_865_id,result.planes];
 return hash860('ROSIE-866-'+kind.toUpperCase()+'-V1\n'+
  JSON.stringify([tx.id,tx.transaction_reference,sourceRevision,
   result.status,evidence,ownerAction,previous?.id||null,
   previous?.review_digest_sha256||null,reviewNonce]));
}
