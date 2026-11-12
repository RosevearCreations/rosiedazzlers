import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_866,HOLD_866,KINDS_866,
 rotateCustody866,correlateSlaReceipt866,recheckTwoPlane866,digest866}
 from '../functions/api/_lib/jobday-rotation-866.js';
globalThis.crypto??=webcrypto;
const now=Date.now(),hours=h=>new Date(now-h*3600000).toISOString();
const tx={id:'11111111-1111-4111-8111-111111111111',
 transaction_reference:'OriginalRosie866',incident_reference:'original-866-incident'};
const sha=x=>x.repeat(64),sourceRevision='f'.repeat(40);
const ownerExport864={id:'22222222-2222-4222-8222-222222222222',
 kind:'owner_incident_continuity_export',transaction_review_id:tx.id,
 snapshot_sha256:sha('a'),recorded_at:hours(2)};
const ownerReadback865={id:'33333333-3333-4333-8333-333333333333',
 kind:'owner_continuity_snapshot_readback',transaction_review_id:tx.id,
 review_status:'PRIVATE_SNAPSHOT_MATCH_HOLD',
 latest_export_864_id:ownerExport864.id,
 snapshot_sha256:ownerExport864.snapshot_sha256,
 review_digest_sha256:sha('b'),recorded_at:hours(1)};
const verified={ok:true,verified_snapshot_sha256:ownerExport864.snapshot_sha256,
 transport_verified:false,master_connected:false};
const r=arg=>rotateCustody866({verified,ownerExport864,ownerReadback865,
 txId:tx.id,now,...arg});
const rotation=r();
assert.equal(rotation.status,'PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD');
assert.equal(rotation.private_bundle_stored,false);
assert.equal(rotation.cryptographic_key_rotated,false);
assert.equal(rotation.master_connected,false);
assert.equal(r({verified:{...verified,transport_verified:true}}).decision,'HOLD');
assert.equal(r({ownerReadback865:{...ownerReadback865,
 snapshot_sha256:sha('c')}}).decision,'HOLD');
assert.equal(r({ownerExport864:{...ownerExport864,
 transaction_review_id:'44444444-4444-4444-8444-444444444444'}}).decision,'HOLD');
assert.equal(r({previousRotation:{id:'55555555-5555-4555-8555-555555555555',
 kind:'owner_private_snapshot_custody_rotation',transaction_review_id:tx.id,
 review_digest_sha256:sha('e')}}).status,
 'PRIVATE_CUSTODY_REFERENCE_ROTATED_HOLD');
assert.equal(r({previousRotation:{id:'55555555-5555-4555-8555-555555555555',
 kind:'owner_private_snapshot_custody_rotation',
 transaction_review_id:'44444444-4444-4444-8444-444444444444',
 review_digest_sha256:sha('e')}}).decision,'HOLD');
const freshness={decision:'CRITICAL_ORIGINAL_OWNER_SLA_FRESHNESS_RECHECK_HOLD_ONLY',
 status:'CRITICAL_FOLLOWUP_FRESH_REFERENCE_HOLD'};
const latestFreshness865={id:'66666666-6666-4666-8666-666666666666',
 kind:'owner_critical_followup_freshness',transaction_review_id:tx.id,
 review_status:freshness.status,review_digest_sha256:sha('d'),recorded_at:hours(1)};
const latestEscalation865={id:'77777777-7777-4777-8777-777777777777',
 kind:'owner_two_plane_discrepancy_escalation',transaction_review_id:tx.id,
 review_status:'TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD',
 review_digest_sha256:sha('e'),recorded_at:hours(1)};
const refs=['ai-data-platform','rosevear-comms-hub'].map((plane,i)=>({
 id:i?'88888888-8888-4888-8888-888888888888':
 '99999999-9999-4999-8999-999999999999',
 kind:'signed_master_hold_export_readback',plane,transaction_review_id:tx.id,
 receipt_sha256:i?sha('a'):sha('b'),
 review_digest_sha256:i?sha('c'):sha('d'),recorded_at:hours(1)}));
