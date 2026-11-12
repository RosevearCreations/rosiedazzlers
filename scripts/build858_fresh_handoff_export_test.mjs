import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_856,WITNESS_KIND_856,canonicalWitness856} from '../functions/api/_lib/jobday-delivery-856.js';
import {checkFreshReceipt858,crossPlaneFreshness858,handoffAssessment858,evidenceDigest858,
 recoveryExport858,CONTRACT_858} from '../functions/api/_lib/jobday-recovery-858.js';
globalThis.crypto??=webcrypto;
const crypto=globalThis.crypto;
const b64=b=>Buffer.from(b).toString('base64url'),iso=n=>new Date(n).toISOString();
const ks=await Promise.all(Array.from({length:8},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>b64(await crypto.subtle.exportKey('raw',k.publicKey));
const env={CF_PAGES_COMMIT_SHA:'c'.repeat(40),
 ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(ks[0]),
 ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(ks[1])};
const prior=['ROSIE_AIDATA_TX_REPLAY_ED25519_PUBLIC_KEY_855','ROSIE_COMMS_TX_REPLAY_ED25519_PUBLIC_KEY_855',
 'ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854','ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853',
 'ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852','ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851'];
for(let i=0;i<prior.length;i++)env[prior[i]]=await pub(ks[i+2]);
const now=Date.now(),booking='11111111-1111-4111-8111-111111111111',
 project='22222222-2222-4222-8222-222222222222';
const post={id:'33333333-3333-4333-8333-333333333333',platform:'instagram'};
const tx={id:'44444444-4444-4444-8444-444444444444',transaction_reference:'original858transaction',
 project_id:project,booking_id:booking,post_id:post.id,
 case_reference:'original858case',incident_reference:'original858incident',
 ai_data_sha256:'a'.repeat(64),comms_sha256:'b'.repeat(64),
 ai_data_nonce:'originalAiDataTransactionNonce858',comms_nonce:'originalCommsTransactionNonce858',
 recorded_at:iso(now-100000)};
const base={version:1,kind:WITNESS_KIND_856,source_id:'rosiedazzlers',
 source_contract:CONTRACT_856,source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:booking,project_id:project,post_id:post.id,
 case_reference:tx.case_reference,incident_reference:tx.incident_reference,
 transaction_reference:tx.transaction_reference,prior_855_review_id:tx.id,
 receiver_claim:'signed_receiver_observation_review_only',
 disposition:'delivery_evidence_hold',permissions:'review_only_no_delivery_grant',
 issued_at:iso(now-15000),observed_at:iso(now-10000),expires_at:iso(now+120000)};
const ai={...base,plane:'ai-data-platform',prior_855_plane_sha256:tx.ai_data_sha256,
 prior_855_plane_nonce:tx.ai_data_nonce,nonce:'independentAiFreshCustody858123456',
 delivery_receipt_reference:'freshAiReceipt858reference',signer_id:'independent-ai-858-signer'};
const comms={...base,plane:'rosevear-comms-hub',prior_855_plane_sha256:tx.comms_sha256,
 prior_855_plane_nonce:tx.comms_nonce,nonce:'independentCommsFreshCustody858123',
 delivery_receipt_reference:'freshCommsReceipt858reference',signer_id:'independent-comms-858-signer'};
const sign=async(k,r)=>b64(await crypto.subtle.sign('Ed25519',k.privateKey,new TextEncoder().encode(canonicalWitness856(r))));
const ctx={transaction:tx,bookingId:booking,projectId:project,post,caseReference:tx.case_reference,
 incidentReference:tx.incident_reference,actor:'originalowner@rosie.ca',now};
const [a,c]=await Promise.all([
 checkFreshReceipt858(env,ai,await sign(ks[0],ai),{...ctx,plane:'ai-data-platform'}),
 checkFreshReceipt858(env,comms,await sign(ks[1],comms),{...ctx,plane:'rosevear-comms-hub'})]);
assert.equal(a.ok,true,JSON.stringify(a));assert.equal(c.ok,true,JSON.stringify(c));
assert.equal(a.master_connection,'HOLD');assert.equal(a.remote_receiver_delivery_verified,false);
assert.equal(CONTRACT_858.endsWith('.v858'),true);
assert.equal((await checkFreshReceipt858(env,{...ai,source_revision:'d'.repeat(40)},await sign(ks[0],ai),
 {...ctx,plane:'ai-data-platform'})).ok,false);
assert.equal((await checkFreshReceipt858(env,ai,await sign(ks[1],ai),{...ctx,plane:'ai-data-platform'})).ok,false);
assert.equal((await checkFreshReceipt858(env,{...ai,disposition:'CONNECTED'},await sign(ks[0],ai),
 {...ctx,plane:'ai-data-platform'})).ok,false);
assert.equal((await checkFreshReceipt858(env,{...ai,observed_at:iso(now-360000)},await sign(ks[0],ai),
 {...ctx,plane:'ai-data-platform'})).ok,false);
const rows=[{id:'55555555-5555-4555-8555-555555555555',kind:'fresh_receipt_recheck',
 transaction_review_id:tx.id,source_revision:env.CF_PAGES_COMMIT_SHA,plane:a.plane,
 receipt_sha256:a.receipt_sha256,receipt_observed_at:a.observed_at,recorded_at:iso(now-1000)},
 {id:'66666666-6666-4666-8666-666666666666',kind:'fresh_receipt_recheck',
 transaction_review_id:tx.id,source_revision:env.CF_PAGES_COMMIT_SHA,plane:c.plane,
 receipt_sha256:c.receipt_sha256,receipt_observed_at:c.observed_at,recorded_at:iso(now-1000)}];
const ready=crossPlaneFreshness858({records:rows,transaction:tx,sourceRevision:env.CF_PAGES_COMMIT_SHA,now});
assert.equal(ready.decision,'TWO_FRESH_SIGNED_OBSERVATIONS_REVIEW_ONLY');
assert.equal(crossPlaneFreshness858({records:rows.slice(0,1),transaction:tx,sourceRevision:env.CF_PAGES_COMMIT_SHA,now}).decision,'HOLD');
assert.equal(crossPlaneFreshness858({records:rows.map(r=>({...r,recorded_at:iso(now-600000)})),
 transaction:tx,sourceRevision:env.CF_PAGES_COMMIT_SHA,now}).decision,'HOLD');
assert.equal(crossPlaneFreshness858({records:rows.map(r=>({...r,source_revision:'d'.repeat(40)})),
 transaction:tx,sourceRevision:env.CF_PAGES_COMMIT_SHA,now}).decision,'HOLD');
const readback={id:'77777777-7777-4777-8777-777777777777',
 kind:'owner_acceptance_readback',transaction_review_id:tx.id,review_digest_sha256:'a'.repeat(64)};
const aging={decision:'AGING_REVIEW_ONLY',open_conflict_count:2,conflict_aging_status:'OPEN_ESCALATION_DUE'};
const assessment=handoffAssessment858({transaction:tx,readbacks:[readback],freshness:ready,
 aging,ownerAction:'escalate_unresolved_conflicts'});
assert.equal(assessment.decision,'DURABLE_CONFLICT_HANDOFF_REQUEST_HOLD_ONLY');
assert.equal(handoffAssessment858({transaction:tx,readbacks:[],freshness:ready,aging,
 ownerAction:'escalate_unresolved_conflicts'}).decision,'HOLD');
assert.equal(handoffAssessment858({transaction:tx,readbacks:[readback],freshness:ready,
 aging:{...aging,open_conflict_count:0},ownerAction:'escalate_unresolved_conflicts'}).decision,'HOLD');
const digest=await evidenceDigest858({kind:'conflict_escalation_handoff',transaction:tx,
 sourceRevision:env.CF_PAGES_COMMIT_SHA,freshness:ready,aging,priorOwnerReadbackId:readback.id,
 ownerAction:'escalate_unresolved_conflicts',nonce:'uniqueHandoff858NonceABC1234'});
assert.match(digest,/^[a-f0-9]{64}$/);
const handoff={id:'88888888-8888-4888-8888-888888888888',kind:'conflict_escalation_handoff',
 transaction_review_id:tx.id,source_revision:env.CF_PAGES_COMMIT_SHA,
 prior_857_readback_id:readback.id,review_digest_sha256:digest,owner_action:'escalate_unresolved_conflicts'};
const exported=await recoveryExport858({transaction:tx,sourceRevision:env.CF_PAGES_COMMIT_SHA,
 readback,handoff,freshness:ready,aging,ownerAction:'maintain_external_hold',
 nonce:'ownerExport858ReviewNonce123456',generatedAt:iso(now)});
assert.equal(exported.bundle.assessment.master_connection,'HOLD');
assert.equal(exported.bundle.assessment.verified_remote_delivery,false);
assert.match(exported.sha256,/^[a-f0-9]{64}$/);
await assert.rejects(()=>recoveryExport858({transaction:tx,sourceRevision:env.CF_PAGES_COMMIT_SHA,
 readback,handoff:{...handoff,source_revision:'d'.repeat(40)},freshness:ready,aging,
 ownerAction:'maintain_external_hold',nonce:'ownerExport858ReviewNonce123456'}));
console.log('Rosie 858 fresh independent Ed25519 receipt, bounded handoff and owner HOLD export PASS');
