// Rosie 855 — independent AI Data + Comms signed transaction observations.
// The local source can verify signatures but NOT remote durable delivery or distributed atomicity.
export const CONTRACT_855='rosie.ai-data.comms.incident-transaction-review.v855';
export const KIND_855='independent_cross_plane_transaction_hold_observation';
const FIELDS=['version','kind','plane','source_id','source_contract','source_revision','booking_id',
  'project_id','post_id','case_reference','incident_reference','transaction_reference',
  'prior_854_response_id','prior_854_response_sha256','original_owner_audit_id',
  'source_sla_due_at','disposition','permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const SPEC={
 'ai-data-platform':{pin:'ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855',signer:'ai-data-platform'},
 'rosevear-comms-hub':{pin:'ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855',signer:'rosevear-comms-hub'}
};
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const sha=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const digest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const ident=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$/.test(v);
const txref=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const signer=v=>typeof v==='string'&&/^[A-Za-z0-9_.@-]{5,120}$/.test(v);
const ms=v=>typeof v==='string'?Date.parse(v):NaN;
const decode=(v,n)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
 try{const s=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);
   const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return bytes.length===n?bytes:null;}
 catch{return null;}
};
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function canonicalTransaction855(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==FIELDS.length
   ||FIELDS.some(k=>r[k]===undefined||r[k]===null||!['string','number','boolean'].includes(typeof r[k]))
   ||Object.keys(r).some(k=>!FIELDS.includes(k)))throw Error('Exact independent Master transaction scalar schema required.');
 return 'ROSIE-855-CROSS-PLANE-TX-HOLD-V1\n'+JSON.stringify(FIELDS.map(k=>r[k]));
}
export async function verifyTransaction855(env,r,signature,{
 plane,bookingId,projectId,post,caseReference,incidentReference,transactionReference,
 prior854,ownerAuditId,actor,now=Date.now()
}={}){
 const spec=SPEC[plane],due=ms(prior854?.sla_due_at),anchor=ms(prior854?.recorded_at);
 if(!spec||!sha(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!==KIND_855||
   r.plane!==plane||r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_855||
   r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.booking_id!==bookingId||
   r.project_id!==projectId||r.post_id!==post?.id||r.case_reference!==caseReference||
   !ident(caseReference)||r.incident_reference!==incidentReference||!ident(incidentReference)||
   !txref(transactionReference)||r.transaction_reference!==transactionReference)
   return {ok:false,reason:'Original source, independently named plane and transaction contract required.'};
 if(!uuid(prior854?.id)||prior854?.kind!=='master_incident_response'||!digest(prior854?.evidence_sha256)||
   !Number.isFinite(due)||!Number.isFinite(anchor)||r.prior_854_response_id!==prior854.id||
   r.prior_854_response_sha256!==prior854.evidence_sha256||!uuid(ownerAuditId)||
   r.original_owner_audit_id!==ownerAuditId||ms(r.source_sla_due_at)!==due)
   return {ok:false,reason:'Exact prior atomic Build 854 response, owner audit and immutable SLA boundary required.'};
 if(r.disposition!=='cross_plane_hold_observation'||r.permissions!=='review_only_no_runtime_grant'||
   !nonce(r.nonce)||!signer(r.signer_id)||r.signer_id.toLowerCase()===String(actor).toLowerCase())
   return {ok:false,reason:'Explicit signed HOLD observation and distinct signer required.'};
 const issued=ms(r.issued_at),observed=ms(r.observed_at),expires=ms(r.expires_at);
 if(![issued,observed,expires].every(Number.isFinite)||issued>now+300000||observed>now+300000||
   now-issued>600000||now-observed>600000||observed<anchor-300000||
   observed<issued-300000||observed>expires||expires<=now||expires<=issued||
   expires-issued>900000)
   return {ok:false,reason:'Independent observed transaction timestamps stale, expired, before source anchor or future-dated.'};
 const pub=decode(env?.[spec.pin],32),sig=decode(signature,64);
 const reserved=[env?.ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854,
   env?.ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853,
   env?.ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852,
   env?.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851];
 const other=env?.[SPEC[plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform'].pin];
 if(!pub||!sig||!decode(other,32)||env[spec.pin]===other||reserved.some(k=>k===env[spec.pin]))
   return {ok:false,reason:'Two separately enrolled public-only signers distinct from prior original identities required.'};
 try{
   const serialized=canonicalTransaction855(r);
   const key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
   if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(serialized)))
     return {ok:false,reason:'Cryptographic signature invalid for claimed independent plane.'};
   return {ok:true,plane,canonical_sha256:await hash(serialized),
     nonce:r.nonce,observed_at:r.observed_at,signer_id:r.signer_id,
     master_connection:'HOLD',remote_transaction_commit_verified:false};
 }catch{return {ok:false,reason:'Malformed signed transaction or Ed25519 verifier unavailable.'};}
}
export function reviewCrossPlane855({ai,comms,prior854,incidentRecordedAt,ownerDecision,now=Date.now()}={}){
 const reasons=[],due=ms(prior854?.sla_due_at),start=ms(incidentRecordedAt);
 const ams=ms(ai?.observed_at),cms=ms(comms?.observed_at);
 if(!ai?.ok||ai.plane!=='ai-data-platform')reasons.push('AI_DATA_INDEPENDENT_SIGNATURE_MISSING');
 if(!comms?.ok||comms.plane!=='rosevear-comms-hub')reasons.push('COMMS_INDEPENDENT_SIGNATURE_MISSING');
 if(ai?.nonce===comms?.nonce||ai?.canonical_sha256===comms?.canonical_sha256||
   ai?.signer_id===comms?.signer_id)reasons.push('INDEPENDENT_PLANES_COLLIDE');
 if(!Number.isFinite(due)||!Number.isFinite(start)||start>now+300000||
   due<=start||!Number.isFinite(ams)||!Number.isFinite(cms)||
   ams<start-300000||cms<start-300000||ams>now+300000||cms>now+300000)
   reasons.push('SOURCE_SLA_TIMELINE_MISMATCH');
 if(!['accept_cross_plane_review_only','maintain_external_hold'].includes(ownerDecision))
   reasons.push('EXPLICIT_OWNER_REVIEW_DECISION_REQUIRED');
 const within=Number.isFinite(due)&&Number.isFinite(ams)&&Number.isFinite(cms)&&
   ams<=due&&cms<=due;
 return {decision:reasons.length?'HOLD':'OWNER_CROSS_PLANE_REVIEW_RECORDED_ONLY',
   reasons,source_sla_due_at:Number.isFinite(due)?new Date(due).toISOString():null,
   review_status:reasons.length?'UNVERIFIED':within?'SIGNED_OBSERVATIONS_WITHIN_TARGET':'SIGNED_OBSERVATION_AFTER_TARGET',
   both_planes_signed:reasons.length===0,owner_review_decision:ownerDecision||null,
   master_connection:'HOLD',master_runtime_ack:false,remote_transaction_commit_verified:false,
   confirmed_sla_resolution:false,provider_mutation_performed:false,
   owner_operational_incident_closed:false,external_mirrors_verified:false,
   consumer_authorized:false,master_events_emitted:0};
}
