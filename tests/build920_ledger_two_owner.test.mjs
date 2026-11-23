import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {verifyLedgerReadback920,verifyOwnerWitness920,project920,LEDGER_SCHEMA920,OWNER_SCHEMA920} from '../assets/build920-field-ceremony-contract.mjs';
const keys=()=>{const pair=generateKeyPairSync('ed25519');const publicKeySpkiBase64=pair.publicKey.export({format:'der',type:'spki'}).toString('base64');return {pair,pin:{publicKeySpkiBase64,expectedCommit:'a'.repeat(40)}}};
const ledger=keys(),ackSigner=keys(),hostSigner=keys(),owner1=keys(),owner2=keys();
for(const k of [ledger,ackSigner,hostSigner,owner1,owner2])k.pin.fingerprintSha256=Buffer.from(await crypto.subtle.digest('SHA-256',Buffer.from(k.pin.publicKeySpkiBase64,'base64'))).toString('hex');
const signed=(payload,key)=>({payload,signature:sign(null,Buffer.from(canonical918(payload)),key.pair.privateKey).toString('hex')});
const now=1800000000000,ackReviewId='11111111-1111-4111-8111-111111111111',sourceReceiptId='22222222-2222-4222-8222-222222222222',
 receiverReceiptId='33333333-3333-4333-8333-333333333333',ledgerEntryId='44444444-4444-4444-8444-444444444444',
 ceremonyId='55555555-5555-4555-8555-555555555555',hostReviewId='66666666-6666-4666-8666-666666666666',
 primaryOwner='77777777-7777-4777-8777-777777777777',secondOwner='88888888-8888-4888-8888-888888888888';
const ack={id:ackReviewId,source_receipt_id:sourceReceiptId,receiver_id:'ai-data-platform',receiver_commit:'a'.repeat(40),
 receiver_receipt_id:receiverReceiptId,delivery_id:'original_delivery_abcdefghijkl',delivery_nonce:'b'.repeat(32),receiver_received_at_ms:now-40000};
