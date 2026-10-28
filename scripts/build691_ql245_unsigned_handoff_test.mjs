import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,ql245UnsignedDraft,QL245_SOURCE_KEYS}
  from '../functions/api/admin/integration_v1_ql245_witness_handoff.js';
const owner='69100000-0000-4000-8000-000000000010',other='69100000-0000-4000-8000-000000000011';
const url='https://rosiedazzlers.ca/api/admin/integration_v1_ql245_witness_handoff';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',
  ROSEVEAR_INTEGRATION_V1_MODE:'nonproduction',CF_PAGES_BRANCH:'dev',
  ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN:'https://dev.rosiedazzlers.pages.dev',
  ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID:'SOMEKEY1234',
  ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64:'A'.repeat(43),CF_PAGES_COMMIT_SHA:'f'.repeat(40)};
const originalFetch=globalThis.fetch,calls=[],receipts=[];
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{const u=new URL(input),method=init.method||'GET';
  calls.push({path:u.pathname,method});assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','other-token'].map(digest));
    const n=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(n<0?[]:[{id:'session',staff_user:{id:n?other:owner,role_code:n?'detailer':'admin',
      is_active:true,full_name:'Test staff',permissions_profile:{}},revoked_at:null,
      expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]);}
  if(u.pathname.endsWith('/rosevear_integration_v1_ql245_owner_handoffs'))return Response.json(receipts);
  if(u.pathname.endsWith('/rpc/record_rosevear_integration_v1_ql245_owner_handoff')){
    const b=JSON.parse(init.body);assert.equal(b.p_owner_id,owner);
    assert.equal(b.p_evidence_sha256.length,64);
    assert.equal(Object.keys(b.p_negatives).length,7);
    assert.ok(Object.values(b.p_negatives).every(x=>x===false));
    if(receipts.some(x=>x.evidence_reference===b.p_evidence_reference))return Response.json({error:'duplicate'},{status:409});
    const receipt={id:b.p_id,evidence_reference:b.p_evidence_reference,created_at:new Date().toISOString()};
    receipts.push(receipt);return Response.json({id:b.p_id,connection_state:'DISCONNECTED',owner_authorization:'NOT_GIVEN'});}
  throw Error('Forbidden external gateway contact '+u.pathname);};
async function call(method,who,body,origin='https://rosiedazzlers.ca'){
  const r=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request:r,env});
  return {status:response.status,data:await response.json()};}
const body=()=>({evidence_reference:'QL245-ROSIE-691',observed_at:new Date().toISOString(),
  confirm_no_signed_receipts:true,confirm_all_denials_unverified:true,confirm_no_owner_pilot:true});
try{
  const draft=ql245UnsignedDraft(env);
  assert.deepEqual(Object.keys(draft),QL245_SOURCE_KEYS);
  assert.deepEqual(draft.allowed_paths,['/api/integration/v1/health','/api/integration/v1/capabilities']);
  assert.deepEqual(draft.scope,['read_health','read_capabilities']);
  assert.equal(draft.key_id,null);assert.equal(draft.signer_key_id,null);
  assert.equal(draft.source_receipt_id,null);assert.equal(draft.ci_run_url,null);
  assert.equal(draft.owner_authorization,'NOT_GIVEN');assert.equal(draft.connection_state,'DISCONNECTED');
  assert.equal(draft.issued_at,null);assert.equal(draft.expires_at,null);
  assert.equal((await call('GET','other')).status,403);
  const ownerGet=await call('GET','owner');assert.equal(ownerGet.status,200);
  assert.equal(ownerGet.data.signer_state,'NOT_PROVISIONED');
  assert.equal(ownerGet.data.witness_state,'UNVERIFIED');
  assert.equal(JSON.stringify(ownerGet.data).includes('A'.repeat(43)),false);
  assert.equal((await call('POST','other',body())).status,403);
  assert.equal((await call('POST','owner',body(),'https://evil.test')).status,403);
  const invalid=body();invalid.confirm_all_denials_unverified=false;
  assert.equal((await call('POST','owner',invalid)).status,400);
  assert.equal((await call('POST','owner',body())).status,200);
  assert.equal((await call('POST','owner',body())).status,409);
  assert.equal((await call('GET','owner')).data.handoffs.length,1);
  assert.ok(calls.every(x=>x.path.startsWith('/rest/v1/')&&
    (x.method==='GET'||x.path.endsWith('/rpc/record_rosevear_integration_v1_ql245_owner_handoff'))));
}finally{globalThis.fetch=originalFetch;}
const sql=readFileSync(new URL('../supabase/migrations/20261028020000_build691_gift_reopen_and_ql245_handoff.sql',import.meta.url),'utf8');
assert.match(sql,/connection_state='DISCONNECTED'/);
assert.match(sql,/owner_authorization='NOT_GIVEN'/);
assert.match(sql,/signer_state='NOT_PROVISIONED'/);
assert.match(sql,/security invoker/);assert.match(sql,/enable row level security/);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review691QL245/);
console.log('Build 691 QL-245 unsigned source metadata, no fabricated proof and owner-only DISCONNECTED intake: PASS');
