import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_863,HOLD_863,canonicalReadback863,verifyReadback863,
 reconcileWitnesses863,criticalFollowUp863,digest863}
 from '../functions/api/_lib/jobday-postwitness-863.js';
globalThis.crypto??=webcrypto;
const c=globalThis.crypto,now=Date.now(),iso=t=>new Date(t).toISOString(),
 b64=x=>Buffer.from(x).toString('base64url');
const keys=await Promise.all(Array.from({length:4},
 ()=>c.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>b64(await c.subtle.exportKey('raw',k.publicKey));
const env={CF_PAGES_COMMIT_SHA:'d'.repeat(40),
 ROSIE_AIDATA_HOLD_READBACK_ED25519_PUBLIC_KEY_863:await pub(keys[0]),
 ROSIE_COMMS_HOLD_READBACK_ED25519_PUBLIC_KEY_863:await pub(keys[1]),
 ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862:await pub(keys[2]),
 ROSIE_COMMS_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862:await pub(keys[3])};
const bookingId='11111111-1111-4111-8111-111111111111',
 projectId='22222222-2222-4222-8222-222222222222',
 postId='33333333-3333-4333-8333-333333333333',
 transactionId='44444444-4444-4444-8444-444444444444';
const tx={id:transactionId,transaction_reference:'originalTransaction863'};
const handoff={id:'55555555-5555-4555-8555-555555555555'};
const ownerException={id:'66666666-6666-4666-8666-666666666666'};
const ownerEscalation={id:'77777777-7777-4777-8777-777777777777',
 review_digest_sha256:'a'.repeat(64)};
const latestSla={id:'88888888-8888-4888-8888-888888888888',
 kind:'owner_aging_sla_recheck',transaction_review_id:tx.id,
 review_digest_sha256:'b'.repeat(64),sla_status:'CRITICAL_HOLD',
 recorded_at:iso(now-25*3600000)};
const latestExport={id:'99999999-9999-4999-8999-999999999999',
 kind:'master_hold_custody_export',transaction_review_id:tx.id,
 review_digest_sha256:'c'.repeat(64),snapshot_sha256:'d'.repeat(64)};
const reconciliation={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 kind:'owner_post_witness_reconciliation',transaction_review_id:tx.id,
 review_digest_sha256:'e'.repeat(64)};
const criticalFollowUp={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 kind:'owner_critical_sla_follow_up',transaction_review_id:tx.id,
 review_digest_sha256:'f'.repeat(64)};
const planes=['ai-data-platform','rosevear-comms-hub'];
const disputes=planes.map((plane,i)=>({id:i?
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd':'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 plane,transaction_review_id:tx.id,kind:'signed_external_custodian_discrepancy',
 review_digest_sha256:i?'1'.repeat(64):'2'.repeat(64)}));
const witnesses=planes.map((plane,i)=>({id:i?
 'ffffffff-ffff-4fff-8fff-ffffffffffff':'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
 plane,transaction_review_id:tx.id,kind:'signed_resolution_review_witness',
 discrepancy_861_id:disputes[i].id,review_digest_sha256:i?'3'.repeat(64):'4'.repeat(64),
 receipt_sha256:i?'5'.repeat(64):'6'.repeat(64)}));
const full=reconcileWitnesses863({discrepancies:disputes,witnesses,txId:tx.id});
assert.equal(full.decision,'ORIGINAL_POST_WITNESS_RECONCILIATION_HOLD_ONLY');
assert.equal(full.status,'BOTH_PLANES_WITNESS_REVIEW_HOLD');
assert.equal(full.master_connected,false);
assert.equal(reconcileWitnesses863({discrepancies:disputes,witnesses:[],txId:tx.id}).status,'NO_SIGNED_WITNESS_HOLD');
assert.equal(reconcileWitnesses863({discrepancies:disputes,witnesses:[witnesses[0]],txId:tx.id}).status,'PARTIAL_WITNESS_REVIEW_HOLD');
assert.equal(reconcileWitnesses863({discrepancies:disputes,
 witnesses:[{...witnesses[0],discrepancy_861_id:disputes[1].id}],txId:tx.id}).status,'WITNESS_CONFLICT_HOLD');
assert.equal(reconcileWitnesses863({discrepancies:disputes,
 witnesses:[{...witnesses[0],transaction_review_id:ownerException.id}],txId:tx.id}).decision,'HOLD');
const age={decision:'ORIGINAL_OWNER_SLA_RECHECK_HOLD_ONLY',
 original_exception_age_hours:51,sla_status:'CRITICAL_HOLD'};
const critical=criticalFollowUp863({sla:age,latestSla,now});
assert.equal(critical.decision,'ORIGINAL_OWNER_CRITICAL_SLA_FOLLOW_UP_HOLD_ONLY');
assert.equal(critical.critical_breach_age_hours,3);
assert.equal(critical.follow_up_recheck_due,true);
assert.equal(critical.master_connected,false);
assert.equal(criticalFollowUp863({sla:{...age,original_exception_age_hours:47},latestSla,now}).decision,'HOLD');
assert.equal(criticalFollowUp863({sla:{...age,sla_status:'OPEN_HOLD'},latestSla,now}).decision,'HOLD');
assert.equal(criticalFollowUp863({sla:age,latestSla:{...latestSla,
 kind:'master_hold_custody_export'},now}).decision,'HOLD');
const base={version:1,kind:'independent_master_hold_reference_readback',source_id:'rosiedazzlers',
 contract:CONTRACT_863,source_revision:env.CF_PAGES_COMMIT_SHA,
 booking_id:bookingId,project_id:projectId,post_id:postId,
 transaction_review_id:tx.id,handoff_858_id:handoff.id,
 owner_exception_860_id:ownerException.id,
 owner_escalation_861_id:ownerEscalation.id,
 owner_escalation_861_sha256:ownerEscalation.review_digest_sha256,
 sla_862_id:latestSla.id,sla_862_sha256:latestSla.review_digest_sha256,
 export_862_id:latestExport.id,export_862_sha256:latestExport.review_digest_sha256,
 export_snapshot_862_sha256:latestExport.snapshot_sha256,
 reconciliation_863_id:reconciliation.id,
 reconciliation_863_sha256:reconciliation.review_digest_sha256,
 critical_followup_863_id:criticalFollowUp.id,
 critical_followup_863_sha256:criticalFollowUp.review_digest_sha256,
 review_claim:'master_export_hash_reference_reviewed_hold_only',
 disposition:'offline_reference_only_no_transport_or_ack',issued_at:iso(now-12000),
 expires_at:iso(now+200000)};
const receipts=planes.map((plane,i)=>({...base,plane,
 witness_862_id:witnesses[i].id,witness_862_sha256:witnesses[i].review_digest_sha256,
 nonce:i?'newCommsOfflineReferenceReadbackNonce863':'newAiOfflineReferenceReadbackNonce863',
 signer_id:i?'comms-reference-only-863':'ai-reference-only-863'}));
const sign=async (k,r)=>b64(await c.subtle.sign('Ed25519',k.privateKey,
 new TextEncoder().encode(canonicalReadback863(r))));
const ctx=i=>({plane:planes[i],tx,handoff,ownerException,ownerEscalation,
 witness:witnesses[i],latestSla,latestExport,reconciliation,criticalFollowUp,
 bookingId,projectId,postId,now});
const aiSig=await sign(keys[0],receipts[0]);
const verified=await verifyReadback863(env,receipts[0],aiSig,ctx(0));
assert.equal(verified.ok,true,JSON.stringify(verified));
assert.equal(verified.cross_master_export_delivered,false);
assert.equal(verified.independent_master_ack_verified,false);
assert.equal((await verifyReadback863(env,receipts[1],await sign(keys[1],receipts[1]),ctx(1))).ok,true);
const check=(r,sig=aiSig,e=env,co=ctx(0))=>verifyReadback863(e,r,sig,co);
assert.equal((await check({...receipts[0],disposition:'MASTER_CONNECTED'})).ok,false);
assert.equal((await check({...receipts[0],export_snapshot_862_sha256:'0'.repeat(64)})).ok,false);
assert.equal((await check({...receipts[0],critical_followup_863_id:ownerException.id})).ok,false);
assert.equal((await check(receipts[0],await sign(keys[1],receipts[0]))).ok,false);
assert.equal((await check(receipts[0],aiSig,{...env,
 ROSIE_COMMS_HOLD_READBACK_ED25519_PUBLIC_KEY_863:env.ROSIE_AIDATA_HOLD_READBACK_ED25519_PUBLIC_KEY_863})).ok,false);
assert.equal((await check(receipts[0],aiSig,{...env,
 ROSIE_AIDATA_RESOLUTION_WITNESS_ED25519_PUBLIC_KEY_862:env.ROSIE_AIDATA_HOLD_READBACK_ED25519_PUBLIC_KEY_863})).ok,false);
const stale={...receipts[0],issued_at:iso(now-3600000)};
assert.equal((await check(stale,await sign(keys[0],stale))).ok,false);
assert.throws(()=>canonicalReadback863({...receipts[0],foo:'unsafe'}));
const reconDigest=await digest863({kind:'owner_post_witness_reconciliation',
 tx,ownerEscalation,latestSla,nonce:'reconciliationDigestOriginalNonce863',reconciliation:full});
assert.match(reconDigest,/^[a-f0-9]{64}$/);
const ownerDigest=await digest863({kind:'owner_critical_sla_follow_up',
 tx,ownerEscalation,latestSla,nonce:'criticalOwnerDigestOriginalNonce863',
 critical,ownerAction:'escalate_critical_sla_to_original_owner'});
assert.match(ownerDigest,/^[a-f0-9]{64}$/);
assert.match(await digest863({kind:'signed_master_hold_export_readback',
 tx,ownerEscalation,latestSla,nonce:'protectedReadbackDigestNonce863',
 checked:verified}),/^[a-f0-9]{64}$/);
await assert.rejects(()=>digest863({kind:'owner_critical_sla_follow_up',
 tx,ownerEscalation,latestSla,nonce:'invalidActionDigestNonce863',
 critical,ownerAction:'allow_master_connected'}));
assert.equal(HOLD_863.original_owner_incident_closed,false);
console.log('Rosie 863 post-witness reconciliation, critical SLA and signed HOLD hash-reference regression PASS');
