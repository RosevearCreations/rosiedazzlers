import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign,randomUUID,createHash,webcrypto} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {verifyWindowsServiceIdentity924,checkLiveReceiverEvidence924,verifyOwnerFinalReview924,finalFieldReview924,IDENTITY_SCHEMA924,OWNER_REVIEW_SCHEMA924} from '../assets/build924-field-authority.mjs';
import {RECEIVER_PROTOCOL922,RECEIVER_PATH922} from '../assets/build922-original-application-authority-contract.mjs';
globalThis.crypto??=webcrypto;
const now=Date.now(),h40='a'.repeat(40),hex=s=>createHash('sha256').update(s).digest('hex');
const makePin=(staffId,ownerRole)=>{
 const kp=generateKeyPairSync('ed25519'),pub=kp.publicKey.export({type:'spki',format:'der'});
 return {key:kp.privateKey,pin:{expectedCommit:h40,fingerprintSha256:hex(pub),publicKeySpkiBase64:pub.toString('base64'),...(staffId?{staffId,ownerRole}:{})}};
};
const inspector=makePin(),app=makePin();
const signEnvelope=(payload,key)=>({payload,signature:sign(null,Buffer.from(canonical918(payload)),key).toString('hex')});
const source={id:randomUUID(),host_id:'original-windows-owner',boot_id:'f'.repeat(32)};
const ch={app_attestation_id:source.id,challenge_nonce:'b'.repeat(64),expires_at:new Date(now+60000).toISOString()};
const services=['hub','caddy','mqtt','ollama'].map(service=>({service,serviceName:'rosevear-'+service,state:'RUNNING',processId:5432,binarySha256:'c'.repeat(64),authenticode:'VALID',account:'LocalSystem'}));
const expectedServices=Object.fromEntries(services.map(s=>[s.service,{serviceName:s.serviceName,binarySha256:s.binarySha256,account:s.account}]));
const identity={schema:IDENTITY_SCHEMA924,hostId:source.host_id,bootId:source.boot_id,sourceAttestationId:source.id,inspectionId:randomUUID(),
 challengeNonce:ch.challenge_nonce,inspectorCommit:h40,observedAtMs:now-1000,expiresAtMs:now+30000,services,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const verify=(p,pin=inspector.pin,sourceAttestation=source,challenge=ch,fp=app.pin.fingerprintSha256)=>
 verifyWindowsServiceIdentity924({envelope:signEnvelope(p,inspector.key),pin,sourceAttestation,challenge,appSignerFingerprint:fp,expectedServices,nowMs:now});
const ok=await verify(identity);assert.equal(ok.allServiceIdentitiesObserved,true);assert.equal(ok.independentFieldCertified,false);
for(const altered of [{challengeNonce:'d'.repeat(64)},{bootId:'e'.repeat(32)},{expiresAtMs:now-1},{inspectorCommit:'e'.repeat(40)},
 {services:services.map((x,i)=>i===0?{...x,service:'browser'}:x)}])
 await assert.rejects(verify({...identity,...altered}),/ORIGINAL_924/);
await assert.rejects(verify(identity,inspector.pin,source,ch,inspector.pin.fingerprintSha256),/INDEPENDENT_INSPECTOR/);
await assert.rejects(verifyWindowsServiceIdentity924({envelope:{...signEnvelope(identity,inspector.key),signature:'0'.repeat(128)},
 pin:inspector.pin,sourceAttestation:source,challenge:ch,appSignerFingerprint:app.pin.fingerprintSha256,expectedServices,nowMs:now}),/SIGNATURE_REJECTED/);
const wrongPins={...expectedServices,hub:{...expectedServices.hub,binarySha256:'e'.repeat(64)}};
const wrongIdentity=await verifyWindowsServiceIdentity924({envelope:signEnvelope(identity,inspector.key),
 pin:inspector.pin,sourceAttestation:source,challenge:ch,appSignerFingerprint:app.pin.fingerprintSha256,
 expectedServices:wrongPins,nowMs:now});
assert.equal(wrongIdentity.allServiceIdentitiesObserved,false);
await assert.rejects(verifyWindowsServiceIdentity924({envelope:signEnvelope(identity,inspector.key),
 pin:inspector.pin,sourceAttestation:source,challenge:ch,appSignerFingerprint:app.pin.fingerprintSha256,
 nowMs:now}),/WINDOWS_SERVICE_PINS_REQUIRED/);
const unsigned=await verify({...identity,services:services.map((s,i)=>i? s:{...s,authenticode:'UNKNOWN'})});
assert.equal(unsigned.allServiceIdentitiesObserved,false);
const receiver=makePin(),rpin=receiver.pin;
const manifest={protocol:RECEIVER_PROTOCOL922,path:RECEIVER_PATH922,method:'GET',auth:'SCOPED_READ_ONLY_BEARER',
 signerAlgorithm:'Ed25519',challengeBits:256,redirects:false,maxResponseBytes:8000,dataClass:'NON_SENSITIVE_AGGREGATE',
 receiverCommit:h40,signerFingerprintSha256:rpin.fingerprintSha256};
const ids=['ai-data-platform','rosevear-comms-hub'];
const obs=ids.map((id,i)=>({id:randomUUID(),receiver_id:id,ledger_review_id:randomUUID(),challenge_nonce:String(i?'d':'e').repeat(64),
 api_observed_at_ms:now-1000,api_signer_commit:h40,api_signer_fingerprint_sha256:rpin.fingerprintSha256}));
const inputs={observations:obs,manifests:Object.fromEntries(ids.map(id=>[id,manifest])),pins:Object.fromEntries(ids.map(id=>[id,rpin])),nowMs:now};
const live=checkLiveReceiverEvidence924(inputs);assert.equal(live.twoOriginalLiveReceiversObserved,true);
for(const altered of [{observations:obs.slice(0,1)},{observations:obs.map(x=>({...x,challenge_nonce:obs[0].challenge_nonce}))},
 {observations:obs.map(x=>({...x,api_observed_at_ms:now-360000}))},{manifests:{...inputs.manifests,'ai-data-platform':{...manifest,redirects:true}}}])
 assert.throws(()=>checkLiveReceiverEvidence924({...inputs,...altered}),/ORIGINAL_/);
const staffId=randomUUID(),owner=makePin(staffId,'PRIMARY_OWNER');
const digest='1'.repeat(64);
const review={schema:OWNER_REVIEW_SCHEMA924,ownerStaffId:staffId,ownerRole:'PRIMARY_OWNER',ownerSignerCommit:h40,
 reviewId:randomUUID(),identityWitnessId:randomUUID(),caseDigestSha256:digest,decision:'APPROVE_REVIEW',
 observedAtMs:now-1000,expiresAtMs:now+30000,dataClass:'NON_SENSITIVE_AGGREGATE',authorizesAction:false};
const vr=p=>verifyOwnerFinalReview924({envelope:signEnvelope(p,owner.key),pin:owner.pin,actorId:staffId,caseDigestSha256:digest,nowMs:now});
const signedOwner=await vr(review);assert.equal(signedOwner.fieldCertified,false);
for(const change of [{ownerStaffId:randomUUID()},{ownerSignerCommit:'b'.repeat(40)},{caseDigestSha256:'2'.repeat(64)},{expiresAtMs:now-1}])
 await assert.rejects(vr({...review,...change}),/ORIGINAL_924/);
const gate=finalFieldReview924({identityWitness:{inspectionId:review.identityWitnessId,allServiceIdentitiesObserved:true},
 liveReceivers:live,ownerReviews:[signedOwner,{...signedOwner,ownerStaffId:randomUUID()}],
 independentPhysicalObservation:true,exactShaProductionVerified:true});
assert.equal(gate.reviewReady,true);assert.equal(gate.fieldCertified,false);assert.equal(gate.sevenSourceConnected,false);
assert.equal(finalFieldReview924().reviewReady,false);
const api=readFileSync('functions/api/admin/sysop_924.js','utf8'),sql=readFileSync('sql/2026-11-23_build924_independent_field_review.sql','utf8');
const ps=readFileSync('scripts/build924-original-windows-service-inspection.ps1','utf8'),agent=readFileSync('scripts/build924-original-windows-service-identity.mjs','utf8');
const signer=readFileSync('scripts/build924-original-owner-final-review.mjs','utf8'),html=readFileSync('admin-sysop-924.html','utf8');
for(const s of ['requireStaffAccess','allowLegacyAdminFallback:false','SAME_ORIGIN_REQUIRED','issue_identity_challenge','admit_service_identity','record_owner_final_review','onRequestDelete=DENY','ROSEVEAR_ROSIE924_INSPECTOR_PIN_JSON','ROSEVEAR_ROSIE924_EXPECTED_WINDOWS_SERVICES_JSON','ROSEVEAR_ROSIE920_OWNER_PINS_JSON'])assert.ok(api.includes(s),'missing private gate '+s);
for(const s of ['enable row level security','grant select,insert','pg_advisory_xact_lock','unique','challenge_nonce text not null unique'])assert.ok(sql.includes(s),'missing immutable DB '+s);
assert.doesNotMatch(sql,/grant (update|delete|all) on public\.rosie_sysop_/i);
for(const s of ['Get-CimInstance','Win32_Service','Get-FileHash','Get-AuthenticodeSignature','Win32_Process'])assert.ok(ps.includes(s));
assert.doesNotMatch(ps,/\b(Stop-Service|Start-Service|Restart-Service|Set-Service|Remove-Service|Invoke-Expression)\b/);
assert.ok(agent.includes("process.platform!=='win32'")&&agent.includes('LOCALAPPDATA')&&agent.includes('INSPECTOR_PRIVATE_KEY'));
assert.ok(signer.includes('OWNER_STAFF_ID')&&signer.includes('OWNER_SIGNER_COMMIT'));
assert.ok(html.includes('Build 924')&&html.includes('ownerEnvelope'));
console.log('Rosie 924 independent SCM identity, receiver witness, two-owner signing and fail-closed source gate PASS. Original field authority remains HOLD.');
