import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {canonicalQl246Payload,pendingQl246SourceProof,QL246_DENIAL_KEYS}
  from '../functions/api/_lib/rosevear-integration-ql246.js';
import {preflightAuthenticQl252Proof} from './ql252_rosie_authentic_proof_preflight.mjs';

// All key material below is an IN-MEMORY SYNTHETIC TEST FIXTURE. NEVER original evidence.
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const spki=publicKey.export({format:'der',type:'spki'});
const pin=createHash('sha256').update(spki).digest('hex');
const source='a'.repeat(40),ci='https://github.com/RosevearCreations/rosiedazzlers/actions/runs/12345';
const challenge='np-build698-test-only',hash=createHash('sha256').update('test-only-challenge').digest('hex');
const now=Date.now(),payload={...pendingQl246SourceProof(source),challenge_id:challenge,
  challenge_sha256:hash,ci_run_url:ci,issued_at:now-1000,expires_at:now+120000,
  negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(k=>[k,true]))};
const signature=sign(null,Buffer.from(canonicalQl246Payload(payload)),privateKey).toString('base64url');
const envelope={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,signature};
const folder=mkdtempSync(join(tmpdir(),'rosie-ql252-offline-test-'));
const file=join(folder,'synthetic-only.json');
const raw=Buffer.from(JSON.stringify(envelope));writeFileSync(file,raw);
const options={proofFile:file,sourceRevisionSha:source,ciRunUrl:ci,
  proofSha256:createHash('sha256').update(raw).digest('hex'),
  publicKeySpkiSha256:pin,challengeId:challenge,challengeSha256:hash,tenantId:null};
try{
  const match=await preflightAuthenticQl252Proof(options,now);
  assert.equal(match.ok,true,match.reason);
  assert.equal(match.stage,'LOCAL_PUBLIC_PROOF_DIGEST_AND_PINNED_SIGNATURE_MATCH_ONLY');
  assert.equal(match.proof_commit_sha_B,'NOT_AVAILABLE');
  assert.equal(match.independent_custodian_verified,false);
  assert.equal(match.distinct_witness_verified,false);
  assert.equal(match.original_denials_verified,false);
  assert.equal(match.actual_gateway_test,'NOT_RUN');
  assert.equal(match.owner_test_decision,'NOT_GIVEN');
  assert.equal(match.connection_state,'DISCONNECTED');
  assert.equal((await preflightAuthenticQl252Proof({...options,publicKeySpkiSha256:'0'.repeat(64)},now)).ok,false);
  assert.equal((await preflightAuthenticQl252Proof({...options,sourceRevisionSha:'b'.repeat(40)},now)).ok,false);
  assert.equal((await preflightAuthenticQl252Proof({...options,proofSha256:'f'.repeat(64)},now)).ok,false);
  assert.equal((await preflightAuthenticQl252Proof({...options,challengeId:'np-other'},now)).ok,false);
  assert.equal((await preflightAuthenticQl252Proof({...options,proofFile:join(folder,'absent.json')},now)).ok,false);
  assert.equal((await preflightAuthenticQl252Proof(options,now+240000)).ok,false);
  assert.equal((await preflightAuthenticQl252Proof({...options,tenantId:'some-other-tenant'},now)).ok,false);
  writeFileSync(file,Buffer.from(JSON.stringify({...envelope,payload:{...payload,environment:'production'}})));
  assert.equal((await preflightAuthenticQl252Proof(options,now)).ok,false);
}finally{rmSync(folder,{recursive:true,force:true});}
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
const code=readFileSync(new URL('./ql252_rosie_authentic_proof_preflight.mjs',import.meta.url),'utf8');
assert.equal(/fetch\(|createPrivateKey|generateKeyPair|writeFile/.test(code),false);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review698QL252/);
console.log('Build 698 local QL-252 authentic-proof digest/signature preflight, tamper/expiry denial and no publication: PASS');
