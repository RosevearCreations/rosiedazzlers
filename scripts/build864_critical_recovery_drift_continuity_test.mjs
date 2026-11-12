import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_864,HOLD_864,ACTIONS_864,revalidateCritical864,
 monitorReadbackDrift864,digest864} from '../functions/api/_lib/jobday-continuity-864.js';
globalThis.crypto??=webcrypto;
const now=Date.now(),ago=h=>new Date(now-h*3600000).toISOString();
const tx={id:'11111111-1111-4111-8111-111111111111',
 transaction_reference:'originalScopedTransaction864'};
const latestSla={id:'22222222-2222-4222-8222-222222222222',
 kind:'owner_aging_sla_recheck',transaction_review_id:tx.id,
 review_digest_sha256:'a'.repeat(64),sla_status:'CRITICAL_HOLD',recorded_at:ago(2)};
const latestExport={id:'33333333-3333-4333-8333-333333333333',
 kind:'master_hold_custody_export',transaction_review_id:tx.id,
 review_digest_sha256:'b'.repeat(64),snapshot_sha256:'c'.repeat(64)};
const recon={id:'44444444-4444-4444-8444-444444444444',
 kind:'owner_post_witness_reconciliation',transaction_review_id:tx.id,
 review_digest_sha256:'d'.repeat(64)};
const criticalRow={id:'55555555-5555-4555-8555-555555555555',
 kind:'owner_critical_sla_follow_up',transaction_review_id:tx.id,
 review_digest_sha256:'e'.repeat(64),recorded_at:ago(3)};
const aging={decision:'ORIGINAL_OWNER_CRITICAL_SLA_FOLLOW_UP_HOLD_ONLY',
 status:'CRITICAL_BREACH_HOLD',original_exception_age_hours:54};
const critical=revalidateCritical864({latestSla,criticalHistory:[criticalRow],aging,now});
assert.equal(critical.decision,'ORIGINAL_OWNER_CRITICAL_RECOVERY_EVIDENCE_HOLD_ONLY');
assert.equal(critical.status,'CRITICAL_RECOVERY_RECHECK_HOLD');
assert.equal(critical.critical_breach_age_hours,6);
assert.equal(critical.critical_recovery_closed,false);
assert.equal(revalidateCritical864({latestSla,criticalHistory:[],aging,now}).status,
 'MISSING_FOLLOWUP_HOLD');
assert.equal(revalidateCritical864({latestSla:{...latestSla,recorded_at:ago(25)},
 criticalHistory:[criticalRow],aging,now}).status,'STALE_CRITICAL_RECHECK_HOLD');
assert.equal(revalidateCritical864({latestSla,criticalHistory:[{...criticalRow,recorded_at:ago(25)}],
 aging,now}).status,'STALE_CRITICAL_RECHECK_HOLD');
assert.equal(revalidateCritical864({latestSla,criticalHistory:[criticalRow],
 aging:{...aging,original_exception_age_hours:47},now}).decision,'HOLD');
assert.equal(revalidateCritical864({latestSla:{...latestSla,sla_status:'OPEN_HOLD'},
 criticalHistory:[criticalRow],aging,now}).decision,'HOLD');
assert.equal(revalidateCritical864({latestSla,criticalHistory:[
 {...criticalRow,review_digest_sha256:'spoof'}],aging,now}).decision,'HOLD');
const planes=['ai-data-platform','rosevear-comms-hub'];
const refs=planes.map((plane,i)=>({
 id:i?'77777777-7777-4777-8777-777777777777':'66666666-6666-4666-8666-666666666666',
 kind:'signed_master_hold_export_readback',plane,transaction_review_id:tx.id,
 witness_862_id:i?'99999999-9999-4999-8999-999999999999':
  '88888888-8888-4888-8888-888888888888',
 receipt_sha256:i?'1'.repeat(64):'2'.repeat(64),
 review_digest_sha256:i?'3'.repeat(64):'4'.repeat(64),
 export_862_id:latestExport.id,export_snapshot_sha256:latestExport.snapshot_sha256,
 reconciliation_863_id:recon.id,critical_followup_863_id:criticalRow.id,
 recorded_at:ago(1)
}));
const ctx=r=>({readbacks:r,latestExport,latestReconciliation:recon,
 latestCritical:criticalRow,txId:tx.id,now});
