// Rosie Build 854: source-scoped atomic ledger pilot, SLA evidence and independent
// Master incident-response reconciliation. None of these authorizes CONNECTED.
import {CONTRACT_853} from './jobday-replay-853.js';
export const CONTRACT_854='rosie.ai-data.social-incident-response.review.v854';
export const MASTER_RESPONSE_KIND_854='independent_master_incident_hold_response';
const FIELDS=['version','kind','source_id','source_contract','source_revision','consumer_id','receiver_id',
  'booking_id','project_id','post_id','platform','case_reference','incident_reference',
  'prior_ledger_sha256','prior_ledger_sequence','prior_owner_incident_audit_id','disposition',
  'permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const PRIORITIES={CRITICAL:{route:'OWNER_CRITICAL_RECALL_REVIEW',hours:4},
  HIGH:{route:'SUPERVISOR_ESCALATION_REVIEW',hours:12},
  ELEVATED:{route:'OWNER_RECALL_TRIAGE_REVIEW',hours:24},
  MONITOR:{route:'OWNER_SCOPED_FOLLOWUP_REVIEW',hours:72}};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$/.test(v);
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const digest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const sha=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const name=v=>typeof v==='string'&&/^[A-Za-z0-9_.@-]{5,120}$/.test(v);
const time=v=>typeof v==='string'?Date.parse(v):NaN;
const decode=(value,n)=>{
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))return null;
  try {const bytes=Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),x=>x.charCodeAt(0));return bytes.length===n?bytes:null;}
  catch{return null;}
};
const hash=async s=>{
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
};
export function canonicalMaster854(r){
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==FIELDS.length
     ||FIELDS.some(k=>r[k]===undefined||r[k]===null||!['string','boolean','number'].includes(typeof r[k]))
     ||Object.keys(r).some(k=>!FIELDS.includes(k)))throw Error('Exact scalar Master incident response schema required.');
  return 'ROSIE-854-INDEPENDENT-MASTER-INCIDENT-HOLD-V1\n'+JSON.stringify(FIELDS.map(k=>r[k]));
}
export async function verifyMaster854(env,r,signature,{bookingId,projectId,post,caseReference,incidentReference,
  ledgerDigest,ledgerSequence,ownerAuditId,actor,now=Date.now()}={}){
  if(!sha(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!==MASTER_RESPONSE_KIND_854||
     r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_854||
     r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.consumer_id!=='ai-data-platform'||
     !name(r.receiver_id)||r.booking_id!==bookingId||r.project_id!==projectId||
     r.post_id!==post?.id||r.platform!==post?.platform||r.case_reference!==caseReference||
     !id(caseReference)||r.incident_reference!==incidentReference||!id(incidentReference))
    return {ok:false,reason:'Original active source, independent consumer and incident binding required.'};
  if(!digest(ledgerDigest)||r.prior_ledger_sha256!==ledgerDigest||
     !Number.isSafeInteger(ledgerSequence)||ledgerSequence<1||r.prior_ledger_sequence!==ledgerSequence||
     !uuid(ownerAuditId)||r.prior_owner_incident_audit_id!==ownerAuditId)
    return {ok:false,reason:'Exact durable 854 snapshot and original 853 owner audit lineage required.'};
  if(!['hold_response_acknowledged','hold_response_recheck_required'].includes(r.disposition)||
     r.permissions!=='review_only_no_master_grant'||!nonce(r.nonce)||!name(r.signer_id)||
     r.signer_id.toLowerCase()===String(actor).toLowerCase())
    return {ok:false,reason:'Distinct non-authorizing Master response identity and HOLD required.'};
  const issued=time(r.issued_at),observed=time(r.observed_at),expires=time(r.expires_at);
  if(![issued,observed,expires].every(Number.isFinite)||issued>now+300000||observed>now+300000||
     now-issued>600000||now-observed>600000||observed<issued-300000||
     observed>expires||expires<=now||expires<=issued||expires-issued>900000)
    return {ok:false,reason:'Master response evidence is expired, stale or future-dated.'};
  const pub=decode(env?.ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854,32),sig=decode(signature,64);
  if(!pub||!sig||[env?.ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853,
     env?.ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852,
     env?.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851].some(x=>!decode(x,32)||x===env.ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854))
    return {ok:false,reason:'Independent Master response public signer must be enrolled separately from prior evidence identities.'};
  try{
    const canonical=canonicalMaster854(r);
    const key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(canonical)))
      return {ok:false,reason:'Independent Master incident signature verification failed.'};
    return {ok:true,sha256:await hash(canonical),signature_verified:true,
      response_observed_at:r.observed_at,master_connection:'HOLD',atomic_snapshot_claim_verified_separately:true,
      master_runtime_ack:false,durable_master_transport_verified:false};
  }catch{return {ok:false,reason:'Malformed signed response or Ed25519 verifier unavailable.'};}
}
export function slaEvidence854({incidentRecordedAt,priority,route,observedAt=null,now=Date.now()}={}){
  const level=PRIORITIES[priority],start=time(incidentRecordedAt),observed=observedAt===null?null:time(observedAt);
  if(!level||level.route!==route||!Number.isFinite(start)||start>now+300000||
     !Number.isFinite(now)||now-start>366*86400000||
     (observed!==null&&(!Number.isFinite(observed)||observed<start-300000||observed>now+300000)))
    return {decision:'HOLD',reason:'SOURCE_INCIDENT_SLA_TIMELINE_OR_ROUTE_INVALID',notification_sent:false};
  const due=start+level.hours*3600000,measuredAt=observed===null?now:observed;
  const state=observed===null?(now>due?'OVERDUE_REVIEW':'OPEN_REVIEW'):(observed>due?'SIGNED_RESPONSE_AFTER_TARGET':'SIGNED_RESPONSE_WITHIN_TARGET');
  return {decision:'SLA_REVIEW_ONLY',priority,route,review_target_hours:level.hours,
    source_incident_recorded_at:new Date(start).toISOString(),review_due_at:new Date(due).toISOString(),
    response_observed_at:observed===null?null:new Date(observed).toISOString(),
    elapsed_hours:Math.round(((measuredAt-start)/3600000)*10)/10,status:state,
    delivered_notification_verified:false,master_transport_verified:false,
    external_provider_action_verified:false,master_connection:'HOLD'};
}
export function reconcileMaster854({verdict,sla,atomicSnapshot,incidentAudit}={}){
  const reasons=[];
  if(!verdict?.ok||!verdict.signature_verified)reasons.push('INDEPENDENT_MASTER_SIGNATURE_MISSING');
  if(sla?.decision!=='SLA_REVIEW_ONLY')reasons.push('ESCALATION_SLA_EVIDENCE_INCOMPLETE');
  if(!atomicSnapshot?.id||atomicSnapshot.kind!=='ledger_snapshot')reasons.push('ATOMIC_SOURCE_LEDGER_CLAIM_MISSING');
  if(!incidentAudit?.id)reasons.push('ORIGINAL_OWNER_INCIDENT_AUDIT_MISSING');
  return {decision:reasons.length?'HOLD':'SIGNED_MASTER_RESPONSE_REVIEW_ONLY',reasons,
    source_atomicity_claim_recorded:reasons.length===0,master_connection:'HOLD',
    master_runtime_ack:false,external_mirrors_verified:false,consumer_authorized:false,
    provider_mutation_performed:false,master_events_emitted:0,notification_sent:false,
    incident_closed:false,verified_master_delivery:false};
}
export const ORIGINAL_SOURCE_REPLAY_CONTRACT_854=CONTRACT_853;
