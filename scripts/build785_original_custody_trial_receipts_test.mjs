import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {inspectBrokerTrial785,DENIAL_CASES_785}
  from './ql785_broker_trial_receipts_offline.mjs';
import {SOURCE_GET_PATHS_784} from './ql784_source_get_test_offline.mjs';

const now=Date.parse('2026-11-07T13:00:00.000Z');
const iso=n=>new Date(n).toISOString();
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canonical(v)).digest('hex');
const roles=['sourceGet','broker','sourceOwner','masterOwner'];
const keys=Object.fromEntries(roles.map(role=>[role,generateKeyPairSync('ed25519')]));
const pins=Object.fromEntries(roles.map(role=>[role,
  createHash('sha256').update(keys[role].publicKey.export({type:'spki',format:'der'})).digest('hex')]));
const publicKeys=Object.fromEntries(roles.map(role=>[role,{
  publicSpkiPem:keys[role].publicKey.export({type:'spki',format:'pem'})}]));
const signed=(role,value)=>sign(null,Buffer.from(canonical(value)),keys[role].privateKey).toString('base64url');

function buildNine(){
  const payload={schema:'rosie.comms.source-test-authorization.v1',
    source:'rosiedazzlers',tenant:'rosie-dazzlers',
    audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
    methods:['GET'],paths:SOURCE_GET_PATHS_784,maxRequests:9,
    issuedAt:iso(now-60_000),expiresAt:iso(now+600_000),
    sourceKeyPin:pins.sourceGet,brokerKeyPin:pins.broker};
  const decision=role=>{
    const value={decision:'APPROVE_TEST_ONLY',authorizationSha256:sha(payload),
      signedAt:iso(now-30_000)};
    return {...value,signature:signed(role,value)};
  };
  const authorization={payload,sourceDecision:decision('sourceOwner'),
    masterDecision:decision('masterOwner')};
  const positivePackets=SOURCE_GET_PATHS_784.map((path,i)=>{
    const request={schema:'rosie.comms.source-signed-get.v1',
      source:payload.source,tenant:payload.tenant,audience:payload.audience,
      environment:'TEST',method:'GET',path,
      nonce:'synthetic-source-get-nonce-'+i+'-abcdefghijklmnop',
      issuedAt:iso(now-20_000),expiresAt:iso(now+60_000),
      authorizationSha256:sha(payload)};
    const sourceRequest={envelope:request,signature:signed('sourceGet',request)};
    const receipt={schema:'rosie.comms.broker-test-get-receipt.v1',
      source:payload.source,tenant:payload.tenant,audience:payload.audience,
      environment:'TEST',method:'GET',path,
      requestSha256:sha(sourceRequest),authorizationSha256:sha(payload),
      nonceSha256:sha(request.nonce),decision:'ACCEPTED_TEST_GET',httpStatus:200,
      observedAt:iso(now-10_000),expiresAt:request.expiresAt,customerBytes:0};
    return {publicKeys,authorization,sourceRequest,
      brokerReceipt:{envelope:receipt,signature:signed('broker',receipt)}};
  });
  const negativeReceipts=DENIAL_CASES_785.map(([slot,httpStatus],i)=>{
    const envelope={schema:'rosie.comms.broker-denial-receipt.v1',slot,
      source:payload.source,tenant:payload.tenant,audience:payload.audience,
      environment:'TEST',method:'GET',path:SOURCE_GET_PATHS_784[0],
      requestSha256:sha({slot,index:i}),
      nonceSha256:slot==='replayed_nonce'?
        sha(positivePackets[0].sourceRequest.envelope.nonce):
        sha('synthetic-denial-nonce-'+slot),
      authorizationSha256:sha(payload),decision:'DENIED_TEST_GET',httpStatus,
      observedAt:iso(now-5_000),expiresAt:payload.expiresAt,customerBytes:0};
    return {envelope,signature:signed('broker',envelope)};
  });
  return {positivePackets,negativeReceipts};
}
const inspect=(trial,opts={})=>inspectBrokerTrial785({...trial,pins,now,...opts});
const trial=buildNine(),valid=inspect(trial);
assert.equal(valid.ok,true,valid.state);
assert.equal(valid.positiveReceiptMechanicsVerified,2);
assert.equal(valid.negativeReceiptMechanicsVerified,7);
assert.equal(valid.receiptCandidateDigests.length,9);
assert.equal(valid.liveTrialExecuted,false);
assert.equal(valid.connected,false);
assert.equal(valid.networkRequests,0);
assert.equal(valid.genuineOwnerTestAuthorityVerified,false);
assert.equal(valid.originalSourceSignerCustodyVerified,false);
assert.equal(JSON.stringify(valid).includes('synthetic-'),false);
const negativeCases=[
  [v=>{v.positivePackets[0].sourceRequest.envelope.method='POST';},'POST'],
  [v=>{v.positivePackets[1].sourceRequest.envelope.nonce=v.positivePackets[0].sourceRequest.envelope.nonce;},'nonce reuse'],
  [v=>{v.positivePackets[1].authorization.masterDecision.decision='REJECT';},'separate owner rejection'],
  [v=>{v.positivePackets[1].authorization.payload.tenant='other';},'cross tenant'],
  [v=>{v.negativeReceipts.reverse();},'slot reorder'],
  [v=>{v.negativeReceipts.pop();},'missing denial'],
  [v=>{v.negativeReceipts[0].envelope.httpStatus=200;},'not actually denied'],
  [v=>{v.negativeReceipts[3].envelope.tenant='other';},'denial tenant mismatch'],
  [v=>{v.negativeReceipts[4].envelope.audience='evil';},'denial audience mismatch'],
  [v=>{v.negativeReceipts[5].envelope.nonceSha256='a'.repeat(64);},'replay lacks original nonce binding'],
  [v=>{v.negativeReceipts[3].envelope.nonceSha256=v.negativeReceipts[2].envelope.nonceSha256;},'denial nonce reuse'],
  [v=>{v.negativeReceipts[2].envelope.customerBytes=3;},'customer bytes'],
  [v=>{v.negativeReceipts[6].envelope.path='/api/private';},'unscoped path'],
  [v=>{v.negativeReceipts[1].signature=v.negativeReceipts[0].signature;},'forged signature'],
  [v=>{v.negativeReceipts[2].envelope.authorizationSha256='f'.repeat(64);},'wrong owner digest'],
  [v=>{v.negativeReceipts[1].envelope.requestSha256=v.negativeReceipts[0].envelope.requestSha256;},'request replay'],
  [v=>{v.negativeReceipts[0].envelope.customerEmail='private';},'extra data field'],
  [v=>{v.negativeReceipts[3].envelope.expiresAt=iso(now+700_000);},'wrong expiry'],
  [v=>{v.negativeReceipts[0].envelope.observedAt=iso(now+1);},'future observation'],
  [v=>{v.negativeReceipts[1].envelope.observedAt=iso(now-70_000);},'before owner approval'],
  [v=>{v.positivePackets[1].publicKeys.broker.publicSpkiPem=v.positivePackets[1].publicKeys.sourceGet.publicSpkiPem;},'mixed broker pin'],
  [v=>{v.positivePackets[1].authorization.sourceDecision.signedAt=iso(now-20_000);},'different owner renewal'],
];
for(const [change,label] of negativeCases){
  const altered=structuredClone(trial);change(altered);
  const result=inspect(altered);
  assert.equal(result.ok,false,`${label}: ${result.state}`);
  assert.equal(result.liveTrialExecuted,false,label);
  assert.equal(result.connected,false,label);
}
for(const [value,label] of [[null,'missing'],[{},'empty']])
  assert.equal(inspect(value).ok,false,label);
assert.equal(inspect(trial,{now:now+600_000}).ok,false,'expired renewal');
assert.equal(inspect(trial,{pins:{...pins,broker:'f'.repeat(64)}}).ok,false,'untrusted broker pin');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/First controlled broker GET trial/);
assert.match(read('admin-integrations.html'),/Build 785/);
assert.match(read('admin-catalog.html'),/Build 785/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build785_original_custody_trial_receipts_test/);
console.log('Build 785 PASS: nine signed synthetic receipts (two GET candidates plus seven denials), original-custody/owner HOLD, 22 tamper/expiry/scope/nonce/role denials; zero live traffic.');
