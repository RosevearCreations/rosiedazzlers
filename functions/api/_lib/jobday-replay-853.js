// Build 853 — signed replay-ledger review, source-only recall routing and owner incident history.
// This code cannot verify remote durable transport/atomicity and never grants CONNECTED.
import {recallAging852,CONTRACT_852} from './jobday-continuity-852.js';
export const CONTRACT_853='rosie.ai-data.social-recall.replay-review.v853';
export const REPLAY_AUDIT_853='Build 853 independently signed ledger snapshot review:';
export const INCIDENT_AUDIT_853='Build 853 original owner incident decision:';
const FIELDS=['version','kind','source_id','source_contract','source_revision','consumer_id','receiver_id','booking_id','project_id','post_id','platform','case_reference','prior_consumer_sha256','prior_consumer_nonce','prior_source_revision','ledger_entry_digest_sha256','ledger_chain_digest_sha256','ledger_sequence','ledger_claim','decision','permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const LEVELS={CRITICAL:{route:'OWNER_CRITICAL_RECALL_REVIEW',target_hours:4},HIGH:{route:'SUPERVISOR_ESCALATION_REVIEW',target_hours:12},ELEVATED:{route:'OWNER_RECALL_TRIAGE_REVIEW',target_hours:24},MONITOR:{route:'OWNER_SCOPED_FOLLOWUP_REVIEW',target_hours:72},NONE:{route:'OWNER_EVIDENCE_RECONCILIATION',target_hours:null}};
const safeName=(v,min=3,max=120)=>typeof v==='string'&&v.length>=min&&v.length<=max&&/^[A-Za-z0-9_.@-]+$/.test(v);
const sha40=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const digest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const time=v=>typeof v==='string'?Date.parse(v):NaN;
export const incidentReference853=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$/.test(v);
const decode=(v,length)=>{
  if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
  try{
    const value=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);
    const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    return bytes.length===length?bytes:null;
  }catch{return null;}
};
export function canonicalReplay853(receipt){
  if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||Object.keys(receipt).length!==FIELDS.length||Object.keys(receipt).some(k=>!FIELDS.includes(k))||FIELDS.some(k=>receipt[k]===null||receipt[k]===undefined||!['string','number','boolean'].includes(typeof receipt[k])))throw Error('Exact scalar replay-ledger review schema required.');
  return 'ROSIE-853-AIDATA-LEDGER-REVIEW-V1\n'+JSON.stringify(FIELDS.map(k=>receipt[k]));
}
const sha256=async text=>{
  const result=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return [...new Uint8Array(result)].map(b=>b.toString(16).padStart(2,'0')).join('');
};
export async function verifyReplayLedger853(env,r,signature,{bookingId,projectId,post,caseReference,priorConsumerSha,priorConsumerNonce,priorSourceRevision,actor,now=Date.now()}={}){
  if(!sha40(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!=='independent_master_replay_ledger_review'||r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_853||r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.consumer_id!=='ai-data-platform'||!safeName(r.receiver_id,5,120)||r.booking_id!==bookingId||r.project_id!==projectId||r.post_id!==post?.id||r.platform!==post?.platform||r.case_reference!==caseReference||!incidentReference853(caseReference))return {ok:false,reason:'Exact deployed source, consumer contract, receiver and original case required.'};
  if(!digest(priorConsumerSha)||r.prior_consumer_sha256!==priorConsumerSha||!nonce(priorConsumerNonce)||r.prior_consumer_nonce!==priorConsumerNonce||!sha40(priorSourceRevision)||r.prior_source_revision!==priorSourceRevision)return {ok:false,reason:'Prior original Master consumer signature chain must match.'};
  if(!digest(r.ledger_entry_digest_sha256)||!digest(r.ledger_chain_digest_sha256)||!Number.isSafeInteger(r.ledger_sequence)||r.ledger_sequence<1||r.ledger_sequence>1e12||r.ledger_claim!=='signed_snapshot_review_only'||r.decision!=='ledger_evidence_hold'||r.permissions!=='review_only_no_consumer_grant')return {ok:false,reason:'Bounded non-authorizing ledger snapshot digest, sequence and HOLD required.'};
  const issued=time(r.issued_at),observed=time(r.observed_at),expires=time(r.expires_at);
  if(![issued,observed,expires].every(Number.isFinite)||issued>now+300000||observed>now+300000||now-issued>600000||now-observed>600000||observed<issued-300000||observed>expires||expires<=now||expires<=issued||expires-issued>900000)return {ok:false,reason:'Independent ledger review expired, stale or future-dated.'};
  if(!nonce(r.nonce)||r.nonce===priorConsumerNonce||!safeName(r.signer_id,5,120)||r.signer_id.toLowerCase()===String(actor).toLowerCase())return {ok:false,reason:'Distinct independent reviewer and new safe replay nonce required.'};
  const pub=decode(env?.ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853,32),sig=decode(signature,64);
  if(!pub||!sig||env.ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853===env.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851)return {ok:false,reason:'Distinct independent replay-ledger public identity and signed receipt required.'};
  try{
    const payload=canonicalReplay853(r),key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(payload)))return {ok:false,reason:'Signed replay-ledger snapshot failed cryptographic verification.'};
    return {ok:true,canonical_sha256:await sha256(payload),expires_at:r.expires_at,ledger_sequence:r.ledger_sequence,signature_verified:true,durable_remote_read_verified:false,atomic_ledger_uniqueness_verified:false,master_connection:'HOLD'};
  }catch{return {ok:false,reason:'Independent Ed25519 verifier unavailable or malformed signed receipt.'};}
}
// Deterministic, local recommendation only. Never claim delivery to staff, social platform or Master.
export function escalationRouting853(cases=[],{expectedPlatforms=[],revoked=false,now=Date.now()}={}){
  const aging=recallAging852(cases,{expectedPlatforms,revoked,now});
  const routes=aging.platforms.map(p=>{
    const priority=aging.decision==='REVIEW_ONLY'?p.priority:'NONE';
    const policy=LEVELS[priority]||LEVELS.NONE;
    return {platform:p.platform,priority,route:policy.route,review_target_hours:policy.target_hours,open:p.open,critical_72h:p.critical_72h,aged_24h:p.aged_24h,scoped:p.scoped,proposal_only:true,notification_sent:false};
  });
  return {decision:aging.decision==='REVIEW_ONLY'?'ROUTING_REVIEW_ONLY':'HOLD',reasons:aging.reasons,routes,review_only:true,notification_sent:false,provider_mutation_performed:false,consumer_authorized:false,master_connection:'HOLD',external_mirrors_verified:false,source_window_complete:aging.source_window_complete};
}
const ACTIONS=new Set(['acknowledge_critical_review','request_provider_evidence_recheck','request_independent_ledger_recheck','assign_supervisor_followup','maintain_external_hold']);
export function ownerIncidentDecision853({action,platform,route,caseReference,incidentReference,revocationRecorded=false,routing,ledgerReviewRecorded=false}={}){
  const reasons=[],entry=routing?.routes?.find(r=>r.platform===platform);
  if(!incidentReference853(caseReference)||!incidentReference853(incidentReference))reasons.push('SAFE_OWNER_CASE_AND_INCIDENT_REFERENCE_REQUIRED');
  if(!revocationRecorded)reasons.push('ORIGINAL_CONSENT_REVOCATION_AUDIT_MISSING');
  if(routing?.decision!=='ROUTING_REVIEW_ONLY'||!entry)reasons.push('INCOMPLETE_PLATFORM_ROUTING_EVIDENCE');
  if(!ACTIONS.has(action))reasons.push('UNSUPPORTED_OWNER_INCIDENT_ACTION');
  if(entry&&route!==entry.route)reasons.push('ESCALATION_ROUTE_MISMATCH');
  if(action==='request_independent_ledger_recheck'&&!ledgerReviewRecorded)reasons.push('SIGNED_LEDGER_SNAPSHOT_REVIEW_MISSING');
  if(entry?.priority==='CRITICAL'&&!['acknowledge_critical_review','request_provider_evidence_recheck','assign_supervisor_followup','maintain_external_hold'].includes(action))reasons.push('CRITICAL_CASE_ESCALATION_REQUIRED');
  return {decision:reasons.length?'HOLD':'OWNER_REVIEW_RECORDED_ONLY',reasons:[...new Set(reasons)],action:action||null,route:entry?.route||null,priority:entry?.priority||'NONE',notification_sent:false,incident_closed:false,provider_mutation_performed:false,master_events_emitted:0,atomic_ledger_uniqueness_verified:false,master_connection:'HOLD',consumer_authorized:false,external_mirrors_verified:false};
}
