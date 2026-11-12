// Rosie 863: independent source-scoped witness reconciliation, owner SLA breach
// follow-up and signed cross-Master *HOLD hash reference* readback claims.
// Nothing in this module proves external delivery, receiver ACK or incident closure.
import {hash860} from './jobday-intake-860.js';
import {HOLD_862} from './jobday-witness-862.js';
export const CONTRACT_863='rosie.ai-data.comms.post-witness-critical-sla-hold-readback.v863';
export const HOLD_863={...HOLD_862,cross_master_export_delivered:false,
 independent_master_ack_verified:false,original_owner_incident_closed:false,
 discrepancy_operationally_resolved:false,master_connected:false};
export const PLANES_863=['ai-data-platform','rosevear-comms-hub'];
export const STATUSES_863=['NO_SIGNED_WITNESS_HOLD','PARTIAL_WITNESS_REVIEW_HOLD',
 'BOTH_PLANES_WITNESS_REVIEW_HOLD','WITNESS_CONFLICT_HOLD','CRITICAL_BREACH_HOLD',
 'CROSS_MASTER_REFERENCE_ONLY_HOLD'];
export const ACTIONS_863=['maintain_hold','escalate_critical_sla_to_original_owner',
 'request_fresh_external_custodian_evidence'];
export const FIELDS_863=['version','kind','plane','source_id','contract','source_revision',
 'booking_id','project_id','post_id','transaction_review_id','handoff_858_id',
 'owner_exception_860_id','owner_escalation_861_id',
 'owner_escalation_861_sha256','witness_862_id','witness_862_sha256',
 'sla_862_id','sla_862_sha256','export_862_id','export_862_sha256',
 'export_snapshot_862_sha256','reconciliation_863_id','reconciliation_863_sha256',
 'critical_followup_863_id','critical_followup_863_sha256',
 'review_claim','disposition','nonce','issued_at','expires_at','signer_id'];
const PINS_863={'ai-data-platform':'ROSIE_AIDATA_HOLD_READBACK_ED25519_PUBLIC_KEY_863',
 'rosevear-comms-hub':'ROSIE_COMMS_HOLD_READBACK_ED25519_PUBLIC_KEY_863'};
