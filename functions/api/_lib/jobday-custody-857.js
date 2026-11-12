// Rosie 857 — revalidate historical, source-custodied signed 856 receipts using their
// ORIGINAL deployed revision and admission time, not a forged current-live heartbeat.
// All decisions remain owner review / Master HOLD, never CONNECTED.
import {verifyWitness856} from './jobday-delivery-856.js';
export const CONTRACT_857='rosie.ai-data.comms.delivery-custody-owner-readback.v857';
export const PLANES_857=['ai-data-platform','rosevear-comms-hub'];
export const OWNER_ACTIONS_857=['maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts'];
const SLA_HOURS={CRITICAL:4,HIGH:12,ELEVATED:24,MONITOR:72};
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const sha=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const ms=v=>typeof v==='string'?Date.parse(v):NaN;
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function revalidateHistoricCustody857(env,receipt,signature,{
 witness,plane,transaction,bookingId,projectId,post,caseReference,incidentReference,actor
}={}){
 const recorded=ms(witness?.recorded_at),origin=ms(transaction?.recorded_at);
 const prior=plane==='ai-data-platform'?transaction?.ai_data_sha256:transaction?.comms_sha256;
 if(!uuid(witness?.id)||!uuid(transaction?.id)||!PLANES_857.includes(plane)||
    witness.kind!=='signed_delivery_hold_witness'||witness.plane!==plane||
    witness.transaction_review_id!==transaction.id||witness.project_id!==projectId||
    witness.booking_id!==bookingId||witness.post_id!==post?.id||
    witness.case_reference!==caseReference||witness.incident_reference!==incidentReference||
    witness.transaction_reference!==transaction.transaction_reference||
    witness.prior_855_sha256!==prior||!digest(prior)||!digest(witness.evidence_sha256)||
    !sha(witness.source_revision)||receipt?.source_revision!==witness.source_revision||
    receipt.nonce!==witness.evidence_nonce||
    receipt.delivery_receipt_reference!==witness.delivery_receipt_reference||
    ms(receipt.observed_at)!==ms(witness.witness_observed_at)||
    !Number.isFinite(recorded)||!Number.isFinite(origin)||recorded<origin-300000)
   return {ok:false,reason:'Exact historical 856 source custody, deployment and original 855 plane binding required.'};
 const checked=await verifyWitness856({...env,CF_PAGES_COMMIT_SHA:witness.source_revision},
   receipt,signature,{plane,bookingId,projectId,post,caseReference,incidentReference,
      transaction,actor,now:recorded});
 if(!checked.ok)return {ok:false,reason:checked.reason};
 if(checked.canonical_sha256!==witness.evidence_sha256)
   return {ok:false,reason:'Recomputed original signed 856 witness digest differs from stored immutable custody.'};
 return {ok:true,plane,witness_id:witness.id,witness_sha256:witness.evidence_sha256,
   observed_at:witness.witness_observed_at,source_revision:witness.source_revision,
   originally_recorded_at:witness.recorded_at,
   historical_signature_revalidated:true,verified_fresh_live_receiver_ack:false,
   remote_receiver_delivery_verified:false,master_connection:'HOLD'};
}
export function conflictAging857({conflicts=[],priority,now=Date.now()}={}){
 if(!Array.isArray(conflicts)||conflicts.length>80||
   !Object.prototype.hasOwnProperty.call(SLA_HOURS,priority)||!Number.isFinite(now))
   return {decision:'HOLD',reason:'ORIGINAL_ESCALATION_PRIORITY_OR_BOUNDED_CONFLICT_HISTORY_REQUIRED'};
 const times=conflicts.map(c=>ms(c?.recorded_at));
 if(times.some(t=>!Number.isFinite(t)||t>now+300000||now-t>366*86400000))
   return {decision:'HOLD',reason:'INVALID_OR_TRUNCATED_CONFLICT_CLOCK'};
 const target=SLA_HOURS[priority],due=times.length?Math.min(...times)+target*3600000:null;
 const overdue=due!==null&&now>due;
 return {decision:'AGING_REVIEW_ONLY',priority,review_target_hours:target,
   open_conflict_count:conflicts.length,
   oldest_conflict_recorded_at:times.length?new Date(Math.min(...times)).toISOString():null,
   escalation_review_due_at:due===null?null:new Date(due).toISOString(),
   conflict_aging_status:!times.length?'NO_CONFLICTS_RECORDED':overdue?'OPEN_ESCALATION_DUE':'OPEN_WITHIN_TARGET',
   independent_master_remediation_verified:false,automatic_retries_performed:0,
   conflict_recovery_authorized:false,master_connection:'HOLD'};
}
export async function revalidationDigest857({transaction,witness,plane,nonce:reviewNonce,aging}={}){
 if(!uuid(transaction?.id)||!uuid(witness?.id)||!PLANES_857.includes(plane)||!nonce(reviewNonce)||
   !digest(witness?.evidence_sha256)||aging?.decision!=='AGING_REVIEW_ONLY')
   throw Error('Exact historical witness and bounded aging digest required.');
 return hash('ROSIE-857-HISTORICAL-CUSTODY-V1\n'+JSON.stringify([
   transaction.id,witness.id,plane,witness.evidence_sha256,witness.source_revision,
   reviewNonce,aging.conflict_aging_status,aging.open_conflict_count
 ]));
}
export function ownerAcceptance857({transaction,revalidations=[],aging,ownerAction}={}){
 const reasons=[];
 if(!uuid(transaction?.id))reasons.push('ORIGINAL_855_TRANSACTION_MISSING');
 if(!Array.isArray(revalidations)||revalidations.length!==2||
    !PLANES_857.every(p=>revalidations.some(x=>x.plane===p&&
      x.kind==='historical_witness_revalidation'&&x.transaction_review_id===transaction?.id&&
      uuid(x.witness_856_id)&&digest(x.review_digest_sha256)&&digest(x.prior_witness_sha256)))||
    new Set(revalidations.map(x=>x.witness_856_id)).size!==2)
   reasons.push('BOTH_HISTORIC_INDEPENDENT_CUSTODY_REVIEWS_REQUIRED');
 if(aging?.decision!=='AGING_REVIEW_ONLY')reasons.push('SOURCE_ESCALATION_AGING_UNVERIFIED');
 if(!OWNER_ACTIONS_857.includes(ownerAction)||
    (ownerAction==='escalate_unresolved_conflicts'&&!(aging?.open_conflict_count>0)))
   reasons.push('NON_AUTHORIZING_OWNER_HOLD_DECISION_REQUIRED');
 return {decision:reasons.length?'HOLD':'OWNER_MASTER_ACCEPTANCE_READBACK_HOLD_ONLY',reasons,
   independent_historic_custody_review_recorded:reasons.length===0,
   conflict_aging_status:aging?.conflict_aging_status||'UNVERIFIED',
   open_conflict_count:aging?.open_conflict_count??null,
   owner_action:ownerAction||null,master_connection:'HOLD',master_runtime_ack:false,
   verified_fresh_live_receiver_ack:false,verified_remote_delivery:false,
   verified_cross_plane_atomicity:false,confirmed_sla_resolution:false,
   external_mirrors_verified:false,owner_operational_incident_closed:false,
   provider_mutation_performed:false,consumer_authorized:false,master_events_emitted:0};
}
export async function readbackDigest857({transaction,revalidations,aging,action,nonce:reviewNonce}={}){
 if(!uuid(transaction?.id)||!Array.isArray(revalidations)||revalidations.length!==2||
   !nonce(reviewNonce)||!OWNER_ACTIONS_857.includes(action)||aging?.decision!=='AGING_REVIEW_ONLY')
   throw Error('Two original receipt revalidations and non-authorizing owner HOLD required.');
 const prior=revalidations.map(x=>[x.plane,x.witness_856_id,x.review_digest_sha256]).sort((a,b)=>a[0].localeCompare(b[0]));
 if(!PLANES_857.every(p=>prior.some(x=>x[0]===p)))throw Error('Missing independent source plane.');
 return hash('ROSIE-857-MASTER-OWNER-READBACK-HOLD-V1\n'+JSON.stringify([
   transaction.id,transaction.transaction_reference,prior,
   aging.conflict_aging_status,aging.open_conflict_count,
   aging.escalation_review_due_at,action,reviewNonce
 ]));
}
