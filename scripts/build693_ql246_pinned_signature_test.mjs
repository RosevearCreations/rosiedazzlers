import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {onRequestGet,onRequestPost} from '../functions/api/admin/integration_v1_ql246_signature_readiness.js';
import {QL246_DENIAL_KEYS,canonicalQl246Payload,pendingQl246SourceProof,
  verifyQl246PinnedSignature} from '../functions/api/_lib/rosevear-integration-ql246.js';

const owner='69300000-0000-4000-8000-000000000001',other='69300000-0000-4000-8000-000000000002';
const url='https://rosiedazzlers.ca/api/admin/integration_v1_ql246_signature_readiness';
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const spki=publicKey.export({format:'der',type:'spki'});
const pin=createHash('sha256').update(spki).digest('hex');
const time=Date.now(),revision='a'.repeat(40),challenge='np-test-only-never-publish';
const hash=createHash('sha256').update('ephemeral-fixture-challenge').digest('hex');
const ci='https://github.com/RosevearCreations/rosiedazzlers/actions/runs/12345';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only',
  ROSEVEAR_QL246_TRUSTED_SPKI_SHA256:pin,ROSEVEAR_QL246_EXPECTED_SOURCE_SHA:revision,
  ROSEVEAR_QL246_EXPECTED_CI_RUN_URL:ci,ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID:challenge,
  ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256:hash};
const payload={...pendingQl246SourceProof(revision),challenge_id:challenge,challenge_sha256:hash,
  ci_run_url:ci,issued_at:time-1000,expires_at:time+300000,
  negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(k=>[k,true]))};
const envelope={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,
  signature:sign(null,Buffer.from(canonicalQl246Payload(payload)),privateKey).toString('base64url')};
const expectations={pinnedSpkiSha256:pin,expectedRevision:revision,expectedCiRunUrl:ci,
  expectedChallengeId:challenge,expectedChallengeSha256:hash,expectedTenantId:null};
const validResult=await verifyQl246PinnedSignature(envelope,expectations,time);
assert.equal(validResult.ok,true,validResult.reason);
assert.equal((await verifyQl246PinnedSignature(envelope,{...expectations,pinnedSpkiSha256:'0'.repeat(64)},time)).ok,false);
assert.equal((await verifyQl246PinnedSignature(envelope,{...expectations,expectedRevision:'b'.repeat(40)},time)).ok,false);
assert.equal((await verifyQl246PinnedSignature(envelope,{...expectations,expectedChallengeId:'np-other'},time)).ok,false);
assert.equal((await verifyQl246PinnedSignature({...envelope,payload:{...payload,issued_at:time-2000}},expectations,time)).ok,false);
assert.equal((await verifyQl246PinnedSignature({...envelope,payload:{...payload,negative_tests:pendingQl246SourceProof().negative_tests}},expectations,time)).ok,false);
assert.equal((await verifyQl246PinnedSignature(envelope,expectations,time+3600000)).ok,false);
assert.equal((await verifyQl246PinnedSignature(envelope,{},time)).ok,false);

const oldFetch=globalThis.fetch,calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{const u=new URL(input);calls.push([u.pathname,init.method||'GET']);
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','other-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'s',staff_user:{id:ix?other:owner,
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Staff',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]);}
  throw Error('Verification must not contact external gateway or persist receipts');};
async function call(method,who,e=env,body=envelope,origin='https://rosiedazzlers.ca'){
  const request=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{origin,'content-type':'application/json'}:{})},
    ...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const r=await (method==='GET'?onRequestGet:onRequestPost)({request,env:e});
  return {status:r.status,data:await r.json()};}
try{
  assert.equal((await call('GET','other')).status,403);
  assert.equal((await call('POST','other')).status,403);
  assert.equal((await call('POST','owner',env,envelope,'https://evil.test')).status,403);
  const before=await call('GET','owner');assert.equal(before.status,200);
  assert.equal(before.data.trust_pin_configured,true);
  assert.equal(JSON.stringify(before.data).includes(pin),false);
  const yes=await call('POST','owner');assert.equal(yes.status,200);
  assert.equal(yes.data.signature_check,true);
  assert.equal(yes.data.original_evidence_verified,false);
  assert.equal(yes.data.connection_state,'DISCONNECTED');
  const no=await call('POST','owner',{...env,ROSEVEAR_QL246_TRUSTED_SPKI_SHA256:undefined});
  assert.equal(no.data.signature_check,false);
  assert.ok(calls.every(([path,method])=>path.endsWith('/staff_auth_sessions')&&method==='GET'));
}finally{globalThis.fetch=oldFetch;}
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review693QL246/);
assert.equal(readFileSync(new URL('../docs/integration/ql246-source-proof-pending.md',import.meta.url),'utf8').includes('PENDING'),true);
console.log('Build 693 independent pin, Ed25519 canonical signature, tamper, expiry, owner-only and disconnected checks: PASS');
