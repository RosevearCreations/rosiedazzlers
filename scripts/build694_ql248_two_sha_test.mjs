import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {QL246_DENIAL_KEYS,canonicalQl246Payload,pendingQl246SourceProof}
  from '../functions/api/_lib/rosevear-integration-ql246.js';
import {verifyQl248RosieTransport,pendingQl248Transport}
  from '../functions/api/_lib/rosevear-integration-ql248.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/integration_v1_ql248_proof_commit_readiness.js';

// Ephemeral synthetic fixture tests ONLY; never use as original QL-246 evidence.
const HOUR=3600000,sourceSha='a'.repeat(40),proofSha='b'.repeat(40),now=Date.now();
const challenge='np-ephemeral-fixture-694',challengeSha=createHash('sha256').update('test-only').digest('hex');
const ci='https://github.com/RosevearCreations/rosiedazzlers/actions/runs/12345';
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const spki=publicKey.export({format:'der',type:'spki'});
const pin=createHash('sha256').update(spki).digest('hex');
const payload={...pendingQl246SourceProof(sourceSha),challenge_id:challenge,challenge_sha256:challengeSha,
  ci_run_url:ci,issued_at:now-2000,expires_at:now+300000,
  negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(k=>[k,true]))};
const envelope={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,
  signature:sign(null,Buffer.from(canonicalQl246Payload(payload)),privateKey).toString('base64url')};
const raw=Buffer.from(JSON.stringify(envelope));const proofDigest=createHash('sha256').update(raw).digest('hex');
const row={system:'rosiedazzlers',sourceRevisionSha:sourceSha,proofCommitSha:proofSha,
  rawProofBase64:raw.toString('base64')};
const expectations={sourceRevisionSha:sourceSha,proofCommitSha:proofSha,proofSha256:proofDigest,
  publicKeySpkiSha256:pin,ciRunUrl:ci,challengeId:challenge,challengeSha256:challengeSha,tenantId:null};
const valid=await verifyQl248RosieTransport(row,expectations,now);
assert.equal(valid.ok,true,valid.reason);
assert.equal(valid.transport_state,'PUBLIC_METADATA_CRYPTOGRAPHICALLY_MATCHED_ONLY');
assert.equal(valid.connection_state,'DISCONNECTED');assert.equal(valid.consumer_agreement_verified,false);
assert.equal(valid.seven_original_denials_verified,false);assert.equal(valid.original_gateway_evidence_verified,false);
for(const [s,e] of [
  [{...row,proofCommitSha:sourceSha},expectations],
  [{...row,sourceRevisionSha:proofSha},expectations],
  [row,{...expectations,proofSha256:'0'.repeat(64)}],
  [row,{...expectations,proofCommitSha:sourceSha}],
  [row,{...expectations,publicKeySpkiSha256:'0'.repeat(64)}],
  [row,{...expectations,challengeId:'np-something-else'}],
  [row,{...expectations,ciRunUrl:ci.replace('12345','99999')}],
  [row,{...expectations,tenantId:'invented-tenant'}],
  [{...row,rawProofBase64:Buffer.from(JSON.stringify({...envelope,signature:'tampered'})).toString('base64')},expectations],
  [{...row,rawProofBase64:'???'},expectations],
  [{...row,privateKey:'must-not-appear'},expectations]
])assert.equal((await verifyQl248RosieTransport(s,e,now)).ok,false);
assert.equal((await verifyQl248RosieTransport(row,expectations,now+HOUR)).ok,false);
assert.equal(pendingQl248Transport().connection_state,'DISCONNECTED');

const url='https://rosiedazzlers.ca/api/admin/integration_v1_ql248_proof_commit_readiness';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only',
  ROSEVEAR_QL246_EXPECTED_SOURCE_SHA:sourceSha,ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA:proofSha,
  ROSEVEAR_QL248_EXPECTED_PROOF_SHA256:proofDigest,ROSEVEAR_QL246_TRUSTED_SPKI_SHA256:pin,
  ROSEVEAR_QL246_EXPECTED_CI_RUN_URL:ci,ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID:challenge,
  ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256:challengeSha};
const originalFetch=globalThis.fetch,calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{const u=new URL(input);calls.push([u.pathname,init.method||'GET']);
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','other-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'s',staff_user:{id:ix?'other':'owner',
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Staff',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(now+HOUR).toISOString(),created_at:new Date(now).toISOString()}]);}
  throw Error('Offline proof verification contacted forbidden source');};
async function call(method,who,e=env,b=row,origin='https://rosiedazzlers.ca'){
  const req=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{'content-type':'application/json',origin}:{})},
    ...(method==='POST'?{body:JSON.stringify(b)}:{})});
  const r=await (method==='POST'?onRequestPost:onRequestGet)({request:req,env:e});
  return {status:r.status,data:await r.json(),headers:r.headers};}
try{
  assert.equal((await call('GET','other')).status,403);
  assert.equal((await call('POST','other')).status,403);
  assert.equal((await call('POST','owner',env,row,'https://evil.test')).status,403);
  const before=await call('GET','owner');assert.equal(before.status,200);
  assert.equal(before.data.consumer_agreement,'PENDING');
  assert.equal(before.data.connection_state,'DISCONNECTED');
  assert.equal(JSON.stringify(before.data).includes(pin),false);
  assert.match(before.headers.get('Cache-Control'),/no-store/);
  const yes=await call('POST','owner');assert.equal(yes.status,200);
  assert.equal(yes.data.signature_and_raw_digest_match,true);
  assert.equal(yes.data.original_denials_verified,false);
  assert.equal(yes.data.read_only_pilot_authorized,false);
  const no=await call('POST','owner',{...env,ROSEVEAR_QL248_EXPECTED_PROOF_SHA256:undefined});
  assert.equal(no.data.signature_and_raw_digest_match,false);
  assert.ok(calls.every(([path,method])=>path.endsWith('/staff_auth_sessions')&&method==='GET'));
}finally{globalThis.fetch=originalFetch;}
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review694QL248/);
console.log('Build 694 QL-248 two-SHA independent raw digest, Ed25519 pin, tamper, expiry and owner-only HOLD: PASS');
