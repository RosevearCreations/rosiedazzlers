// Build 862: independently signed discrepancy *review* witnesses and immutable HOLD custody.
// A verified signature authenticates a witness claim, never a Master ACK or conflict closure.
import {hash860} from './jobday-intake-860.js';
import {HOLD_861,PLANES_861} from './jobday-exception-861.js';
export const CONTRACT_862='rosie.ai-data.comms.resolution-witness-sla-hold-custody.v862';
export const HOLD_862={...HOLD_861,discrepancy_operationally_resolved:false,
 owner_incident_closed:false,external_receiver_delivery_verified:false,
 master_connected:false};
export const ACTIONS_862=['maintain_hold','request_fresh_independent_witness',
 'escalate_to_external_custodians'];
export const FIELDS_862=['version','kind','plane','source_id','contract',
 'source_revision','booking_id','project_id','post_id','transaction_review_id',
 'handoff_858_id','owner_decision_859_id','owner_exception_860_id',
 'owner_exception_860_sha256','owner_escalation_861_id',
 'owner_escalation_861_sha256','discrepancy_861_id','discrepancy_861_sha256',
 'discrepancy_code','review_claim','disposition','nonce','issued_at','expires_at','signer_id'];
const PINS={'ai-data-platform':'ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862',
 'rosevear-comms-hub':'ROSIE_COMMS_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862'};
const OLD_PINS=['ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861',
 'ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861',
 'ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860',
 'ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860',
 'ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856',
 'ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856'];
