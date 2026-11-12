import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_862,HOLD_862,canonicalWitness862,verifyWitness862,
 slaRecheck862,digest862} from '../functions/api/_lib/jobday-witness-862.js';
globalThis.crypto??=webcrypto;
const c=globalThis.crypto,now=Date.now(),iso=n=>new Date(n).toISOString(),
 b64=x=>Buffer.from(x).toString('base64url');
const keys=await Promise.all(Array.from({length:4},()=>c.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async key=>b64(await c.subtle.exportKey('raw',key.publicKey));
const env={CF_PAGES_COMMIT_SHA:'e'.repeat(40),
 ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862:await pub(keys[0]),
 ROSIE_COMMS_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862:await pub(keys[1]),
 ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861:await pub(keys[2]),
 ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861:await pub(keys[3])};
const booking='11111111-1111-4111-8111-111111111111';
const project='22222222-2222-4222-8222-222222222222';
const postId='33333333-3333-4333-8333-333333333333';
const tx={id:'44444444-4444-4444-8444-444444444444',transaction_reference:'transaction862original'};
const handoff={id:'55555555-5555-4555-8555-555555555555',
 review_digest_sha256:'a'.repeat(64)};
const ownerDecision={id:'66666666-6666-4666-8666-666666666666'};
const ownerException={id:'77777777-7777-4777-8777-777777777777',
 kind:'owner_continuity_exception_review',transaction_review_id:tx.id,
 review_digest_sha256:'b'.repeat(64)};
const ownerEscalation={id:'88888888-8888-4888-8888-888888888888',
 kind:'owner_hold_escalation_review',transaction_review_id:tx.id,
 review_digest_sha256:'c'.repeat(64),recorded_at:iso(now-25*3600000)};
const discrepancies=['ai-data-platform','rosevear-comms-hub'].map((plane,i)=>({
 id:i?'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa':'99999999-9999-4999-8999-999999999999',
 kind:'signed_external_custodian_discrepancy',transaction_review_id:tx.id,
 plane,discrepancy_code:'INTAKE_DIGEST_DISPUTED',
 review_digest_sha256:i?'d'.repeat(64):'f'.repeat(64)}));
const base={version:1,kind:'independent_resolution_review_witness',
 source_id:'rosiedazzlers',contract:CONTRACT_862,source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:booking,project_id:project,post_id:postId,
 transaction_review_id:tx.id,handoff_858_id:handoff.id,
 owner_decision_859_id:ownerDecision.id,owner_exception_860_id:ownerException.id,
 owner_exception_860_sha256:ownerException.review_digest_sha256,
 owner_escalation_861_id:ownerEscalation.id,
 owner_escalation_861_sha256:ownerEscalation.review_digest_sha256,
 review_claim:'discrepancy_evidence_reviewed_no_operational_resolution',
 disposition:'independent_non_authorizing_review_hold_only',
 issued_at:iso(now-18000),expires_at:iso(now+120000)};
const receipts=discrepancies.map((d,i)=>({...base,plane:d.plane,
 discrepancy_861_id:d.id,discrepancy_861_sha256:d.review_digest_sha256,
 discrepancy_code:d.discrepancy_code,nonce:i?
 'newCommsIndependentReviewWitnessNonce862':'newAiIndependentReviewWitnessNonce862',
 signer_id:i?'fresh-comms-862-custodian':'fresh-ai-862-custodian'}));
const sign=async(k,r)=>b64(await c.subtle.sign('Ed25519',k.privateKey,
 new TextEncoder().encode(canonicalWitness862(r))));
const context=(i)=>({plane:discrepancies[i].plane,tx,handoff,ownerDecision,
 ownerException,ownerEscalation,discrepancy:discrepancies[i],
 bookingId:booking,projectId:project,postId,now});
const sig=await sign(keys[0],receipts[0]);
const verified=await verifyWitness862(env,receipts[0],sig,context(0));
assert.equal(verified.ok,true,JSON.stringify(verified));
assert.equal(verified.master_connected,false);
assert.equal(verified.discrepancy_operationally_resolved,false);
assert.equal((await verifyWitness862(env,receipts[1],await sign(keys[1],receipts[1]),context(1))).ok,true);
const check=(r,signature=sig,envOverride=env,ctx=context(0))=>
 verifyWitness862(envOverride,r,signature,ctx);
assert.equal((await check({...receipts[0],source_revision:'d'.repeat(40)})).ok,false);
assert.equal((await check({...receipts[0],disposition:'CONNECTED'})).ok,false);
assert.equal((await check({...receipts[0],owner_escalation_861_sha256:'9'.repeat(64)})).ok,false);
assert.equal((await check({...receipts[0],issued_at:iso(now-600000)},
 await sign(keys[0],{...receipts[0],issued_at:iso(now-600000)}))).ok,false);
assert.equal((await check(receipts[0],await sign(keys[1],receipts[0]))).ok,false);
assert.equal((await check(receipts[0],sig,{...env,
 ROSIE_COMMS_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862:env.ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862})).ok,false);
assert.equal((await check(receipts[0],sig,{...env,
 ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861:env.ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862})).ok,false);
assert.throws(()=>canonicalWitness862({...receipts[0],extra:'tamper'}));
const aging={decision:'ORIGINAL_OWNER_INTAKE_EXCEPTION_AGING_HOLD_ONLY',
 first_exception_id:ownerException.id,oldest_exception_age_hours:52};
const sla=slaRecheck862({aging,latestEscalation:ownerEscalation,witnesses:[],now});
assert.equal(sla.decision,'ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY');
assert.equal(sla.sla_status,'CRITICAL_HOLD');
assert.equal(sla.escalation_recheck_due,true);
assert.ok(sla.checks.includes('OWNER_ESCALATION_RECHECK_OVER_24H'));
assert.ok(sla.checks.includes('NO_SIGNED_RESOLUTION_REVIEW_WITNESS'));
for(const [hours,status] of [[23,'OPEN_HOLD'],[24,'ESCALATION_DUE_HOLD'],
 [48,'CRITICAL_HOLD']]){
 assert.equal(slaRecheck862({aging:{...aging,oldest_exception_age_hours:hours},
 latestEscalation:{...ownerEscalation,recorded_at:iso(now-1000)},witnesses:[],now}).sla_status,status);
}
assert.equal(slaRecheck862({aging,latestEscalation:null,witnesses:[],now}).decision,'HOLD');
const wDigest=await digest862({kind:'signed_resolution_review_witness',tx,handoff,
 ownerDecision,ownerException,ownerEscalation,nonce:'witnessDigest862OriginalNonce',checked:verified,
 discrepancy:discrepancies[0]});
assert.match(wDigest,/^[a-f0-9]{64}$/);
const slaDigest=await digest862({kind:'owner_aging_sla_recheck',tx,handoff,
 ownerDecision,ownerException,ownerEscalation,nonce:'ownerSla862OriginalNonce',sla,
 ownerAction:'request_fresh_independent_witness'});
assert.match(slaDigest,/^[a-f0-9]{64}$/);
const previous={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 kind:'owner_aging_sla_recheck',review_digest_sha256:slaDigest};
const exportDigest=await digest862({kind:'master_hold_custody_export',tx,handoff,
 ownerDecision,ownerException,ownerEscalation,nonce:'durableExport862OriginalNonce',
 previous,snapshotSha:'f'.repeat(64)});
assert.match(exportDigest,/^[a-f0-9]{64}$/);
await assert.rejects(()=>digest862({kind:'owner_aging_sla_recheck',tx,handoff,
 ownerDecision,ownerException,ownerEscalation,nonce:'invalidAction862OriginalNonce',
 sla,ownerAction:'approve_connected'}));
await assert.rejects(()=>digest862({kind:'master_hold_custody_export',tx,handoff,
 ownerDecision,ownerException,ownerEscalation,nonce:'invalidExport862OriginalNonce',
 previous:null,snapshotSha:'f'.repeat(64)}));
assert.equal(HOLD_862.owner_incident_closed,false);
console.log('Rosie 862 source-bound Ed25519 review, owner SLA and durable HOLD export regression PASS');
