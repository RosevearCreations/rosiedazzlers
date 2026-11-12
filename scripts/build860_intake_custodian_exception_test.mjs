import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_860,HOLD_860,canonicalIntake860,verifyIntake860,
 freshCustodian860,exceptionAssessment860,digest860} from '../functions/api/_lib/jobday-intake-860.js';
globalThis.crypto??=webcrypto;
const c=globalThis.crypto,now=Date.now(),iso=n=>new Date(n).toISOString(),
 b64=b=>Buffer.from(b).toString('base64url');
const keys=await Promise.all(Array.from({length:6},()=>c.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>b64(await c.subtle.exportKey('raw',k.publicKey));
const env={CF_PAGES_COMMIT_SHA:'e'.repeat(40),
 ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860:await pub(keys[0]),
 ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860:await pub(keys[1]),
 ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859:await pub(keys[2]),
 ROSIE_COMMS_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859:await pub(keys[3]),
 ROSIE_AIDATA_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(keys[4]),
 ROSIE_COMMS_DELIVERY_WITNESS_ED25519_PUBLIC_KEY_856:await pub(keys[5])};
const booking='11111111-1111-4111-8111-111111111111',
 project='22222222-2222-4222-8222-222222222222',
 post={id:'33333333-3333-4333-8333-333333333333'},
 tx={id:'44444444-4444-4444-8444-444444444444',transaction_reference:'transaction860original'};
const handoff={id:'55555555-5555-4555-8555-555555555555',review_digest_sha256:'a'.repeat(64)};
const ownerDecision={id:'66666666-6666-4666-8666-666666666666',
 review_digest_sha256:'b'.repeat(64),owner_export_858_id:'77777777-7777-4777-8777-777777777777',
 transaction_review_id:tx.id,kind:'owner_recovery_decision'};
const checkpoint={id:'88888888-8888-4888-8888-888888888888',
 review_digest_sha256:'c'.repeat(64),owner_decision_859_id:ownerDecision.id,
 recorded_at:iso(now-120000)};
const returns=['ai-data-platform','rosevear-comms-hub'].map((plane,i)=>({
 id:i?'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa':'99999999-9999-4999-8999-999999999999',
 kind:'signed_escalation_return',plane,receipt_sha256:i?'d'.repeat(64):'f'.repeat(64),
 transaction_review_id:tx.id,handoff_858_id:handoff.id,
 owner_export_858_id:ownerDecision.owner_export_858_id,
 recorded_at:iso(now-180000)
}));
const base={version:1,kind:'independent_external_intake_correlation',
 source_id:'rosiedazzlers',contract:CONTRACT_860,source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:booking,project_id:project,post_id:post.id,case_reference:'originalcase860',
 incident_reference:'originalincident860',transaction_reference:tx.transaction_reference,
 transaction_review_id:tx.id,handoff_858_id:handoff.id,
 handoff_858_sha256:handoff.review_digest_sha256,
 owner_decision_859_id:ownerDecision.id,
 owner_decision_859_sha256:ownerDecision.review_digest_sha256,
 checkpoint_859_id:checkpoint.id,checkpoint_859_sha256:checkpoint.review_digest_sha256,
 custodian_claim:'source_bound_intake_observed',disposition:'independent_review_hold_only',
 permissions:'no_transport_or_receiver_proof_no_connection_or_closure',
 issued_at:iso(now-25000),observed_at:iso(now-20000),expires_at:iso(now+120000)};
const recs=returns.map((ret,i)=>({...base,plane:ret.plane,return_859_id:ret.id,
 return_859_sha256:ret.receipt_sha256,
 nonce:i?'distinctExternalCommsIntakeNonce860':'distinctExternalAiIntakeNonce860',
 signer_id:i?'distinct-comms-860-signer':'distinct-ai-860-signer'}));
const sign=async(k,r)=>b64(await c.subtle.sign('Ed25519',k.privateKey,
 new TextEncoder().encode(canonicalIntake860(r))));
const context={tx,handoff,ownerDecision,checkpoint,bookingId:booking,
 projectId:project,post,caseReference:base.case_reference,
 incidentReference:base.incident_reference,now};
const results=await Promise.all(recs.map(async(r,i)=>verifyIntake860(env,r,
 await sign(keys[i],r),{...context,plane:r.plane,returnRow:returns[i]})));
results.forEach((x,i)=>assert.equal(x.ok,true,JSON.stringify({i,x})));
assert.equal(results[0].external_intake_delivery_verified,false);
assert.equal(results[0].master_connected,false);
const check=(r,s,e=env,ctx=context)=>verifyIntake860(e,r,s,
 {...ctx,plane:'ai-data-platform',returnRow:returns[0]});
const good=await sign(keys[0],recs[0]);
assert.equal((await check({...recs[0],source_revision:'f'.repeat(40)},good)).ok,false);
assert.equal((await check({...recs[0],handoff_858_sha256:'9'.repeat(64)},good)).ok,false);
assert.equal((await check({...recs[0],disposition:'CONNECTED'},good)).ok,false);
assert.equal((await check(recs[0],await sign(keys[1],recs[0]))).ok,false);
assert.equal((await check({...recs[0],observed_at:iso(now-400000)},good)).ok,false);
assert.equal((await check(recs[0],good,{...env,
 ROSIE_COMMS_INTAKE_ED25519_PUBLIC_KEY_860:env.ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860})).ok,false);
assert.equal((await check(recs[0],good,{...env,
 ROSIE_AIDATA_ESCALATION_RETURN_ED25519_PUBLIC_KEY_859:env.ROSIE_AIDATA_INTAKE_ED25519_PUBLIC_KEY_860})).ok,false);
assert.equal((await check(recs[0],good,env,{...context,
 checkpoint:{...checkpoint,id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}})).ok,false);
assert.throws(()=>canonicalIntake860({...recs[0],extra:'tamper'}));
const intakes=results.map((x,i)=>({
 id:i?'cccccccc-cccc-4ccc-8ccc-cccccccccccc':'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
 kind:'signed_external_intake_correlation',transaction_review_id:tx.id,
 handoff_858_id:handoff.id,owner_decision_859_id:ownerDecision.id,
 return_859_id:returns[i].id,plane:returns[i].plane,source_revision:env.CF_PAGES_COMMIT_SHA,
 receipt_sha256:x.receipt_sha256,signer_id:x.signer_id,
 observed_at:x.observed_at,recorded_at:iso(now-10000)
}));
const current=freshCustodian860({returns,intakes,tx,handoff,ownerDecision,
 revision:env.CF_PAGES_COMMIT_SHA,now});
assert.equal(current.decision,'TWO_FRESH_INDEPENDENT_INTAKE_REVIEWS_HOLD_ONLY');
assert.equal(current.return_status,'CURRENT');assert.equal(current.intake_status,'FRESH');
assert.equal(freshCustodian860({returns,intakes:intakes.slice(0,1),tx,handoff,
 ownerDecision,revision:env.CF_PAGES_COMMIT_SHA,now}).intake_status,'MISSING');
assert.equal(freshCustodian860({returns:returns.map(x=>({...x,
 recorded_at:iso(now-90000000)})),intakes,tx,handoff,
 ownerDecision,revision:env.CF_PAGES_COMMIT_SHA,now}).return_status,'STALE');
assert.equal(freshCustodian860({returns,intakes:intakes.map(x=>({...x,
 observed_at:iso(now-500000)})),tx,handoff,ownerDecision,
 revision:env.CF_PAGES_COMMIT_SHA,now}).intake_status,'STALE');
const aging={decision:'AGING_REVIEW_ONLY',open_conflict_count:2,
 conflict_aging_status:'OPEN_ESCALATION_DUE'};
const assessed=exceptionAssessment860({custody:current,latestCheckpoint:checkpoint,aging,now});
assert.equal(assessed.decision,'ORIGINAL_OWNER_EXCEPTION_REVIEW_HOLD_ONLY');
assert.deepEqual(assessed.issues,['UNRESOLVED_ORIGINAL_CONFLICT']);
assert.ok(exceptionAssessment860({custody:current,latestCheckpoint:null,aging,now})
 .issues.includes('MISSING_CONTINUITY_CHECKPOINT'));
assert.ok(exceptionAssessment860({custody:current,
 latestCheckpoint:{...checkpoint,recorded_at:iso(now-49*3600000)},aging,now})
 .issues.includes('CONTINUITY_GAP_OVER_48H'));
const checked=await digest860({kind:'signed_external_intake_correlation',tx,handoff,
 ownerDecision,returnRow:returns[0],checked:results[0],
 latestCheckpoint:checkpoint,nonce:'originalIntake860Nonce123456789'});
assert.match(checked,/^[a-f0-9]{64}$/);
const d=await digest860({kind:'owner_continuity_exception_review',tx,handoff,
 ownerDecision,assessment:assessed,latestCheckpoint:checkpoint,
 action:'request_new_independent_receipts',nonce:'ownerException860Nonce1234567'});
assert.match(d,/^[a-f0-9]{64}$/);
await assert.rejects(()=>digest860({kind:'owner_continuity_exception_review',
 tx,handoff,ownerDecision,assessment:assessed,
 action:'approve_connected',nonce:'invalidOwnerDecision860Nonce'}));
await assert.rejects(()=>digest860({kind:'signed_external_intake_correlation',
 tx,handoff,ownerDecision,returnRow:returns[0],
 checked:{...results[0],receipt_sha256:'invalid'},
 latestCheckpoint:checkpoint,nonce:'invalidIntake860Nonce12345'}));
assert.equal(HOLD_860.incident_closed,false);
console.log('Rosie 860 signed source-bound external intake, independent custodian freshness, owner HOLD exception tests PASS');
