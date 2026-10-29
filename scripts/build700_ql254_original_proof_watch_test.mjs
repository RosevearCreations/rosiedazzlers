import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {pendingQl246SourceProof,QL246_DENIAL_KEYS}
  from '../functions/api/_lib/rosevear-integration-ql246.js';
import {onRequestGet,onRequestPost,recheckQl254OriginalPublicProof}
  from '../functions/api/admin/integration_v1_ql254_original_proof_watch.js';

const original=globalThis.fetch,calls=[];
const main='a'.repeat(40),source='b'.repeat(40),runId='40811652474';
const now=Date.now();let fixture='missing';
const payload=pendingQl246SourceProof(source);
Object.assign(payload,{challenge_id:'np-synthetic-test-only',challenge_sha256:'c'.repeat(64),
  ci_run_url:`https://github.com/RosevearCreations/rosiedazzlers/actions/runs/${runId}`,
  issued_at:now-30000,expires_at:now+30000,
  negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(k=>[k,true]))});
// Intentionally not a genuine signature; this exercises UNTRUSTED PUBLIC CANDIDATE routing only.
const fakeEnvelope={payload,publicKeyPem:'-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----',
  signature:'A'.repeat(86)};
const bytes=new TextEncoder().encode(JSON.stringify(fakeEnvelope));
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,
  headers:{'content-type':'application/json'}});
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,options={})=>{
  const u=new URL(url),method=options.method||'GET';calls.push([u.hostname,u.pathname,method]);
  assert.equal(method,'GET');
  if(u.hostname==='database.example.test'){
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return json(ix<0?[]:[{id:'s',staff_user:{id:'70000000-0000-4000-8000-000000000000',
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Fixture',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(now+3600000).toISOString(),created_at:new Date(now).toISOString()}]);
  }
  if(u.hostname==='raw.githubusercontent.com'){
    assert.equal(options.headers.Authorization,undefined);
    assert.ok(u.pathname.startsWith('/RosevearCreations/rosiedazzlers/'));
    assert.ok(u.pathname.endsWith('/docs/integration/ql246-source-proof.json'));
    if(fixture==='missing')return new Response('Not Found',{status:404});
    return new Response(bytes,{status:200,headers:{'content-type':'application/json'}});
  }
  assert.equal(u.hostname,'api.github.com');
  assert.equal(options.headers.Authorization,undefined);
  assert.ok(u.pathname.startsWith('/repos/RosevearCreations/rosiedazzlers/'));
  if(u.pathname.endsWith('/git/ref/heads/main'))return json({ref:'refs/heads/main',
    object:{sha:fixture==='drift'&&calls.filter(c=>c[1].endsWith('/git/ref/heads/main')).length>1?
      'd'.repeat(40):main}});
  if(u.pathname.endsWith('/actions/runs'))return json({workflow_runs:[{
    name:'Current Source Gate',head_sha:main,head_branch:'main',event:'push',status:'completed',
    conclusion:'success',repository:{full_name:'RosevearCreations/rosiedazzlers'},
    html_url:`https://github.com/RosevearCreations/rosiedazzlers/actions/runs/${runId}`}]});
  if(u.pathname.endsWith('/commits'))return json([{sha:main}]);
  if(u.pathname.endsWith('/git/commits/'+main))return json({sha:main,parents:[{sha:source}]});
  if(u.pathname.endsWith('/compare/'+source+'...'+main))return json({
    base_commit:{sha:source},head_commit:{sha:main},merge_base_commit:{sha:source},
    status:'ahead',ahead_by:1,behind_by:0,total_commits:1,
    files:[{filename:'docs/integration/ql246-source-proof.json',status:'added'}]});
  if(u.pathname.endsWith('/actions/runs/'+runId))return json({head_sha:source,
    status:'completed',conclusion:'success',repository:{full_name:'RosevearCreations/rosiedazzlers'},
    html_url:payload.ci_run_url});
  throw Error('Unexpected public GitHub URL '+u.pathname);
};
async function call(method,who='owner',action='recheck_immutable_public_proof',headers={}){
  const request=new Request('https://rosiedazzlers.ca/api/admin/integration_v1_ql254_original_proof_watch',{
    method,headers:{cookie:`rd_staff_session=${who}-token`,
      ...(method==='POST'?{'content-type':'application/json'}:{}),...headers},
    ...(method==='POST'?{body:JSON.stringify({action})}:{})});
  const r=await (method==='POST'?onRequestPost:onRequestGet)({request,
    env:{SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:r.status,data:await r.json(),headers:r.headers};
}
try{
  assert.equal((await call('GET','missing')).status,401);
  assert.equal((await call('POST','staff')).status,403);
  const readiness=await call('GET');assert.equal(readiness.status,200);
  assert.equal(readiness.data.actual_nonproduction_gateway_gets,'NOT_RUN');
  assert.equal(calls.filter(c=>c[0]!=='database.example.test').length,0);
  assert.equal((await call('POST','owner','recheck_immutable_public_proof',
    {origin:'https://outsider.test'})).status,403);
  assert.equal((await call('POST','owner','connect_gateway')).status,400);
  assert.equal(calls.filter(c=>c[0]!=='database.example.test').length,0);
  const missing=await call('POST');assert.equal(missing.status,200);
  assert.equal(missing.data.public_main_proof_http_status,404);
  assert.equal(missing.data.observed_main_sha,main);
  assert.equal(missing.data.source_sha_A,main);
  assert.equal(missing.data.proof_commit_sha_B,'NOT_AVAILABLE');
  assert.equal(missing.data.owner_test_decision,'NOT_GIVEN');
  assert.equal(missing.data.connection_state,'DISCONNECTED');
  fixture='present';calls.length=0;
  const found=await recheckQl254OriginalPublicProof();
  assert.equal(found.proof_publication,'PUBLIC_PROOF_ONLY_ANCESTRY_AND_RAW_BYTES_MATCH_UNTRUSTED');
  assert.equal(found.proof_http_status_at_B,200);
  assert.equal(found.source_sha_A,source);assert.equal(found.proof_commit_sha_B,main);
  assert.equal(found.signed_proof_independently_trusted,false);
  assert.equal(found.independent_witness_real_world_identity_verified,'NOT_VERIFIED');
  assert.equal(found.owner_test_decision,'NOT_GIVEN');
  assert.equal(found.private_relay_installed,false);
  fixture='drift';calls.length=0;
  const drift=await recheckQl254OriginalPublicProof();
  assert.equal(drift.proof_publication,'UNAVAILABLE_OR_CONFLICT_FAIL_CLOSED');
  assert.ok(calls.every(([host,path,method])=>method==='GET'&&
    ['database.example.test','api.github.com','raw.githubusercontent.com'].includes(host)));
}finally{globalThis.fetch=original;}
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review700QL254Recheck/);
assert.equal('onRequestPut' in await import('../functions/api/admin/integration_v1_ql254_original_proof_watch.js'),false);
console.log('Build 700 immutable raw 404/candidate/ancestry, owner-only, no gateway/custody/pilot: PASS');
