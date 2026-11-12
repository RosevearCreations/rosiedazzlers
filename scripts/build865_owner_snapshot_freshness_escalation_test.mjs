import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {hash860} from '../functions/api/_lib/jobday-intake-860.js';
import {CONTRACT_865,HOLD_865,ACTIONS_865,readbackSnapshot865,
 freshness865,escalation865,digest865} from '../functions/api/_lib/jobday-readback-865.js';
globalThis.crypto??=webcrypto;
const now=Date.now(),iso=t=>new Date(t).toISOString(),ago=h=>iso(now-h*3600000);
const tx={id:'11111111-1111-4111-8111-111111111111',
 transaction_reference:'originalTransaction865',incident_reference:'incident-owner-865'};
const latestSla={id:'22222222-2222-4222-8222-222222222222',
 kind:'owner_aging_sla_recheck',transaction_review_id:tx.id,
 review_digest_sha256:'a'.repeat(64),sla_status:'CRITICAL_HOLD',recorded_at:ago(2)};
const latestPrivateExport={id:'33333333-3333-4333-8333-333333333333',
 kind:'master_hold_custody_export',snapshot_sha256:'b'.repeat(64)};
const recovery864={id:'44444444-4444-4444-8444-444444444444',
 kind:'owner_critical_recovery_recheck',transaction_review_id:tx.id,
 latest_sla_862_id:latestSla.id,review_digest_sha256:'c'.repeat(64),
 recorded_at:ago(1)};
const drift864={id:'55555555-5555-4555-8555-555555555555',
 kind:'owner_two_plane_drift_review',review_digest_sha256:'d'.repeat(64)};
const ownerCritical={id:'66666666-6666-4666-8666-666666666666',
 kind:'owner_critical_sla_follow_up',latest_sla_862_id:latestSla.id,
 review_digest_sha256:'e'.repeat(64),recorded_at:ago(1)};
const exportRow={id:'77777777-7777-4777-8777-777777777777',
 kind:'owner_incident_continuity_export',transaction_review_id:tx.id,
 source_revision:'f'.repeat(40),
 latest_recovery_864_id:recovery864.id,latest_drift_864_id:drift864.id,
 reconciliation_863_id:'88888888-8888-4888-8888-888888888888',
 critical_followup_863_id:ownerCritical.id,
 previous_export_id:null,previous_export_sha256:null,recorded_at:ago(0.05)};
const bundle={format:'rosie.original-owner-critical-continuity-hold.v864',
 generated_at:ago(0.08),source_revision:exportRow.source_revision,
 transaction_review_id:tx.id,incident_reference:tx.incident_reference,
 latest_sla_862_id:latestSla.id,latest_sla_862_sha256:latestSla.review_digest_sha256,
 private_export_862_id:latestPrivateExport.id,
 private_export_snapshot_862_sha256:latestPrivateExport.snapshot_sha256,
 latest_863_owner_reconciliation_id:exportRow.reconciliation_863_id,
 latest_863_owner_critical_followup_id:ownerCritical.id,
 critical_evidence_revalidation:{decision:'ORIGINAL_OWNER_CRITICAL_RECOVERY_EVIDENCE_HOLD_ONLY'},
 two_plane_readback_drift:{decision:'PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY'},
 latest_864_recovery_id:recovery864.id,
 latest_864_recovery_sha256:recovery864.review_digest_sha256,
 latest_864_drift_id:drift864.id,
 latest_864_drift_sha256:drift864.review_digest_sha256,
 previous_continuity_export_id:null,previous_continuity_export_sha256:null,
 source_history_truncated:false,delivery_state:'NOT_TRANSMITTED_HOLD_ONLY',
 original_owner_incident_closed:false,external_handoff_completed:false,
 master_connected:false};
exportRow.snapshot_sha256=await hash860('ROSIE-864-PRIVATE-ORIGINAL-OWNER-CONTINUITY-HOLD-V1\n'+
 JSON.stringify(bundle));
const ctx=b=>({bundle:b,exportRow,tx,latestSla,latestPrivateExport,now});
const verified=await readbackSnapshot865(ctx(bundle));
assert.equal(verified.ok,true,JSON.stringify(verified));
assert.equal(verified.transport_verified,false);
assert.equal(verified.master_connected,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 delivery_state:'MASTER_ACK'}))).ok,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 latest_sla_862_sha256:'1'.repeat(64)}))).ok,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 latest_864_recovery_id:drift864.id}))).ok,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 previous_continuity_export_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}))).ok,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 critical_evidence_revalidation:{decision:'CLOSED'}}))).ok,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 master_connected:true}))).ok,false);
assert.equal((await readbackSnapshot865(ctx({...bundle,
 generated_at:ago(4)}))).ok,false);
const fresh=freshness865({criticalRecovery:recovery864,criticalFollowup:ownerCritical,
 latestSla,earliestExceptionAgeHours:53,now});
assert.equal(fresh.status,'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD');
assert.equal(fresh.original_owner_followup_required,false);
assert.equal(fresh.master_connected,false);
assert.equal(freshness865({criticalRecovery:recovery864,criticalFollowup:null,
 latestSla,earliestExceptionAgeHours:53,now}).status,
 'MISSING_CRITICAL_FOLLOWUP_HOLD');
