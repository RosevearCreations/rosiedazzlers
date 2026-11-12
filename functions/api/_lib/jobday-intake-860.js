// Rosie Dazzlers 860 — independent *observed* escalation intake correlation,
// custodian return freshness and original-owner continuity exception HOLD review.
// Never equate a signed observation with external transport, operational ACK or CONNECTED.
import {HOLD_859,PLANES_859} from './jobday-return-859.js';
export const CONTRACT_860='rosie.ai-data.comms.external-intake-custody-exception.v860';
export const HOLD_860={...HOLD_859,external_intake_delivery_verified:false,
 custodian_operational_ack_verified:false,external_recovery_action_executed:false,
 owner_exception_closed:false,master_connected:false};
export const ACTIONS_860=['maintain_external_hold','request_new_independent_receipts','escalate_incident_continuity'];
export const EXCEPTIONS_860=['MISSING_INDEPENDENT_INTAKE','STALE_INTAKE_CORRELATION',
 'STALE_OR_MISSING_859_RETURN','MISSING_CONTINUITY_CHECKPOINT',
 'CONTINUITY_GAP_OVER_48H','UNRESOLVED_ORIGINAL_CONFLICT'];
export const FIELDS_860=['version','kind','plane','source_id','contract',
 'source_revision','booking_id','project_id','post_id','case_reference',
 'incident_reference','transaction_reference','transaction_review_id',
 'handoff_858_id','handoff_858_sha256','return_859_id','return_859_sha256',
 'owner_decision_859_id','owner_decision_859_sha256','checkpoint_859_id',
 'checkpoint_859_sha256','custodian_claim','disposition','permissions',
 'nonce','issued_at','observed_at','expires_at','signer_id'];
