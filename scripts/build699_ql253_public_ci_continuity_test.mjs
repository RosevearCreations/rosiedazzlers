import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {onRequestGet,onRequestPost,recheckQl253PublicCi}
  from '../functions/api/admin/integration_v1_ql253_public_ci_continuity.js';

const original=globalThis.fetch,calls=[];
const main='a'.repeat(40),runId=40804594590,now=Date.now();let mode='ok';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,
  headers:{'Content-Type':'application/json'}});
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,options={})=>{
  const u=new URL(url);calls.push([u.hostname,u.pathname,u.search,options.method||'GET']);
  assert.equal(options.method||'GET','GET');
  if(u.hostname==='database.example.test'){
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return json(ix<0?[]:[{id:'s',staff_user:{id:'69900000-0000-4000-8000-000000000000',
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Fixture',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(now+3600000).toISOString(),created_at:new Date(now-1000).toISOString()}]);
  }
  assert.equal(u.hostname,'api.github.com');
  assert.ok(u.pathname.startsWith('/repos/RosevearCreations/rosiedazzlers/'));
  assert.equal(options.headers.Authorization,undefined);
  if(u.pathname.endsWith('/git/ref/heads/main'))return json({ref:'refs/heads/main',object:{sha:mode==='drift'?'b'.repeat(40):main}});
  if(u.pathname.endsWith('/actions/runs')){
    assert.equal(u.searchParams.get('head_sha'),main);
    return json({workflow_runs:[{name:'Current Source Gate',head_sha:mode==='wrong-ci'?'b'.repeat(40):main,
      head_branch:'main',event:'push',status:'completed',conclusion:'success',
      repository:{full_name:'RosevearCreations/rosiedazzlers'},
      html_url:`https://github.com/RosevearCreations/rosiedazzlers/actions/runs/${runId}`} ]});
  }
  if(u.pathname.endsWith('/contents/docs/integration/ql246-source-proof.json')){
    assert.equal(u.searchParams.get('ref'),main);
    return json({message:'Not Found'},404);
  }
  throw Error('Unexpected GitHub host/path');
};
async function call(method,who='owner',action='recheck_public_main_ci_proof',headers={}){
  const request=new Request('https://rosiedazzlers.ca/api/admin/integration_v1_ql253_public_ci_continuity',{
    method,headers:{cookie:`rd_staff_session=${who}-token`,
      ...(method==='POST'?{'content-type':'application/json'}:{}),...headers},
    ...(method==='POST'?{body:JSON.stringify({action})}:{})});
  const r=await (method==='POST'?onRequestPost:onRequestGet)({request,
    env:{SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:r.status,data:await r.json(),headers:r.headers};
}
try{
  assert.equal((await call('GET','unknown')).status,401);
  assert.equal((await call('POST','staff')).status,403);
  const gate=await call('GET');assert.equal(gate.status,200);
  assert.equal(gate.data.public_source_ci,'NOT_CHECKED');
  assert.equal(calls.filter(x=>x[0]==='api.github.com').length,0);
  assert.equal((await call('POST','owner','recheck_public_main_ci_proof',
    {origin:'https://untrusted.test'})).status,403);
  assert.equal((await call('POST','owner','connect_gateway')).status,400);
  assert.equal(calls.filter(x=>x[0]==='api.github.com').length,0);
  const good=await call('POST');assert.equal(good.status,200);
  assert.equal(good.data.source_sha_A,main);
  assert.equal(good.data.public_source_ci,'EXACT_HEAD_GREEN_PUBLIC_METADATA_ONLY');
  assert.equal(good.data.public_proof_http_status,404);
  assert.equal(good.data.proof_commit_sha_B,'NOT_AVAILABLE');
  assert.equal(good.data.owner_test_decision,'NOT_GIVEN');
  assert.equal(good.data.connection_state,'DISCONNECTED');
  assert.equal(good.data.real_health_and_capabilities_get_receipts,'NOT_RUN');
  assert.ok(calls.filter(x=>x[0]==='api.github.com').every(x=>x[3]==='GET'));
  mode='wrong-ci';const wrong=await recheckQl253PublicCi();
  assert.equal(wrong.source_ci_run_url,'NOT_AVAILABLE');
  mode='drift';const drift=await recheckQl253PublicCi();
  assert.equal(drift.public_source_ci,'NOT_AVAILABLE');
}finally{globalThis.fetch=original;}
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
assert.equal('onRequestPut' in await import('../functions/api/admin/integration_v1_ql253_public_ci_continuity.js'),false);
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review699QL253Recheck/);
console.log('Build 699 public-only exact-main CI/proof recheck, immutable 404 and owner HOLD: PASS');
