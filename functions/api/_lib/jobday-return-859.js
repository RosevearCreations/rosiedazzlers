// Rosie Dazzlers 859 — independent signed escalation return observations,
// original owner non-authorizing recovery decision, long-lived incident continuity.
// A signed return is a HOLD acknowledgement of review, not external operational ACK.
import {HOLD_858} from './jobday-recovery-858.js';
export const CONTRACT_859='rosie.ai-data.comms.escalation-return-owner-continuity.v859';
export const KIND_859='independent_escalation_receipt_return';
export const PLANES_859=['ai-data-platform','rosevear-comms-hub'];
export const ACTIONS_859=['maintain_external_hold','request_independent_master_recheck','escalate_unresolved_conflicts'];
export const HOLD_859={...HOLD_858,external_escalation_delivered:false,
 independent_runtime_receiver_ack:false,incident_closed:false,operator_activation_authorized:false};
const FIELDS_859=['version','kind','plane','source_id','source_contract',
 'handoff_source_revision','review_source_revision','booking_id','project_id','post_id',
 'case_reference','incident_reference','transaction_reference','transaction_review_id',
 'handoff_id','handoff_digest_sha256','prior_857_readback_id',
 'receiver_claim','disposition','permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const PINS_859={'ai-data-platform':'ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'rosevear-comms-hub':'ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859'};
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const sha40=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const sha256=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const ref=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$/.test(v);
const txref=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const stamp=v=>typeof v==='string'?Date.parse(v):NaN;
const decode=(v,n)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
 try {const b=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);
   const bytes=Uint8Array.from(atob(b),x=>x.charCodeAt(0));return bytes.length===n?bytes:null;}
 catch{return null;}
};
export const hash859=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function canonicalReturn859(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||
  Object.keys(r).length!==FIELDS_859.length||
  FIELDS_859.some(k=>typeof r[k]!=='string'&&typeof r[k]!=='number')||
  Object.keys(r).some(k=>!FIELDS_859.includes(k)))
  throw Error('Exact v859 independent return evidence schema required.');
 return 'ROSIE-859-INDEPENDENT-ESCALATION-RETURN-HOLD-V1\n'+JSON.stringify(FIELDS_859.map(k=>r[k]));
}
export async function verifyReturn859(env,receipt,signature,{
 plane,transaction,handoff,bookingId,projectId,post,caseReference,incidentReference,readback,actor,now=Date.now()
}={}){
 const pin=PINS_859[plane],issued=stamp(receipt?.issued_at),observed=stamp(receipt?.observed_at),
  expires=stamp(receipt?.expires_at),handoffTime=stamp(handoff?.recorded_at);
 if(!pin||!Number.isFinite(now)||!sha40(env?.CF_PAGES_COMMIT_SHA)||
  !uuid(transaction?.id)||!uuid(handoff?.id)||!uuid(readback?.id)||
  !sha256(handoff?.review_digest_sha256)||!sha40(handoff?.source_revision)||
  handoff.kind!=='conflict_escalation_handoff'||
  handoff.transaction_review_id!==transaction.id||handoff.prior_857_readback_id!==readback.id||
  !ref(caseReference)||!ref(incidentReference)||!txref(transaction?.transaction_reference)||
  receipt?.version!==1||receipt?.kind!==KIND_859||receipt.plane!==plane||
  receipt.source_id!=='rosiedazzlers'||receipt.source_contract!==CONTRACT_859||
  receipt.handoff_source_revision!==handoff.source_revision||
  receipt.review_source_revision!==env.CF_PAGES_COMMIT_SHA||
  receipt.booking_id!==bookingId||receipt.project_id!==projectId||receipt.post_id!==post?.id||
  receipt.case_reference!==caseReference||receipt.incident_reference!==incidentReference||
  receipt.transaction_reference!==transaction.transaction_reference||
  receipt.transaction_review_id!==transaction.id||receipt.handoff_id!==handoff.id||
  receipt.handoff_digest_sha256!==handoff.review_digest_sha256||
  receipt.prior_857_readback_id!==readback.id)
  return {ok:false,reason:'Exact original 855/857/858 handoff custody and current review deployment required.'};
 if(receipt.receiver_claim!=='independent_escalation_intake_observed'||
  receipt.disposition!=='escalation_review_ack_hold_only'||
  receipt.permissions!=='review_only_no_recovery_or_connection'||
  !nonce(receipt.nonce)||!ref(receipt.signer_id)||String(actor).toLowerCase()===receipt.signer_id.toLowerCase())
  return {ok:false,reason:'Independent non-authorizing escalation return and new signer nonce required.'};
 if(![issued,observed,expires,handoffTime].every(Number.isFinite)||
   issued<handoffTime-300000||issued>now+300000||observed>now+300000||
   now-issued>300000||now-observed>300000||observed<issued-300000||
   observed>expires||expires<=now||expires-issued>900000)
  return {ok:false,reason:'Returned receipt is stale, expired, future-dated or predates handoff.'};
 const own=env?.[pin],other=env?.[PINS_859[plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform']];
 const historic=['ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856',
  'ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856'];
 const pub=decode(own,32),sig=decode(signature,64);
 if(!pub||!sig||!decode(other,32)||own===other||
    historic.some(k=>env?.[k]===own))
  return {ok:false,reason:'Distinct independently enrolled public-only return signer identities required.'};
 try {
  const canonical=canonicalReturn859(receipt);
  const key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(canonical)))
   return {ok:false,reason:'Independent escalation return signature failed verification.'};
  return {ok:true,decision:'INDEPENDENT_SIGNED_ESCALATION_RETURN_HOLD_ONLY',
   plane,receipt_sha256:await hash859(canonical),source_revision:receipt.review_source_revision,
   observed_at:receipt.observed_at,signer_id:receipt.signer_id,
   independent_signature_verified:true,external_receiver_transport_verified:false,...HOLD_859};
 } catch{return {ok:false,reason:'Malformed independent signed return; verification unavailable.'};}
}
export function returnedPlanes859({records=[],transaction,handoff,reviewRevision}={}){
 if(!uuid(transaction?.id)||!uuid(handoff?.id)||!sha40(reviewRevision)||
   !Array.isArray(records)||records.length>150)
  return {decision:'HOLD',reason:'BOUND_OR_ORIGINAL_SOURCE_MISSING',...HOLD_859};
 const scoped=records.filter(r=>r.kind==='signed_escalation_return'&&
  r.transaction_review_id===transaction.id&&r.handoff_858_id===handoff.id&&
  r.review_source_revision===reviewRevision&&uuid(r.id)&&sha256(r.receipt_sha256)&&
  PLANES_859.includes(r.plane)&&ref(r.signer_id)&&Number.isFinite(stamp(r.recorded_at)));
 const two=PLANES_859.map(p=>scoped.filter(r=>r.plane===p)).filter(a=>a.length===1).map(a=>a[0]);
 if(two.length!==2||new Set(two.map(x=>x.receipt_sha256)).size!==2||
    new Set(two.map(x=>x.signer_id.toLowerCase())).size!==2)
  return {decision:'HOLD',reason:'TWO_DISTINCT_SIGNED_ESCALATION_RETURNS_MISSING',...HOLD_859};
 return {decision:'TWO_INDEPENDENT_RETURN_OBSERVATIONS_HOLD_ONLY',
  returns:two.map(x=>({id:x.id,plane:x.plane,receipt_sha256:x.receipt_sha256,
   signer_id:x.signer_id,recorded_at:x.recorded_at})),...HOLD_859};
}
export function ownerDecision859({transaction,readback,handoff,ownerExport,returns,aging,ownerAction}={}){
 const reasons=[];
 if(!uuid(transaction?.id)||!uuid(readback?.id)||!uuid(handoff?.id)||!uuid(ownerExport?.id)||
  ownerExport.kind!=='owner_recovery_acceptance_export'||
  ownerExport.transaction_review_id!==transaction?.id||
  handoff.transaction_review_id!==transaction?.id||
  ownerExport.prior_857_readback_id!==readback?.id)
  reasons.push('EXACT_ORIGINAL_855_857_858_EVIDENCE_REQUIRED');
 if(returns?.decision!=='TWO_INDEPENDENT_RETURN_OBSERVATIONS_HOLD_ONLY')
  reasons.push('BOTH_INDEPENDENT_ESCALATION_RETURNS_REQUIRED');
 if(aging?.decision!=='AGING_REVIEW_ONLY'||!(aging.open_conflict_count>0))
  reasons.push('ORIGINAL_UNRESOLVED_CONFLICT_REQUIRED');
 if(!ACTIONS_859.includes(ownerAction))reasons.push('HOLD_ONLY_OWNER_ACTION_REQUIRED');
 return {decision:reasons.length?'HOLD':'ORIGINAL_OWNER_RECOVERY_DECISION_HOLD_ONLY',
  reasons,open_conflict_count:aging?.open_conflict_count??null,owner_action:ownerAction,
  independent_return_review_recorded:reasons.length===0,
  verified_incident_recovery:false,...HOLD_859};
}
export function continuity859({decision,previous=null,aging,now=Date.now()}={}){
 if(!uuid(decision?.id)||!sha256(decision?.review_digest_sha256)||
  aging?.decision!=='AGING_REVIEW_ONLY'||!Number.isFinite(now)||
  (previous&&(!uuid(previous.id)||!sha256(previous.review_digest_sha256)||
    previous.kind!=='incident_continuity_checkpoint'||!Number.isFinite(stamp(previous.recorded_at))||
    stamp(previous.recorded_at)>now)))
  return {decision:'HOLD',reason:'IMMUTABLE_OWNER_DECISION_OR_CONTINUITY_CHAIN_REQUIRED',...HOLD_859};
 const gapHours=previous?Math.max(0,(now-stamp(previous.recorded_at))/3600000):null;
 return {decision:'LONG_LIVED_INCIDENT_HOLD_CHECKPOINT',
  continuity_status:previous?(gapHours>48?'GAP_REVIEW_REQUIRED':'CURRENT_HOLD'):'INITIAL_OWNER_HOLD_CHECKPOINT',
  previous_checkpoint_id:previous?.id||null,
  previous_checkpoint_sha256:previous?.review_digest_sha256||null,
  checkpoint_gap_hours:gapHours===null?null:Math.round(gapHours*10)/10,
  source_open_conflict_count:aging.open_conflict_count,
  conflict_aging_status:aging.conflict_aging_status,...HOLD_859};
}
export async function digest859({kind,transaction,handoff,returns,decision,
 aging,action,nonce:reviewNonce,previous=null,status=null}={}){
 if(!['signed_escalation_return','owner_recovery_decision','incident_continuity_checkpoint'].includes(kind)||
 !uuid(transaction?.id)||!uuid(handoff?.id)||!nonce(reviewNonce)||
 aging?.decision!=='AGING_REVIEW_ONLY')
 throw Error('Original transaction, handoff, bound aging and unique review nonce required.');
 let tail;
 if(kind==='signed_escalation_return') {
  if(!PLANES_859.includes(returns?.plane)||!sha256(returns.receipt_sha256))
   throw Error('Signed independent return digest required.');
  tail=[returns.plane,returns.receipt_sha256];
 } else if(kind==='owner_recovery_decision') {
  if(returns?.decision!=='TWO_INDEPENDENT_RETURN_OBSERVATIONS_HOLD_ONLY'||
   !ACTIONS_859.includes(action))throw Error('Two returned planes and explicit owner HOLD required.');
  tail=[returns.returns.map(r=>[r.plane,r.id,r.receipt_sha256]).sort((a,b)=>a[0].localeCompare(b[0])),action];
 } else {
  if(!uuid(decision?.id)||!sha256(decision.review_digest_sha256)||
   !['INITIAL_OWNER_HOLD_CHECKPOINT','CURRENT_HOLD','GAP_REVIEW_REQUIRED'].includes(status))
    throw Error('Prior owner acceptance and protected continuity status required.');
  tail=[decision.id,decision.review_digest_sha256,previous?.id||null,
   previous?.review_digest_sha256||null,status];
 }
 return hash859('ROSIE-859-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
  transaction.id,transaction.transaction_reference,handoff.id,handoff.review_digest_sha256,
  aging.conflict_aging_status,aging.open_conflict_count,tail,reviewNonce]));
}
export async function continuityExport859({transaction,handoff,returns,ownerDecision,checkpoints=[],aging,
 now=new Date().toISOString()}={}){
 if(!uuid(transaction?.id)||!uuid(handoff?.id)||!uuid(ownerDecision?.id)||
 returns?.decision!=='TWO_INDEPENDENT_RETURN_OBSERVATIONS_HOLD_ONLY'||
 aging?.decision!=='AGING_REVIEW_ONLY'||!Number.isFinite(stamp(now))||
 !Array.isArray(checkpoints)||checkpoints.length>100||
 checkpoints.some(c=>c.kind!=='incident_continuity_checkpoint'||!uuid(c.id)||
  !sha256(c.review_digest_sha256)||c.transaction_review_id!==transaction.id))
 throw Error('Complete bounded original owner HOLD continuity required.');
 const chain=checkpoints.map(c=>({id:c.id,recorded_at:c.recorded_at,
  review_digest_sha256:c.review_digest_sha256,previous_checkpoint_id:c.previous_checkpoint_id,
  continuity_status:c.continuity_status})).sort((a,b)=>a.recorded_at.localeCompare(b.recorded_at));
 const bundle={format:'rosie.owner-incident-continuity.v859',generated_at:now,
  original_transaction_id:transaction.id,transaction_reference:transaction.transaction_reference,
  incident_reference:transaction.incident_reference,
  escalation_handoff:{id:handoff.id,sha256:handoff.review_digest_sha256},
  independent_signed_return_digests:returns.returns,
  owner_recovery_decision:{id:ownerDecision.id,sha256:ownerDecision.review_digest_sha256,
   owner_action:ownerDecision.owner_action},
  original_conflict_aging:{status:aging.conflict_aging_status,count:aging.open_conflict_count},
  continuity_chain:chain,assessment:{export_only:true,...HOLD_859}};
 return {bundle,sha256:await hash859('ROSIE-859-OWNER-CONTINUITY-EXPORT-V1\n'+JSON.stringify(bundle))};
}
