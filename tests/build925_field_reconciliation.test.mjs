import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign,randomUUID} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {evaluate925,digest925,reconcile925,SERVICES925} from '../assets/build925-field-reconciliation.mjs';
const roles=['INSPECTOR','PHYSICAL_WITNESS','PRIMARY_OWNER','SECOND_OWNER','PRODUCTION_WITNESS'],pins={},keys={};
for(const role of roles){const {publicKey,privateKey}=generateKeyPairSync('ed25519'),der=publicKey.export({type:'spki',format:'der'});keys[role]=privateKey;pins[role]={staffId:randomUUID(),expectedCommit:'a'.repeat(40),fingerprintSha256:createHash('sha256').update(der).digest('hex'),publicKeySpkiBase64:der.toString('base64')}}
const now=Date.now(),binding={caseId:randomUUID(),appAttestationId:randomUUID(),hostId:'original-host',bootId:'a'.repeat(32),nonce:'b'.repeat(64),productionSha:'c'.repeat(40),nativeReceiptIds:[randomUUID(),randomUUID()]};
const expected=Object.fromEntries(SERVICES925.map((id,i)=>[id,{mode:i?'SCM':'SCHEDULED_TASK',identity:id,principal:'SYSTEM',binarySha256:'d'.repeat(64)}]));
const observations=SERVICES925.map(id=>({component:id,...expected[id],state:'RUNNING',processId:123,authenticode:'VALID',processCorrelation:'VERIFIED'}));
const cd=await digest925(binding);
function envelope(role,caseDigest,evidence){const payload={schema:'rosevear.rosie.field-evidence.v925',role,staffId:pins[role].staffId,sourceCommit:pins[role].expectedCommit,caseDigest,observedAtMs:now,expiresAtMs:now+60000,evidence,authorizesAction:false};return {payload,signature:sign(null,Buffer.from(canonical918(payload)),keys[role]).toString('hex')}}
const inspector=envelope('INSPECTOR',cd,{observations}),inspectionDigest=await digest925(inspector);
const physical=envelope('PHYSICAL_WITNESS',cd,{inspectionDigest,presence:'IN_PERSON',observedRecovery:true,decision:'APPROVE'});
const production=envelope('PRODUCTION_WITNESS',cd,{deploymentId:'test-only',productionSha:binding.productionSha,canonicalSmoke:'PASS',providerStatus:'SUCCESS'});
const rd=await digest925({caseDigest:cd,inspectionDigest,physical:await digest925(physical),production:await digest925(production)});
const owners=['PRIMARY_OWNER','SECOND_OWNER'].map(r=>envelope(r,rd,{decision:'APPROVE'}));
const args={binding,pins,appFingerprint:'e'.repeat(64),expected,inspector,physical,production,owners,nowMs:now};
const good=await evaluate925(args);assert.equal(good.closureReady,true);assert.equal(good.fieldCertified,false);assert.equal(good.sevenSourceConnected,false);
assert.equal(reconcile925(observations.map((o,i)=>i?o:{...o,mode:'SCM'}),expected)[0].verified,false);
assert.equal(reconcile925(observations.map((o,i)=>i?o:{...o,processCorrelation:'UNKNOWN'}),expected)[0].verified,false);
await assert.rejects(evaluate925({...args,physical:null}));
await assert.rejects(evaluate925({...args,owners:[owners[0],owners[0]]}));
await assert.rejects(evaluate925({...args,nowMs:now+60001}));
await assert.rejects(evaluate925({...args,appFingerprint:pins.INSPECTOR.fingerprintSha256}));
await assert.rejects(evaluate925({...args,binding:{...binding,productionSha:'f'.repeat(40)}}));
const hold=await evaluate925({...args,owners:[owners[0],envelope('SECOND_OWNER',rd,{decision:'HOLD'})]});assert.equal(hold.closureReady,false);
console.log('925 signed evidence contract tests passed (synthetic fixtures only)');
