// Rosie 867 original-owner signed-reference renewal aging, offline plane
// routing and immutable private HOLD retention audit. No external ACK/closure.
import {hash860} from './jobday-intake-860.js';
import {HOLD_866} from './jobday-rotation-866.js';
export const CONTRACT_867='rosie.ai-data.comms.owner-renewal-routing-retention-hold.v867';
export const HOLD_867={...HOLD_866,independent_plane_receipt_delivered:false,
  scheduled_retention_deletion:false,original_owner_signed_renewal_verified:false,
  master_connected:false,owner_incident_closed:false,
  external_master_receiver_ack_verified:false};
export const KINDS_867=['owner_signed_custody_renewal_aging',
 'owner_independent_plane_receipt_exception_route',
 'owner_hold_history_retention_audit'];
export const ACTIONS_867=['maintain_hold','request_fresh_custody_witness',
 'route_offline_exception_for_independent_review'];
export const PLANES_867=['ai-data-platform','rosevear-comms-hub'];
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const nonce=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(x);
const validTime=(x,now)=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 Date.parse(x)<=now+300000;
const h=(date,now)=>Math.max(0,Math.floor((now-Date.parse(date))/3600000));
const bad=reason=>({decision:'HOLD',reason,...HOLD_867});
const source=(x,txId,kind,now)=>x&&uuid(x.id)&&
 x.transaction_review_id===txId&&x.kind===kind&&sha(x.review_digest_sha256)&&
 validTime(x.recorded_at,now);
