import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {inspectSourceGetTest784,SOURCE_GET_PATHS_784}
  from './ql784_source_get_test_offline.mjs';

const at=Date.parse('2026-11-07T12:00:00.000Z');
const iso=t=>new Date(t).toISOString();
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=x=>createHash('sha256').update(canonical(x)).digest('hex');
const roles=['sourceGet','broker','sourceOwner','masterOwner'];
const keys=Object.fromEntries(roles.map(role=>[role,generateKeyPairSync('ed25519')]));
const pins=Object.fromEntries(roles.map(role=>[role,
  createHash('sha256').update(keys[role].publicKey.export({type:'spki',format:'der'})).digest('hex')]));
const publicKeys=Object.fromEntries(roles.map(role=>[role,{
  publicSpkiPem:keys[role].publicKey.export({type:'spki',format:'pem'})}]));
const signed=(role,body)=>sign(null,Buffer.from(canonical(body)),keys[role].privateKey).toString('base64url');
function fixture(path=SOURCE_GET_PATHS_784[0]){
  const payload={schema:'rosie.comms.source-test-authorization.v1',source:'rosiedazzlers',
    tenant:'rosie-dazzlers',audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
    methods:['GET'],paths:SOURCE_GET_PATHS_784,maxRequests:9,
    issuedAt:iso(at-60_000),expiresAt:iso(at+600_000),
    sourceKeyPin:pins.sourceGet,brokerKeyPin:pins.broker};
  const decision=role=>{
    const body={decision:'APPROVE_TEST_ONLY',authorizationSha256:digest(payload),
      signedAt:iso(at-20_000)};
    return {...body,signature:signed(role,body)};
  };
  const request={schema:'rosie.comms.source-signed-get.v1',source:payload.source,
    tenant:payload.tenant,audience:payload.audience,environment:'TEST',method:'GET',
    path,nonce:'fixed-synthetic-test-nonce-abcdef123456',
    issuedAt:iso(at-10_000),expiresAt:iso(at+70_000),
    authorizationSha256:digest(payload)};
  const sourceRequest={envelope:request,signature:signed('sourceGet',request)};
  const receipt={schema:'rosie.comms.broker-test-get-receipt.v1',source:payload.source,
    tenant:payload.tenant,audience:payload.audience,environment:'TEST',method:'GET',
    path,requestSha256:digest(sourceRequest),authorizationSha256:digest(payload),
    nonceSha256:digest(request.nonce),decision:'ACCEPTED_TEST_GET',httpStatus:200,
    observedAt:iso(at-2_000),expiresAt:request.expiresAt,customerBytes:0};
  return {publicKeys,authorization:{payload,
    sourceDecision:decision('sourceOwner'),masterDecision:decision('masterOwner')},
    sourceRequest,brokerReceipt:{envelope:receipt,signature:signed('broker',receipt)}};
}
const inspect=(packet,opts={})=>inspectSourceGetTest784({packet,pins,now:at,...opts});
for(const path of SOURCE_GET_PATHS_784){
  const result=inspect(fixture(path));
  assert.equal(result.ok,true,result.state);
  assert.equal(result.sourcePath,path);
  assert.equal(result.sourceSignedGetMechanicsVerified,true);
  assert.equal(result.brokerReceiptMechanicsVerified,true);
  assert.equal(result.ownerRenewalMechanicsVerified,true);
  for(const requiredFalse of ['originalSignerCustodyVerified',
    'independentOwnerAuthorityVerified','originalBrokerReceiptIndependentlyVerified',
    'sourceTestAuthorized','connected'])assert.equal(result[requiredFalse],false);
  assert.equal(result.connection,'DISCONNECTED / HOLD');
  assert.equal(result.networkRequests,0);
  assert.equal(JSON.stringify(result).includes('fixed-synthetic-test-nonce'),false);
}
const base=fixture();
const altered=[
  [p=>{p.authorization.payload.tenant='other-tenant';},'tenant'],
  [p=>{p.authorization.payload.paths.push('/api/customer');},'scope'],
  [p=>{p.authorization.payload.environment='PROD';},'environment'],
  [p=>{p.authorization.payload.maxRequests=10;},'request budget'],
  [p=>{p.authorization.sourceDecision.signature=p.authorization.masterDecision.signature;},'owner role swap'],
  [p=>{p.authorization.sourceDecision.decision='REVIEW_ONLY';},'review instead of approve'],
  [p=>{p.authorization.masterDecision.decision='REJECT';},'master reject'],
  [p=>{p.authorization.masterDecision.signedAt=iso(at+1);},'future signature'],
  [p=>{p.authorization.payload.expiresAt=iso(at+1_000_000);},'overlong renewal'],
  [p=>{p.sourceRequest.envelope.path='/api/admin/private';},'wrong GET path'],
  [p=>{p.sourceRequest.envelope.method='POST';},'wrong method'],
  [p=>{p.sourceRequest.envelope.audience='wrong-broker';},'wrong audience'],
  [p=>{p.sourceRequest.envelope.nonce='short';},'wrong nonce'],
  [p=>{p.sourceRequest.envelope.expiresAt=iso(at+100_000);},'overlong GET'],
  [p=>{p.sourceRequest.signature=p.brokerReceipt.signature;},'wrong source key'],
  [p=>{p.brokerReceipt.envelope.requestSha256='b'.repeat(64);},'tampered digest'],
  [p=>{p.brokerReceipt.envelope.nonceSha256='b'.repeat(64);},'replayed nonce digest'],
  [p=>{p.brokerReceipt.envelope.path=SOURCE_GET_PATHS_784[1];},'wrong receipt path'],
  [p=>{p.brokerReceipt.envelope.httpStatus=503;},'HOLD not receipt success'],
  [p=>{p.brokerReceipt.envelope.customerBytes=1;},'customer payload'],
  [p=>{p.brokerReceipt.signature=p.sourceRequest.signature;},'forged broker signature'],
  [p=>{p.brokerReceipt.envelope.customerSecret='sensitive';},'unapproved field'],
  [p=>{p.publicKeys.broker.publicSpkiPem=p.publicKeys.sourceGet.publicSpkiPem;},'broker key conflict']
];
for(const [change,label] of altered){
  const packet=structuredClone(base);change(packet);
  const r=inspect(packet);assert.equal(r.ok,false,`${label}: ${r.state}`);
  assert.equal(r.connected,false,label);assert.equal(r.networkRequests,0,label);
}
assert.equal(inspect(base,{now:at+70_000}).ok,false,'expired GET');
assert.equal(inspect(base,{now:at+600_000}).ok,false,'expired owner renewal');
assert.equal(inspect(base,{now:at-61_000}).ok,false,'premature authorization');
assert.equal(inspect(base,{pins:{...pins,broker:'f'.repeat(64)}}).ok,false,'independent broker pin');
assert.equal(inspect(base,{pins:{...pins,masterOwner:pins.sourceOwner}}).ok,false,'distinct owner keys');
assert.equal(inspect(base,{pins:{...pins,sourceGet:pins.broker}}).ok,false,'source signer pin');
assert.equal(inspect(base,{pins:null}).ok,false,'missing pins');
assert.equal(inspect(base,{now:NaN}).ok,false,'invalid time');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/Source-owned signed GET TEST readiness/);
assert.match(read('admin-integrations.html'),/Build 784/);
assert.match(read('admin-catalog.html'),/Build 784/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build784_source_get_broker_renewal_test/);
console.log('Build 784 PASS: two synthetic signed GET / broker receipt paths; independent owner signature renewal, strict 15-minute scope/90-second GET, tenant/nonce/audience/role and 23 negative cases; offline only, original authority and Comms connectivity remain HOLD.');
