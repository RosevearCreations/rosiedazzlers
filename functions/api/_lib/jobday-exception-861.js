// Rosie Dazzlers 861: independent *claimed* custodian discrepancies and owner HOLD aging.
// A signature verifies a claim's origin, never external transport, ACK, recall or CONNECTED.
import {HOLD_860,hash860} from './jobday-intake-860.js';
export const CONTRACT_861='rosie.ai-data.comms.intake-aging-custodian-discrepancy.v861';
export const HOLD_861={...HOLD_860,external_discrepancy_resolved:false,
 owner_hold_escalation_closed:false,independent_receiver_ack_verified:false,master_connected:false};
export const PLANES_861=['ai-data-platform','rosevear-comms-hub'];
export const CODES_861=['INTAKE_DIGEST_DISPUTED','INTAKE_OBSERVATION_STALENESS_DISPUTED'];
export const ACTIONS_861=['maintain_hold','request_independent_custodian_reconciliation','escalate_original_owner_incident'];
export const FIELDS_861=['version','kind','plane','source_id','contract','source_revision',
 'booking_id','project_id','post_id','transaction_review_id','handoff_858_id',
 'owner_decision_859_id','intake_860_id','intake_860_sha256',
 'owner_exception_860_id','owner_exception_860_sha256','disputed_intake_sha256',
 'discrepancy_code','disposition','issued_at','expires_at','nonce','signer_id'];
const PINS_861={'ai-data-platform':'ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861',
 'rosevear-comms-hub':'ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861'};
