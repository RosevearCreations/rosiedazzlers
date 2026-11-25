import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign,randomUUID} from 'node:crypto';
import {config930,evaluate930,receiverChain930,roles930,components930} from '../assets/build930-signed-guest-custody.mjs';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {digest925} from '../assets/build925-field-reconciliation.mjs';
const now=1800000000000,h=c=>c.repeat(64),sha='a'.repeat(40),keys={},pins={};
for(const role of roles930){const k=generateKeyPairSync('ed25519');keys[role]=k.privateKey;const der=k.publicKey.export({type:'spki',format:'der'});pins[role]={staffId:randomUUID(),expectedCommit:sha,fingerprintSha256:createHash('sha256').update(der).digest('hex'),publicKeySpkiBase64:der.toString('base64')}}
const expectedLaunchers=Object.fromEntries(components930.map((x,i)=>[x,{definitionSha256:h('a'),launcherSha256:h('b'),binarySha256:h('c'),port:[8765,8443,11434][i]}]));
const config={pins,hostId:'original-test-host',guestIdentitySha256:h('d'),expectedLaunchers,productionSha:sha},configDigest=await config930(config);
await assert.rejects(()=>config930(config,[pins.GUEST_WITNESS.fingerprintSha256]));
const pair=['ai-data-platform','rosevear-comms-hub'].map((receiverId,i)=>({receiverId,witnessId:randomUUID(),ledgerReviewId:randomUUID(),observedAtMs:now-5000,signatureSha256:h('a'),fingerprintSha256:h(i?'b':'c'),sourceCommit:sha,challengeNonce:h(i?'e':'f')}));
const mk=(receivers,prior)=>({caseId:randomUUID(),nonce:h('9'),hostId:config.hostId,productionSha:sha,configDigest,priorReceiptId:prior?.id??null,receivers});
const envelope=(role,bindingDigest,evidence)=>{const payload={schema:'rosevear.rosie.original.v926',role,staffId:pins[role].staffId,sourceCommit:sha,bindingDigest,issuedAtMs:now,expiresAtMs:now+120000,evidence,authorizesAction:false};return {payload,signature:sign(null,Buffer.from(canonical918(payload)),keys[role]).toString('hex')}};
async function bundle(binding,boot,prior=null,mutate=false){const d=await digest925(binding),bootTimeMs=boot.result===2?now-200000:now-100000;const guest=envelope('GUEST_WITNESS',d,{hostId:config.hostId,bootTimeMs,guestIdentitySha256:h('d'),endpointEvidenceSha256:h('e'),brokerEvidenceSha256:h('f'),vmRunning:true,mqttCredentialHandshake:!mutate,guestBrokerOwnership:true});const launcher=envelope('LAUNCHER_INSPECTOR',d,{hostId:config.hostId,bootTimeMs,observations:components930.map((component,i)=>({component,...expectedLaunchers[component],pid:100+i,startedAtMs:bootTimeMs+1000,launchReceiptSha256:h(String(i+1)),processIdentityVerified:true,receiptCorrelated:true})),bootTask:boot});const authority=envelope('CUSTODY_AUTHORITY',await digest925({bindingDigest:d,guestDigest:await digest925(guest),launcherDigest:await digest925(launcher)}),{decision:'APPROVE',scope:'SIGNED_ORIGINAL_OBSERVATION_ONLY'});return {binding,config,configDigest,guest,launcher,authority,prior,now}}
const first=await bundle(mk(pair,null),{result:2,runAtMs:now-190000,logSha256:h('a'),reasonCodes:['GATEWAY_HOLD'],logCorrelated:true,preLoginWitnessed:false});
const v=await evaluate930(first);assert.equal(v.guestSignedObservationAccepted,true);assert.equal(v.bootHoldClosed,false);assert.equal(v.fieldCertified,false);assert.equal(v.receiverContinuity,'FRESH_PAIR_BASELINE_ONLY');
const prior={id:randomUUID(),result:v},next=pair.map((x,i)=>({...x,witnessId:randomUUID(),challengeNonce:h(i?'1':'2'),signatureSha256:h('3'),observedAtMs:now-1000}));
const boot={result:0,runAtMs:now-90000,logSha256:h('b'),reasonCodes:[],logCorrelated:true,preLoginWitnessed:true};
const second=await bundle(mk(next,prior),boot,prior);const out=await evaluate930(second);assert.equal(out.bootHoldClosed,true);assert.equal(out.receiverContinuity,'NEW_WITNESSES_SAME_PINNED_LEDGER');assert.equal(out.sevenSourceConnected,false);
assert.equal((await evaluate930(await bundle(mk(next,prior),boot,prior,true))).bootHoldClosed,false);
assert.equal((await evaluate930(await bundle(mk(next,prior),{...boot,preLoginWitnessed:false},prior))).bootHoldClosed,false);
assert.equal(receiverChain930(pair,pair,now),'CONTINUITY_HOLD');
assert.throws(()=>receiverChain930(pair.map(x=>({...x,observedAtMs:now-300001})),null,now));
await assert.rejects(()=>evaluate930({...second,guest:{...second.guest,signature:'0'.repeat(128)}}));
await assert.rejects(()=>evaluate930({...second,now:now+300001}));
console.log('Build 930 independent signatures, custody, boot closure and continuity tests passed');