export function renewalAging867({rotation866,offlineRefs=[],txId,now=Date.now()}={}){
 if(!uuid(txId)||!Number.isFinite(now)||!Array.isArray(offlineRefs)||
  offlineRefs.length>24||
  rotation866&&!source(rotation866,txId,
    'owner_private_snapshot_custody_rotation',now)||
  offlineRefs.some(r=>!source(r,txId,'signed_master_hold_export_readback',now)||
    !PLANES_867.includes(r.plane)||!sha(r.receipt_sha256)||!r.signer_id))
  return bad('Original signed-reference lineage not independently authenticated');
 const planes=PLANES_867.map(plane=>{
   const row=offlineRefs.find(x=>x.plane===plane);
   return {plane,original_signed_reference_id:row?.id||null,
    age_hours:row?h(row.recorded_at,now):null,stale:!row||h(row.recorded_at,now)>=24};
 });
 const age=rotation866?h(rotation866.recorded_at,now):null;
 const status=!rotation866?'MISSING_OWNER_CUSTODY_RENEWAL_HOLD':
  planes.some(p=>p.stale)?'MISSING_OR_STALE_SIGNED_REFERENCE_HOLD':
  age>=48?'OVERDUE_OWNER_CUSTODY_RENEWAL_HOLD':
  age>=24?'OWNER_CUSTODY_RENEWAL_DUE_HOLD':'CURRENT_OWNER_CUSTODY_REFERENCE_HOLD';
 return {decision:'ORIGINAL_OWNER_CUSTODY_RENEWAL_AGING_HOLD_ONLY',
  status,latest_owner_rotation_866_id:rotation866?.id||null,
  latest_owner_rotation_age_hours:age,planes,
  original_owner_signed_renewal_verified:false,
  automatic_renewal_triggered:false,...HOLD_867};
}
export function routeException867({correlation866,recheck866,latestCorrelation866,
 latestRecheck866,plane,txId,now=Date.now()}={}){
 if(!uuid(txId)||!PLANES_867.includes(plane)||
  correlation866?.decision!==
   'INDEPENDENT_OFFLINE_SLA_ESCALATION_REFERENCE_CORRELATION_HOLD_ONLY'||
  recheck866?.decision!=='SIGNED_TWO_PLANE_HOLD_EXCEPTION_REFERENCE_RECHECK_ONLY'||
  !source(latestCorrelation866,txId,'owner_sla_offline_receipt_correlation',now)||
  !source(latestRecheck866,txId,'owner_signed_two_plane_exception_recheck',now)||
  latestCorrelation866.review_status!==correlation866.status||
  latestRecheck866.review_status!==recheck866.status)
  return bad('Original 866 immutable SLA and two-plane source required');
 const ref=recheck866.planes?.find(x=>x.plane===plane);
 const slaRef=correlation866.planes?.find(x=>x.plane===plane);
 if(!ref||!slaRef||ref.id!==slaRef.id)
  return bad('Selected independent custodian route mismatches original plane');
 const status=!ref.id?'MISSING_PLANE_RECEIPT_REFERENCE_HOLD':
  ref.stale||slaRef.stale?'STALE_PLANE_RECEIPT_REFERENCE_HOLD':
  recheck866.status!=='SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD'||
  correlation866.status!=='OFFLINE_SLA_REFERENCE_CORRELATED_HOLD'?
  'DISPUTED_PLANE_RECEIPT_REFERENCE_HOLD':'OFFLINE_PLANE_EXCEPTION_REVIEW_ONLY_HOLD';
 return {decision:'INDEPENDENT_PLANE_OFFLINE_EXCEPTION_ROUTING_HOLD_ONLY',
  status,plane,latest_correlation_866_id:latestCorrelation866.id,
  latest_recheck_866_id:latestRecheck866.id,
  original_signed_reference_863_id:ref.id,
  manual_review_required:true,external_message_sent:false,
  external_ack_received:false,...HOLD_867};
}
export function retentionAudit867({histories={},txId,now=Date.now()}={}){
 if(!uuid(txId)||!Number.isFinite(now))
  return bad('Original transaction required');
 const checks=[];
 for(const kind of ['owner_private_snapshot_custody_rotation',
  'owner_sla_offline_receipt_correlation',
  'owner_signed_two_plane_exception_recheck']){
  const rows=histories[kind];
  if(!Array.isArray(rows)||rows.length>=25||
    rows.some(r=>!source(r,txId,kind,now)))return bad('Private 866 history incomplete');
  const seen=new Set();
  let broken=false;
  for(let i=0;i<rows.length;i++){
   const r=rows[i];if(seen.has(r.id)){broken=true;break;}seen.add(r.id);
   const prior=rows[i+1];
   if(prior){
    if(r.previous_id!==prior.id||r.previous_sha256!==prior.review_digest_sha256)
     broken=true;
   }else if(r.previous_id!==null||r.previous_sha256!==null)broken=true;
  }
  checks.push({kind,count:rows.length,latest_id:rows[0]?.id||null,
   history_complete:!broken,immutable_reference_only:true});
 }
 const status=checks.some(x=>!x.history_complete)?
  'BROKEN_OWNER_HOLD_RETENTION_CHAIN_HOLD':
  checks.some(x=>x.count===0)?'MISSING_OWNER_HOLD_HISTORY_HOLD':
   'COMPLETE_LOCAL_OWNER_HOLD_HISTORY_REFERENCE_HOLD';
 return {decision:'PROTECTED_LOCAL_HOLD_RETENTION_METADATA_AUDIT_ONLY',
  status,checks,raw_private_snapshots_read:false,
  physical_retention_verified:false,deletion_performed:false,...HOLD_867};
}
export async function digest867({kind,tx,sourceRevision,nonce:reviewNonce,
 previous=null,ownerAction,plane=null,result}={}){
 if(!KINDS_867.includes(kind)||!uuid(tx?.id)||
  typeof tx.transaction_reference!=='string'||
  !/^[a-f0-9]{40}$/.test(sourceRevision)||
  !nonce(reviewNonce)||!ACTIONS_867.includes(ownerAction)||
  (kind===KINDS_867[1]&&!PLANES_867.includes(plane))||
  (kind!==KINDS_867[1]&&plane!==null)||
  previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
  throw Error('Original owner source, nonce and predecessor required');
 const allowed={
  [KINDS_867[0]]:'ORIGINAL_OWNER_CUSTODY_RENEWAL_AGING_HOLD_ONLY',
  [KINDS_867[1]]:'INDEPENDENT_PLANE_OFFLINE_EXCEPTION_ROUTING_HOLD_ONLY',
  [KINDS_867[2]]:'PROTECTED_LOCAL_HOLD_RETENTION_METADATA_AUDIT_ONLY'};
 if(result?.decision!==allowed[kind]||
  !result.status?.endsWith('_HOLD')||result.master_connected!==false||
  result.owner_incident_closed!==false||result.external_master_receiver_ack_verified!==false)
  throw Error('Protected non-closing original owner HOLD review required');
 return hash860('ROSIE-867-'+kind.toUpperCase()+'-V1\n'+
  JSON.stringify([tx.id,tx.transaction_reference,sourceRevision,
   kind,plane,result.status,
   result.latest_owner_rotation_866_id||null,
   result.latest_correlation_866_id||null,result.latest_recheck_866_id||null,
   result.planes||result.checks||null,ownerAction,
   previous?.id||null,previous?.review_digest_sha256||null,reviewNonce]));
}
