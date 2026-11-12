import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_867,HOLD_867,KINDS_867,
 renewalAging867,routeException867,retentionAudit867,digest867}
 from '../functions/api/_lib/jobday-retention-867.js';
globalThis.crypto??=webcrypto;
const now=Date.now(),ago=h=>new Date(now-h*3600000).toISOString();
const tx={id:'11111111-1111-4111-8111-111111111111',
 transaction_reference:'original-867-owner'};
const hash=s=>s.repeat(64);
const rotation={id:'22222222-2222-4222-8222-222222222222',
 kind:'owner_private_snapshot_custody_rotation',transaction_review_id:tx.id,
 review_digest_sha256:hash('a'),recorded_at:ago(2),previous_id:null,previous_sha256:null};
const corr={id:'33333333-3333-4333-8333-333333333333',
 kind:'owner_sla_offline_receipt_correlation',transaction_review_id:tx.id,
 review_digest_sha256:hash('b'),
 review_status:'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD',
 recorded_at:ago(2),previous_id:null,previous_sha256:null};
const chk={id:'44444444-4444-4444-8444-444444444444',
 kind:'owner_signed_two_plane_exception_recheck',transaction_review_id:tx.id,
 review_digest_sha256:hash('c'),recorded_at:ago(1),
 review_status:'SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD',
 previous_id:null,previous_sha256:null};
const planes=['ai-data-platform','rosevear-comms-hub'];
const refs=planes.map((plane,i)=>({
 id:i?'55555555-5555-4555-8555-555555555555':
  '66666666-6666-4666-8666-666666666666',
 kind:'signed_master_hold_export_readback',plane,transaction_review_id:tx.id,
 review_digest_sha256:hash(i?'d':'e'),receipt_sha256:hash(i?'f':'a'),
 signer_id:i?'signed-indie-comms':'signed-indie-ai',recorded_at:ago(3)}));
const renewal=arg=>renewalAging867({rotation866:rotation,offlineRefs:refs,
 txId:tx.id,now,...arg});
assert.equal(renewal().status,'CURRENT_OWNER_CUSTODY_REFERENCE_HOLD');
assert.equal(renewal().original_owner_signed_renewal_verified,false);
assert.equal(renewal({rotation866:null}).status,'MISSING_OWNER_CUSTODY_RENEWAL_HOLD');
assert.equal(renewal({rotation866:{...rotation,recorded_at:ago(26)}}).status,
 'OWNER_CUSTODY_RENEWAL_DUE_HOLD');
assert.equal(renewal({rotation866:{...rotation,recorded_at:ago(50)}}).status,
 'OVERDUE_OWNER_CUSTODY_RENEWAL_HOLD');
assert.equal(renewal({offlineRefs:[refs[0]]}).status,
 'MISSING_OR_STALE_SIGNED_REFERENCE_HOLD');
assert.equal(renewal({offlineRefs:[{...refs[0],receipt_sha256:'fake'}]}).decision,'HOLD');
assert.equal(renewal({offlineRefs:[{...refs[0],transaction_review_id:
 '77777777-7777-4777-8777-777777777777'}]}).decision,'HOLD');
const correlation866={decision:
 'INDEPENDENT_OFFLINE_SLA_ESCALATION_REFERENCE_CORRELATION_HOLD_ONLY',
 status:'OFFLINE_SLA_REFERENCE_CORRELATED_HOLD',
 planes:refs.map(r=>({plane:r.plane,id:r.id,stale:false}))};
const recheck866={decision:'SIGNED_TWO_PLANE_HOLD_EXCEPTION_REFERENCE_RECHECK_ONLY',
 status:'SIGNED_TWO_PLANE_REFERENCE_RECHECK_HOLD',
 planes:refs.map(r=>({plane:r.plane,id:r.id,stale:false}))};
const route=arg=>routeException867({correlation866,recheck866,
 latestCorrelation866:corr,latestRecheck866:chk,
 plane:'ai-data-platform',txId:tx.id,now,...arg});
assert.equal(route().status,'OFFLINE_PLANE_EXCEPTION_REVIEW_ONLY_HOLD');
assert.equal(route().external_ack_received,false);
assert.equal(route({plane:'unknown-plane'}).decision,'HOLD');
assert.equal(route({recheck866:{...recheck866,status:'INCONSISTENT_TWO_PLANE_HOLD'}}).status,
 'DISPUTED_PLANE_RECEIPT_REFERENCE_HOLD');
assert.equal(route({correlation866:{...correlation866,planes:
 [{plane:planes[0],id:null,stale:true},correlation866.planes[1]]}}).decision,'HOLD');
assert.equal(route({latestCorrelation866:{...corr,
 review_status:'CLOSED'}}).decision,'HOLD');
const hs={owner_private_snapshot_custody_rotation:[rotation],
 owner_sla_offline_receipt_correlation:[corr],
 owner_signed_two_plane_exception_recheck:[chk]};
const audit=arg=>retentionAudit867({histories:hs,txId:tx.id,now,...arg});
assert.equal(audit().status,'COMPLETE_LOCAL_OWNER_HOLD_HISTORY_REFERENCE_HOLD');
assert.equal(audit().physical_retention_verified,false);
assert.equal(audit({histories:{...hs,owner_signed_two_plane_exception_recheck:[]}}).status,
 'MISSING_OWNER_HOLD_HISTORY_HOLD');
assert.equal(audit({histories:{...hs,owner_signed_two_plane_exception_recheck:[
 {...chk,previous_id:rotation.id,previous_sha256:rotation.review_digest_sha256}]}}).status,
 'BROKEN_OWNER_HOLD_RETENTION_CHAIN_HOLD');
assert.equal(audit({histories:{...hs,
 owner_private_snapshot_custody_rotation:[rotation,rotation]}}).status,
 'BROKEN_OWNER_HOLD_RETENTION_CHAIN_HOLD');
assert.equal(audit({histories:{...hs,
 owner_private_snapshot_custody_rotation:[{...rotation,
 transaction_review_id:'77777777-7777-4777-8777-777777777777'}]}}).decision,'HOLD');
const base={tx,sourceRevision:'f'.repeat(40),
 nonce:'ownerRetainedCustodyAuditReview867',ownerAction:'maintain_hold'};
for(const [kind,result,plane] of [
 [KINDS_867[0],renewal(),null],
 [KINDS_867[1],route(),'ai-data-platform'],
 [KINDS_867[2],audit(),null]]){
 const digest=await digest867({...base,kind,result,plane});
 assert.match(digest,/^[a-f0-9]{64}$/);
}
await assert.rejects(()=>digest867({...base,kind:KINDS_867[0],plane:null,
 result:{...renewal(),master_connected:true}}));
await assert.rejects(()=>digest867({...base,kind:KINDS_867[2],plane:null,
 ownerAction:'delete_history',result:audit()}));
assert.equal(HOLD_867.external_master_receiver_ack_verified,false);
assert.equal(CONTRACT_867,'rosie.ai-data.comms.owner-renewal-routing-retention-hold.v867');
console.log('Rosie 867 renewal aging, independent offline exception routing, immutable HOLD retention audit PASS');
