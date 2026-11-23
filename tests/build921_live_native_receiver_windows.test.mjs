import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {verifyNativeReceiver921,verifyWindowsHealth921,reconcile921,API_SCHEMA921,HEALTH_SCHEMA921} from '../assets/build921-live-authority-contract.mjs';
const keys=()=>{const pair=generateKeyPairSync('ed25519');const publicKeySpkiBase64=pair.publicKey.export({format:'der',type:'spki'}).toString('base64');return {pair,pin:{expectedCommit:'a'.repeat(40),publicKeySpkiBase64}}};
const native=keys(),ledgerSigner=keys(),hostHealth=keys(),hostWitness=keys(),owner1=keys(),owner2=keys();
for(const k of [native,ledgerSigner,hostHealth,hostWitness,owner1,owner2])k.pin.fingerprintSha256=Buffer.from(await crypto.subtle.digest('SHA-256',Buffer.from(k.pin.publicKeySpkiBase64,'base64'))).toString('hex');
const signed=(payload,key)=>({payload,signature:sign(null,Buffer.from(canonical918(payload)),key.pair.privateKey).toString('hex')});
const now=1800000000000,ledgerReviewId='11111111-1111-4111-8111-111111111111',ledgerEntryId='22222222-2222-4222-8222-222222222222',
 hostReviewId='33333333-3333-4333-8333-333333333333',ceremonyId='44444444-4444-4444-8444-444444444444';
