import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign,verify,createHash} from 'node:crypto';
import {onRequestGet,onRequestPost} from '../functions/api/admin/integration_v1_original_receipt_intake.js';
import {QL246_KEYS,QL246_DENIAL_KEYS,canonicalQl246Payload,pendingQl246SourceProof,checkQl246ProofShape}
  from '../functions/api/_lib/rosevear-integration-ql246.js';

const owner='69200000-0000-4000-8000-000000000001',other='69200000-0000-4000-8000-000000000002';
const url='https://rosiedazzlers.ca/api/admin/integration_v1_original_receipt_intake';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',
  CF_PAGES_COMMIT_SHA:'a'.repeat(40),ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64:'B'.repeat(42)};
const oldFetch=globalThis.fetch,calls=[],receipts=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{const u=new URL(input),method=init.method||'GET';
  calls.push([u.pathname,method]);assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','other-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'session',staff_user:{id:ix?other:owner,role_code:ix?'detailer':'admin',
      is_active:true,permissions_profile:{},full_name:'Operator'},revoked_at:null,
      expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]);}
  if(u.pathname.endsWith('/rosevear_integration_v1_original_receipt_intake'))return Response.json(receipts);
  if(u.pathname.endsWith('/rpc/record_rosevear_integration_v1_original_receipt_intake')){
    const b=JSON.parse(init.body);assert.equal(b.p_owner_id,owner);assert.equal(b.p_evidence_sha256.length,64);
    if(receipts.some(x=>x.evidence_reference===b.p_evidence_reference))return Response.json({error:'duplicate'},{status:409});
    receipts.push({id:b.p_id,evidence_reference:b.p_evidence_reference,review_state:'UNVERIFIED_ORIGINAL'});
    return Response.json({id:b.p_id,connection_state:'DISCONNECTED',authenticated_gateway_requests:0});}
  throw Error('External gateway contact forbidden: '+u.pathname);};
async function call(method,who,body,origin='https://rosiedazzlers.ca'){
  const request=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:response.status,data:await response.json()};}
const body=()=>({evidence_reference:'QL246-ROSIE-692',receipt_kind:'health',
  original_receipt_reference:'np-owner-receipt-unverified',source_revision:'a'.repeat(40),
  observed_at:new Date().toISOString(),confirm_independent_verification_pending:true,
  confirm_no_owner_authorization:true,confirm_no_gateway_contact:true});
try{
  const draft=pendingQl246SourceProof('a'.repeat(40));
  assert.deepEqual(Object.keys(draft),QL246_KEYS);assert.equal(draft.connection_state,'DISCONNECTED');
  assert.equal(draft.challenge_id,null);assert.equal(draft.issued_at,null);
  assert.ok(Object.values(draft.negative_tests).every(v=>v===false));
  assert.equal((await call('GET','other')).status,403);
  const get=await call('GET','owner');assert.equal(get.status,200);
  assert.equal(get.data.ql246_signed_payload_order.length,24);
  assert.equal(JSON.stringify(get.data).includes('B'.repeat(42)),false);
  assert.equal((await call('POST','other',body())).status,403);
  assert.equal((await call('POST','owner',body(),'https://evil.test')).status,403);
  const missing=body();missing.confirm_independent_verification_pending=false;
  assert.equal((await call('POST','owner',missing)).status,400);
  const fake=body();fake.original_receipt_reference='https://fake.test/receipt';
  assert.equal((await call('POST','owner',fake)).status,400);
  assert.equal((await call('POST','owner',body())).status,200);
  assert.equal((await call('POST','owner',body())).status,409);
  assert.equal((await call('GET','owner')).data.intakes.length,1);
  assert.ok(calls.every(([p,m])=>p.startsWith('/rest/v1/')&&
    (m==='GET'||p.endsWith('/rpc/record_rosevear_integration_v1_original_receipt_intake'))));
}finally{globalThis.fetch=oldFetch;}

// Ephemeral signing fixture proves canonical field order; it is NOT a real signed handoff.
const now=Date.now(),challenge='test-source-only-never-publish';
const payload={...pendingQl246SourceProof('a'.repeat(40)),challenge_id:'np-temporary-test',
  challenge_sha256:createHash('sha256').update(challenge).digest('hex'),
  ci_run_url:'https://github.com/RosevearCreations/rosiedazzlers/actions/runs/1234',
  negative_tests:Object.fromEntries(QL246_DENIAL_KEYS.map(k=>[k,true])),
  issued_at:now-1000,expires_at:now+300000};
const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const canonical=Buffer.from(canonicalQl246Payload(payload),'utf8');
const signature=sign(null,canonical,privateKey);
const envelope={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,
  signature:signature.toString('base64url')};
assert.equal(checkQl246ProofShape(envelope,now).ok,true);
assert.equal(verify(null,canonical,publicKey,signature),true);
assert.equal(verify(null,Buffer.from(canonical+'\n'),publicKey,signature),false);
assert.equal(checkQl246ProofShape({...envelope,payload:{...payload,expires_at:now-1}},now).ok,false);
assert.equal(checkQl246ProofShape({...envelope,payload:{...payload,
  negative_tests:pendingQl246SourceProof().negative_tests}},now).ok,false);
assert.equal(checkQl246ProofShape({...envelope,secret:'never'},now).ok,false);
const sql=readFileSync(new URL('../supabase/migrations/20261028030000_build692_gift_discrepancy_and_original_receipt_intake.sql',import.meta.url),'utf8');
assert.match(sql,/review_state='UNVERIFIED_ORIGINAL'/);
assert.match(sql,/connection_state='DISCONNECTED'/);
assert.match(sql,/security invoker/);assert.match(sql,/enable row level security/);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review692QL246/);
console.log('Build 692 QL245 original receipt intake, QL246 24-field canonical signature fixture and DISCONNECTED gates: PASS');
