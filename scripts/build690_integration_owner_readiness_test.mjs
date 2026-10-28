import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,configurationSnapshot} from '../functions/api/admin/integration_v1_owner_readiness.js';
const owner='69000000-0000-4000-8000-000000000010',other='69000000-0000-4000-8000-000000000011';
const url='https://rosiedazzlers.ca/api/admin/integration_v1_owner_readiness';
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
    const tokens=await Promise.all(['owner-token','other-token'].map(digest));
    const n=tokens.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(n<0?[]:[{id:'session',staff_user:{id:n?other:owner,role_code:n?'detailer':'admin',
      is_active:true,full_name:'Test staff',permissions_profile:{}},revoked_at:null,
      expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]);}
  if(u.pathname.endsWith('/rosevear_integration_v1_owner_readiness_reviews'))return Response.json(receipts);
  if(u.pathname.endsWith('/rpc/record_rosevear_integration_v1_owner_readiness')){
    const b=JSON.parse(init.body);assert.equal(b.p_owner_id,owner);
    assert.equal(b.p_snapshot.gateway_audit_verified,false);
    assert.equal(b.p_snapshot.pilot_authorized,false);
    assert.equal(b.p_evidence_sha256.length,64);
    if(receipts.some(x=>x.evidence_reference===b.p_evidence_reference))return Response.json({error:'duplicate'},{status:409});
    const receipt={id:b.p_id,evidence_reference:b.p_evidence_reference,created_at:new Date().toISOString()};
    receipts.push(receipt);return Response.json({id:b.p_id,connection_status:'HOLD',pilot_authorized:false});}
  throw Error('No external gateway allowed '+u.pathname);};
async function call(method,who,body,origin='https://rosiedazzlers.ca'){
  const r=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request:r,env});
  return {status:response.status,data:await response.json()};}
const body=()=>({evidence_reference:'QL243-TEST-690',observed_at:new Date().toISOString(),
  confirm_no_live_link:true,confirm_no_gateway_proof:true,confirm_no_pilot_approval:true});
try{
  const s=configurationSnapshot(env);assert.equal(Object.keys(s).length,7);
  assert.equal(s.hmac_key_configured,true);assert.equal(s.pilot_authorized,false);
  assert.equal((await call('GET','other')).status,403);
  const d=await call('GET','owner');assert.equal(d.status,200);
  assert.equal(d.data.connection_status,'HOLD');assert.equal(d.data.gateway_connected,false);
  assert.equal(JSON.stringify(d.data).includes('A'.repeat(43)),false,'secret never exposed');
  assert.equal((await call('POST','other',body())).status,403);
  assert.equal((await call('POST','owner',body(),'https://evil.test')).status,403);
  const missing=body();missing.confirm_no_pilot_approval=false;
  assert.equal((await call('POST','owner',missing)).status,400);
  const saved=await call('POST','owner',body());assert.equal(saved.status,200);
  assert.equal(saved.data.receipt.connection_status,'HOLD');
  assert.equal((await call('POST','owner',body())).status,409);
  assert.equal((await call('GET','owner')).data.reviews.length,1);
  assert.ok(calls.every(x=>x.path.startsWith('/rest/v1/')&&
    (x.method==='GET'||x.path.endsWith('/rpc/record_rosevear_integration_v1_owner_readiness'))));
}finally{globalThis.fetch=originalFetch;}
const sql=readFileSync(new URL('../supabase/migrations/20261028010000_build690_gift_recurrence_alert_integration_readiness.sql',import.meta.url),'utf8');
assert.match(sql,/connection_status='HOLD'/);assert.match(sql,/pilot_authorized=false/);
assert.match(sql,/gateway_audit_verified/);assert.match(sql,/security invoker/);
console.log('Build 690 owner-only QL-243 nonproduction HOLD readiness and no-connect tests: PASS');
