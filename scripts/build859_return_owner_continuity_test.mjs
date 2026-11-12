import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {KIND_859,CONTRACT_859,canonicalReturn859,verifyReturn859,returnedPlanes859,
 ownerDecision859,continuity859,digest859,continuityExport859} from '../functions/api/_lib/jobday-return-859.js';
globalThis.crypto??=webcrypto;
const crypto=globalThis.crypto;
const b64=b=>Buffer.from(b).toString('base64url'),iso=n=>new Date(n).toISOString();
const keys=await Promise.all(Array.from({length:4},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>b64(await crypto.subtle.exportKey('raw',k.publicKey));
const env={CF_PAGES_COMMIT_SHA:'e'.repeat(40),
 ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859:await pub(keys[0]),
 ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859:await pub(keys[1]),
 ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(keys[2]),
 ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(keys[3])};
const now=Date.now(),booking='11111111-1111-4111-8111-111111111111',
 project='22222222-2222-4222-8222-222222222222';
const post={id:'33333333-3333-4333-8333-333333333333'};
const tx={id:'44444444-4444-4444-8444-444444444444',transaction_reference:'original859transaction',
 case_reference:'original859case',incident_reference:'original859incident'};
const readback={id:'55555555-5555-4555-8555-555555555555'};
const handoff={id:'66666666-6666-4666-8666-666666666666',kind:'conflict_escalation_handoff',
 transaction_review_id:tx.id,prior_857_readback_id:readback.id,
 review_digest_sha256:'a'.repeat(64),source_revision:'d'.repeat(40),recorded_at:iso(now-100000)};
const ownerExport={id:'77777777-7777-4777-8777-777777777777',
 kind:'owner_recovery_acceptance_export',transaction_review_id:tx.id,prior_857_readback_id:readback.id};
const base={version:1,kind:KIND_859,source_id:'rosiedazzlers',source_contract:CONTRACT_859,
 handoff_source_revision:handoff.source_revision,review_source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:booking,project_id:project,post_id:post.id,case_reference:tx.case_reference,
 incident_reference:tx.incident_reference,transaction_reference:tx.transaction_reference,
 transaction_review_id:tx.id,handoff_id:handoff.id,handoff_digest_sha256:handoff.review_digest_sha256,
 prior_857_readback_id:readback.id,receiver_claim:'independent_escalation_intake_observed',
 disposition:'escalation_review_ack_hold_only',permissions:'review_only_no_recovery_or_connection',
 issued_at:iso(now-20000),observed_at:iso(now-15000),expires_at:iso(now+120000)};
const ai={...base,plane:'ai-data-platform',nonce:'originalIndependentAiReturn859Nonce',
 signer_id:'external-ai-859-signer'};
const comms={...base,plane:'rosevear-comms-hub',nonce:'originalIndependentCommsReturn859',
 signer_id:'external-comms-859-signer'};
const sign=async(k,r)=>b64(await crypto.subtle.sign('Ed25519',k.privateKey,new TextEncoder().encode(canonicalReturn859(r))));
const context={transaction:tx,handoff,bookingId:booking,projectId:project,post,
 caseReference:tx.case_reference,incidentReference:tx.incident_reference,readback,
 actor:'originalowner@rosie.ca',now};
const a=await verifyReturn859(env,ai,await sign(keys[0],ai),{...context,plane:'ai-data-platform'});
const b=await verifyReturn859(env,comms,await sign(keys[1],comms),{...context,plane:'rosevear-comms-hub'});
assert.equal(a.ok,true,JSON.stringify(a));assert.equal(b.ok,true,JSON.stringify(b));
assert.equal(a.master_connection,'HOLD');assert.equal(a.independent_runtime_receiver_ack,false);
const check=(r,s,plane='ai-data-platform',h=handoff,e=env)=>
 verifyReturn859(e,r,s,{...context,plane,handoff:h});
assert.equal((await check({...ai,review_source_revision:'f'.repeat(40)},await sign(keys[0],ai))).ok,false);
assert.equal((await check({...ai,handoff_digest_sha256:'b'.repeat(64)},await sign(keys[0],ai))).ok,false);
assert.equal((await check({...ai,disposition:'CONNECTED'},await sign(keys[0],ai))).ok,false);
assert.equal((await check(ai,await sign(keys[1],ai))).ok,false);
assert.equal((await check(ai,await sign(keys[0],ai),'ai-data-platform',{...handoff,source_revision:'f'.repeat(40)})).ok,false);
assert.equal((await check({...ai,issued_at:iso(now-480000)},await sign(keys[0],ai))).ok,false);
assert.equal((await check(ai,await sign(keys[0],ai),'ai-data-platform',handoff,{
 ...env,ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859:env.ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859})).ok,false);
assert.throws(()=>canonicalReturn859({...ai,injected:'unexpected'}));
const rows=[{id:'88888888-8888-4888-8888-888888888888',kind:'signed_escalation_return',
 transaction_review_id:tx.id,handoff_858_id:handoff.id,review_source_revision:env.CF_PAGES_COMMIT_SHA,
 plane:'ai-data-platform',receipt_sha256:a.receipt_sha256,signer_id:ai.signer_id,recorded_at:iso(now-1000)},
 {id:'99999999-9999-4999-8999-999999999999',kind:'signed_escalation_return',
 transaction_review_id:tx.id,handoff_858_id:handoff.id,review_source_revision:env.CF_PAGES_COMMIT_SHA,
 plane:'rosevear-comms-hub',receipt_sha256:b.receipt_sha256,signer_id:comms.signer_id,recorded_at:iso(now-1000)}];
const returned=returnedPlanes859({records:rows,transaction:tx,handoff,reviewRevision:env.CF_PAGES_COMMIT_SHA});
assert.equal(returned.decision,'TWO_INDEPENDENT_RETURN_OBSERVATIONS_HOLD_ONLY');
assert.equal(returnedPlanes859({records:rows.slice(0,1),transaction:tx,handoff,reviewRevision:env.CF_PAGES_COMMIT_SHA}).decision,'HOLD');
assert.equal(returnedPlanes859({records:rows.map(r=>({...r,signer_id:'same-signer'})),
 transaction:tx,handoff,reviewRevision:env.CF_PAGES_COMMIT_SHA}).decision,'HOLD');
const aging={decision:'AGING_REVIEW_ONLY',open_conflict_count:2,conflict_aging_status:'OPEN_ESCALATION_DUE'};
const decision=ownerDecision859({transaction:tx,readback,handoff,ownerExport,returns:returned,
 aging,ownerAction:'request_independent_master_recheck'});
assert.equal(decision.decision,'ORIGINAL_OWNER_RECOVERY_DECISION_HOLD_ONLY');
assert.equal(ownerDecision859({transaction:tx,readback,handoff,ownerExport,returns:returned,aging,
 ownerAction:'approve_connected'}).decision,'HOLD');
assert.equal(ownerDecision859({transaction:tx,readback,handoff,ownerExport,returns:returned,
 aging:{...aging,open_conflict_count:0},ownerAction:'maintain_external_hold'}).decision,'HOLD');
const rd=await digest859({kind:'signed_escalation_return',transaction:tx,handoff,returns:a,aging,
 nonce:'originalReturn859NonceHash12345'});
assert.match(rd,/^[0-9a-f]{64}$/);
const digest=await digest859({kind:'owner_recovery_decision',transaction:tx,handoff,returns:returned,aging,
 action:'maintain_external_hold',nonce:'originalOwnerDecision859Nonce12'});
assert.match(digest,/^[0-9a-f]{64}$/);
const owner={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',kind:'owner_recovery_decision',
 transaction_review_id:tx.id,review_digest_sha256:digest,owner_action:'maintain_external_hold'};
const first=continuity859({decision:owner,aging,now});
assert.equal(first.continuity_status,'INITIAL_OWNER_HOLD_CHECKPOINT');
const prior={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',kind:'incident_continuity_checkpoint',
 transaction_review_id:tx.id,review_digest_sha256:'c'.repeat(64),recorded_at:iso(now-72*3600000)};
assert.equal(continuity859({decision:owner,previous:prior,aging,now}).continuity_status,'GAP_REVIEW_REQUIRED');
const d=await digest859({kind:'incident_continuity_checkpoint',transaction:tx,handoff,decision:owner,
 aging,status:first.continuity_status,nonce:'originalContinuity859Nonce12345'});
assert.match(d,/^[0-9a-f]{64}$/);
const exportResult=await continuityExport859({transaction:tx,handoff,returns:returned,ownerDecision:owner,
 checkpoints:[{id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',kind:'incident_continuity_checkpoint',
 transaction_review_id:tx.id,review_digest_sha256:d,recorded_at:iso(now),
 previous_checkpoint_id:null,continuity_status:first.continuity_status}],aging,now:iso(now)});
assert.equal(exportResult.bundle.assessment.master_connection,'HOLD');
assert.equal(exportResult.bundle.assessment.incident_closed,false);
await assert.rejects(()=>continuityExport859({transaction:tx,handoff,returns:returned,
 ownerDecision:owner,checkpoints:[{id:'no',kind:'incident_continuity_checkpoint',
 transaction_review_id:tx.id,review_digest_sha256:d}],aging}));
console.log('Rosie 859 signed independent escalation return, owner HOLD and continuity-chain regression PASS');