assert.equal(freshness865({criticalRecovery:recovery864,
 criticalFollowup:{...ownerCritical,recorded_at:ago(25)},
 latestSla,earliestExceptionAgeHours:53,now}).status,
 'STALE_CRITICAL_FOLLOWUP_HOLD');
assert.equal(freshness865({criticalRecovery:recovery864,
 criticalFollowup:ownerCritical,latestSla:{...latestSla,
 recorded_at:ago(25)},earliestExceptionAgeHours:53,now}).status,
 'STALE_CRITICAL_FOLLOWUP_HOLD');
assert.equal(freshness865({criticalRecovery:recovery864,
 criticalFollowup:ownerCritical,latestSla,earliestExceptionAgeHours:47,now}).decision,'HOLD');
assert.equal(freshness865({criticalRecovery:{...recovery864,
 transaction_review_id:tx.id,latest_sla_862_id:drift864.id},
 criticalFollowup:ownerCritical,latestSla,earliestExceptionAgeHours:53,now}).decision,'HOLD');
const discrepancy= ['ai-data-platform','rosevear-comms-hub'].map((plane,i)=>({
 id:i?'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa':
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 kind:'signed_external_custodian_discrepancy',plane,
 transaction_review_id:tx.id,review_digest_sha256:i?'1'.repeat(64):'2'.repeat(64)}));
const refs=discrepancy.map((x,i)=>({
 id:i?'cccccccc-cccc-4ccc-8ccc-cccccccccccc':
 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
 kind:'signed_master_hold_export_readback',plane:x.plane,
 transaction_review_id:tx.id,receipt_sha256:i?'3'.repeat(64):'4'.repeat(64),
 review_digest_sha256:i?'5'.repeat(64):'6'.repeat(64),recorded_at:ago(2)}));
const drift={decision:'PROTECTED_TWO_PLANE_SIGNED_HOLD_REFERENCE_DRIFT_REVIEW_ONLY',
 status:'BOTH_PLANES_HASH_MATCH_HOLD',
 planes:discrepancy.map(x=>({plane:x.plane,status:'MATCHED_REFERENCE_ONLY'}))};
const ex=(d,ds=discrepancy,rs=refs)=>escalation865({drift:d,discrepancies:ds,
 latestSigned:rs,txId:tx.id,now});
const good=ex(drift);
assert.equal(good.status,'TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD');
assert.equal(good.live_master_receiver_ack,false);
assert.equal(ex({...drift,status:'MISSING_SIGNED_PLANE_HOLD'}).status,
 'MISSING_INDEPENDENT_REFERENCE_HOLD');
assert.equal(ex({...drift,status:'STALE_SIGNED_REFERENCE_HOLD'}).status,
 'STALE_TWO_PLANE_REFERENCE_HOLD');
assert.equal(ex({...drift,status:'CROSS_MASTER_HASH_DRIFT_HOLD'}).status,
 'TWO_PLANE_REFERENCE_DRIFT_HOLD');
assert.equal(ex(drift,[discrepancy[0]]).status,
 'MISSING_DISCREPANCY_CUSTODY_HOLD');
assert.equal(ex(drift,[{...discrepancy[0],transaction_review_id:ownerCritical.id}],
 refs).decision,'HOLD');
assert.equal(ex(drift,discrepancy,[{...refs[0],receipt_sha256:'spoof'}]).decision,'HOLD');
const ds=await digest865({kind:'owner_continuity_snapshot_readback',
 tx,latestSla,export864:exportRow,recovery864,nonce:'uniqueOwnerSnapshotReadbackNonce865',
 readback:verified});
assert.match(ds,/^[a-f0-9]{64}$/);
const df=await digest865({kind:'owner_critical_followup_freshness',
 tx,latestSla,recovery864,nonce:'uniqueOwnerSlaFreshnessNonce865',freshness:fresh,
 action:'request_fresh_original_owner_sla'});
assert.match(df,/^[a-f0-9]{64}$/);
const de=await digest865({kind:'owner_two_plane_discrepancy_escalation',
 tx,latestSla,recovery864,drift864,nonce:'uniqueOwnerDiscrepancyEscalationNonce865',
 escalation:good,action:'escalate_to_independent_custodians'});
assert.match(de,/^[a-f0-9]{64}$/);
await assert.rejects(()=>digest865({kind:'owner_critical_followup_freshness',
 tx,latestSla,recovery864,nonce:'invalidClosedOwnerActionNonce865',freshness:fresh,
 action:'approve_operational_closure'}));
await assert.rejects(()=>digest865({kind:'owner_continuity_snapshot_readback',
 tx,latestSla,export864:exportRow,recovery864,
 nonce:'tamperedOriginalOwnerSnapshotNonce865',
 readback:{...verified,ok:false}}));
assert.equal(CONTRACT_865,'rosie.ai-data.comms.owner-snapshot-freshness-two-plane-hold.v865');
assert.equal(HOLD_865.external_master_receiver_ack_verified,false);
console.log('Rosie 865 private snapshot hash readback, critical freshness, two-plane HOLD escalation PASS');