const HISTORICAL_861=['ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860',
 'ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860',
 'ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856',
 'ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856'];
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const rev=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$/.test(v);
const ms=v=>typeof v==='string'?Date.parse(v):NaN;
const bytes=(v,n)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
 try{const b=Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4)),x=>x.charCodeAt(0));return b.length===n?b:null;}catch{return null;}
};
export function canonicalDiscrepancy861(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||
  Object.keys(r).length!==FIELDS_861.length||
  Object.keys(r).some(k=>!FIELDS_861.includes(k))||
  FIELDS_861.some(k=>typeof r[k]!== (k==='version'?'number':'string')))
  throw Error('Exact independent v861 custodian discrepancy envelope required.');
 return 'ROSIE-861-INDEPENDENT-CUSTODIAN-DISCREPANCY-HOLD-V1\n'+JSON.stringify(FIELDS_861.map(k=>r[k]));
}
export async function verifyDiscrepancy861(env,receipt,signature,{
 plane,tx,handoff,ownerDecision,intake,ownerException,bookingId,projectId,
 postId,now=Date.now()
}={}){
 const pin=PINS_861[plane],issued=ms(receipt?.issued_at),expires=ms(receipt?.expires_at);
 if(!pin||!rev(env?.CF_PAGES_COMMIT_SHA)||!uuid(tx?.id)||!uuid(handoff?.id)||
  !uuid(ownerDecision?.id)||!uuid(intake?.id)||!sha(intake?.receipt_sha256)||
  !uuid(ownerException?.id)||!sha(ownerException?.review_digest_sha256)||
  intake.kind!=='signed_external_intake_correlation'||intake.plane!==plane||
  intake.transaction_review_id!==tx.id||intake.handoff_858_id!==handoff.id||
  intake.owner_decision_859_id!==ownerDecision.id||
  ownerException.kind!=='owner_continuity_exception_review'||
  ownerException.transaction_review_id!==tx.id||
  receipt?.version!==1||receipt.kind!=='independent_custodian_discrepancy_claim'||
  receipt.plane!==plane||receipt.source_id!=='rosiedazzlers'||
  receipt.contract!==CONTRACT_861||receipt.source_revision!==env.CF_PAGES_COMMIT_SHA||
  receipt.booking_id!==bookingId||receipt.project_id!==projectId||receipt.post_id!==postId||
  receipt.transaction_review_id!==tx.id||receipt.handoff_858_id!==handoff.id||
  receipt.owner_decision_859_id!==ownerDecision.id||
  receipt.intake_860_id!==intake.id||receipt.intake_860_sha256!==intake.receipt_sha256||
  receipt.owner_exception_860_id!==ownerException.id||
  receipt.owner_exception_860_sha256!==ownerException.review_digest_sha256)
  return {ok:false,reason:'Exact original 855→858→859→860 scope and owner HOLD lineage required.'};
 if(!CODES_861.includes(receipt.discrepancy_code)||!sha(receipt.disputed_intake_sha256)||
  (receipt.discrepancy_code==='INTAKE_DIGEST_DISPUTED'&&
   receipt.disputed_intake_sha256===intake.receipt_sha256)||
  receipt.disposition!=='unresolved_claim_owner_hold_only'||
  !nonce(receipt.nonce)||!identifier(receipt.signer_id)||
  !Number.isFinite(now)||![issued,expires].every(Number.isFinite)||
  issued>now+300000||now-issued>300000||expires<=now||
  expires-issued>900000)
  return {ok:false,reason:'Fresh, non-authorizing, specifically disputed custodian claim required.'};
 const own=env?.[pin],other=env?.[PINS_861[plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform']];
 const keyBytes=bytes(own,32),sigBytes=bytes(signature,64);
 if(!keyBytes||!sigBytes||!bytes(other,32)||own===other||
   HISTORICAL_861.some(k=>typeof env?.[k]==='string'&&env[k]===own))
  return {ok:false,reason:'Independent public-only v861 custodian signer required.'};
 try{
  const canonical=canonicalDiscrepancy861(receipt);
  const key=await crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',key,sigBytes,new TextEncoder().encode(canonical)))
   return {ok:false,reason:'External custodian discrepancy signature invalid.'};
  return {ok:true,decision:'SIGNED_DISCREPANCY_CLAIM_HOLD_ONLY',plane,
   receipt_sha256:await hash860(canonical),signer_id:receipt.signer_id,
   discrepancy_code:receipt.discrepancy_code,disputed_intake_sha256:receipt.disputed_intake_sha256,
   issued_at:receipt.issued_at,...HOLD_861};
 }catch{return {ok:false,reason:'Custodian discrepancy signature unsupported or malformed.'};}
}
export function intakeExceptionAging861({intakes=[],exceptions=[],discrepancies=[],
 txId,now=Date.now()}={}){
 if(!uuid(txId)||!Number.isFinite(now)||[intakes,exceptions,discrepancies].some(a=>
  !Array.isArray(a)||a.length>=100||
  a.some(r=>r.transaction_review_id!==txId||!uuid(r.id)||!Number.isFinite(ms(r.recorded_at))||
   ms(r.recorded_at)>now+300000)))
  return {decision:'HOLD',reason:'INCOMPLETE_OR_INVALID_ORIGINAL_INTAKE_HISTORY',...HOLD_861};
 const ordered=[...exceptions].filter(e=>e.kind==='owner_continuity_exception_review')
  .sort((a,b)=>ms(a.recorded_at)-ms(b.recorded_at));
 const first=ordered[0],last=ordered.at(-1);
 const age=first?Math.max(0,Math.floor((now-ms(first.recorded_at))/3600000)):null;
 const currentIntakes=PLANES_861.map(plane=>[...intakes].filter(i=>i.plane===plane&&
  i.kind==='signed_external_intake_correlation').sort((a,b)=>
   ms(b.recorded_at)-ms(a.recorded_at))[0]||null);
 const missing=currentIntakes.some(i=>!i);
 const stale=currentIntakes.some(i=>i&&
  (!Number.isFinite(ms(i.observed_at))||now-ms(i.observed_at)>300000||
   ms(i.observed_at)>now+300000));
 const contradiction=discrepancies.filter(x=>x.kind==='signed_external_custodian_discrepancy');
 const codes=[];
 if(!first)codes.push('MISSING_ORIGINAL_OWNER_EXCEPTION');
 if(missing)codes.push('MISSING_INDEPENDENT_INTAKE');
 else if(stale)codes.push('STALE_INDEPENDENT_INTAKE');
 if(contradiction.length)codes.push('UNRESOLVED_CUSTODIAN_DISCREPANCY');
 if(age!==null&&age>=48)codes.push('OPEN_EXCEPTION_OVER_48H');
 else if(age!==null&&age>=24)codes.push('OPEN_EXCEPTION_OVER_24H');
 const status=age!==null&&age>=48?'CRITICAL_HOLD':
  age!==null&&age>=24?'ESCALATION_DUE_HOLD':
  codes.length?'REVIEW_DUE_HOLD':'OPEN_UNRESOLVED_HOLD';
 return {decision:'ORIGINAL_OWNER_INTAKE_EXCEPTION_AGING_HOLD_ONLY',
  aging_status:status,oldest_exception_age_hours:age,
  first_exception_id:first?.id||null,latest_exception_id:last?.id||null,
  latest_exception_sha256:last?.review_digest_sha256||null,
  independent_intake_status:missing?'MISSING':stale?'STALE':'FRESH_REVIEW_ONLY',
  custodian_discrepancy_count:contradiction.length,issues:codes,
  open_incident:true,...HOLD_861};
}
export async function digest861({kind,tx,handoff,ownerDecision,nonce:reviewNonce,
 checked,intake,ownerException,aging,action,previous}={}){
 if(!uuid(tx?.id)||!uuid(handoff?.id)||!uuid(ownerDecision?.id)||!nonce(reviewNonce))
  throw Error('Exact original scoped incident and unique review nonce required.');
 let basis;
 if(kind==='signed_external_custodian_discrepancy'){
  if(!checked?.ok||!uuid(intake?.id)||!sha(intake?.receipt_sha256)||
   !uuid(ownerException?.id)||!sha(ownerException?.review_digest_sha256))
   throw Error('Valid independently signed original intake dispute required.');
  basis=[intake.id,intake.receipt_sha256,ownerException.id,
   ownerException.review_digest_sha256,checked.plane,checked.receipt_sha256,
   checked.discrepancy_code,checked.disputed_intake_sha256];
 }else if(kind==='owner_hold_escalation_review'){
  if(!ACTIONS_861.includes(action)||
   aging?.decision!=='ORIGINAL_OWNER_INTAKE_EXCEPTION_AGING_HOLD_ONLY'||
   !aging.first_exception_id||!Array.isArray(aging.issues)||
   previous&&(!uuid(previous.id)||!sha(previous.review_digest_sha256)))
   throw Error('Open original owner v860 exception and bounded HOLD action required.');
  basis=[aging.aging_status,aging.oldest_exception_age_hours,aging.issues,
   aging.first_exception_id,aging.latest_exception_id,aging.latest_exception_sha256,
   aging.custodian_discrepancy_count,previous?.id||null,
   previous?.review_digest_sha256||null,action];
 }else throw Error('Unsupported 861 immutable HOLD review.');
 return hash860('ROSIE-861-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
  tx.id,tx.transaction_reference,handoff.id,handoff.review_digest_sha256,
  ownerDecision.id,ownerDecision.review_digest_sha256,basis,reviewNonce]));
}