const OLD_863=[
 'ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862',
 'ROSIE_COMMS_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862',
 'ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861',
 'ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861',
 'ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860',
 'ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860'];
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const rev=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(s);
const signer=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$/.test(s);
const stamp=s=>typeof s==='string'?Date.parse(s):NaN;
const bytes=(s,n)=>{
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))return null;
 try{const b=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+
  '='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));return b.length===n?b:null;}
 catch{return null;}
};
export function reconcileWitnesses863({discrepancies=[],witnesses=[],txId}={}){
 if(!uuid(txId)||![discrepancies,witnesses].every(a=>Array.isArray(a)&&a.length<100)||
  discrepancies.some(d=>!uuid(d.id)||d.transaction_review_id!==txId||
   d.kind!=='signed_external_custodian_discrepancy'||!PLANES_863.includes(d.plane)||
   !sha(d.review_digest_sha256))||
  witnesses.some(w=>!uuid(w.id)||w.transaction_review_id!==txId||
   w.kind!=='signed_resolution_review_witness'||!PLANES_863.includes(w.plane)||
   !sha(w.review_digest_sha256)||!sha(w.receipt_sha256)))
  return {decision:'HOLD',reason:'INCOMPLETE_OR_OUT_OF_SCOPE_WITNESS_HISTORY',...HOLD_863};
 const mismatched=witnesses.filter(w=>!discrepancies.some(d=>
  d.id===w.discrepancy_861_id&&d.plane===w.plane));
 const counts=Object.fromEntries(PLANES_863.map(plane=>[plane,{
  disputes:discrepancies.filter(d=>d.plane===plane).length,
  signed_review_witnesses:witnesses.filter(w=>w.plane===plane&&!mismatched.includes(w)).length}]));
 const matchedPlanes=PLANES_863.filter(p=>counts[p].signed_review_witnesses>0);
 const missingDisputes=PLANES_863.some(p=>counts[p].disputes===0);
 const status=mismatched.length?'WITNESS_CONFLICT_HOLD':
  matchedPlanes.length===2&&!missingDisputes?'BOTH_PLANES_WITNESS_REVIEW_HOLD':
  matchedPlanes.length?'PARTIAL_WITNESS_REVIEW_HOLD':'NO_SIGNED_WITNESS_HOLD';
 const issues=['ORIGINAL_INCIDENT_REMAINS_OPEN','SIGNED_WITNESSES_ARE_REVIEW_ONLY'];
 if(missingDisputes)issues.push('MISSING_INDEPENDENT_DISCREPANCY_PLANE');
 if(mismatched.length)issues.push('CROSS_PLANE_WITNESS_LINEAGE_MISMATCH');
 if(matchedPlanes.length!==2)issues.push('MISSING_TWO_PLANE_REVIEW_COVERAGE');
 return {decision:'ORIGINAL_POST_WITNESS_RECONCILIATION_HOLD_ONLY',status,
  planes:counts,matched_review_planes:matchedPlanes,issue_codes:issues,
  witness_review_count:witnesses.length,discrepancy_claim_count:discrepancies.length,
  external_delivery_proven:false,operational_resolution_proven:false,...HOLD_863};
}
export function criticalFollowUp863({sla,latestSla,now=Date.now()}={}){
 const age=sla?.original_exception_age_hours,issued=stamp(latestSla?.recorded_at);
 if(sla?.decision!=='ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY'||
  !Number.isInteger(age)||age<0||!uuid(latestSla?.id)||
  !sha(latestSla.review_digest_sha256)||latestSla.kind!=='owner_aging_sla_recheck'||
  latestSla.sla_status!=='CRITICAL_HOLD'||!Number.isFinite(issued)||
  !Number.isFinite(now)||issued>now+300000||
  age<48||sla.sla_status!=='CRITICAL_HOLD')
  return {decision:'HOLD',reason:'LATEST_EXACT_CRITICAL_OWNER_SLA_EVIDENCE_REQUIRED',...HOLD_863};
 const ageSince=Math.max(0,Math.floor((now-issued)/3600000));
 return {decision:'ORIGINAL_OWNER_CRITICAL_SLA_FOLLOW_UP_HOLD_ONLY',
  status:'CRITICAL_BREACH_HOLD',original_exception_age_hours:age,
  critical_breach_age_hours:age-48,latest_sla_recheck_age_hours:ageSince,
  follow_up_recheck_due:ageSince>=24,
  latest_sla_862_id:latestSla.id,latest_sla_862_sha256:latestSla.review_digest_sha256,
  issues:['CRITICAL_ORIGINAL_OWNER_INCIDENT_UNRESOLVED',
   ...(ageSince>=24?['STALE_CRITICAL_SLA_RECHECK']:[]),
   'EXTERNAL_RUNTIME_AND_MASTER_ACK_UNVERIFIED'],...HOLD_863};
}
export function canonicalReadback863(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||
  Object.keys(r).length!==FIELDS_863.length||
  Object.keys(r).some(k=>!FIELDS_863.includes(k))||
  FIELDS_863.some(k=>typeof r[k]!==(k==='version'?'number':'string')))
  throw Error('Exact private v863 readback witness required.');
 return 'ROSIE-863-INDEPENDENT-MASTER-HOLD-REFERENCE-READBACK-V1\n'+
  JSON.stringify(FIELDS_863.map(k=>r[k]));
}
export async function verifyReadback863(env,receipt,signature,{
 plane,tx,handoff,ownerException,ownerEscalation,witness,latestSla,latestExport,
 reconciliation,criticalFollowUp,bookingId,projectId,postId,now=Date.now()
}={}){
 const pin=PINS_863[plane],issued=stamp(receipt?.issued_at),
  expires=stamp(receipt?.expires_at);
 if(!pin||!rev(env?.CF_PAGES_COMMIT_SHA)||
  ![tx,handoff,ownerException,ownerEscalation,witness,latestSla,latestExport,
    reconciliation,criticalFollowUp].every(x=>uuid(x?.id))||
  ![ownerEscalation.review_digest_sha256,witness.review_digest_sha256,
   latestSla.review_digest_sha256,latestExport.review_digest_sha256,
   latestExport.snapshot_sha256,reconciliation.review_digest_sha256,
   criticalFollowUp.review_digest_sha256].every(sha)||
  witness.kind!=='signed_resolution_review_witness'||witness.plane!==plane||
  witness.transaction_review_id!==tx.id||
  latestSla.kind!=='owner_aging_sla_recheck'||latestSla.transaction_review_id!==tx.id||
  latestExport.kind!=='master_hold_custody_export'||latestExport.transaction_review_id!==tx.id||
  reconciliation.kind!=='owner_post_witness_reconciliation'||
  criticalFollowUp.kind!=='owner_critical_sla_follow_up'||
  reconciliation.transaction_review_id!==tx.id||
  criticalFollowUp.transaction_review_id!==tx.id||
  receipt?.version!==1||receipt.kind!=='independent_master_hold_reference_readback'||
  receipt.plane!==plane||receipt.source_id!=='rosiedazzlers'||
  receipt.contract!==CONTRACT_863||receipt.source_revision!==env.CF_PAGES_COMMIT_SHA||
  receipt.booking_id!==bookingId||receipt.project_id!==projectId||
  receipt.post_id!==postId||receipt.transaction_review_id!==tx.id||
  receipt.handoff_858_id!==handoff.id||
  receipt.owner_exception_860_id!==ownerException.id||
  receipt.owner_escalation_861_id!==ownerEscalation.id||
  receipt.owner_escalation_861_sha256!==ownerEscalation.review_digest_sha256||
  receipt.witness_862_id!==witness.id||
  receipt.witness_862_sha256!==witness.review_digest_sha256||
  receipt.sla_862_id!==latestSla.id||
  receipt.sla_862_sha256!==latestSla.review_digest_sha256||
  receipt.export_862_id!==latestExport.id||
  receipt.export_862_sha256!==latestExport.review_digest_sha256||
  receipt.export_snapshot_862_sha256!==latestExport.snapshot_sha256||
  receipt.reconciliation_863_id!==reconciliation.id||
  receipt.reconciliation_863_sha256!==reconciliation.review_digest_sha256||
  receipt.critical_followup_863_id!==criticalFollowUp.id||
  receipt.critical_followup_863_sha256!==criticalFollowUp.review_digest_sha256)
  return {ok:false,reason:'Exact 855–863 original witness/export/critical custody required.'};
 if(receipt.review_claim!=='master_export_hash_reference_reviewed_hold_only'||
  receipt.disposition!=='offline_reference_only_no_transport_or_ack'||
  !nonce(receipt.nonce)||!signer(receipt.signer_id)||
  ![issued,expires].every(Number.isFinite)||!Number.isFinite(now)||
  issued>now+300000||now-issued>300000||expires<=now||expires-issued>900000)
  return {ok:false,reason:'Only a fresh independent non-delivery Master HOLD reference is permitted.'};
 const own=env?.[pin],other=env?.[PINS_863[
  plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform']];
 if(!bytes(own,32)||!bytes(other,32)||!bytes(signature,64)||
  own===other||OLD_863.some(k=>env?.[k]===own&&typeof own==='string'))
  return {ok:false,reason:'Two new independent public-only v863 readback pins required.'};
 try{
  const canon=canonicalReadback863(receipt),key=await crypto.subtle.importKey(
   'raw',bytes(own,32),{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',key,bytes(signature,64),
   new TextEncoder().encode(canon)))
   return {ok:false,reason:'Protected cross-Master HOLD hash-reference signature invalid.'};
  return {ok:true,decision:'INDEPENDENT_MASTER_HOLD_HASH_REFERENCE_ONLY',
   plane,receipt_sha256:await hash860(canon),signer_id:receipt.signer_id,
   export_id:latestExport.id,export_snapshot_sha256:latestExport.snapshot_sha256,
   ...HOLD_863};
 }catch{return {ok:false,reason:'Malformed independently signed readback claim.'};}
}
export async function digest863({kind,tx,ownerEscalation,latestSla,nonce:reviewNonce,
 reconciliation,critical,checked,previous=null,ownerAction=null}={}){
 if(!uuid(tx?.id)||!uuid(ownerEscalation?.id)||!uuid(latestSla?.id)||!nonce(reviewNonce)||
  !sha(ownerEscalation.review_digest_sha256)||!sha(latestSla.review_digest_sha256)||
  previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
  throw Error('Complete original owner and prior immutable SHA chain required.');
 let detail;
 if(kind==='owner_post_witness_reconciliation'){
  if(reconciliation?.decision!=='ORIGINAL_POST_WITNESS_RECONCILIATION_HOLD_ONLY'||
   !STATUSES_863.includes(reconciliation.status))
   throw Error('Bounded independent signed witness reconciliation required.');
  detail=[reconciliation.status,reconciliation.planes,reconciliation.issue_codes,
   previous?.id||null,previous?.review_digest_sha256||null];
 }else if(kind==='owner_critical_sla_follow_up'){
  if(critical?.decision!=='ORIGINAL_OWNER_CRITICAL_SLA_FOLLOW_UP_HOLD_ONLY'||
   !ACTIONS_863.includes(ownerAction))
   throw Error('Critical open owner SLA and bounded HOLD action required.');
  detail=[critical.critical_breach_age_hours,critical.latest_sla_recheck_age_hours,
   critical.issues,ownerAction,previous?.id||null,previous?.review_digest_sha256||null];
 }else if(kind==='signed_master_hold_export_readback'){
  if(!checked?.ok||previous)
   throw Error('New independent verified per-plane HOLD hash-reference required.');
  detail=[checked.plane,checked.receipt_sha256,checked.export_id,
   checked.export_snapshot_sha256];
 }else throw Error('Unsupported v863 immutable HOLD kind.');
 return hash860('ROSIE-863-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
  tx.id,tx.transaction_reference,ownerEscalation.id,
  ownerEscalation.review_digest_sha256,latestSla.id,latestSla.review_digest_sha256,
  detail,reviewNonce]));
}
