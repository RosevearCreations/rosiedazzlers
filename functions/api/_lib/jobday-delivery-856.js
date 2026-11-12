// Rosie Build 856 — cryptographically checked external receiver HOLD witness,
// source-only conflict recovery and privacy-safe owner closure evidence export.
// A signed observation cannot prove external delivery, custody or CONNECTED.
export const CONTRACT_856='rosie.ai-data.comms.delivery-witness.review.v856';
export const WITNESS_KIND_856='external_master_delivery_hold_witness';
export const PLANES_856=['ai-data-platform','rosevear-comms-hub'];
const FIELDS=['version','kind','plane','source_id','source_contract','source_revision',
  'booking_id','project_id','post_id','case_reference','incident_reference',
  'transaction_reference','prior_855_review_id','prior_855_plane_sha256',
  'prior_855_plane_nonce','delivery_receipt_reference','receiver_claim',
  'disposition','permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const PUBLIC_PINS={
  'ai-data-platform':'ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856',
  'rosevear-comms-hub':'ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856'
};
const PRIOR_PINS=['ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855',
 'ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855',
 'ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854',
 'ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853',
 'ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852',
 'ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851'];
export const CONFLICT_KINDS_856=['duplicate_transaction_replay','mismatched_master_receipt',
 'missing_delivery_ack','stale_delivery_witness'];
export const RECOVERY_ACTIONS_856=['quarantine_for_owner_review',
 'request_independent_receiver_recheck','maintain_external_hold'];
const validUuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const sha40=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const sha256=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const ref=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{5,79}$/.test(v);
const txref=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{11,95}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const signer=v=>typeof v==='string'&&/^[A-Za-z0-9_.@-]{5,120}$/.test(v);
const ms=v=>typeof v==='string'?Date.parse(v):NaN;
const decode=(v,n)=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
 try{const s=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);
   const a=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return a.length===n?a:null;}
 catch{return null;}
};
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function canonicalWitness856(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==FIELDS.length
   ||FIELDS.some(k=>r[k]===null||r[k]===undefined||!['string','boolean','number'].includes(typeof r[k]))
   ||Object.keys(r).some(k=>!FIELDS.includes(k)))throw Error('Exact signed receiver witness schema required.');
 return 'ROSIE-856-INDEPENDENT-DELIVERY-HOLD-V1\n'+JSON.stringify(FIELDS.map(k=>r[k]));
}
export async function verifyWitness856(env,r,signature,{
  plane,bookingId,projectId,post,caseReference,incidentReference,transaction,
  actor,now=Date.now()
}={}){
 const pin=PUBLIC_PINS[plane],original=ms(transaction?.recorded_at);
 const previousSha=plane==='ai-data-platform'?transaction?.ai_data_sha256:transaction?.comms_sha256;
 const previousNonce=plane==='ai-data-platform'?transaction?.ai_data_nonce:transaction?.comms_nonce;
 if(!pin||!sha40(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!==WITNESS_KIND_856||
    r.plane!==plane||r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_856||
    r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.booking_id!==bookingId||
    r.project_id!==projectId||r.post_id!==post?.id||r.case_reference!==caseReference||
    r.incident_reference!==incidentReference||!ref(caseReference)||!ref(incidentReference)||
    !validUuid(transaction?.id)||!txref(transaction?.transaction_reference)||
    r.transaction_reference!==transaction.transaction_reference||
    r.prior_855_review_id!==transaction.id||r.prior_855_plane_sha256!==previousSha||
    !sha256(previousSha)||r.prior_855_plane_nonce!==previousNonce||!nonce(previousNonce))
    return {ok:false,reason:'Exact original 855 transaction, consumer plane and deployed source required.'};
 if(!txref(r.delivery_receipt_reference)||r.receiver_claim!=='signed_receiver_observation_review_only'||
    r.disposition!=='delivery_evidence_hold'||r.permissions!=='review_only_no_delivery_grant'||
    !nonce(r.nonce)||r.nonce===previousNonce||!signer(r.signer_id)||
    r.signer_id.toLowerCase()===String(actor).toLowerCase())
   return {ok:false,reason:'Non-authorizing independent receiver observation and new nonce required.'};
 const issued=ms(r.issued_at),observed=ms(r.observed_at),expires=ms(r.expires_at);
 if(![issued,observed,expires,original].every(Number.isFinite)||
    issued>now+300000||observed>now+300000||now-issued>600000||now-observed>600000||
    observed<original-300000||observed<issued-300000||observed>expires||
    expires<=now||expires<=issued||expires-issued>900000)
   return {ok:false,reason:'Independent witness expired, stale, before source transaction or future-dated.'};
 const pub=decode(env?.[pin],32),sig=decode(signature,64);
 const other=env?.[PUBLIC_PINS[plane==='ai-data-platform'?'rosevear-comms-hub':'ai-data-platform']];
 if(!pub||!sig||!decode(other,32)||other===env[pin]||
   PRIOR_PINS.some(k=>!decode(env?.[k],32)||env[k]===env[pin]))
   return {ok:false,reason:'Distinct enrolled public-only external witness identities required.'};
 try{
   const serialized=canonicalWitness856(r);
   const key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
   if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(serialized)))
     return {ok:false,reason:'Signed receiver witness failed cryptographic verification.'};
   return {ok:true,plane,canonical_sha256:await hash(serialized),nonce:r.nonce,
     delivery_receipt_reference:r.delivery_receipt_reference,observed_at:r.observed_at,
     signer_id:r.signer_id,signature_verified:true,receiver_delivery_independently_proven:false,
     master_connection:'HOLD',provider_mutation_performed:false};
 }catch{return {ok:false,reason:'Malformed witness or independent Ed25519 verifier unavailable.'};}
}
export function conflictReview856({plane,conflictKind,recoveryAction,conflictReference,
  evidenceNonce,evidenceSha256,transaction}={}){
 const reasons=[];
 if(!PLANES_856.includes(plane))reasons.push('UNKNOWN_MASTER_PLANE');
 if(!CONFLICT_KINDS_856.includes(conflictKind))reasons.push('UNSUPPORTED_CONFLICT_KIND');
 if(!RECOVERY_ACTIONS_856.includes(recoveryAction))reasons.push('UNSAFE_RECOVERY_ACTION');
 if(!txref(conflictReference)||!nonce(evidenceNonce)||!sha256(evidenceSha256))reasons.push('ORIGINAL_CONFLICT_EVIDENCE_REQUIRED');
 if(!validUuid(transaction?.id)||!txref(transaction?.transaction_reference))
   reasons.push('ATOMIC_855_TRANSACTION_MISSING');
 return {decision:reasons.length?'HOLD':'OWNER_CONFLICT_TRIAGE_RECORDED_ONLY',
   reasons,provider_retry_performed:false,receiver_reroute_performed:false,
   authorization_granted:false,master_connection:'HOLD'};
}
export async function ownerEvidenceExport856({transaction,witnesses=[],conflicts=[],
  generatedAt=new Date().toISOString()}={}){
 if(!validUuid(transaction?.id)||!txref(transaction?.transaction_reference)||
   !validUuid(transaction?.project_id)||!validUuid(transaction?.booking_id)||
   !validUuid(transaction?.post_id)||!ref(transaction?.incident_reference)||
   !ref(transaction?.case_reference)||!sha40(transaction?.source_revision)||
   !sha256(transaction?.ai_data_sha256)||!sha256(transaction?.comms_sha256)||
   !Array.isArray(witnesses)||!Array.isArray(conflicts)||witnesses.length>20||conflicts.length>80||
   !Number.isFinite(ms(generatedAt)))throw Error('Complete and bounded original transaction export evidence required.');
 const scope=r=>r.transaction_review_id===transaction.id&&
   r.case_reference===transaction.case_reference&&
   r.incident_reference===transaction.incident_reference&&
   r.transaction_reference===transaction.transaction_reference&&
   PLANES_856.includes(r.plane)&&sha256(r.evidence_sha256)&&validUuid(r.id);
 if(!witnesses.every(scope)||!conflicts.every(scope))throw Error('Out-of-scope closure evidence refused.');
 const toRecord=r=>({record_id:r.id,plane:r.plane,evidence_sha256:r.evidence_sha256,
   prior_855_sha256:r.prior_855_sha256,recorded_at:r.recorded_at});
 const signedWitnesses=witnesses.map(r=>({...toRecord(r),
   delivery_receipt_reference:r.delivery_receipt_reference,
   witness_observed_at:r.witness_observed_at,signature_review_only:true})).sort((a,b)=>a.record_id.localeCompare(b.record_id));
 const conflictHistory=conflicts.map(r=>({...toRecord(r),
   conflict_reference:r.conflict_reference,conflict_kind:r.conflict_kind,
   recovery_action:r.recovery_action,not_auto_retried:true})).sort((a,b)=>a.record_id.localeCompare(b.record_id));
 const coverage=PLANES_856.every(p=>signedWitnesses.some(x=>x.plane===p));
 const bundle={format:'rosie.owner-incident-closure-evidence.v856',generated_at:generatedAt,
   source:{source_id:'rosiedazzlers',source_revision:transaction.source_revision,
     booking_id:transaction.booking_id,project_id:transaction.project_id,post_id:transaction.post_id,
     case_reference:transaction.case_reference,incident_reference:transaction.incident_reference},
   transaction:{review_id:transaction.id,transaction_reference:transaction.transaction_reference,
     source_sla_due_at:transaction.source_sla_due_at,sla_review_status:transaction.sla_review_status,
     owner_review_decision:transaction.owner_review_decision,
     ai_data_sha256:transaction.ai_data_sha256,comms_sha256:transaction.comms_sha256},
   witnesses:signedWitnesses,conflicts:conflictHistory,
   assessment:{both_signed_receiver_observations_recorded:coverage,
     unresolved_conflicts_require_review:conflicts.length>0,
     owner_export_status:'EVIDENCE_EXPORT_ONLY',
     verified_external_transport:false,verified_remote_delivery:false,
     verified_cross_plane_atomicity:false,confirmed_sla_resolution:false,
     owner_operational_incident_closed:false,master_connection:'HOLD'}};
 return {bundle,sha256:await hash('ROSIE-856-OWNER-EVIDENCE-EXPORT-V1\n'+JSON.stringify(bundle))};
}