const originalLedger={id:ledgerReviewId,receiver_id:'ai-data-platform',ledger_entry_id:ledgerEntryId,ledger_entry_sha256:'b'.repeat(64),ledger_head_sha256:'c'.repeat(64),ledger_observed_at_ms:now-30000};
const nonce='d'.repeat(64);
const nativePayload={schema:API_SCHEMA921,receiverId:'ai-data-platform',receiverCommit:'a'.repeat(40),ledgerReviewId,ledgerEntryId,ledgerEntrySha256:originalLedger.ledger_entry_sha256,
 ledgerHeadSha256:originalLedger.ledger_head_sha256,challengeNonce:nonce,apiObservedAtMs:now-12000,apiSignerCommit:'a'.repeat(40),
 readMethod:'ORIGINAL_NATIVE_HTTPS_GET',entryState:'DURABLE_ENTRY_PRESENT',issuedAtMs:now-8000,expiresAtMs:now+30000,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const good=await verifyNativeReceiver921({envelope:signed(nativePayload,native),pin:native.pin,ledger:originalLedger,ledgerSignerPin:ledgerSigner.pin,challengeNonce:nonce,nowMs:now});
assert.equal(good.reviewState,'ORIGINAL_NATIVE_API_GET_SIGNATURE_VERIFIED');assert.equal(good.sevenSourceConnected,false);
for(const bad of [{...nativePayload,challengeNonce:'f'.repeat(64)},{...nativePayload,ledgerEntryId:ledgerReviewId},{...nativePayload,ledgerHeadSha256:'f'.repeat(64)},
 {...nativePayload,apiSignerCommit:'b'.repeat(40)},{...nativePayload,entryState:'MISSING'},{...nativePayload,authorizesAction:true},{...nativePayload,apiObservedAtMs:now-500000}]){
 await assert.rejects(verifyNativeReceiver921({envelope:signed(bad,native),pin:native.pin,ledger:originalLedger,ledgerSignerPin:ledgerSigner.pin,challengeNonce:nonce,nowMs:now}));}
await assert.rejects(verifyNativeReceiver921({envelope:signed(nativePayload,native),pin:native.pin,ledger:originalLedger,ledgerSignerPin:native.pin,challengeNonce:nonce,nowMs:now}));
await assert.rejects(verifyNativeReceiver921({envelope:signed(nativePayload,owner1),pin:native.pin,ledger:originalLedger,ledgerSignerPin:ledgerSigner.pin,challengeNonce:nonce,nowMs:now}));
const host={id:hostReviewId,host_id:'ORIGINAL_REE_WINDOWS',boot_id:'1'.repeat(32),boot_time_ms:now-180000};
const ceremony={id:ceremonyId,host_id:host.host_id,created_at:new Date(now-240000).toISOString(),expires_at:new Date(now+300000).toISOString()};
hostHealth.pin.hostId=host.host_id;
const sample={schema:HEALTH_SCHEMA921,hostReviewId,ceremonyId,hostId:host.host_id,bootId:host.boot_id,bootTimeMs:host.boot_time_ms,
 sampleId:'55555555-5555-4555-8555-555555555555',sampleSeq:1,sampledAtMs:now-60000,osUptimeSec:120,samplerCommit:'a'.repeat(40),
 hubApiPort:'LISTENING',caddyPort:'LISTENING',mqttPort:'NO_LISTENER',ollamaPort:'UNKNOWN',
 collectionMode:'ORIGINAL_WINDOWS_LOOPBACK_READ_ONLY',issuedAtMs:now-30000,expiresAtMs:now+30000,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const w=await verifyWindowsHealth921({envelope:signed(sample,hostHealth),pin:hostHealth.pin,host,ceremony,hostSignerPin:hostWitness.pin,ownerSignerPins:[owner1.pin,owner2.pin],nowMs:now});
assert.equal(w.evidenceState,'SIGNED_ORIGINAL_LOOPBACK_PORTS_PARTIAL_OR_UNKNOWN');assert.equal(w.physicalRecoveryCertified,false);
for(const bad of [{...sample,sampleSeq:2},{...sample,bootId:'9'.repeat(32)},{...sample,osUptimeSec:500},{...sample,sampledAtMs:now+50000},
 {...sample,collectionMode:'REMOTE_REBOOT'},{...sample,hubApiPort:'HEALTHY'},{...sample,authorizesAction:true}]){
 await assert.rejects(verifyWindowsHealth921({envelope:signed(bad,hostHealth),pin:hostHealth.pin,host,ceremony,hostSignerPin:hostWitness.pin,ownerSignerPins:[owner1.pin,owner2.pin],nowMs:now}));}
const previous={sample_seq:1,sampled_at_ms:sample.sampledAtMs,os_uptime_sec:120};
const sample2={...sample,sampleId:'66666666-6666-4666-8666-666666666666',sampleSeq:2,sampledAtMs:now-10000,osUptimeSec:170,issuedAtMs:now-3000,expiresAtMs:now+30000};
const next=await verifyWindowsHealth921({envelope:signed(sample2,hostHealth),pin:hostHealth.pin,host,ceremony,previous,hostSignerPin:hostWitness.pin,ownerSignerPins:[owner1.pin,owner2.pin],nowMs:now});
assert.equal(next.sampleSeq,2);
await assert.rejects(verifyWindowsHealth921({envelope:signed({...sample2,sampledAtMs:now-45000,osUptimeSec:135},hostHealth),pin:hostHealth.pin,host,ceremony,previous,hostSignerPin:hostWitness.pin,ownerSignerPins:[owner1.pin,owner2.pin],nowMs:now}));
await assert.rejects(verifyWindowsHealth921({envelope:signed(sample,hostHealth),pin:hostHealth.pin,host,ceremony,hostSignerPin:hostHealth.pin,ownerSignerPins:[owner1.pin,owner2.pin],nowMs:now}));
const report=reconcile921({sources:[{id:'original'}],ackReviews:[{id:'original'}],ledgerReviews:[originalLedger],nativeReviews:[{receiver_id:'ai-data-platform'}],
 hostReviews:[host],preflights:[ceremony],ownerReports:[{ceremony_id:ceremonyId,host_review_id:hostReviewId,owner_role:'PRIMARY_OWNER',owner_staff_id:'a'},{ceremony_id:ceremonyId,host_review_id:hostReviewId,owner_role:'SECOND_OWNER',owner_staff_id:'b'}],
 healthSamples:[{ceremony_id:ceremonyId,host_review_id:hostReviewId,sample_seq:1,sampled_at_ms:now-110000,hub_api_port:'LISTENING',caddy_port:'LISTENING',mqtt_port:'LISTENING',ollama_port:'LISTENING'},
 {ceremony_id:ceremonyId,host_review_id:hostReviewId,sample_seq:2,sampled_at_ms:now-70000,hub_api_port:'LISTENING',caddy_port:'LISTENING',mqtt_port:'LISTENING',ollama_port:'LISTENING'},
 {ceremony_id:ceremonyId,host_review_id:hostReviewId,sample_seq:3,sampled_at_ms:now-30000,hub_api_port:'LISTENING',caddy_port:'LISTENING',mqtt_port:'LISTENING',ollama_port:'LISTENING'}]});
assert.equal(report.fieldCases[0].threeSignedPortObservations,true);assert.equal(report.fieldCases[0].twoOwnerSignedReport,true);
assert.equal(report.physicalWindowsRebootCertified,false);assert.equal(report.receiverNetworkDeliveryAccepted,false);assert.equal(report.sevenSourceConnected,false);
const sql=readFileSync('sql/2026-11-23_build921_original_api_and_windows_health.sql','utf8');
for(const w of ['enable row level security','grant select,insert','pg_advisory_xact_lock','ORIGINAL_WINDOWS_MONOTONIC_SAMPLING_REQUIRED','ORIGINAL_NATIVE_API_LEDGER_CORRELATION_REQUIRED','before insert','unique(host_review_id,sample_seq)'])assert.ok(sql.includes(w),w);
assert.doesNotMatch(sql,/grant\s+(update|delete)/i);
const api=readFileSync('functions/api/admin/sysop_921.js','utf8');
for(const w of ['requireStaffAccess','allowLegacyAdminFallback:false','SAME_ORIGIN_REQUIRED','read_original_receiver_api','admit_windows_health_sample','redirect:','AbortSignal.timeout','ORIGINAL_NATIVE_RECEIVER_UNSAFE_ORIGIN','onRequestDelete=deny'])assert.ok(api.includes(w),w);
assert.doesNotMatch(api,/method:\s*['"]DELETE['"]|method:\s*['"]PUT['"]|\breboot\s*\(|\.delete\(|exec\s*\(/i);
const collector=readFileSync('scripts/build921-original-windows-readonly-sampler.mjs','utf8'),ui=readFileSync('assets/build921-live-admin.mjs','utf8'),html=readFileSync('admin-sysop-921.html','utf8');
for(const w of ["process.platform!=='win32'","os.uptime()","127.0.0.1","createPrivateKey","randomUUID","NET",'sampledAtMs']){if(w==='NET')continue;assert.ok(collector.includes(w),w)}
assert.doesNotMatch(collector,/execSync|spawnSync|powershell|Stop-Service|Restart-Computer|shutdown.exe/i);
assert.doesNotMatch(ui,/innerHTML|localStorage|setInterval|service_role/i);assert.match(ui,/textContent/);assert.match(ui,/credentials:'same-origin'/);assert.match(html,/read-only/i);
console.log('Rosie 921 original HTTPS receiver-native direct GET witness, signed Windows monotonic sampler and fail-closed authority reconciliation PASS');
