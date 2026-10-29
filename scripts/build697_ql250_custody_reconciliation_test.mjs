import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {onRequestGet,onRequestPost,recheckQl252PublicProof}
  from '../functions/api/admin/integration_v1_ql250_custody_reconciliation.js';

const previous=globalThis.fetch,calls=[];
const main='a'.repeat(40),source='b'.repeat(40),runId='40793428550',now=Date.now();
let fixture='missing';
const envelope={payload:{source_revision:source,ci_run_url:`https://github.com/RosevearCreations/rosiedazzlers/actions/runs/${runId}`}};
const bytes=new TextEncoder().encode(JSON.stringify(envelope));
const file={path:'docs/integration/ql246-source-proof.json',type:'file',encoding:'base64',size:bytes.length,
  content:Buffer.from(bytes).toString('base64')};
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
const getJson=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json'}});
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';calls.push([u.hostname,u.pathname,method]);
  assert.equal(method,'GET');
  if(u.hostname==='database.example.test'){
    assert.ok(u.pathname.startsWith('/rest/v1/'));
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return getJson(ix<0?[]:[{id:'staff-auth',staff_user:{id:`00000000-0000-4000-8000-00000000000${ix+1}`,
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Fixture',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(now+3600000).toISOString(),created_at:new Date(now).toISOString()}]);
  }
  assert.equal(u.hostname,'api.github.com');
  assert.ok(u.pathname.startsWith('/repos/RosevearCreations/rosiedazzlers/'));
  assert.equal(init.headers.Authorization,undefined);
  if(u.pathname.endsWith('/git/ref/heads/main'))return getJson(fixture==='badref'?{ref:'refs/heads/dev'}:
    {ref:'refs/heads/main',object:{sha:main}});
  if(u.pathname.endsWith('/contents/docs/integration/ql246-source-proof.json')){
    assert.equal(u.searchParams.get('ref'),main);
    return fixture==='missing'?getJson({message:'Not Found'},404):getJson(file);
  }
  if(u.pathname.endsWith('/actions/runs/'+runId))return getJson({head_sha:source,conclusion:'success',
    repository:{full_name:'RosevearCreations/rosiedazzlers'}});
  throw Error('Unexpected public URL '+u.pathname);
};
async function call(method,who='owner',body={action:'public_proof_recheck'},extras={}){
  const request=new Request('https://rosiedazzlers.ca/api/admin/integration_v1_ql250_custody_reconciliation',{
    method,headers:{cookie:`rd_staff_session=${who}-token`,...(method==='POST'?{'content-type':'application/json'}:{}),...extras},
    ...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const result=await (method==='POST'?onRequestPost:onRequestGet)({request,
    env:{SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:result.status,data:await result.json(),headers:result.headers};
}
try{
  assert.equal((await call('GET','nope')).status,401);
  assert.equal((await call('POST','staff')).status,403);
  const get=await call('GET');assert.equal(get.status,200);
  assert.equal(get.data.owner_test_decision,'NOT_GIVEN');
  assert.equal(get.data.operator_return.proof_commit_sha_B,'NOT_AVAILABLE');
  assert.equal(get.data.actual_gateway_test,'NOT_RUN');
  assert.equal(calls.filter(c=>c[0]==='api.github.com').length,0);
  assert.equal((await call('POST','owner',{action:'public_proof_recheck'},
    {origin:'https://outside.example.test'})).status,403);
  assert.equal((await call('POST','owner',{action:'try_gateway'})).status,400);
  assert.equal(calls.filter(c=>c[0]==='api.github.com').length,0);
  const missing=await call('POST');assert.equal(missing.status,200);
  assert.equal(missing.data.public_proof_http_status,404);
  assert.equal(missing.data.checked_main_sha,main);
  assert.equal(missing.data.operator_return.exact_proof_bytes_sha256,'NOT_AVAILABLE');
  assert.equal(missing.data.connection_state,'DISCONNECTED');
  assert.equal(calls.filter(c=>c[0]==='api.github.com').length,2);
  fixture='present';calls.length=0;
  const found=await call('POST');assert.equal(found.status,200);
  assert.equal(found.data.public_proof_http_status,200);
  assert.equal(found.data.proof_publication,'HTTP_200_UNTRUSTED_CANDIDATE');
  assert.equal(found.data.source_ci_head_match,true);
  assert.equal(found.data.operator_return.source_sha_A,source);
  assert.equal(found.data.operator_return.proof_commit_sha_B,'NOT_AVAILABLE');
  assert.equal(found.data.independent_signer_origin_attested,false);
  assert.equal(found.data.distinct_witness_signature_verified,false);
  assert.equal(found.data.owner_test_decision,'NOT_GIVEN');
  assert.equal(calls.filter(c=>c[0]==='api.github.com').length,3);
  fixture='badref';const bad=await recheckQl252PublicProof();
  assert.equal(bad.proof_publication,'UNAVAILABLE_FAIL_CLOSED');
}finally{globalThis.fetch=previous;}
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false,
  'Do not publish synthetic or unauthorized signed proof');
assert.equal('onRequestPut' in await import('../functions/api/admin/integration_v1_ql250_custody_reconciliation.js'),false);
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review697QL250/);
assert.match(html,/admin-integration-v1-ql250-custody-v697/);
console.log('Build 697 QL-252 real 404 vs candidate, no synthetic proof publication, CI and custody HOLD: PASS');
