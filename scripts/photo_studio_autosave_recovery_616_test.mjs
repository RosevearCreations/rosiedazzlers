import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {onRequestGet,onRequestPost} from '../functions/api/admin/photo_library_save.js';

const REV='2026-10-22T19:00:00.000Z';
const NEXT='2026-10-22T19:01:00.000Z';
const env={SUPABASE_URL:'https://database.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-not-a-secret',ALLOW_LEGACY_ADMIN_FALLBACK:'true',ADMIN_PASSWORD:'test-only'};
const headers={'x-admin-password':'test-only','content-type':'application/json'};
const request=(body={})=>new Request('https://rosiedazzlers.ca/api/admin/photo_library_save',{method:'POST',headers,body:JSON.stringify(body)});
const getRequest=()=>new Request('https://rosiedazzlers.ca/api/admin/photo_library_save?id=photo-123',{headers});
const input={id:'photo-123',expected_updated_at:REV,label:'Unconfirmed photo edit',alt_text:'Customer vehicle interior detailing'};
const originalFetch=globalThis.fetch;
let calls=[];
const mockFetch=(handler)=>{calls=[];globalThis.fetch=async(url,options={})=>{calls.push({url:String(url),options});return handler(String(url),options);};};
const jsonResponse=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
const invoke=async(body=input)=>{const response=await onRequestPost({request:request(body),env});return {status:response.status,body:await response.json()};};

try{
  mockFetch(()=>{throw new Error('Database should not be called without a revision');});
  let r=await invoke({...input,expected_updated_at:undefined});
  assert.equal(r.status,428,'Unversioned metadata writes must be blocked');
  assert.equal(r.body.code,'revision_required');
  assert.equal(calls.length,0);

  mockFetch((_url,options)=>{assert.equal(options.method,'PATCH');return jsonResponse([]);});
  r=await invoke();
  assert.equal(r.status,409,'A zero-row compare-and-swap means another version won');
  assert.equal(r.body.code,'revision_conflict');
  const params=new URL(calls[0].url).searchParams;
  assert.equal(params.get('updated_at'),`eq.${REV}`,'The DB—not browser—enforces the prior revision');
  assert.equal(params.get('id'),'eq.photo-123');
  assert.match(calls[0].options.headers.Prefer,/return=representation/);

  mockFetch(()=>jsonResponse({error:'service unavailable'},503));
  r=await invoke();
  assert.equal(r.status,503);
  assert.equal(r.body.recovery,'review_saved_version');
  assert.equal(calls.length,1,'No auto retry after a transient database failure');

  mockFetch(()=>{throw new Error('Connection lost after request was sent');});
  r=await invoke();
  assert.equal(r.status,503,'Unknown write outcome must not be reported as success');
  assert.equal(calls.length,1,'Do not repeat a write on network error');

  const saved={id:input.id,updated_at:NEXT,label:input.label,alt_text:input.alt_text,r2_key:'gallery/saved.jpg',media_url:'https://assets.rosiedazzlers.ca/gallery/saved.jpg'};
  mockFetch(()=>jsonResponse([saved]));
  r=await invoke();
  assert.equal(r.status,200);
  assert.equal(r.body.photo.updated_at,NEXT,'Return the server-confirmed next revision');
  assert.equal(calls.length,1,'No schema fanout or follow-up GET on success');

  mockFetch((url,options)=>{assert.equal(options.method,undefined,'Recovery review must be read-only');assert.match(url,/id=eq.photo-123/);return jsonResponse([saved]);});
  const read=await onRequestGet({request:getRequest(),env});
  assert.equal(read.status,200);
  assert.equal((await read.json()).photo.updated_at,NEXT);
  assert.equal(calls.length,1);

  mockFetch(()=>jsonResponse({},503));
  const failRead=await onRequestGet({request:getRequest(),env});
  assert.equal(failRead.status,503);
  assert.equal(calls.length,1,'Read-only review should not auto retry either');

  const page=fs.readFileSync('admin-photo-studio.html','utf8');
  const mirror=fs.readFileSync('admin-photo-studio/index.html','utf8');
  assert.equal(page,mirror,'Both real admin URLs must ship the same recovery editor');
  for(const needle of ['id="metadataRecovery"','id="reviewSavedPhoto"','id="copyMetadataDraft"','id="loadSavedPhoto"','id="metadataDraftExport"','expected_updated_at:state.selected?.updated_at','window.addEventListener(\'beforeunload\'','No automatic retry']){
    assert.ok(page.includes(needle),`Missing recovery safeguard: ${needle}`);
  }
  const match=page.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match,'Expected Photo Studio module script');
  const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:match[1],encoding:'utf8'});
  assert.equal(check.status,0,check.stderr||'Photo Studio module syntax error');
  console.log('Build 616 Photo Studio metadata recovery: PASS (428 / 409 / 503 / uncertain write / read-only review / route parity)');
}finally{globalThis.fetch=originalFetch;}
