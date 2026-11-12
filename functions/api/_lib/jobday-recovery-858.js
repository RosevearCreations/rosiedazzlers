// Rosie 858 — fresh independent signed observation recheck, scoped conflict handoff,
// and privacy-safe owner recovery export. Neither a signature nor local custody
// is proof of external transport, Master CONNECTED, SLA closure, or incident closure.
import {canonicalWitness856,verifyWitness856} from './jobday-delivery-856.js';
import {PLANES_857} from './jobday-custody-857.js';
export const CONTRACT_858='rosie.ai-data.comms.fresh-recheck-handoff-recovery.v858';
export const HOLD_858={master_connection:'HOLD',master_runtime_ack:false,
  verified_remote_delivery:false,verified_cross_plane_atomicity:false,
  confirmed_sla_resolution:false,owner_operational_incident_closed:false,
  recovery_executed:false,provider_mutation_performed:false,master_events_emitted:0};
export const HANDOFF_ACTIONS_858=['request_independent_master_recheck','escalate_unresolved_conflicts'];
export const EXPORT_ACTIONS_858=['maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts'];
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const sha40=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const digest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const ms=v=>typeof v==='string'?Date.parse(v):NaN;
export const hash858=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function checkFreshReceipt858(env,receipt,signature,context={}){
 const now=context.now??Date.now(),rev=env?.CF_PAGES_COMMIT_SHA;
 if(!Number.isFinite(now)||!sha40(rev)||receipt?.source_revision!==rev)
   return {ok:false,reason:'Current exact deployed revision required; historical 857 proof is not fresh.'};
 const checked=await verifyWitness856(env,receipt,signature,{...context,now});
 if(!checked.ok)return {ok:false,reason:checked.reason};
 if(!PLANES_857.includes(context.plane))
   return {ok:false,reason:'Independent recognized consumer plane required.'};
 const observed=ms(receipt.observed_at),expires=ms(receipt.expires_at);
 if(!Number.isFinite(observed)||!Number.isFinite(expires)||now-observed>300000||observed>now+300000||expires<=now)
   return {ok:false,reason:'Fresh receipt must have an unexpired observation within five minutes.'};
 const canonical=canonicalWitness856(receipt);
 return {ok:true,decision:'FRESH_SIGNED_OBSERVATION_RECHECK_HOLD_ONLY',
   plane:context.plane,source_revision:rev,receipt_sha256:await hash858(canonical),
   observed_at:receipt.observed_at,signer_id:receipt.signer_id,
   signature_verified:true,remote_receiver_delivery_verified:false,...HOLD_858};
}
export function crossPlaneFreshness858({records=[],transaction,sourceRevision,now=Date.now()}={}){
 if(!uuid(transaction?.id)||!sha40(sourceRevision)||!Number.isFinite(now)||
   !Array.isArray(records)||records.length>100)
   return {decision:'HOLD',reason:'EXACT_SOURCE_OR_BOUNDED_RECEIPT_HISTORY_REQUIRED',...HOLD_858};
 const scoped=records.filter(r=>r.kind==='fresh_receipt_recheck'&&
   r.transaction_review_id===transaction.id&&r.source_revision===sourceRevision&&
   PLANES_857.includes(r.plane)&&digest(r.receipt_sha256)&&uuid(r.id)&&
   Number.isFinite(ms(r.recorded_at))&&Number.isFinite(ms(r.receipt_observed_at))&&
   ms(r.recorded_at)<=now+300000&&ms(r.receipt_observed_at)<=now+300000&&
   ms(r.recorded_at)>=now-300000&&ms(r.receipt_observed_at)>=now-300000);
 const latest=PLANES_857.map(p=>scoped.filter(r=>r.plane===p)
   .sort((a,b)=>ms(b.recorded_at)-ms(a.recorded_at))[0]).filter(Boolean);
 if(latest.length!==2||new Set(latest.map(r=>r.receipt_sha256)).size!==2)
   return {decision:'HOLD',reason:'TWO_DISTINCT_FRESH_INDEPENDENT_PLANE_RECHECKS_REQUIRED',...HOLD_858};
 return {decision:'TWO_FRESH_SIGNED_OBSERVATIONS_REVIEW_ONLY',
   rechecks:latest.map(r=>({id:r.id,plane:r.plane,receipt_sha256:r.receipt_sha256,
    source_revision:r.source_revision,observed_at:r.receipt_observed_at,
    recorded_at:r.recorded_at})),...HOLD_858};
}
export function handoffAssessment858({transaction,readbacks=[],freshness,aging,ownerAction}={}){
 const reasons=[];
 if(!uuid(transaction?.id))reasons.push('EXACT_ORIGINAL_TRANSACTION_REQUIRED');
 if(!Array.isArray(readbacks)||!readbacks.some(r=>r.transaction_review_id===transaction?.id&&
  r.kind==='owner_acceptance_readback'&&uuid(r.id)&&digest(r.review_digest_sha256)))
  reasons.push('ORIGINAL_857_OWNER_HOLD_READBACK_REQUIRED');
 if(freshness?.decision!=='TWO_FRESH_SIGNED_OBSERVATIONS_REVIEW_ONLY')
  reasons.push('INDEPENDENT_FRESH_RECEIPT_RECHECK_PENDING');
 if(aging?.decision!=='AGING_REVIEW_ONLY'||!(aging.open_conflict_count>0))
  reasons.push('OPEN_SOURCE_CONFLICT_REQUIRED');
 if(!HANDOFF_ACTIONS_858.includes(ownerAction))reasons.push('NON_AUTHORIZING_ESCALATION_ACTION_REQUIRED');
 return {decision:reasons.length?'HOLD':'DURABLE_CONFLICT_HANDOFF_REQUEST_HOLD_ONLY',
  reasons,open_conflict_count:aging?.open_conflict_count??null,
  conflict_aging_status:aging?.conflict_aging_status||'UNVERIFIED',
  independent_receiver_handoff_ack:false,external_handoff_sent:false,...HOLD_858};
}
export async function evidenceDigest858({kind,transaction,sourceRevision,freshness,
  aging,priorOwnerReadbackId,ownerAction,nonce}={}){
 if(!['conflict_escalation_handoff','owner_recovery_acceptance_export'].includes(kind)||
   !uuid(transaction?.id)||!sha40(sourceRevision)||!uuid(priorOwnerReadbackId)||
   !Array.isArray(freshness?.rechecks)||freshness.rechecks.length!==2||
   aging?.decision!=='AGING_REVIEW_ONLY'||typeof nonce!=='string'||!/^[A-Za-z0-9_-]{20,100}$/.test(nonce)||
   !EXPORT_ACTIONS_858.includes(ownerAction))
   throw Error('Bounded original Master readback, current two-plane receipts and explicit HOLD action required.');
 const evidence=freshness.rechecks.map(r=>[r.plane,r.id,r.receipt_sha256]).sort((a,b)=>a[0].localeCompare(b[0]));
 return hash858('ROSIE-858-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
   transaction.id,transaction.transaction_reference,sourceRevision,priorOwnerReadbackId,
   evidence,aging.conflict_aging_status,aging.open_conflict_count,ownerAction,nonce]));
}
export async function recoveryExport858({transaction,sourceRevision,readback,handoff,
  freshness,aging,ownerAction,nonce,generatedAt=new Date().toISOString()}={}){
 if(!uuid(transaction?.id)||!uuid(readback?.id)||!uuid(handoff?.id)||
   handoff.kind!=='conflict_escalation_handoff'||
   handoff.transaction_review_id!==transaction.id||handoff.prior_857_readback_id!==readback.id||
   handoff.source_revision!==sourceRevision||freshness?.decision!=='TWO_FRESH_SIGNED_OBSERVATIONS_REVIEW_ONLY'||
   aging?.decision!=='AGING_REVIEW_ONLY'||!EXPORT_ACTIONS_858.includes(ownerAction)||
   !Number.isFinite(ms(generatedAt)))
   throw Error('Original owner HOLD handoff and fresh independent plane evidence required.');
 const bundle={format:'rosie.owner-recovery-acceptance.v858',generated_at:generatedAt,
  source:{source_id:'rosiedazzlers',source_revision:sourceRevision,
   transaction_review_id:transaction.id,transaction_reference:transaction.transaction_reference,
   incident_reference:transaction.incident_reference},
  original_owner_readback:{id:readback.id,review_sha256:readback.review_digest_sha256},
  fresh_plane_rechecks:freshness.rechecks,
  conflict_escalation:{handoff_id:handoff.id,handoff_digest_sha256:handoff.review_digest_sha256,
   open_conflict_count:aging.open_conflict_count,
   aging_status:aging.conflict_aging_status,owner_action:handoff.owner_action},
  owner_recovery_action:ownerAction,
  assessment:{export_purpose:'OWNER_REVIEW_ONLY',verified_external_ack:false,
   automatic_recovery_performed:false,...HOLD_858}};
 const sha256=await hash858('ROSIE-858-OWNER-RECOVERY-EXPORT-V1\n'+JSON.stringify(bundle));
 return {bundle,sha256};
}
