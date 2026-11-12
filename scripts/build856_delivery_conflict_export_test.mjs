import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_856,WITNESS_KIND_856,canonicalWitness856,verifyWitness856,
 conflictReview856,ownerEvidenceExport856} from '../functions/api/_lib/jobday-delivery-856.js';
const crypto=globalThis.crypto||webcrypto;
const b64=a=>Buffer.from(a).toString('base64url');
const key=async()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=async k=>b64(await crypto.subtle.exportKey('raw',k.publicKey));
const sign=async(k,s)=>b64(await crypto.subtle.sign('Ed25519',k.privateKey,new TextEncoder().encode(s)));
const kp=await key(),commsK=await key();
const prior=await Promise.all(Array.from({length:6},()=>key()));
const priorNames=['ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855','ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855',
 'ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854','ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853',
 'ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852','ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851'];
const env={CF_PAGES_COMMIT_SHA:'c'.repeat(40),
  ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(kp),
  ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(commsK)};
for(let i=0;i<prior.length;i++)env[priorNames[i]]=await pub(prior[i]);
const now=Date.now(),iso=t=>new Date(t).toISOString();
const booking='11111111-1111-4111-8111-111111111111';
const project='22222222-2222-4222-8222-222222222222';
const post={id:'33333333-3333-4333-8333-333333333333',platform:'facebook'};
const incident='rosie856incident',caseId='rosie856case',tx='transaction856original';
const original={id:'44444444-4444-4444-8444-444444444444',
 project_id:project,booking_id:booking,post_id:post.id,case_reference:caseId,
 incident_reference:incident,transaction_reference:tx,source_revision:'b'.repeat(40),
 ai_data_sha256:'a'.repeat(64),comms_sha256:'b'.repeat(64),
 ai_data_nonce:'previousAIdataNonce123456789',comms_nonce:'previousCommsNonce123456789',
 recorded_at:iso(now-70000),source_sla_due_at:iso(now+7200000),sla_review_status:'SIGNED_OBSERVATIONS_WITHIN_TARGET',
 owner_review_decision:'accept_cross_plane_review_only'};
const context={bookingId:booking,projectId:project,post,caseReference:caseId,
 incidentReference:incident,transaction:original,actor:'originalowner@rosie.ca',now};
const shared={version:1,kind:WITNESS_KIND_856,source_id:'rosiedazzlers',
 source_contract:CONTRACT_856,source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:booking,project_id:project,post_id:post.id,case_reference:caseId,
 incident_reference:incident,transaction_reference:tx,prior_855_review_id:original.id,
 receiver_claim:'signed_receiver_observation_review_only',disposition:'delivery_evidence_hold',
 permissions:'review_only_no_delivery_grant',issued_at:iso(now-30000),
 observed_at:iso(now-20000),expires_at:iso(now+180000)};
const ai={...shared,plane:'ai-data-platform',prior_855_plane_sha256:original.ai_data_sha256,
 prior_855_plane_nonce:original.ai_data_nonce,
 delivery_receipt_reference:'receiptAIdata856original',nonce:'newAIdataDeliveryNonce85612345678',
 signer_id:'original-independent-ai-witness'};
const comms={...shared,plane:'rosevear-comms-hub',prior_855_plane_sha256:original.comms_sha256,
 prior_855_plane_nonce:original.comms_nonce,
 delivery_receipt_reference:'receiptComms856original',nonce:'newCommsDeliveryNonce85612345678',
 signer_id:'original-independent-comms-witness'};
