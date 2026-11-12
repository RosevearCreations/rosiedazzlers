import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_861,HOLD_861,canonicalDiscrepancy861,verifyDiscrepancy861,
 intakeExceptionAging861,digest861} from '../functions/api/_lib/jobday-exception-861.js';
globalThis.crypto??=webcrypto;
const c=globalThis.crypto,now=Date.now(),iso=n=>new Date(n).toISOString(),
 b64=b=>Buffer.from(b).toString('base64url');
const keys=await Promise.all(Array.from({length:4},()=>c.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>b64(await c.subtle.exportKey('raw',k.publicKey));
const env={CF_PAGES_COMMIT_SHA:'e'.repeat(40),
 ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861:await pub(keys[0]),
 ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861:await pub(keys[1]),
 ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860:await pub(keys[2]),
 ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860:await pub(keys[3])};
const booking='11111111-1111-4111-8111-111111111111',
 project='22222222-2222-4222-8222-222222222222',
 postId='33333333-3333-4333-8333-333333333333';
const tx={id:'44444444-4444-4444-8444-444444444444',transaction_reference:'transaction861original'},
 handoff={id:'55555555-5555-4555-8555-555555555555',review_digest_sha256:'a'.repeat(64)},
 ownerDecision={id:'66666666-6666-4666-8666-666666666666'},
 ownerException={id:'77777777-7777-4777-8777-777777777777',
   kind:'owner_continuity_exception_review',transaction_review_id:tx.id,
   review_digest_sha256:'b'.repeat(64),recorded_at:iso(now-52*3600000)},
 intakes=['ai-data-platform','rosevear-comms-hub'].map((plane,i)=>({
 id:i?'99999999-9999-4999-8999-999999999999':'88888888-8888-4888-8888-888888888888',
 kind:'signed_external_intake_correlation',transaction_review_id:tx.id,
 handoff_858_id:handoff.id,owner_decision_859_id:ownerDecision.id,plane,
 receipt_sha256:i?'c'.repeat(64):'d'.repeat(64),
 recorded_at:iso(now-60000),observed_at:iso(now-30000)}));
const base={version:1,kind:'independent_custodian_discrepancy_claim',
 source_id:'rosiedazzlers',contract:CONTRACT_861,source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:booking,project_id:project,post_id:postId,transaction_review_id:tx.id,
 handoff_858_id:handoff.id,owner_decision_859_id:ownerDecision.id,
 owner_exception_860_id:ownerException.id,
 owner_exception_860_sha256:ownerException.review_digest_sha256,
 discrepancy_code:'INTAKE_DIGEST_DISPUTED',disposition:'unresolved_claim_owner_hold_only',
 issued_at:iso(now-12000),expires_at:iso(now+120000)};
const receipts=intakes.map((i,n)=>({...base,plane:i.plane,intake_860_id:i.id,
 intake_860_sha256:i.receipt_sha256,disputed_intake_sha256:n?'f'.repeat(64):'a'.repeat(64),
 nonce:n?'originalCommsDiscrepancyNonce861':'originalAiDiscrepancyNonce861',
 signer_id:n?'external-comms-861':'external-ai-861'}));
const sign=async(k,r)=>b64(await c.subtle.sign('Ed25519',k.privateKey,
 new TextEncoder().encode(canonicalDiscrepancy861(r))));
const context=(i,n)=>({plane:i.plane,tx,handoff,ownerDecision,intake:i,
 ownerException,bookingId:booking,projectId:project,postId,now});
const signature=await sign(keys[0],receipts[0]);
const checked=await verifyDiscrepancy861(env,receipts[0],signature,context(intakes[0],0));
assert.equal(checked.ok,true,JSON.stringify(checked));
assert.equal(checked.master_connected,false);
assert.equal(checked.external_discrepancy_resolved,false);
assert.equal((await verifyDiscrepancy861(env,receipts[1],await sign(keys[1],receipts[1]),
 context(intakes[1],1))).ok,true);
const verify=(r,s=signature,e=env,ctx=context(intakes[0]))=>
 verifyDiscrepancy861(e,r,s,ctx);
assert.equal((await verify({...receipts[0],disposition:'CONNECTED'})).ok,false);
assert.equal((await verify({...receipts[0],disputed_intake_sha256:intakes[0].receipt_sha256},
 await sign(keys[0],{...receipts[0],disputed_intake_sha256:intakes[0].receipt_sha256}))).ok,false);
assert.equal((await verify({...receipts[0],transaction_review_id:intakes[1].id})).ok,false);
assert.equal((await verify(receipts[0],await sign(keys[1],receipts[0]))).ok,false);
assert.equal((await verify({...receipts[0],issued_at:iso(now-900000)},
 await sign(keys[0],{...receipts[0],issued_at:iso(now-900000)}))).ok,false);
assert.equal((await verify(receipts[0],signature,{...env,
 ROSIE_COMMS_DISCREPANCY_ED25519_PUBLIC_KEY_861:env.ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861})).ok,false);
assert.equal((await verify(receipts[0],signature,{...env,
 ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860:env.ROSIE_AIDATA_DISCREPANCY_ED25519_PUBLIC_KEY_861})).ok,false);
assert.throws(()=>canonicalDiscrepancy861({...receipts[0],unexpected:true}));
const age=intakeExceptionAging861({intakes,exceptions:[ownerException],
 discrepancies:[],txId:tx.id,now});
assert.equal(age.aging_status,'CRITICAL_HOLD');
assert.ok(age.issues.includes('OPEN_EXCEPTION_OVER_48H'));
const stale=intakeExceptionAging861({intakes:intakes.map(i=>({...i,observed_at:iso(now-3600000)})),
 exceptions:[ownerException],discrepancies:[],txId:tx.id,now});
assert.equal(stale.independent_intake_status,'STALE');
const missing=intakeExceptionAging861({intakes:[],exceptions:[ownerException],
 discrepancies:[],txId:tx.id,now});
assert.equal(missing.independent_intake_status,'MISSING');
const disputed=intakeExceptionAging861({intakes,exceptions:[ownerException],
 discrepancies:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 kind:'signed_external_custodian_discrepancy',transaction_review_id:tx.id,
 recorded_at:iso(now-1000)}],txId:tx.id,now});
assert.ok(disputed.issues.includes('UNRESOLVED_CUSTODIAN_DISCREPANCY'));
assert.equal(intakeExceptionAging861({intakes,exceptions:[ownerException],
 discrepancies:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 kind:'signed_external_custodian_discrepancy',transaction_review_id:postId,
 recorded_at:iso(now)}],txId:tx.id,now}).decision,'HOLD');
const d1=await digest861({kind:'signed_external_custodian_discrepancy',
 tx,handoff,ownerDecision,nonce:'originalDiscrepancyDigestNonce861',checked,
 intake:intakes[0],ownerException});
assert.match(d1,/^[a-f0-9]{64}$/);
const d2=await digest861({kind:'owner_hold_escalation_review',
 tx,handoff,ownerDecision,nonce:'originalHoldEscalationNonce861',
 aging:age,action:'request_independent_custodian_reconciliation'});
assert.match(d2,/^[a-f0-9]{64}$/);
await assert.rejects(()=>digest861({kind:'owner_hold_escalation_review',
 tx,handoff,ownerDecision,nonce:'invalidHoldEscalationNonce861',
 aging:age,action:'mark_connected'}));
assert.equal(HOLD_861.master_connected,false);
console.log('Rosie 861 independent signature, intake aging, discrepancy triage and owner HOLD history PASS');