const PINS_860={'ai-data-platform':'ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860',
 'rosevear-comms-hub':'ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860'};
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const sha256=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const sha40=v=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const identifier=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,95}$/.test(v);
const t=v=>typeof v==='string'?Date.parse(v):NaN;
const b64=(v,n)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
 try{const s=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);
  const bytes=Uint8Array.from(atob(s),x=>x.charCodeAt(0));return bytes.length===n?bytes:null;}
 catch{return null;}
};
export const hash860=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function canonicalIntake860(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||
   Object.keys(r).length!==FIELDS_860.length||Object.keys(r).some(k=>!FIELDS_860.includes(k))||
   FIELDS_860.some(k=>typeof r[k]!== (k==='version'?'number':'string')))
  throw Error('Exact independent v860 source-bound intake receipt required.');
 return 'ROSIE-860-INDEPENDENT-INTAKE-CORRELATION-HOLD-V1\n'+JSON.stringify(FIELDS_860.map(k=>r[k]));
}
export async function verifyIntake860(env,receipt,signature,{
 plane,tx,handoff,returnRow,ownerDecision,checkpoint,bookingId,projectId,
 post,caseReference,incidentReference,now=Date.now()
}={}){
 const pin=PINS_860[plane],issued=t(receipt?.issued_at),
  observed=t(receipt?.observed_at),expires=t(receipt?.expires_at);
 if(!pin||!sha40(env?.CF_PAGES_COMMIT_SHA)||!Number.isFinite(now)||
  !uuid(tx?.id)||!uuid(handoff?.id)||!sha256(handoff?.review_digest_sha256)||
  !uuid(returnRow?.id)||!sha256(returnRow?.receipt_sha256)||
  !uuid(ownerDecision?.id)||!sha256(ownerDecision?.review_digest_sha256)||
  !uuid(checkpoint?.id)||!sha256(checkpoint?.review_digest_sha256)||
  checkpoint.owner_decision_859_id!==ownerDecision.id||
  returnRow.kind!=='signed_escalation_return'||returnRow.plane!==plane||
  returnRow.transaction_review_id!==tx.id||
  returnRow.handoff_858_id!==handoff.id||
  returnRow.owner_export_858_id!==ownerDecision.owner_export_858_id||
  ownerDecision.transaction_review_id!==tx.id||ownerDecision.kind!=='owner_recovery_decision'||
  receipt?.version!==1||receipt.kind!=='independent_external_intake_correlation'||
  receipt.plane!==plane||receipt.source_id!=='rosiedazzlers'||
  receipt.contract!==CONTRACT_860||receipt.source_revision!==env.CF_PAGES_COMMIT_SHA||
  receipt.booking_id!==bookingId||receipt.project_id!==projectId||receipt.post_id!==post?.id||
  receipt.case_reference!==caseReference||receipt.incident_reference!==incidentReference||
  receipt.transaction_reference!==tx.transaction_reference||
  receipt.transaction_review_id!==tx.id||receipt.handoff_858_id!==handoff.id||
  receipt.handoff_858_sha256!==handoff.review_digest_sha256||
  receipt.return_859_id!==returnRow.id||receipt.return_859_sha256!==returnRow.receipt_sha256||
  receipt.owner_decision_859_id!==ownerDecision.id||
  receipt.owner_decision_859_sha256!==ownerDecision.review_digest_sha256||
  receipt.checkpoint_859_id!==checkpoint.id||
  receipt.checkpoint_859_sha256!==checkpoint.review_digest_sha256)
  return {ok:false,reason:'Exact original 855→858→859 transaction, return and checkpoint correlation required.'};
 if(receipt.custodian_claim!=='source_bound_intake_observed'||
  receipt.disposition!=='independent_review_hold_only'||
  receipt.permissions!=='no_transport_or_receiver_proof_no_connection_or_closure'||
  !identifier(receipt.signer_id)||!nonce(receipt.nonce)||
  ![issued,observed,expires].every(Number.isFinite)||issued>now+300000||
  observed>now+300000||now-issued>300000||now-observed>300000||
  observed<issued-300000||expires<=now||observed>expires||expires-issued>900000||
  issued<t(checkpoint.recorded_at)-300000)
  return {ok:false,reason:'Non-authorizing newly observed intake with bounded time and identity required.'};
 const own=env?.[pin],other=env?.[PINS_860[plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform']];
 const historical=['ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859',
 'ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856',
 'ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856'];
 const keyBytes=b64(own,32),sigBytes=b64(signature,64);
 if(!keyBytes||!sigBytes||!b64(other,32)||own===other||
   historical.some(k=>typeof env?.[k]==='string'&&env[k]===own))
  return {ok:false,reason:'Independent current custodian Ed25519 public signer enrollment required.'};
 try{
  const canonical=canonicalIntake860(receipt);
  const key=await crypto.subtle.importKey('raw',keyBytes,{name:'Ed25519'},false,['verify']);
  if(!await crypto.subtle.verify('Ed25519',key,sigBytes,new TextEncoder().encode(canonical)))
   return {ok:false,reason:'Signed independent intake correlation failed cryptographic verification.'};
  return {ok:true,decision:'SIGNED_EXTERNAL_INTAKE_CORRELATION_REVIEW_ONLY',
   plane,receipt_sha256:await hash860(canonical),signer_id:receipt.signer_id,
   observed_at:receipt.observed_at,source_revision:receipt.source_revision,
   transport_delivery_verified:false,...HOLD_860};
 }catch{return {ok:false,reason:'Invalid or unsupported Ed25519 intake evidence.'};}
}
export function freshCustodian860({returns=[],intakes=[],tx,handoff,ownerDecision,
 revision,now=Date.now()}={}){
 if(!uuid(tx?.id)||!uuid(handoff?.id)||!uuid(ownerDecision?.id)||
  !sha40(revision)||!Number.isFinite(now)||!Array.isArray(returns)||returns.length>100||
  !Array.isArray(intakes)||intakes.length>100)
  return {decision:'HOLD',reason:'EXACT_BOUNDED_ORIGINAL_CUSTODY_REQUIRED',...HOLD_860};
 const ret=PLANES_859.map(p=>returns.filter(r=>
  r.kind==='signed_escalation_return'&&r.transaction_review_id===tx.id&&
  r.handoff_858_id===handoff.id&&r.plane===p&&
  uuid(r.id)&&sha256(r.receipt_sha256)&&Number.isFinite(t(r.recorded_at))));
 const history=ret.map(rows=>rows.length===1?rows[0]:null);
 const missingRet=history.some(x=>!x);
 const staleRet=!missingRet&&history.some(x=>now-t(x.recorded_at)>86400000||
  t(x.recorded_at)>now+300000);
 const matched=history.map(r=>r?intakes.filter(i=>i.kind==='signed_external_intake_correlation'&&
  i.transaction_review_id===tx.id&&i.handoff_858_id===handoff.id&&
  i.owner_decision_859_id===ownerDecision.id&&i.return_859_id===r.id&&
  i.plane===r.plane&&i.source_revision===revision&&uuid(i.id)&&sha256(i.receipt_sha256)&&
  Number.isFinite(t(i.observed_at))&&Number.isFinite(t(i.recorded_at))):[]);
 const two=matched.map(rows=>rows.length?rows.sort((a,b)=>t(b.recorded_at)-t(a.recorded_at))[0]:null);
 const missing=two.some(x=>!x);
 const stale=!missing&&two.some(x=>now-t(x.observed_at)>300000||
  now-t(x.recorded_at)>300000||t(x.observed_at)>now+300000);
 const unique=!missing&&new Set(two.map(x=>x.receipt_sha256)).size===2&&
  new Set(two.map(x=>x.signer_id.toLowerCase())).size===2;
 let reason=null;
 if(missingRet)reason='STALE_OR_MISSING_859_RETURN';
 else if(staleRet)reason='STALE_OR_MISSING_859_RETURN';
 else if(missing||!unique)reason='MISSING_INDEPENDENT_INTAKE';
 else if(stale)reason='STALE_INTAKE_CORRELATION';
 return {decision:reason?'HOLD':'TWO_FRESH_INDEPENDENT_INTAKE_REVIEWS_HOLD_ONLY',
  reason,return_status:missingRet?'MISSING':staleRet?'STALE':'CURRENT',
  intake_status:missing?'MISSING':stale?'STALE':unique?'FRESH':'SIGNER_CONFLICT',
  intake_records:two.filter(Boolean).map(r=>({id:r.id,plane:r.plane,receipt_sha256:r.receipt_sha256,
   recorded_at:r.recorded_at,observed_at:r.observed_at})),
  returned_custodians:history.filter(Boolean).map(r=>({id:r.id,plane:r.plane,
   receipt_sha256:r.receipt_sha256,recorded_at:r.recorded_at})),...HOLD_860};
}
export function exceptionAssessment860({custody,latestCheckpoint,aging,now=Date.now()}={}){
 const issues=[];
 if(custody?.return_status!=='CURRENT')issues.push('STALE_OR_MISSING_859_RETURN');
 if(custody?.intake_status==='MISSING'||custody?.intake_status==='SIGNER_CONFLICT')
  issues.push('MISSING_INDEPENDENT_INTAKE');
 else if(custody?.intake_status!=='FRESH')issues.push('STALE_INTAKE_CORRELATION');
 if(!uuid(latestCheckpoint?.id)||!sha256(latestCheckpoint?.review_digest_sha256)||
    !Number.isFinite(t(latestCheckpoint?.recorded_at)))
  issues.push('MISSING_CONTINUITY_CHECKPOINT');
 else if(Number.isFinite(now)&&now-t(latestCheckpoint.recorded_at)>48*3600000)
  issues.push('CONTINUITY_GAP_OVER_48H');
 if(aging?.decision!=='AGING_REVIEW_ONLY'||!(aging.open_conflict_count>0))
  return {decision:'HOLD',reason:'OPEN_EXACT_ORIGINAL_CONFLICT_REQUIRED',...HOLD_860};
 issues.push('UNRESOLVED_ORIGINAL_CONFLICT');
 return {decision:'ORIGINAL_OWNER_EXCEPTION_REVIEW_HOLD_ONLY',
  issues:EXCEPTIONS_860.filter(x=>issues.includes(x)),
  checkpoint_id:latestCheckpoint?.id||null,
  checkpoint_sha256:latestCheckpoint?.review_digest_sha256||null,
  conflict_aging_status:aging.conflict_aging_status,
  open_conflict_count:aging.open_conflict_count, ...HOLD_860};
}
export async function digest860({kind,tx,handoff,ownerDecision,returnRow,checked,
 assessment,latestCheckpoint,previousException,action,nonce:reviewNonce}={}){
 if(!uuid(tx?.id)||!uuid(handoff?.id)||!uuid(ownerDecision?.id)||!nonce(reviewNonce))
  throw Error('Original scoped transaction, prior owner decision and new nonce required.');
 let body;
 if(kind==='signed_external_intake_correlation'){
  if(!uuid(returnRow?.id)||!sha256(returnRow?.receipt_sha256)||
    !sha256(checked?.receipt_sha256)||!PLANES_859.includes(checked?.plane)||
    !uuid(latestCheckpoint?.id))throw Error('Verified exact custodian return required.');
  body=[returnRow.id,returnRow.receipt_sha256,checked.plane,checked.receipt_sha256,
   checked.source_revision,latestCheckpoint.id,latestCheckpoint.review_digest_sha256];
 }else if(kind==='owner_continuity_exception_review'){
  if(assessment?.decision!=='ORIGINAL_OWNER_EXCEPTION_REVIEW_HOLD_ONLY'||
   !ACTIONS_860.includes(action)||!Array.isArray(assessment.issues)||
   assessment.issues.length===0||assessment.issues.some(x=>!EXCEPTIONS_860.includes(x))||
   previousException&&(!uuid(previousException.id)||!sha256(previousException.review_digest_sha256)))
   throw Error('Explicit unresolved original-owner exception HOLD required.');
  body=[assessment.issues,assessment.open_conflict_count,assessment.conflict_aging_status,
   latestCheckpoint?.id||null,latestCheckpoint?.review_digest_sha256||null,
   previousException?.id||null,previousException?.review_digest_sha256||null,action];
 }else throw Error('Unsupported original owner custody action.');
 return hash860('ROSIE-860-'+kind.toUpperCase()+'-V1\n'+JSON.stringify([
 tx.id,tx.transaction_reference,handoff.id,handoff.review_digest_sha256,
 ownerDecision.id,ownerDecision.review_digest_sha256,body,reviewNonce]));
}