const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const revision=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(s);
const signer=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$/.test(s);
const stamp=s=>typeof s==='string'?Date.parse(s):NaN;
const decoded=(s,n)=>{
 if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))return null;
 try{const a=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+
  '='.repeat((4-s.length%4)%4)),x=>x.charCodeAt(0));return a.length===n?a:null;}
 catch{return null;}
};
export function canonicalWitness862(receipt){
 if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||
  Object.keys(receipt).length!==FIELDS_862.length||
  Object.keys(receipt).some(k=>!FIELDS_862.includes(k))||
  FIELDS_862.some(k=>typeof receipt[k]!== (k==='version'?'number':'string')))
  throw Error('Exact source-bound v862 signed witness required.');
 return 'ROSIE-862-INDEPENDENT-RESOLUTION-REVIEW-HOLD-V1\n'+
  JSON.stringify(FIELDS_862.map(k=>receipt[k]));
}
export async function verifyWitness862(env,receipt,signature,{
 plane,tx,handoff,ownerDecision,ownerException,ownerEscalation,discrepancy,
 bookingId,projectId,postId,now=Date.now()
}={}){
 const keyName=PINS[plane],issued=stamp(receipt?.issued_at),
  expires=stamp(receipt?.expires_at);
 if(!keyName||!revision(env?.CF_PAGES_COMMIT_SHA)||
  ![tx,handoff,ownerDecision,ownerException,ownerEscalation,discrepancy].every(x=>uuid(x?.id))||
  ![ownerException.review_digest_sha256,ownerEscalation.review_digest_sha256,
   discrepancy.review_digest_sha256].every(sha)||
  ownerException.kind!=='owner_continuity_exception_review'||
  ownerEscalation.kind!=='owner_hold_escalation_review'||
  discrepancy.kind!=='signed_external_custodian_discrepancy'||
  discrepancy.plane!==plane||
  [ownerException,ownerEscalation,discrepancy].some(x=>x.transaction_review_id!==tx.id)||
  receipt?.version!==1||receipt.kind!=='independent_resolution_review_witness'||
  receipt.plane!==plane||receipt.source_id!=='rosiedazzlers'||
  receipt.contract!==CONTRACT_862||receipt.source_revision!==env.CF_PAGES_COMMIT_SHA||
  receipt.booking_id!==bookingId||receipt.project_id!==projectId||receipt.post_id!==postId||
  receipt.transaction_review_id!==tx.id||receipt.handoff_858_id!==handoff.id||
  receipt.owner_decision_859_id!==ownerDecision.id||
  receipt.owner_exception_860_id!==ownerException.id||
  receipt.owner_exception_860_sha256!==ownerException.review_digest_sha256||
  receipt.owner_escalation_861_id!==ownerEscalation.id||
  receipt.owner_escalation_861_sha256!==ownerEscalation.review_digest_sha256||
  receipt.discrepancy_861_id!==discrepancy.id||
  receipt.discrepancy_861_sha256!==discrepancy.review_digest_sha256||
  receipt.discrepancy_code!==discrepancy.discrepancy_code)
  return {ok:false,reason:'Exact original 855→861 discrepancy and owner HOLD lineage required.'};
 if(receipt.review_claim!=='discrepancy_evidence_reviewed_no_operational_resolution'||
  receipt.disposition!=='independent_non_authorizing_review_hold_only'||
  !nonce(receipt.nonce)||!signer(receipt.signer_id)||
  !Number.isFinite(now)||![issued,expires].every(Number.isFinite)||
  issued>now+300000||now-issued>300000||expires<=now||
  expires-issued>900000)
  return {ok:false,reason:'Fresh non-authorizing signed review witness required.'};
 const own=env?.[keyName],
  other=env?.[PINS[plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform']];
 if(!decoded(own,32)||!decoded(other,32)||!decoded(signature,64)||
  own===other||OLD_PINS.some(k=>env?.[k]===own&&typeof own==='string'))
  return {ok:false,reason:'Independent v862 custodian public signer enrollment required.'};
 try{
  const canonical=canonicalWitness862(receipt);
  const pub=await crypto.subtle.importKey('raw',decoded(own,32),{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',pub,decoded(signature,64),
    new TextEncoder().encode(canonical)))
   return {ok:false,reason:'Independent witness signature invalid.'};
  return {ok:true,decision:'SIGNED_DISCREPANCY_REVIEW_WITNESS_HOLD_ONLY',
   plane,receipt_sha256:await hash860(canonical),signer_id:receipt.signer_id,
   discrepancy_id:discrepancy.id,issued_at:receipt.issued_at,...HOLD_862};
 }catch{return {ok:false,reason:'Malformed or unsupported independent witness.'};}
}
export function slaRecheck862({aging,latestEscalation,witnesses=[],now=Date.now()}={}){
 if(aging?.decision!=='ORIGINAL_OWNER_INTAKE_EXCEPTION_AGING_HOLD_ONLY'||
  !uuid(aging.first_exception_id)||!Number.isInteger(aging.oldest_exception_age_hours)||
  aging.oldest_exception_age_hours<0||!uuid(latestEscalation?.id)||
  !sha(latestEscalation.review_digest_sha256)||
  !Number.isFinite(stamp(latestEscalation.recorded_at))||
  !Number.isFinite(now)||!Array.isArray(witnesses)||witnesses.length>=100)
  return {decision:'HOLD',reason:'INCOMPLETE_EXACT_OWNER_ESCALATION_SLA_SOURCE',...HOLD_862};
 const escalationAgeHours=Math.max(0,Math.floor(
  (now-stamp(latestEscalation.recorded_at))/3600000));
 const initialAge=aging.oldest_exception_age_hours;
 const slaStatus=initialAge>=48?'CRITICAL_HOLD':
  initialAge>=24?'ESCALATION_DUE_HOLD': 'OPEN_HOLD';
 const due=escalationAgeHours>=24||initialAge>=24;
 const checks=['INCIDENT_UNRESOLVED','INDEPENDENT_WITNESS_REVIEW_NOT_CLOSURE'];
 if(initialAge>=48)checks.push('OWNER_EXCEPTION_OVER_48H');
 else if(initialAge>=24)checks.push('OWNER_EXCEPTION_OVER_24H');
 if(escalationAgeHours>=24)checks.push('OWNER_ESCALATION_RECHECK_OVER_24H');
 if(witnesses.length===0)checks.push('NO_SIGNED_RESOLUTION_REVIEW_WITNESS');
 return {decision:'ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY',
  sla_status:slaStatus,escalation_recheck_due:due,
  original_exception_age_hours:initialAge,owner_escalation_age_hours:escalationAgeHours,
  owner_escalation_id:latestEscalation.id,
  owner_escalation_sha256:latestEscalation.review_digest_sha256,
  signed_witness_count:witnesses.length,checks,...HOLD_862};
}
export async function digest862({kind,tx,handoff,ownerDecision,ownerException,
 ownerEscalation,nonce:reviewNonce,checked,discrepancy,sla,ownerAction,previous,
 snapshotSha}={}){
 if(![tx,handoff,ownerDecision,ownerException,ownerEscalation].every(x=>uuid(x?.id))||
  !nonce(reviewNonce))throw Error('Exact original incident and unique nonce required.');
 if(previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
  throw Error('Previous 862 owner evidence chain incomplete.');
 let payload;
 if(kind==='signed_resolution_review_witness'){
  if(!checked?.ok||!uuid(discrepancy?.id)||!sha(checked.receipt_sha256))
   throw Error('Independent signed discrepancy review required.');
  payload=[discrepancy.id,discrepancy.review_digest_sha256,
   checked.plane,checked.receipt_sha256,checked.signer_id];
 }else if(kind==='owner_aging_sla_recheck'){
  if(sla?.decision!=='ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY'||
   !ACTIONS_862.includes(ownerAction))throw Error('Non-authorizing owner SLA action required.');
  payload=[sla.sla_status,sla.original_exception_age_hours,
   sla.owner_escalation_age_hours,sla.checks,ownerAction,
   previous?.id||null,previous?.review_digest_sha256||null];
 }else if(kind==='master_hold_custody_export'){
  if(!sha(snapshotSha)||!uuid(previous?.id)||
   previous.kind!=='owner_aging_sla_recheck')
   throw Error('Latest immutable SLA recheck and complete custody hash required.');
  payload=[snapshotSha,previous.id,previous.review_digest_sha256];
 }else throw Error('Unsupported original owner HOLD custody kind.');
 return hash860('ROSIE-862-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
  tx.id,tx.transaction_reference,handoff.id,handoff.review_digest_sha256,
  ownerDecision.id,ownerException.id,ownerException.review_digest_sha256,
  ownerEscalation.id,ownerEscalation.review_digest_sha256,payload,reviewNonce]));
}
