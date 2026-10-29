import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {QL246_DENIAL_KEYS,canonicalQl246Payload,pendingQl246SourceProof}
  from '../functions/api/_lib/rosevear-integration-ql246.js';
import {QL249_PROOF_PATH,verifyQl249PublicGitHubResponses,ql249IndependentExpectationsReady}
  from '../functions/api/_lib/rosevear-integration-ql249-github.js';
import {onRequestGet,onRequestPost}
  from '../functions/api/admin/integration_v1_ql249_github_origin_intake.js';

// Ephemeral synthetic fixture, NEVER original QL-246 GitHub/gateway/CI evidence.
const now=Date.now(),sourceSha='a'.repeat(40),proofSha='b'.repeat(40);
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const publicKeySpkiSha256=createHash('sha256').update(publicKey.export({format:'der',type:'spki'})).digest('hex');
const challengeId='np-synthetic-ql249-696',challengeSha256=createHash('sha256').update('test').digest('hex');
const ciRunUrl='https://github.com/RosevearCreations/rosiedazzlers/actions/runs/12345';
const payload={...pendingQl246SourceProof(sourceSha),challenge_id:challengeId,
  challenge_sha256:challengeSha256,ci_run_url:ciRunUrl,issued_at:now-1000,
  expires_at:now+300000,negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(x=>[x,true]))};
const envelope={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,
  signature:sign(null,Buffer.from(canonicalQl246Payload(payload)),privateKey).toString('base64url')};
const bytes=Buffer.from(JSON.stringify(envelope)+'\n');
const proofSha256=createHash('sha256').update(bytes).digest('hex');
const blobSha=createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex');
const expected={sourceRevisionSha:sourceSha,proofCommitSha:proofSha,proofSha256,
  publicKeySpkiSha256,ciRunUrl,challengeId,challengeSha256,tenantId:null};
const commit={sha:proofSha,tree:{sha:'c'.repeat(40)},parents:[{sha:sourceSha}]};
const comparison={base_commit:{sha:sourceSha},merge_base_commit:{sha:sourceSha},head_commit:{sha:proofSha},
  status:'ahead',ahead_by:1,behind_by:0,total_commits:1,
  files:[{filename:QL249_PROOF_PATH,status:'added'}]};
const file={type:'file',path:QL249_PROOF_PATH,sha:blobSha,size:bytes.length,
  encoding:'base64',content:bytes.toString('base64')};
assert.equal(ql249IndependentExpectationsReady(expected),true);
const yes=await verifyQl249PublicGitHubResponses(commit,comparison,file,expected,now);
assert.equal(yes.ok,true,yes.reason);
assert.equal(yes.stage,'PUBLIC_GITHUB_API_AND_PINNED_SIGNATURE_MATCH_ONLY');
assert.equal(yes.independent_github_origin_attested,false);
assert.equal(yes.source_ci_independently_verified,false);
assert.equal(yes.consumer_agreement_verified,false);assert.equal(yes.seven_original_denials_verified,false);
assert.equal(yes.connection_state,'DISCONNECTED');
for(const [c,d,f,e] of [
  [{...commit,parents:[{sha:'d'.repeat(40)}]},comparison,file,expected],
  [commit,{...comparison,files:[{filename:'functions/api/gifts/webhook.js',status:'modified'}]},file,expected],
  [commit,{...comparison,ahead_by:2,total_commits:2},file,expected],
  [commit,comparison,{...file,sha:'0'.repeat(40)},expected],
  [commit,comparison,{...file,size:file.size+1},expected],
  [commit,comparison,{...file,content:'???'},expected],
  [commit,comparison,file,{...expected,proofSha256:'0'.repeat(64)}],
  [commit,comparison,file,{...expected,publicKeySpkiSha256:'0'.repeat(64)}],
  [commit,comparison,file,{...expected,tenantId:'fake'}]
])assert.equal((await verifyQl249PublicGitHubResponses(c,d,f,e,now)).ok,false);
assert.equal((await verifyQl249PublicGitHubResponses(commit,comparison,file,expected,now+3600000)).ok,false);

const url='https://rosiedazzlers.ca/api/admin/integration_v1_ql249_github_origin_intake';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only',
  ROSEVEAR_QL246_EXPECTED_SOURCE_SHA:sourceSha,ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA:proofSha,
  ROSEVEAR_QL248_EXPECTED_PROOF_SHA256:proofSha256,
  ROSEVEAR_QL246_TRUSTED_SPKI_SHA256:publicKeySpkiSha256,
  ROSEVEAR_QL246_EXPECTED_CI_RUN_URL:ciRunUrl,
  ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID:challengeId,
  ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256:challengeSha256};
const savedFetch=globalThis.fetch,calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input);calls.push({host:u.hostname,path:u.pathname,method:init.method||'GET'});
  assert.equal(init.method||'GET','GET');
  if(u.hostname==='database.example.test'&&u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'s',staff_user:{id:ix?'staff':'owner',
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Fixture',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(now+3600000).toISOString(),created_at:new Date(now).toISOString()}]);}
  assert.equal(u.hostname,'api.github.com');assert.equal(init.redirect,'error');
  if(u.pathname.endsWith('/git/commits/'+proofSha))return Response.json(commit);
  if(u.pathname.includes('/compare/'))return Response.json(comparison);
  if(u.pathname.endsWith('/contents/'+QL249_PROOF_PATH))return Response.json(file);
  throw Error('Unexpected public GitHub path');};
async function call(method,who,e=env,body={sourceRevisionSha:sourceSha,proofCommitSha:proofSha},origin='https://rosiedazzlers.ca'){
  const request=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{'content-type':'application/json',origin}:{})},
    ...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const r=await (method==='POST'?onRequestPost:onRequestGet)({request,env:e});
  return {status:r.status,headers:r.headers,data:await r.json()};}
try{
  assert.equal((await call('GET','staff')).status,403);
  assert.equal((await call('POST','staff')).status,403);
  assert.equal((await call('POST','unknown')).status,401);
  assert.equal((await call('POST','owner',env,undefined,'https://evil.test')).status,403);
  const readiness=await call('GET','owner');assert.equal(readiness.status,200);
  assert.equal(readiness.data.independent_public_pins_configured,true);
  assert.equal(JSON.stringify(readiness.data).includes(publicKeySpkiSha256),false);
  const before=calls.filter(x=>x.host==='api.github.com').length;
  const blocked=await call('POST','owner',{...env,ROSEVEAR_QL248_EXPECTED_PROOF_SHA256:undefined});
  assert.equal(blocked.data.public_github_check,'BLOCKED');
  assert.equal(calls.filter(x=>x.host==='api.github.com').length,before);
  const valid=await call('POST','owner');assert.equal(valid.status,200);
  assert.equal(valid.data.public_github_check,'PUBLIC_API_CRYPTOGRAPHIC_MATCH_ONLY');
  assert.equal(valid.data.remote_public_metadata_match,true);
  assert.equal(valid.data.connection_state,'DISCONNECTED');
  assert.equal(valid.data.read_only_pilot_authorized,false);
  assert.equal(calls.filter(x=>x.host==='api.github.com').length,before+3);
  assert.ok(calls.every(x=>x.method==='GET'&&['database.example.test','api.github.com'].includes(x.host)));
}finally{globalThis.fetch=savedFetch;}
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review696QL249/);
console.log('Build 696 bounded allowlisted public GitHub response, pinned proof-only metadata, owner auth, no gateway and permanent HOLD: PASS');
