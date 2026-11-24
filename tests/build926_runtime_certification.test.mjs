import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign,randomUUID} from 'node:crypto';
import {canonical918} from '../assets/build918-signed-mesh-contract.mjs';
import {digest925,SERVICES925} from '../assets/build925-field-reconciliation.mjs';
import {evaluate926,priorReview926,validateRuntime926,verify926,validateRoster926} from '../assets/build926-runtime-certification.mjs';
const now=Date.now(),keys={};function pin(role){const k=generateKeyPairSync('ed25519'),der=k.publicKey.export({type:'spki',format:'der'});keys[role]=k.privateKey;return {staffId:randomUUID(),expectedCommit:'a'.repeat(40),fingerprintSha256:createHash('sha256').update(der).digest('hex'),publicKeySpkiBase64:der.toString('base64')}}
const rp=pin('RUNTIME_INSPECTOR'),ap=pin('CERTIFICATION_AUTHORITY'),wp=pin('PHYSICAL_WITNESS');
function env(role,p,bindingDigest,evidence){const payload={schema:'rosevear.rosie.original.v926',role,staffId:p.staffId,sourceCommit:p.expectedCommit,bindingDigest,issuedAtMs:now,expiresAtMs:now+60000,evidence,authorizesAction:false};return {payload,signature:sign(null,Buffer.from(canonical918(payload)),keys[role]).toString('hex')}}
const binding={caseId:randomUUID(),reviewId:randomUUID(),reviewDigest:'a'.repeat(64),nonce:'b'.repeat(64),productionSha:'c'.repeat(40),enrollmentDigest:'d'.repeat(64),bootId:'e'.repeat(32)};
const expected=Object.fromEntries(SERVICES925.map((s,i)=>[s,{mode:i?'SCM':'SCHEDULED_TASK',identity:s,principalSid:'S-1-5-18',definitionSha256:'a'.repeat(64),runtimeSha256:'b'.repeat(64),commandSha256:'c'.repeat(64),port:8000+i}]));
const observations=SERVICES925.map(s=>({component:s,...expected[s],runtimePid:42,lineage:'VERIFIED',listener:'OWNED',stable:true,state:'RUNNING'}));
const d=await digest925(binding),runtime=env('RUNTIME_INSPECTOR',rp,d,{observations}),ad=await digest925({bindingDigest:d,runtimeDigest:await digest925(runtime)}),approval=env('CERTIFICATION_AUTHORITY',ap,ad,{decision:'APPROVE',scope:'ORIGINAL_HOST_RUNTIME_AT_OBSERVATION'});
const args={binding,expected,runtimePin:rp,authorityPin:ap,runtime,approval,now};const v=await evaluate926(args);assert.equal(v.certified,true);assert.equal(v.sevenSourceConnected,false);assert.equal(v.continuousHealthCertified,false);
await assert.rejects(evaluate926({...args,approval:null}));await assert.rejects(evaluate926({...args,now:now+60001}));await assert.rejects(evaluate926({...args,binding:{...binding,bootId:'f'.repeat(32)}}));
assert.equal((await evaluate926({...args,approval:env('CERTIFICATION_AUTHORITY',ap,ad,{decision:'HOLD',scope:'ORIGINAL_HOST_RUNTIME_AT_OBSERVATION'})})).certified,false);
assert.equal(validateRuntime926(observations.map((x,i)=>i?x:{...x,lineage:'UNKNOWN'}),expected)[0].verified,false);
assert.equal(validateRuntime926(observations.map((x,i)=>i?x:{...x,commandSha256:'d'.repeat(64)}),expected)[0].verified,false);
const old={id:randomUUID(),binding:{productionSha:binding.productionSha}},review={case_id:old.id,review_digest:'a'.repeat(64),case_digest:'b'.repeat(64),result:{build:925,reasons:['SCM_TASK_IDENTITY_HOLD'],fieldCertified:false,sevenSourceConnected:false}};
assert.equal(priorReview926(review,old,binding.productionSha),old.binding);assert.throws(()=>priorReview926({...review,result:{...review.result,reasons:['PHYSICAL_WITNESS_HOLD']}},old,binding.productionSha));assert.throws(()=>priorReview926(review,old,'f'.repeat(40)));
const en=env('PHYSICAL_WITNESS',wp,d,{decision:'ENROLL'});assert.deepEqual(await verify926({envelope:en,pin:wp,role:'PHYSICAL_WITNESS',bindingDigest:d,now}),{decision:'ENROLL'});await assert.rejects(verify926({envelope:en,pin:ap,role:'PHYSICAL_WITNESS',bindingDigest:d,now}));
const roles={INSPECTOR:rp,PRODUCTION_WITNESS:ap,PHYSICAL_WITNESS:wp,PRIMARY_OWNER:pin('PRIMARY_OWNER'),SECOND_OWNER:pin('SECOND_OWNER')};
assert.doesNotThrow(()=>validateRoster926(roles,'f'.repeat(64),rp,ap));
assert.throws(()=>validateRoster926(roles,'f'.repeat(64),ap,rp));
assert.throws(()=>validateRoster926(roles,rp.fingerprintSha256,rp,ap));
console.log('926 runtime lineage, enrollment and scoped certification tests PASS (fixtures only)');
