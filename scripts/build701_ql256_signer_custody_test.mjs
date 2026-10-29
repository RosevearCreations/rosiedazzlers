import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,statSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createPublicKey,verify} from 'node:crypto';
import {perform,validateChallenge} from './ql256_rosie_signer_custody.mjs';

const root=mkdtempSync(join(tmpdir(),'rosie-build701-signer-test-'));
const custody=join(root,'private-rosie'),response=join(root,'response.json');
const challenge=join(root,'external-challenge.json');
const fs=await import('node:fs');
try{
  const first=perform(['provision','--custody-dir',custody]);
  assert.equal(first.local_signer_status,'SIGNER_EXISTS_CUSTODY_NOT_VERIFIED');
  assert.match(first.public_spki_sha256,/^[0-9a-f]{64}$/);
  assert.equal(first.private_custodian_origin,'NOT_INDEPENDENTLY_VERIFIED');
  assert.equal(first.owner_test_decision,'NOT_GIVEN');
  assert.equal(first.connection_state,'DISCONNECTED');
  assert.equal(first.private_key_contents,'NEVER_EXPORTED');
  const privateFile=join(custody,'rosie-ql256-source-signer.private.pem');
  assert.equal(existsSync(privateFile),true);
  assert.equal(statSync(privateFile).mode&0o077,0);
  assert.equal(statSync(custody).mode&0o077,0);
  assert.ok(readFileSync(privateFile,'utf8').includes('PRIVATE KEY'));
  assert.equal(JSON.stringify(first).includes('PRIVATE KEY-----'),false);
  assert.deepEqual(perform(['inspect','--custody-dir',custody]).public_spki_sha256,
    first.public_spki_sha256);
  assert.throws(()=>perform(['provision','--custody-dir',custody]),/already exists/);
  const now=Date.now(),c={business_id:'rosiedazzlers',tenant_id:null,
    repository:'RosevearCreations/rosiedazzlers',environment:'nonproduction',
    source_sha_A:'a'.repeat(40),
    ci_run_url:'https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40878439083',
    challenge_id:'np-independent-challenge-fixture',nonce:'Q'.repeat(32),
    issued_at:now-10000,expires_at:now+120000};
  assert.equal(validateChallenge(c).nonce_sha256.length,64);
  fs.writeFileSync(challenge,JSON.stringify(c));
  const result=perform(['respond','--custody-dir',custody,
    '--challenge-file',challenge,'--response-file',response]);
  assert.equal(result.response_written,true);
  const packet=JSON.parse(readFileSync(response,'utf8'));
  assert.equal(packet.real_world_custody_verified,false);
  assert.equal(packet.independent_witness_verified,false);
  assert.equal(packet.owner_test_authorization,'NOT_GIVEN');
  const key=createPublicKey(packet.publicKeyPem);
  assert.equal(verify(null,Buffer.from(JSON.stringify(packet.claims)),key,
    Buffer.from(packet.signature,'base64url')),true);
  assert.equal(packet.claims.nonce,undefined);
  assert.throws(()=>perform(['respond','--custody-dir',custody,
    '--challenge-file',challenge,'--response-file',response]),/EEXIST/);
  assert.throws(()=>validateChallenge({...c,tenant_id:'real-customer'}),/Invalid\/expired/);
  assert.throws(()=>validateChallenge({...c,expires_at:now-1}),/Invalid\/expired/);
  assert.throws(()=>validateChallenge({...c,expires_at:now+400000}),/Invalid\/expired/);
  assert.equal(existsSync(join(root,'docs/integration/ql246-source-proof.json')),false);
}finally{rmSync(root,{recursive:true,force:true});}
console.log('Build 701 real Ed25519 local key provisioning path, strict private storage, bounded challenge-response and no proof/owner claims: PASS');