const good=monitorReadbackDrift864(ctx(refs));
assert.equal(good.decision,'PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY');
assert.equal(good.status,'BOTH_PLANES_HASH_MATCH_HOLD');
assert.equal(good.matched_plane_count,2);
assert.equal(good.two_plane_master_ack_verified,false);
assert.equal(monitorReadbackDrift864(ctx([refs[0]])).status,'MISSING_SIGNED_PLANE_HOLD');
assert.equal(monitorReadbackDrift864(ctx([])).status,'MISSING_SIGNED_PLANE_HOLD');
assert.equal(monitorReadbackDrift864(ctx([{...refs[0],recorded_at:ago(25)},refs[1]])).status,
 'STALE_SIGNED_REFERENCE_HOLD');
assert.equal(monitorReadbackDrift864(ctx([{...refs[0],export_snapshot_sha256:'5'.repeat(64)},
 refs[1]])).status,'CROSS_MASTER_HASH_DRIFT_HOLD');
assert.equal(monitorReadbackDrift864(ctx([{...refs[0],critical_followup_863_id:recon.id},
 refs[1]])).status,'CROSS_MASTER_HASH_DRIFT_HOLD');
assert.equal(monitorReadbackDrift864(ctx([{...refs[0],transaction_review_id:recon.id},
 refs[1]])).decision,'HOLD');
assert.equal(monitorReadbackDrift864(ctx([{...refs[0],receipt_sha256:'fake'},
 refs[1]])).decision,'HOLD');
const ownerEscalation={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 review_digest_sha256:'f'.repeat(64)};
const recovery=await digest864({kind:'owner_critical_recovery_recheck',
 tx,latestSla,reviewNonce:'originalOwnerCritical864Nonce001',
 critical,ownerAction:ACTIONS_864[2]});
assert.match(recovery,/^[a-f0-9]{64}$/);
const previousRecovery={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 kind:'owner_critical_recovery_recheck',review_digest_sha256:recovery};
const driftDigest=await digest864({kind:'owner_two_plane_drift_review',
 tx,latestSla,latestExport,reviewNonce:'twoPlaneDriftReview864Nonce001',
 drift:good});
assert.match(driftDigest,/^[a-f0-9]{64}$/);
const previousDrift={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 kind:'owner_two_plane_drift_review',review_digest_sha256:driftDigest};
const bundleSha='6'.repeat(64);
const exported=await digest864({kind:'owner_incident_continuity_export',
 tx,latestSla,latestExport,reviewNonce:'ownerIncidentContinuity864Nonce001',
 previous:previousDrift,bundleSha});
assert.match(exported,/^[a-f0-9]{64}$/);
const previousExport={id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
 kind:'owner_incident_continuity_export',review_digest_sha256:exported};
assert.match(await digest864({kind:'owner_incident_continuity_export',
 tx,latestSla,latestExport,reviewNonce:'ownerContinuitySecond864Nonce001',
 previous:previousDrift,previousExport,bundleSha:'7'.repeat(64)}),/^[a-f0-9]{64}$/);
await assert.rejects(()=>digest864({kind:'owner_critical_recovery_recheck',tx,latestSla,
 reviewNonce:'unsafeRecoveryOwner864Nonce',critical,ownerAction:'mark_resolved'}));
await assert.rejects(()=>digest864({kind:'owner_incident_continuity_export',tx,latestSla,
 latestExport,reviewNonce:'invalidOwnerExport864Nonce',previous:previousRecovery,
 bundleSha}));
await assert.rejects(()=>digest864({kind:'owner_incident_continuity_export',tx,latestSla,
 latestExport,reviewNonce:'invalidSnapshotOwner864Nonce',previous:previousDrift,
 bundleSha:'invalid'}));
assert.equal(CONTRACT_864,'rosie.ai-data.comms.critical-revalidation-two-plane-hold-continuity.v864');
assert.equal(HOLD_864.master_connected,false);
assert.equal(HOLD_864.original_owner_incident_closed,false);
console.log('Rosie 864 critical revalidation, two-plane signed HOLD drift, private continuity PASS');
