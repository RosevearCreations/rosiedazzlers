import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectOriginalReadback786}
  from '../assets/ql786-original-readback.mjs';

const at=Date.parse('2026-11-07T16:00:00.000Z');
const iso=n=>new Date(n).toISOString();
const device={schema:'rosevear.hub.ql355.original-authority-test-acceptance.v1',
  state:'HOLD_GENUINE_ORIGINAL_AUTHORITY_REQUIRED',
  deviceId:'rosevear-windows-hub',authenticatedPrivateOperator:false,
  originalTestReceiptVerified:false,firstPrivateTestAccepted:false,
  sourceTestAuthorized:false,connected:false,connectedCount:0,
  connectionState:'DISCONNECTED / HOLD',receiptCount:0,receiverActivated:false};
const source={schema:'rosie.comms.ql786.source-public-summary.v1',
  source:'rosiedazzlers',tenant:'rosie-dazzlers',
  audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  sourceKeyPin:'a'.repeat(64),authorizationSha256:'b'.repeat(64),
  originalSourceEnrollmentCount:0,sourceRevocationCount:0,
  originalBrokerReceiptCount:0,sourceState:'HOLD',connected:false,
  customerBytes:0,readbackAt:iso(at-2_000)};
const owners={schema:'rosie.comms.ql786.owner-public-continuity.v1',
  authorizationSha256:source.authorizationSha256,
  sourceDecision:'HOLD',masterDecision:'HOLD',
  sourceDecisionDigest:'c'.repeat(64),masterDecisionDigest:'d'.repeat(64),
  expiresAt:iso(at+300_000),independentOriginalOwnerAuthorityVerified:false};
const inspect=(v={},now=at)=>inspectOriginalReadback786({device,source,owners,
  ...v,now});
const basic=inspect();
assert.equal(basic.ok,true,basic.state);
assert.equal(basic.reportParityVerified,true);
assert.equal(basic.claimedDeviceReceiptCount,0);
assert.equal(basic.claimedBrokerReceiptCount,0);
for(const k of ['originalIssuerIndependentlyAuthenticated',
  'privateDatabaseEnrollmentIndependentlyVerified',
  'originalOwnerTestCeremonyVerified','originalBrokerGetIndependentlyAccepted',
  'originalPrivateOperatorAuthenticated','sourceTestAuthorized','connected'])
  assert.equal(basic[k],false,k);
assert.equal(basic.networkRequests,0);
// A synthetic claimed QL355 original-device receipt plus source/owner candidate
// still is NOT an independently trusted enrollment, source authorization or GET.
const acceptedDevice={...device,receiptCount:1,
  state:'FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD',
  authenticatedPrivateOperator:true,originalTestReceiptVerified:true,
  firstPrivateTestAccepted:true};
const claimedSource={...source,originalSourceEnrollmentCount:1,
  originalBrokerReceiptCount:9,sourceState:'PRIVATE_OPERATOR_REVIEW_CANDIDATE'};
const candidateOwners={...owners,sourceDecision:'TEST_APPROVAL_CANDIDATE',
  masterDecision:'TEST_APPROVAL_CANDIDATE'};
const candidate=inspect({device:acceptedDevice,source:claimedSource,owners:candidateOwners});
assert.equal(candidate.ok,true,candidate.state);
assert.equal(candidate.claimedDeviceReceiptCount,1);
assert.equal(candidate.claimedBrokerReceiptCount,9);
assert.equal(candidate.originalBrokerGetIndependentlyAccepted,false);
assert.equal(candidate.connected,false);

const invalid=[
  [{device:{...device,connected:true}},'device connected'],
  [{device:{...device,connectedCount:1}},'device connected count'],
  [{device:{...device,sourceTestAuthorized:true}},'device source grant'],
  [{device:{...device,receiptCount:1}},'device inconsistent receipt count'],
  [{device:{...device,firstPrivateTestAccepted:true}},'unproven acceptance'],
  [{device:{...device,receiverActivated:true}},'live receiver'],
  [{device:{...device,privateKey:'secret'}},'secret device field'],
  [{source:{...source,tenant:'another'}},'cross tenant'],
  [{source:{...source,environment:'PROD'}},'wrong environment'],
  [{source:{...source,sourceRevocationCount:1}},'revoked source'],
  [{source:{...source,originalBrokerReceiptCount:9}},'receipts without enrollment'],
  [{source:{...source,originalSourceEnrollmentCount:1}},'source before device'],
  [{source:{...source,customerBytes:1}},'customer bytes'],
  [{source:{...source,connected:true}},'source connected'],
  [{source:{...source,readbackAt:iso(at-301_000)}},'stale source'],
  [{source:{...source,readbackAt:iso(at+1000)}},'future readback'],
  [{source:{...source,networkUrl:'private'}},'extra field'],
  [{owners:{...owners,authorizationSha256:'e'.repeat(64)}},'different owner digest'],
  [{owners:{...owners,masterDecisionDigest:owners.sourceDecisionDigest}},'same owner role'],
  [{owners:{...owners,sourceDecision:'APPROVED'}},'unsupported approval claim'],
  [{owners:{...owners,independentOriginalOwnerAuthorityVerified:true}},'self-asserted owner authority'],
  [{owners:{...owners,expiresAt:iso(at-1)}},'expired owners'],
  [{device:acceptedDevice,source:claimedSource,owners},'missing both owner candidates'],
  [{device:acceptedDevice,source:claimedSource,owners:{...owners,masterDecision:'TEST_APPROVAL_CANDIDATE'}},'missing source owner candidate'],
  [{device:acceptedDevice,source:{...claimedSource,sourceState:'HOLD'},owners:candidateOwners},'HOLD source with broker receipts'],
];
for(const [changes,label] of invalid){
  const got=inspect(changes);
  assert.equal(got.ok,false,`${label}: ${got.state}`);
  assert.equal(got.connected,false,label);
  assert.equal(got.networkRequests,0,label);
}
assert.equal(inspect({},NaN).ok,false);
assert.equal(inspect({owners:{...owners,expiresAt:iso(at)}}).ok,false);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/Original enrollment readback and genuine TEST gate/);
assert.match(read('admin-integrations.html'),/Build 786/);
assert.match(read('admin-catalog.html'),/Build 786/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build786_original_enrollment_acceptance_test/);
assert.doesNotMatch(read('assets/ql786-original-readback.mjs'),/fetch\(/);
console.log('Build 786 PASS: QL355 device/source/dual-owner public parity, synthetic accepted-receipt claims remain nonauthorizing, 25 status/expiry/tenant/PII/scope denials, zero network, real TEST HOLD.');
