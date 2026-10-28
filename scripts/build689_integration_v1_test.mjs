import assert from 'node:assert/strict';
import {onRequest,canonicalV1Request,nonproductionEnabled} from '../functions/api/_lib/rosevear-integration-v1.js';
const host='https://dev.rosiedazzlers.pages.dev';
const path='/api/integration/v1/health';
const secret=crypto.getRandomValues(new Uint8Array(32));
const base64=a=>btoa(String.fromCharCode(...a));
const b64url=a=>base64(a).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const env={CF_PAGES_BRANCH:'dev',CF_PAGES_COMMIT_SHA:'a'.repeat(40),
  ROSEVEAR_INTEGRATION_V1_MODE:'nonproduction',
  ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN:host,
  ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID:'np-rosie-2026-current',
  ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64:base64(secret),
  SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'synthetic-test'};
const originalFetch=globalThis.fetch,nonceSet=new Set(),audits=[];
globalThis.fetch=async(input,opts={})=>{
  const url=new URL(input);assert.equal(url.hostname,'database.example.test','Only durable local audit is allowed');
  assert.equal(url.pathname,'/rest/v1/rpc/record_rosevear_integration_v1_probe');
  assert.equal(opts.method,'POST');const b=JSON.parse(opts.body);audits.push(b);
  let decision='denied';
  if(b.p_reason==='ok'&&b.p_claim_nonce){
    const key=`${b.p_key_id}/${b.p_nonce_sha256}`;
    decision=nonceSet.has(key)?'replay_denied':'accepted';nonceSet.add(key);
  }
  return Response.json({receipt_id:b.p_id,decision,connection_status:'HOLD',
    customer_messages_sent:0,write_capabilities:0});
};
async function headerSet(route=path,nonce=`np-${crypto.randomUUID().replace(/-/g,'')}`,
  timestamp=String(Date.now()),keyId=env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID){
  const canonical=canonicalV1Request({path:route,timestamp,nonce,keyId});
  assert.equal(canonical.split('\n').length,12);
  const k=await crypto.subtle.importKey('raw',secret,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(canonical)));
  return {'X-Rosevear-Contract':'rosevear.integration.v1','X-Rosevear-Environment':'nonproduction',
    'X-Rosevear-Source':'ai-data-platform','X-Rosevear-Destination':'rosiedazzlers',
    'X-Rosevear-Business':'rosiedazzlers','X-Rosevear-Tenant':'-',
    'X-Rosevear-Key-Id':keyId,'X-Rosevear-Timestamp':timestamp,
    'X-Rosevear-Nonce':nonce,'X-Rosevear-Signature':b64url(sig)};
}
async function attempt(opts={}){const route=opts.route||path;
  const request=new Request(host+route,{method:opts.method||'GET',
    headers:opts.headers||await headerSet(route),
    ...(opts.method==='POST'?{body:'{}'}:{})});
  const response=await onRequest({request,env:opts.env||env});
  return {status:response.status,body:await response.json(),headers:response.headers};
}
try{
  assert.equal(nonproductionEnabled(env,new Request(host+path)),true);
  assert.equal((await attempt({env:{...env,CF_PAGES_BRANCH:'main'}})).status,503);
  assert.equal((await attempt({env:{...env,ROSEVEAR_INTEGRATION_V1_MODE:'off'}})).status,503);
  assert.equal((await attempt({env:{...env,ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64:''}})).status,503);
  const h=await headerSet();const ok=await attempt({headers:h});
  assert.equal(ok.status,200);assert.equal(ok.body.source_system,'rosiedazzlers');
  assert.equal(ok.body.connection_status,'HOLD');
  assert.equal(ok.body.owner_pilot_authorized,false);
  assert.match(ok.body.source_audit_receipt_id,/^[0-9a-f-]{36}$/);
  assert.match(ok.headers.get('cache-control'),/no-store/);
  assert.equal((await attempt({headers:h})).status,403,'Duplicate nonce must be denied durably');
  const caps=await attempt({route:'/api/integration/v1/capabilities'});
  assert.equal(caps.status,200);assert.deepEqual(caps.body.allowed_operations,[]);
  assert.ok(caps.body.prohibited_operations.includes('gift_resend'));
  const tampered=await headerSet();tampered['X-Rosevear-Business']='devilndove';
  assert.equal((await attempt({headers:tampered})).status,403);
  const fake=await headerSet();fake['X-Rosevear-Signature']='A'.repeat(43);
  assert.equal((await attempt({headers:fake})).status,403);
  const stale=await headerSet(path,`np-${crypto.randomUUID().replace(/-/g,'')}`,String(Date.now()-350000));
  assert.equal((await attempt({headers:stale})).status,403);
  const wrongTenant=await headerSet();wrongTenant['X-Rosevear-Tenant']='another-campground';
  assert.equal((await attempt({headers:wrongTenant})).status,403);
  const rotated=await headerSet();env.ROSEVEAR_INTEGRATION_V1_REVOKED_KEY_IDS=env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID;
  assert.equal((await attempt({headers:rotated})).status,403);
  delete env.ROSEVEAR_INTEGRATION_V1_REVOKED_KEY_IDS;
  assert.equal((await attempt({method:'POST'})).status,403);
  assert.equal((await attempt({route:path+'?unsafe=1'})).status,403);
  assert.equal(audits.filter(x=>x.p_reason==='ok').length,3);
  assert.ok(audits.every(x=>!JSON.stringify(x).includes(env.ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64)));
}finally{globalThis.fetch=originalFetch;}
console.log('Build 689 QL-243 Rosie nonproduction HMAC identity, atomic replay and fail-closed capabilities: PASS');
