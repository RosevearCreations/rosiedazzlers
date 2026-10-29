import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ql256RuntimeInventory,onRequestGet}
  from '../functions/api/admin/integration_v1_ql256_config_inventory.js';

const sentinel='DO_NOT_LEAK_PRIVATE_VALUE';
const env={SUPABASE_URL:'https://database.example.test',
  SUPABASE_SERVICE_ROLE_KEY:sentinel,CF_PAGES_BRANCH:'main',
  ROSEVEAR_INTEGRATION_V1_MODE:'nonproduction',
  ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID:'np_test_real',
  ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64:Buffer.alloc(32,3).toString('base64url'),
  ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN:'https://private.example.test',
  ROSEVEAR_QL246_TRUSTED_SPKI_SHA256:'a'.repeat(64),
  ROSEVEAR_QL246_EXPECTED_SOURCE_SHA:'b'.repeat(40),
  ROSEVEAR_QL246_EXPECTED_CI_RUN_URL:'https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40878439083',
  ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID:'np-real-custody-challenge',
  ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256:'c'.repeat(64)};
const inventory=ql256RuntimeInventory(env);
assert.equal(inventory.production_branch,true);
assert.equal(inventory.production_integration_gate_enabled,false);
assert.equal(inventory.runtime_ql246_pin_fields_complete,true);
assert.equal(inventory.signer_provisioning_decision,'SIGNER_STATUS_UNKNOWN');
assert.equal(inventory.signer_custodian_privately_authenticated,false);
assert.equal(inventory.owner_test_authorization,'NOT_GIVEN');
assert.equal(inventory.original_gift_hold_unaffected,true);
assert.equal(inventory.resend_permitted,false);
assert.equal(inventory.connection_state,'DISCONNECTED');
assert.ok(inventory.bindings.find(r=>r.name==='ROSEVEAR_QL246_TRUSTED_SPKI_SHA256').configured);
assert.equal(inventory.bindings.find(r=>r.name==='ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA').configured,false);
assert.equal(JSON.stringify(inventory).includes(sentinel),false);
assert.equal(JSON.stringify(inventory).includes(env.ROSEVEAR_QL246_TRUSTED_SPKI_SHA256),false);
assert.equal(ql256RuntimeInventory({}).runtime_ql246_pin_fields_complete,false);

const originalFetch=globalThis.fetch;
const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),
  b=>b.toString(16).padStart(2,'0')).join('');
let calls=[];
globalThis.fetch=async(url,options={})=>{
  assert.equal(new URL(url).hostname,'database.example.test');calls.push(options.method||'GET');
  const hashed=new URL(url).searchParams.get('token_hash')?.replace('eq.','');
  const admin=hashed===await digest('owner-token'),staff=hashed===await digest('staff-token');
  return new Response(JSON.stringify(!admin&&!staff?[]:[{id:'session',
    staff_user:{id:'70100000-0000-4000-8000-000000000000',
      role_code:staff?'detailer':'admin',is_active:true,is_admin:!staff,
      full_name:'Fixture',permissions_profile:{}},
    revoked_at:null,expires_at:new Date(Date.now()+600000).toISOString(),created_at:new Date().toISOString()}]),
    {status:200,headers:{'content-type':'application/json'}});
};
async function request(token){return onRequestGet({request:new Request(
  'https://rosiedazzlers.ca/api/admin/integration_v1_ql256_config_inventory',{
    headers:token?{cookie:`rd_staff_session=${token}-token`}:{}}),env});}
try{
  assert.equal((await request('missing')).status,401);
  assert.equal((await request('staff')).status,403);
  const r=await request('owner');assert.equal(r.status,200);
  assert.equal(r.headers.get('Cache-Control'),'private, no-store');
  const data=await r.json();assert.equal(data.ok,true);
  assert.equal(JSON.stringify(data).includes(sentinel),false);
  assert.ok(calls.every(x=>x==='GET'));
}finally{globalThis.fetch=originalFetch;}
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review701QL256Inspect/);
assert.equal('onRequestPost' in await import('../functions/api/admin/integration_v1_ql256_config_inventory.js'),false);
console.log('Build 701 owner-only binding presence, secrets redacted, no gateway/CI/authorization and HOLD unchanged: PASS');
