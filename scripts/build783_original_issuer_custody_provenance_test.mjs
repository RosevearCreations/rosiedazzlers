import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign,webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {verifyLocalOriginalIssuer783,ql783Cli}
  from './ql783_original_issuer_offline.mjs';
import {inspectCommsProvenance783}
  from '../assets/ql783-comms-provenance.mjs';

const at=Date.parse('2026-11-07T12:00:00Z');
const sha=b=>createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':
  x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
const keys=generateKeyPairSync('ed25519');
const spki=keys.publicKey.export({type:'spki',format:'der'});
const pin=sha(spki);
const deviceCandidate={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:keys.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:pin,enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const envelope={schemaVersion:'rosevear.hub.relay.heartbeat.v1',
  issuer:'rosevear-ai-hub',audience:'rosevear-comms-hub:nonproduction',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',environment:'TEST',
  sequence:1,nonce:'z'.repeat(24),
  sessionId:'12345678-1234-1234-1234-1234567890ab',
  issuedAt:new Date(at-30_000).toISOString(),
  expiresAt:new Date(at+60_000).toISOString(),
  capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'};
const packet=()=>({envelope,keyId:'hub-ql339b',
  signature:sign(null,Buffer.from(canonical(envelope)),keys.privateKey).toString('base64url')});
const proof=verifyLocalOriginalIssuer783({packet:packet(),deviceCandidate,
  outOfBandDeviceSpki:pin,now:at});
assert.equal(proof.issuerSignatureCryptographicallyValid,true);
assert.equal(proof.devicePinMatches,true);
assert.equal(proof.originalIssuerIndependentlyAuthenticated,false);
assert.equal(proof.originalIssuerOutOfBandCustodyApproved,false);
assert.equal(proof.readyForDatabaseEnrollment,false);
assert.equal(proof.connected,false);
assert.equal(proof.networkRequests,0);
assert.equal(proof.signedEnvelopeSha256,sha(canonical(envelope)));
assert.equal(JSON.stringify(proof).includes(envelope.nonce),false);
for(const altered of [
  {packet:packet(),deviceCandidate,outOfBandDeviceSpki:'a'.repeat(64)},
  {packet:{...packet(),envelope:{...envelope,environment:'PROD'}},deviceCandidate,outOfBandDeviceSpki:pin},
  {packet:{...packet(),envelope:{...envelope,capabilities:['booking.read']}},deviceCandidate,outOfBandDeviceSpki:pin},
  {packet:{...packet(),envelope:{...envelope,sequence:2}},deviceCandidate,outOfBandDeviceSpki:pin},
  {packet:{...packet(),envelope:{...envelope,queueDepth:1}},deviceCandidate,outOfBandDeviceSpki:pin},
  {packet:{...packet(),signature:'a'.repeat(86)},deviceCandidate,outOfBandDeviceSpki:pin},
  {packet:{...packet(),privateToken:'secret'},deviceCandidate,outOfBandDeviceSpki:pin},
  {packet:packet(),deviceCandidate:{...deviceCandidate,enrollmentState:'REVIEWED_TEST'},outOfBandDeviceSpki:pin},
])assert.equal(verifyLocalOriginalIssuer783({...altered,now:at}).issuerSignatureCryptographicallyValid,false);
assert.equal(verifyLocalOriginalIssuer783({packet:packet(),deviceCandidate,
  outOfBandDeviceSpki:pin,now:at+61_000}).issuerSignatureCryptographicallyValid,false);
assert.equal(ql783Cli(['--help']).networkRequests,0);
assert.throws(()=>ql783Cli(['--activate']));

const ql346={schema:'rosevear.hub.ql346.offline-test-readiness.v1',
  state:'CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD',
  issuerSignatureCryptographicallyValid:true,devicePinMatches:true,
  sourceOwnerTestSignatureValid:true,masterOwnerTestSignatureValid:true,
  originalIssuerIndependentlyAuthenticated:false,
  originalIssuerOutOfBandCustodyApproved:false,readyForDatabaseEnrollment:false,
  databaseEnrollmentCreated:false,receiverActivated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,
  signedEnvelopeSha256:proof.signedEnvelopeSha256,
  ownerRequestPayloadSha256:'b'.repeat(64)};
const receipt={schema:'rosevear.hub.ql347.custody-handoff.v1',
  ql346EvidenceSha256:sha(canonical({signedEnvelopeSha256:ql346.signedEnvelopeSha256,
    ownerRequestPayloadSha256:ql346.ownerRequestPayloadSha256})),
  issuerCustodyDecision:'HOLD',issuerEvidenceSha256:'c'.repeat(64),
  ownerDecisionDigests:[
    {role:'source',digest:'d'.repeat(64),decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'},
    {role:'master',digest:'e'.repeat(64),decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'}]};
const ql347={schema:'rosevear.hub.ql347.custody-handoff.v1',
  state:'RECONCILED_OFFLINE_HANDOFF_INDEPENDENT_AUTHORITY_HOLD',
  issuerCustodyVerified:false,ownerEnrollmentAuthorized:false,
  receiverActivated:false,databaseEnrollmentCreated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,
  receipt,receiptSha256:sha(canonical(receipt))};
const ql353={schema:'rosevear.hub.ql353.owner-session-receipt.v1',
  state:'HOLD_ORIGINAL_OWNER_DATABASE_ENROLLMENT_MISSING',
  authenticatedPrivateOperator:false,verifiedOriginalEnrollment:false,
  verifiedSignedReceipt:false,sourceTestAuthorized:false,
  connectedCount:0,connectionState:'DISCONNECTED / HOLD',
  customerCommunications:0,deviceActions:0,sourceRepositoryWrites:0,
  databaseMutations:0,automaticRetries:0,
  originalEnrollmentCount:0,originalRevocationCount:0,
  originalReceiptCount:0,heldPeerCount:6};
const ownerReview={ok:true,signatureMechanicsVerified:true,
  enrollmentAuthorized:false,challengeExpiresAt:new Date(at+90_000).toISOString()};
const inspect=o=>inspectCommsProvenance783({ql346,ql347,ql353,ownerReview,
  now:at,subtle:webcrypto.subtle,...o});
const valid=await inspect();
assert.equal(valid.ok,true);
assert.equal(valid.reportFormatAndDigestLinksVerified,true);
assert.equal(valid.state,'QL346_QL347_LINKED_QL353_NO_DEVICE_RECEIPT_SOURCE_TEST_HELD');
for(const k of ['originalIssuerIndependentlyAuthenticated','originalOwnerTestEnrollmentAuthorized',
  'originalDeviceReceiptIndependentlyVerified','brokerReceiptsIndependentlyVerified',
  'nonproductionSourceTestAuthorized','connected'])assert.equal(valid[k],false,k);
assert.equal((await inspect({now:at+91_000})).ok,false);
assert.equal((await inspect({ownerReview:{...ownerReview,enrollmentAuthorized:true}})).ok,false);
assert.equal((await inspect({ql346:{...ql346,originalIssuerIndependentlyAuthenticated:true}})).ok,false);
assert.equal((await inspect({ql346:{...ql346,nonce:'private'}})).ok,false);
assert.equal((await inspect({ql347:{...ql347,receiptSha256:'f'.repeat(64)}})).ok,false);
assert.equal((await inspect({ql347:{...ql347,receipt:{...receipt,issuerCustodyDecision:'APPROVED'}}})).ok,false);
assert.equal((await inspect({ql347:{...ql347,receipt:{...receipt,ownerDecisionDigests:[receipt.ownerDecisionDigests[1],receipt.ownerDecisionDigests[0]]}}})).ok,false);
assert.equal((await inspect({ql353:{...ql353,connectedCount:1}})).ok,false);
assert.equal((await inspect({ql353:{...ql353,originalRevocationCount:1}})).ok,false);
assert.equal((await inspect({ql353:{...ql353,verifiedSignedReceipt:true}})).ok,false);
assert.equal((await inspect({ql353:{...ql353,cookie:'private'}})).ok,false);
assert.equal((await inspect({ql353:{...ql353,customerCommunications:1}})).ok,false);
const sourceRejected=await inspect({ql347:{...ql347,state:'REJECTED_NO_ENROLLMENT',
  receipt:{...receipt,ownerDecisionDigests:[
    {...receipt.ownerDecisionDigests[0],decision:'REJECT'},receipt.ownerDecisionDigests[1]]},
  receiptSha256:sha(canonical({...receipt,ownerDecisionDigests:[
    {...receipt.ownerDecisionDigests[0],decision:'REJECT'},receipt.ownerDecisionDigests[1]]}))}});
assert.equal(sourceRejected.ok,true);
assert.equal(sourceRejected.state,'ORIGINAL_CUSTODY_HOLD_OR_REJECT_NO_TEST');

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('admin-integrations.html'),/Build 783/);
assert.match(read('admin-comms-hub-v781.html'),/Independent issuer attestation and owner decision continuity/);
assert.match(read('admin-comms-hub-v781.html'),/ql783-comms-provenance-ui\.js/);
assert.doesNotMatch(read('assets/ql783-comms-provenance-ui.js'),/fetch\(/);
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
console.log('Build 783 PASS: QL346 offline original heartbeat crypto, ninety-second expiry and no nonce disclosure; QL347 digest parity, decision expiry/rejection, QL353 zero/signed-receipt HOLD controls; no network, consent, or source grant.');
