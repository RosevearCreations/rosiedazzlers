import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {ACK_SCHEMA919,HOST_SCHEMA919,verifyReceiver919,verifyHostWitness919,project919} from '../assets/build919-ack-recovery-contract.mjs';
const keys=()=>{const pair=generateKeyPairSync('ed25519');const publicKeySpkiBase64=pair.publicKey.export({format:'der',type:'spki'}).toString('base64');return {pair,pin:{publicKeySpkiBase64,fingerprintSha256:null,expectedCommit:'a'.repeat(40)}}};
const receiver=keys(),host=keys(),sourcePin={fingerprintSha256:'f'.repeat(64)};
for(const v of [receiver,host])v.pin.fingerprintSha256=Buffer.from(await crypto.subtle.digest('SHA-256',Buffer.from(v.pin.publicKeySpkiBase64,'base64'))).toString('hex');
host.pin.hostId='REES-ORIGINAL-HOST';
const now=1800000000000,sourceReceiptId='11111111-1111-4111-8111-111111111111',receiverReceiptId='22222222-2222-4222-8222-222222222222',
 staff='33333333-3333-4333-8333-333333333333',original='44444444-4444-4444-8444-444444444444',witnessId='55555555-5555-4555-8555-555555555555';
const source={id:sourceReceiptId,app_id:'rosevear-ai-hub',source_commit:'b'.repeat(40),event_id:'source_event_12345678',signature_sha256:'c'.repeat(64),
 event_kind:'HOST_BOOT_OBSERVED',observed_at_ms:now-20000,source_signed_at_ms:now-18000,created_at:new Date(now-15000).toISOString(),registered_by_staff_id:original};
const signIt=(p,k)=>({payload:p,signature:sign(null,Buffer.from(canonical918(p)),k.pair.privateKey).toString('hex')});
const p={schema:ACK_SCHEMA919,receiverId:'ai-data-platform',receiverCommit:'a'.repeat(40),sourceAppId:'rosevear-ai-hub',sourceCommit:'b'.repeat(40),
 sourceReceiptId,sourceEventId:source.event_id,sourceSignatureSha256:source.signature_sha256,deliveryId:'delivery_original_12345678',deliveryNonce:'d'.repeat(32),
 receiverReceiptId,receivedAtMs:now-10000,issuedAtMs:now-8000,expiresAtMs:now+30000,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const ok=await verifyReceiver919({envelope:signIt(p,receiver),pin:receiver.pin,source,nowMs:now});
assert.equal(ok.state,'SIGNED_RECEIVER_ACK_REVIEW_ONLY');assert.equal(ok.connected,false);
for(const bad of [{...p,sourceReceiptId:receiverReceiptId},{...p,receiverCommit:'f'.repeat(40)},{...p,dataClass:'CUSTOMER'},{...p,receivedAtMs:now-10000000},{...p,authorizesAction:true}]){
 await assert.rejects(verifyReceiver919({envelope:signIt(bad,receiver),pin:receiver.pin,source,nowMs:now}));}
await assert.rejects(verifyReceiver919({envelope:signIt(p,host),pin:receiver.pin,source,nowMs:now}));
const w={id:witnessId,receipt_id:sourceReceiptId,witnessed_by_staff_id:staff,evidence_sha256:'e'.repeat(64)};
const hp={schema:HOST_SCHEMA919,sourceReceiptId,sourceSignatureSha256:source.signature_sha256,hostId:host.pin.hostId,bootId:'1'.repeat(32),bootTimeMs:now-100000,
 windowsEventDigestSha256:'2'.repeat(64),serviceReadbackDigestSha256:'3'.repeat(64),originalWitnessEvidenceSha256:w.evidence_sha256,witnessStaffId:staff,
 issuedAtMs:now-8000,expiresAtMs:now+30000,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesRestart:false};
const hostOk=await verifyHostWitness919({envelope:signIt(hp,host),pin:host.pin,source,staffWitness:w,sourcePin,actorId:staff,nowMs:now});
assert.equal(hostOk.state,'SIGNED_HOST_SECOND_WITNESS_REVIEW_ONLY');assert.equal(hostOk.physicalRecoveryVerified,false);
await assert.rejects(verifyHostWitness919({envelope:signIt({...hp,witnessStaffId:original},host),pin:host.pin,source,staffWitness:w,sourcePin,actorId:staff,nowMs:now}));
await assert.rejects(verifyHostWitness919({envelope:signIt(hp,host),pin:{...host.pin,fingerprintSha256:sourcePin.fingerprintSha256},source,staffWitness:w,sourcePin,actorId:staff,nowMs:now}));
assert.equal(project919([source],[{source_app_id:'rosevear-ai-hub'}],[{host_id:'REES-ORIGINAL-HOST'}]).sevenSourceConnected,false);
const sql=readFileSync('sql/2026-11-22_build919_receiver_ack_original_host_review.sql','utf8');
for(const word of ['enable row level security','unique(receiver_id,delivery_nonce)','unique(receiver_id,delivery_id)','SIGNED_RECEIVER_ACK_REVIEW_ONLY','SIGNED_HOST_SECOND_WITNESS_REVIEW_ONLY','before insert','grant select,insert','w.witnessed_by_staff_id<>new.reviewed_by_staff_id'])assert.ok(sql.includes(word),word);
const api=readFileSync('functions/api/admin/sysop_919.js','utf8');
const ui=readFileSync('assets/build919-receiver-admin.mjs','utf8');
const html=readFileSync('admin-sysop-919.html','utf8');
for(const word of ['requireStaffAccess','allowLegacyAdminFallback:false','SAME_ORIGIN_REQUIRED','verifyReceiver919','verifyHostWitness919','onRequestDelete=deny','ORIGINAL_ADMIN_SESSION_REQUIRED'])assert.ok(api.includes(word),word);
assert.match(ui,/textContent/);assert.match(ui,/credentials:'same-origin'/);assert.match(html,/Signed/);
assert.doesNotMatch(api,/method:\s*['"]DELETE['"]|\.delete\(|\breboot\s*\(/i);
assert.doesNotMatch(ui,/innerHTML|localStorage|setInterval|service_role/i);
console.log('Build919 pinned receiver ACK correlation, independent host signature review, SQL privacy and no CONNECTED promotion PASS');