const asig=await sign(kp,canonicalWitness856(ai)),csig=await sign(commsK,canonicalWitness856(comms));
const a=await verifyWitness856(env,ai,asig,{...context,plane:'ai-data-platform'});
const c=await verifyWitness856(env,comms,csig,{...context,plane:'rosevear-comms-hub'});
assert.equal(a.ok,true,JSON.stringify(a));
assert.equal(c.ok,true,JSON.stringify(c));
assert.equal(a.signature_verified,true);
assert.equal(a.receiver_delivery_independently_proven,false);
assert.equal(a.master_connection,'HOLD');
const test=(r,s,plane,ctx=context,e=env)=>verifyWitness856(e,r,s,{...ctx,plane});
assert.equal((await test({...ai,source_revision:'d'.repeat(40)},asig,'ai-data-platform')).ok,false);
assert.equal((await test({...ai,disposition:'CONNECTED'},asig,'ai-data-platform')).ok,false);
assert.equal((await test({...ai,permissions:'approve_delivery'},asig,'ai-data-platform')).ok,false);
assert.equal((await test({...ai,receiver_claim:'delivered_and_closed'},asig,'ai-data-platform')).ok,false);
assert.equal((await test({...ai,nonce:original.ai_data_nonce},asig,'ai-data-platform')).ok,false);
assert.equal((await test({...ai,prior_855_plane_sha256:'d'.repeat(64)},asig,'ai-data-platform')).ok,false);
assert.equal((await test({...ai,observed_at:iso(now+600000)},asig,'ai-data-platform')).ok,false);
assert.equal((await test(ai,csig,'ai-data-platform')).ok,false);
assert.equal((await test(ai,asig,'rosevear-comms-hub')).ok,false);
assert.equal((await test(ai,asig,'ai-data-platform',{...context,transaction:{...original,id:booking}})).ok,false);
assert.equal((await test(ai,asig,'ai-data-platform',{...context,now:now+3600000})).ok,false);
assert.equal((await test(ai,asig,'ai-data-platform',context,{
  ...env,ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:env.ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856})).ok,false);
assert.equal((await test(ai,asig,'ai-data-platform',context,{
  ...env,ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:env.ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855})).ok,false);
assert.throws(()=>canonicalWitness856({...ai,extra:'connected'}));
const conflictBase={plane:'ai-data-platform',conflictKind:'duplicate_transaction_replay',
 recoveryAction:'quarantine_for_owner_review',conflictReference:'conflict856originaltest',
 evidenceNonce:'originalOwnerConflictNonce856123456',evidenceSha256:'e'.repeat(64),transaction:original};
assert.equal(conflictReview856(conflictBase).decision,'OWNER_CONFLICT_TRIAGE_RECORDED_ONLY');
assert.equal(conflictReview856({...conflictBase,recoveryAction:'replay_and_close'}).decision,'HOLD');
assert.equal(conflictReview856({...conflictBase,conflictKind:'provider_dispatched'}).decision,'HOLD');
assert.equal(conflictReview856({...conflictBase,evidenceNonce:'bad'}).decision,'HOLD');
const witness=(id,verdict,r)=>({
 id,project_id:project,booking_id:booking,post_id:post.id,transaction_review_id:original.id,
 case_reference:caseId,incident_reference:incident,transaction_reference:tx,
 kind:'signed_delivery_hold_witness',plane:verdict.plane,evidence_sha256:verdict.canonical_sha256,
 prior_855_sha256:verdict.plane==='ai-data-platform'?original.ai_data_sha256:original.comms_sha256,
 delivery_receipt_reference:r.delivery_receipt_reference,witness_observed_at:r.observed_at,
 recorded_at:iso(now-10000),actor_staff_email:'secret@rosie.ca'});
const w1=witness('55555555-5555-4555-8555-555555555555',a,ai);
const w2=witness('66666666-6666-4666-8666-666666666666',c,comms);
const generatedAt=iso(now),e1=await ownerEvidenceExport856({transaction:original,witnesses:[w2,w1],generatedAt});
const e2=await ownerEvidenceExport856({transaction:original,witnesses:[w1,w2],generatedAt});
assert.equal(e1.sha256,e2.sha256);
assert.equal(e1.bundle.assessment.both_signed_receiver_observations_recorded,true);
assert.equal(e1.bundle.assessment.verified_remote_delivery,false);
assert.equal(e1.bundle.assessment.owner_operational_incident_closed,false);
assert.equal(JSON.stringify(e1).includes('secret@rosie.ca'),false);
assert.equal((await ownerEvidenceExport856({transaction:original,witnesses:[w1],generatedAt})).bundle.assessment.both_signed_receiver_observations_recorded,false);
const conflict={...w1,id:'77777777-7777-4777-8777-777777777777',kind:'replay_conflict_review',
 conflict_reference:'conflict856originaltest',conflict_kind:'duplicate_transaction_replay',
 recovery_action:'quarantine_for_owner_review'};
const withConflict=await ownerEvidenceExport856({transaction:original,witnesses:[w1,w2],conflicts:[conflict],generatedAt});
assert.equal(withConflict.bundle.assessment.unresolved_conflicts_require_review,true);
await assert.rejects(()=>ownerEvidenceExport856({transaction:original,witnesses:[{...w1,transaction_review_id:booking}],generatedAt}));
console.log('Rosie 856 receiver signed HOLD witnesses, fail-closed conflicts and privacy-safe owner evidence export PASS');
