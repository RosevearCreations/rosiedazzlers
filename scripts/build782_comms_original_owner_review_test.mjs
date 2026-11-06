import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign,webcrypto} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {inspectOwnerReview782,brokerReceiptReview782}
  from '../assets/ql782-comms-review.mjs';

const now=Date.parse('2026-11-08T12:00:00Z');
const hash=s=>createHash('sha256').update(s).digest('hex');
const canonical=x=>Array.isArray(x)?'['+x.map(canonical).join(',')+']':
  x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}':JSON.stringify(x);
function key(){
  const k=generateKeyPairSync('ed25519');
  const spki=k.publicKey.export({type:'spki',format:'der'});
  return {publicKeyPem:k.publicKey.export({type:'spki',format:'pem'}),
    spkiSha256:hash(spki),privateKey:k.privateKey};
}
const source=key(),master=key();
const digestFields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const challenge={schema:'rosevear.hub.ql345.issuer-owner-review-challenge.v1',
  state:'ORIGINAL_ISSUER_AND_OWNER_REVIEW_ONLY_NOT_SIGNABLE',
  issuedAt:new Date(now-60_000).toISOString(),expiresAt:new Date(now+1_140_000).toISOString(),
  environment:'TEST',audience:'rosevear-comms-hub:nonproduction',
  observationSha256:'f'.repeat(64),
  evidenceDigests:Object.fromEntries(digestFields.map((x,i)=>[x,String(i+1).repeat(64)])),
  tlsCertificateFileSha256:'9'.repeat(64),
  ownerAuthorityPins:{schema:'rosevear.hub.ql339b.owner-authorities.v1',
    source:{keyId:'ree-source-1',publicKeyPem:source.publicKeyPem},
    master:{keyId:'jack-master-1',publicKeyPem:master.publicKeyPem}},
  deviceKeyId:'hub-device-1',rollbackKind:'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
  originalIssuerIndependentlyConfirmed:false,sourceOwnerEnrollmentApproved:false,
  masterOwnerEnrollmentApproved:false,requestMayBeSigned:false,
  receiverActivated:false,databaseEnrollmentCreated:false,connected:false};
const challengeSha256=hash(canonical(challenge));
function decision(role,choice='REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'){
  const actor=role==='source'?source:master;
  const signedAt=new Date(now-1_000).toISOString();
  return {schema:'rosevear.hub.ql345.independent-owner-review-decision.v1',
    role,keyId:challenge.ownerAuthorityPins[role].keyId,decision:choice,
    challengeSha256,signedAt,
    signature:sign(null,Buffer.from(`${role}:${choice}:${challengeSha256}:${signedAt}`),
      actor.privateKey).toString('base64url'),enrollmentAuthorized:false};
}
const inputs={challenge,sourceDecision:decision('source'),masterDecision:decision('master'),
  pinnedSourceSpki:source.spkiSha256,pinnedMasterSpki:master.spkiSha256,now,
  subtle:webcrypto.subtle};
const check=x=>inspectOwnerReview782(x);
const accepted=await check(inputs);
assert.equal(accepted.ok,true);
assert.equal(accepted.signatureMechanicsVerified,true);
assert.equal(accepted.state,'DUAL_REVIEW_SIGNATURES_CRYPTOGRAPHICALLY_VALID_ISSUER_AND_TEST_HELD');
for(const field of ['originalIssuerAuthenticated','independentOwnerIdentityAuthenticated',
  'enrollmentAuthorized','brokerChallengeAuthorized','sourceSignedReceiptsVerified'])
  assert.equal(accepted[field],false,field);
assert.equal(accepted.networkRequests,0);
assert.equal(accepted.connection,'DISCONNECTED / HOLD');
assert.equal((await check({...inputs,pinnedSourceSpki:'a'.repeat(64)})).ok,false);
assert.equal((await check({...inputs,pinnedMasterSpki:source.spkiSha256})).ok,false);
assert.equal((await check({...inputs,now:now+1_200_000})).ok,false);
assert.equal((await check({...inputs,challenge:{...challenge,connected:true}})).ok,false);
assert.equal((await check({...inputs,challenge:{...challenge,sourceOwnerEnrollmentApproved:true}})).ok,false);
assert.equal((await check({...inputs,challenge:{...challenge,privateKey:'UNSAFE'}})).ok,false);
assert.equal((await check({...inputs,challenge:{...challenge,audience:'production'}})).ok,false);
assert.equal((await check({...inputs,challenge:{...challenge,evidenceDigests:{...challenge.evidenceDigests,rollbackWitnessSha256:'1'.repeat(64)}}})).ok,false);
assert.equal((await check({...inputs,sourceDecision:{...inputs.sourceDecision,decision:'HOLD'}})).ok,false);
assert.equal((await check({...inputs,masterDecision:inputs.sourceDecision})).ok,false);
assert.equal((await check({...inputs,sourceDecision:{...inputs.sourceDecision,enrollmentAuthorized:true}})).ok,false);
assert.equal((await check({...inputs,masterDecision:{...inputs.masterDecision,signature:'a'.repeat(86)}})).ok,false);
assert.equal((await check({...inputs,subtle:null})).ok,false);
const hold=await check({...inputs,sourceDecision:decision('source','HOLD')});
assert.equal(hold.ok,true);
assert.equal(hold.state,'ORIGINAL_OWNER_HOLD_OR_REJECT_REVIEWED_TEST_STOP');
assert.equal(hold.enrollmentAuthorized,false);
const rejected=await check({...inputs,masterDecision:decision('master','REJECT')});
assert.equal(rejected.ok,true);
assert.equal(rejected.state,'ORIGINAL_OWNER_HOLD_OR_REJECT_REVIEWED_TEST_STOP');
const register=brokerReceiptReview782({publicReview:accepted,
  sourceRevision:'a'.repeat(40),now});
assert.equal(register.unsigned,true);
assert.equal(register.notAnAuthorization,true);
assert.equal(register.owner_review_signature_mechanics_checked,true);
assert.equal(register.max_future_gets,9);
assert.equal(register.max_future_window_minutes,15);
assert.equal(register.expected_positive.length,2);
assert.equal(register.expected_denials.length,7);
assert.equal(new Set(register.expected_denials.map(x=>x.reason)).size,7);
assert.ok(register.expected_positive.every(x=>x.original_signed_source_receipt==='NOT_RECEIVED'));
assert.ok(register.expected_denials.every(x=>x.original_denial_trace==='NOT_RUN'));
assert.equal(register.test_enrollment_authorized,false);
assert.equal(register.connected,false);
assert.equal(register.networkRequests,0);
assert.equal(brokerReceiptReview782({now}).owner_review_signature_mechanics_checked,false);

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.match(read('admin-comms-hub-v781.html'),/Original signer &amp; separate-owner QL-345 public review/);
assert.match(read('admin-comms-hub-v781.html'),/ql782-comms-owner-review\.js/);
assert.match(read('admin-integrations.html'),/Build 782/);
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('assets/ql782-comms-owner-review.js'),/Verify public review signatures locally|inspectOwnerReview782/);
assert.doesNotMatch(read('assets/ql782-comms-owner-review.js'),/fetch\(/);
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
console.log('Build 782 PASS: valid original-owner Ed25519 REVIEW signatures only; forged, expired, swapped, cross-role, altered, elevated and unpinned cases DENIED; nine future slots HOLD; no network or authority.');