const lp={schema:LEDGER_SCHEMA920,receiverId:ack.receiver_id,receiverCommit:ack.receiver_commit,ackReviewId,sourceReceiptId,receiverReceiptId,deliveryId:ack.delivery_id,deliveryNonce:ack.delivery_nonce,
 ledgerEntryId,ledgerEntrySha256:'c'.repeat(64),ledgerHeadSha256:'d'.repeat(64),ledgerObservedAtMs:now-20000,
 issuedAtMs:now-10000,expiresAtMs:now+50000,disposition:'DURABLE_ACK_PRESENT',dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const ok=await verifyLedgerReadback920({envelope:signed(lp,ledger),pin:ledger.pin,ack,ackSignerPin:ackSigner.pin,nowMs:now});
assert.equal(ok.reviewState,'SIGNED_INDEPENDENT_LEDGER_READBACK_REVIEW');assert.equal(ok.receiverTransportAccepted,false);
for(const bad of [{...lp,ackReviewId:sourceReceiptId},{...lp,receiverReceiptId:sourceReceiptId},{...lp,ledgerObservedAtMs:now-60000},{...lp,disposition:'AUTO_CONNECTED'},{...lp,authorizesAction:true},{...lp,issuedAtMs:now-200000}]){
 await assert.rejects(verifyLedgerReadback920({envelope:signed(bad,ledger),pin:ledger.pin,ack,ackSignerPin:ackSigner.pin,nowMs:now}));}
await assert.rejects(verifyLedgerReadback920({envelope:signed(lp,ackSigner),pin:ackSigner.pin,ack,ackSignerPin:ackSigner.pin,nowMs:now}));
await assert.rejects(verifyLedgerReadback920({envelope:signed(lp,owner1),pin:ledger.pin,ack,ackSignerPin:ackSigner.pin,nowMs:now}));
const start=now-120000,ceremony={id:ceremonyId,host_id:'ORIGINAL_REE_WINDOWS',preflight_nonce:'1'.repeat(64),created_at:new Date(start).toISOString(),expires_at:new Date(now+600000).toISOString()};
const host={id:hostReviewId,host_id:ceremony.host_id,host_witness_commit:'a'.repeat(40),boot_id:'2'.repeat(32),boot_time_ms:now-80000,
 windows_event_sha256:'3'.repeat(64),service_readback_sha256:'4'.repeat(64)};
owner1.pin.staffId=primaryOwner;owner1.pin.ownerRole='PRIMARY_OWNER';owner2.pin.staffId=secondOwner;owner2.pin.ownerRole='SECOND_OWNER';
const op={schema:OWNER_SCHEMA920,ceremonyId,preflightNonce:ceremony.preflight_nonce,hostReviewId,hostId:host.host_id,hostWitnessCommit:host.host_witness_commit,
 bootId:host.boot_id,bootTimeMs:host.boot_time_ms,windowsEventDigestSha256:host.windows_event_sha256,serviceReadbackDigestSha256:host.service_readback_sha256,
 ownerStaffId:primaryOwner,ownerRole:'PRIMARY_OWNER',ownerSignerCommit:'a'.repeat(40),observedAtMs:now-30000,issuedAtMs:now-10000,
 expiresAtMs:now+50000,physicalObservationReported:true,automaticRestartApproved:false,dataClass:'NON_SENSITIVE_AGGREGATE'};
const v=await verifyOwnerWitness920({envelope:signed(op,owner1),pin:owner1.pin,ceremony,host,hostSignerPin:hostSigner.pin,otherOwnerPin:owner2.pin,actorId:primaryOwner,nowMs:now});
assert.equal(v.ownerRole,'PRIMARY_OWNER');assert.equal(v.physicalRecoveryCertified,false);
for(const bad of [{...op,automaticRestartApproved:true},{...op,hostReviewId:ceremonyId},{...op,ownerStaffId:secondOwner},{...op,physicalObservationReported:false},{...op,preflightNonce:'f'.repeat(64)},{...op,windowsEventDigestSha256:'c'.repeat(64)}]){
 await assert.rejects(verifyOwnerWitness920({envelope:signed(bad,owner1),pin:owner1.pin,ceremony,host,hostSignerPin:hostSigner.pin,otherOwnerPin:owner2.pin,actorId:primaryOwner,nowMs:now}));}
await assert.rejects(verifyOwnerWitness920({envelope:signed(op,owner1),pin:owner1.pin,ceremony:{...ceremony,created_at:new Date(now-20000).toISOString()},host,hostSignerPin:hostSigner.pin,otherOwnerPin:owner2.pin,actorId:primaryOwner,nowMs:now}));
await assert.rejects(verifyOwnerWitness920({envelope:signed(op,owner1),pin:owner1.pin,ceremony,host,hostSignerPin:hostSigner.pin,otherOwnerPin:owner1.pin,actorId:primaryOwner,nowMs:now}));
const projection=project920({ackReviews:[ack],ledgerReviews:[{receiver_id:'ai-data-platform'}],hostReviews:[host],ceremonies:[ceremony],
 ownerReviews:[{ceremony_id:ceremonyId,owner_role:'PRIMARY_OWNER',owner_staff_id:primaryOwner},{ceremony_id:ceremonyId,owner_role:'SECOND_OWNER',owner_staff_id:secondOwner}]});
assert.equal(projection.signedTwoOwnerReportPresent,true);assert.equal(projection.originalHostPhysicallyCertified,false);assert.equal(projection.sevenSourceConnected,false);
const sql=readFileSync('sql/2026-11-22_build920_receiver_readback_preflight_two_owner.sql','utf8');
for(const x of ['enable row level security','grant select,insert','for update','unique(ceremony_id,owner_role)','unique(ceremony_id,owner_staff_id)','unique(ceremony_id,owner_pin_fingerprint_sha256)','ORIGINAL_PREFLIGHT_MUST_PRECEDE_SIGNED_WINDOWS_BOOT','SIGNED_INDEPENDENT_LEDGER_READBACK_REVIEW'])assert.ok(sql.includes(x),x);
const api=readFileSync('functions/api/admin/sysop_920.js','utf8'),ui=readFileSync('assets/build920-field-admin.mjs','utf8'),html=readFileSync('admin-sysop-920.html','utf8');
for(const x of ['requireStaffAccess','allowLegacyAdminFallback:false','SAME_ORIGIN_REQUIRED','verifyLedgerReadback920','verifyOwnerWitness920','ownerRoster(env)','ROSEVEAR_ROSIE920_OWNER_PINS_JSON','onRequestDelete=deny','open_preflight'])assert.ok(api.includes(x),x);
assert.doesNotMatch(api,/method:\s*['"]DELETE['"]|\.delete\(|\breboot\s*\(|exec\s*\(/i);
assert.doesNotMatch(ui,/innerHTML|localStorage|setInterval|service_role/i);
assert.match(ui,/textContent/);assert.match(ui,/credentials:'same-origin'/);assert.match(html,/physical reboot/i);
console.log('Rosie 920 independent ledger signer, original manual preflight, separate two-owner report and HOLD invariants PASS');