const c=arg=>correlateSlaReceipt866({freshness,latestFreshness865,
 latestEscalation865,refs,txId:tx.id,now,...arg});
const corr=c();
assert.equal(corr.status,'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD');
assert.equal(corr.offline_receipt_is_external_ack,false);
assert.equal(corr.planes.length,2);
assert.equal(c({latestEscalation865:null}).status,
 'MISSING_OWNER_ESCALATION_RECEIPT_HOLD');
assert.equal(c({refs:[refs[0]]}).status,'MISSING_OFFLINE_SLA_REFERENCE_HOLD');
assert.equal(c({refs:[refs[0],{...refs[1],recorded_at:hours(25)}]}).status,
 'STALE_OFFLINE_SLA_REFERENCE_HOLD');
assert.equal(c({freshness:{...freshness,
 status:'STALE_CRITICAL_FOLLOWUP_HOLD'},
 latestFreshness865:{...latestFreshness865,
 review_status:'STALE_CRITICAL_FOLLOWUP_HOLD'}}).status,
 'SLA_ESCALATION_REFERENCE_MISMATCH_HOLD');
assert.equal(c({refs:[{...refs[0],transaction_review_id:
 '00000000-0000-4000-8000-000000000000'}]}).decision,'HOLD');
const drift864={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 kind:'owner_two_plane_drift_review',transaction_review_id:tx.id,
 review_digest_sha256:sha('f')};
const escalation={decision:'TWO_PLANE_ORIGINAL_DISCREPANCY_ESCALATION_HOLD_ONLY',
 status:'TWO_PLANE_DISCREPANCY_REVIEW_ONLY_HOLD',
 planes:refs.map(x=>({plane:x.plane,latest_offline_signed_reference_id:x.id,
  latest_offline_signed_reference_sha256:x.review_digest_sha256}))};
const e=arg=>recheckTwoPlane866({escalation,latestEscalation865,
 drift864,refs,txId:tx.id,now,...arg});
const check=e();
assert.equal(check.status,'SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD');
assert.equal(check.external_signed_receipt_verified,false);
assert.equal(e({refs:[refs[0]]}).status,'MISSING_SIGNED_TWO_PLANE_REFERENCE_HOLD');
assert.equal(e({refs:[refs[0],{...refs[1],recorded_at:hours(25)}]}).status,
 'STALE_SIGNED_TWO_PLANE_REFERENCE_HOLD');
assert.equal(e({refs:[{...refs[0],review_digest_sha256:sha('a')},refs[1]]}).status,
 'INCONSISTENT_TWO_PLANE_HOLD');
assert.equal(e({escalation:{...escalation,status:'TWO_PLANE_REFERENCE_DRIFT_HOLD'},
 latestEscalation865:{...latestEscalation865,
 review_status:'TWO_PLANE_REFERENCE_DRIFT_HOLD'}}).status,
 'INCONSISTENT_TWO_PLANE_HOLD');
assert.equal(e({latestEscalation865:{...latestEscalation865,
 review_status:'CLOSED'}}).decision,'HOLD');
const nonce='ownerOriginalCustodyRotationNonce866';
const base={tx,sourceRevision,nonce,ownerAction:'maintain_hold'};
for(const [kind,sub] of [[KINDS_866[0],{rotation}],
 [KINDS_866[1],{correlation:corr}],[KINDS_866[2],{recheck:check}]]){
 const digest=await digest866({...base,kind,...sub});
 assert.match(digest,/^[a-f0-9]{64}$/);
}
await assert.rejects(()=>digest866({...base,kind:KINDS_866[0],
 rotation:{...rotation,master_connected:true}}));
await assert.rejects(()=>digest866({...base,kind:KINDS_866[0],
 rotation,ownerAction:'close_incident'}));
assert.equal(CONTRACT_866,
 'rosie.ai-data.comms.private-owner-custody-sla-receipt-two-plane-hold.v866');
assert.equal(HOLD_866.external_master_receiver_ack_verified,false);
assert.equal(HOLD_866.owner_incident_closed,false);
console.log('Rosie 866 owner private rotation, offline SLA receipt correlation and two-plane signed HOLD recheck PASS');
