import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {QL246_DENIAL_KEYS,canonicalQl246Payload,pendingQl246SourceProof}
  from '../functions/api/_lib/rosevear-integration-ql246.js';
import {reviewLocalQl249} from './ql249_rosie_local_git_proof_review.mjs';

// A temporary synthetic fixture is NEVER publishable original QL-246 evidence.
const dir=mkdtempSync(join(tmpdir(),'rosie-ql249-synthetic-'));
const git=(...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8',timeout:8000}).trim();
try{
  git('init','-q');git('config','user.name','Synthetic Fixture');git('config','user.email','fixture@example.test');
  writeFileSync(join(dir,'README.md'),'source-only fixture\n');git('add','README.md');git('commit','-qm','Ephemeral source fixture');
  const sourceSha=git('rev-parse','HEAD'),now=Date.now();
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  const pin=createHash('sha256').update(publicKey.export({format:'der',type:'spki'})).digest('hex');
  const challengeId='np-ql249-ephemeral-fixture';
  const challengeSha256=createHash('sha256').update('ephemeral').digest('hex');
  const ciRunUrl='https://github.com/RosevearCreations/rosiedazzlers/actions/runs/123456';
  const payload={...pendingQl246SourceProof(sourceSha),challenge_id:challengeId,
    challenge_sha256:challengeSha256,ci_run_url:ciRunUrl,issued_at:now-1000,
    expires_at:now+300000,
    negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(k=>[k,true]))};
  const proof={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,
    signature:sign(null,Buffer.from(canonicalQl246Payload(payload)),privateKey).toString('base64url')};
  const raw=Buffer.from(JSON.stringify(proof)+'\n');
  const proofSha256=createHash('sha256').update(raw).digest('hex');
  mkdirSync(join(dir,'docs','integration'),{recursive:true});
  writeFileSync(join(dir,'docs','integration','ql246-source-proof.json'),raw);
  git('add','docs/integration/ql246-source-proof.json');git('commit','-qm','Synthetic proof object only');
  const proofCommitSha=git('rev-parse','HEAD');
  const opts={repo:dir,sourceRevisionSha:sourceSha,proofCommitSha,proofSha256,
    publicKeySpkiSha256:pin,ciRunUrl,challengeId,challengeSha256,tenantId:null};
  const valid=await reviewLocalQl249(opts,now);
  assert.equal(valid.ok,true,valid.reason);
  assert.equal(valid.stage,'LOCAL_GIT_OBJECT_AND_PUBLIC_SIGNATURE_MATCH_ONLY');
  assert.equal(valid.local_git_relation_verified,true);
  assert.equal(valid.github_origin_attested,false);assert.equal(valid.github_ci_verified,false);
  assert.equal(valid.consumer_agreement_verified,false);
  assert.equal(valid.seven_original_denials_verified,false);
  assert.equal(valid.connection_state,'DISCONNECTED');
  for(const altered of [
    {...opts,sourceRevisionSha:proofCommitSha},
    {...opts,proofSha256:'0'.repeat(64)},
    {...opts,publicKeySpkiSha256:'0'.repeat(64)},
    {...opts,ciRunUrl:ciRunUrl.replace('123456','1')},
    {...opts,tenantId:'synthetic'},
    {...opts,proofCommitSha:'b'.repeat(40)}
  ])assert.equal((await reviewLocalQl249(altered,now)).ok,false);
  assert.equal((await reviewLocalQl249(opts,now+3600000)).ok,false);
  writeFileSync(join(dir,'other.js'),'not part of the proof-only change\n');
  git('add','other.js');git('commit','-qm','Unexpected code changed after source');
  const extra=await reviewLocalQl249({...opts,proofCommitSha:git('rev-parse','HEAD')},now);
  assert.equal(extra.ok,false);assert.match(extra.reason,/non-proof changes/);
}finally{rmSync(dir,{recursive:true,force:true});}
console.log('Build 695 QL-249 local Git ancestry, proof-only diff, raw bytes, pinned Ed25519 and independent origin HOLD: PASS');
