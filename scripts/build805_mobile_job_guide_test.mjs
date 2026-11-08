import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIELD_STEPS805,fieldGuide805,proofCounts805} from '../assets/detailer-job-guide-v805.mjs';
import {onRequestPost as onsitePost} from '../functions/api/detailer/onsite_setup_v746.js';

const path=url=>readFileSync(new URL(url,import.meta.url),'utf8');
const good={jobId:'job',loaded:true,onsiteReady:true,beforePhoto:true,checklist:true,
  addons:false,products:false,completion:false,afterPhoto:false,canStart:true,canComplete:false};
const options={fieldState:good,stage:'detailing',assignmentVerified:true,feedVerified:true,online:true,pendingUpload:false};
const verified=fieldGuide805(options);
assert.equal(FIELD_STEPS805.length,7);
assert.equal(verified.current,true);
assert.equal(verified.complete,3);
assert.equal(verified.next.key,'addons');
assert.equal(verified.steps.find(item=>item.key==='beforePhoto').status,'done');
assert.equal(fieldGuide805({...options,stage:'arrived',fieldState:{...good,onsiteReady:false}}).next.key,'onsiteReady');
assert.equal(fieldGuide805({...options,stage:'detailing',fieldState:{...good,onsiteReady:false}}).steps[0].status,'review');
assert.equal(fieldGuide805({...options,feedVerified:false}).steps.every(item=>item.status==='recheck'),true);
assert.equal(fieldGuide805({...options,assignmentVerified:false}).next,null);
assert.equal(fieldGuide805({...options,online:false}).current,false);
assert.equal(fieldGuide805({...options,pendingUpload:true}).next,null,'Uncertain original upload blocks guided next action');
assert.equal(fieldGuide805({...options,fieldState:{...good,loaded:false}}).current,false,'Failed evidence read cannot claim ready');
assert.equal(fieldGuide805({...options,fieldState:{...good,addons:true,products:true,completion:true,afterPhoto:true,canComplete:true}}).message.includes('Independent quality'),true);
assert.deepEqual(proofCounts805({stage_counts:{arrival:2,final:1}}),{before:2,after:1});
assert.deepEqual(proofCounts805({stage_counts:{arrival:-1,final:'not-a-number'}}),{before:0,after:0});
assert.deepEqual(proofCounts805(null),{before:0,after:0});

// Verify the scoped onsite read remains available after Start, without extending edit authority.
const origin='https://rosiedazzlers.ca',db='https://mock-db.invalid';
const bookingId='dab89e67-cc92-4b6a-832f-64b8d5f22842';
const staffId='ac697b64-72f5-4ed5-bbaa-c761bdf8c82d';
const actor={id:staffId,role_code:'detailer',is_active:true,full_name:'Test Detailer',email:'test@staff.invalid'};
let stage='detailing',writeCount=0;
const revision='2026-11-02T15:00:00Z';
const intake={id:'intake-test',booking_id:bookingId,updated_at:revision};
const event={id:'event-test',event_type:'detailer_onsite_setup_v746',created_at:revision,
  payload:{intake_revision:revision,photo_consent:'internal_job_evidence'}};
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input);assert.equal(url.origin,db,'No real database accessed');
  const table=url.pathname.split('/').pop();
  if((options.method||'GET')!=='GET'){writeCount++;throw new Error('Read-only test unexpectedly attempted a write');}
  if(table==='staff_auth_sessions')return Response.json([{id:'test',expires_at:'2030-01-01T00:00:00Z',revoked_at:null,staff_user:actor}]);
  if(table==='staff_users')return Response.json([actor]);
  if(table==='booking_staff_assignments')return Response.json([]);
  if(table==='bookings')return Response.json([{id:bookingId,updated_at:revision,status:'confirmed',job_status:'in_progress',current_workflow_stage:stage,assigned_staff_user_id:staffId,assigned_staff_email:actor.email}]);
  if(table==='jobsite_intake')return Response.json([intake]);
  if(table==='booking_events')return Response.json([event]);
  throw new Error(`Unexpected table: ${table}`);
};
const request=(action,{cookie=true,requestOrigin=origin}={})=>({env:{SUPABASE_URL:db,SUPABASE_SERVICE_ROLE_KEY:'test-only'},
  request:new Request(`${origin}/api/detailer/onsite_setup_v746`,{method:'POST',headers:{Origin:requestOrigin,
    'Content-Type':'application/json',...(cookie?{Cookie:'rd_staff_session=test'}:{})},body:JSON.stringify({booking_id:bookingId,action})})});
try{
  for(const active of ['detailing','paused']){
    stage=active;
    const result=await onsitePost(request('load'));assert.equal(result.status,200,await result.clone().text());
    const body=await result.json();
    assert.equal(body.receipt.photo_consent,'internal_job_evidence');
    assert.equal(body.booking_revision,revision);
    assert.equal((await onsitePost(request('save'))).status,409,'No post-start editing');
  }
  assert.equal((await onsitePost(request('load',{cookie:false}))).status,401);
  assert.equal((await onsitePost(request('load',{requestOrigin:'https://outsider.invalid'}))).status,403);
  stage='scheduled';assert.equal((await onsitePost(request('load'))).status,409);
  assert.equal(writeCount,0,'Test-only proof read made no mutations');
}finally{globalThis.fetch=originalFetch;}

const app=path('../app/detailer/index.html'),live=path('../apps/detailer/live-job-module.js');
const client=path('../apps/detailer/detailer-app.js');
for(const marker of ['fieldGuide805Steps','fieldGuide805Photos','fieldGuide805Recheck','fieldGuide805Inspect',
  'data-guide805-target','feedVerified805=false','feedSequence805','original_sha256','onsite746.receipt?.photo_consent','canRecoverPending805',
  'document.body.dataset.build745Sync','No automatic retry'])assert.ok(live.includes(marker),`Missing mobile recovery control: ${marker}`);
assert.ok(app.includes('data-build805="mobile-job-guide-and-proof-recovery"'));
assert.ok(app.includes('field-guide805-grid'));
assert.ok(client.includes('live-job-module.js?v=20261108build805'));
assert.ok(client.includes('liveModuleMount805=mod.mount('),'Rapid job refreshes share one lazy field-module mount');
assert.ok(client.includes('liveModule?.setJob?.(selected,currentPolicy)'),'Selection is reconciled after lazy mount');
assert.doesNotMatch(live,/setInterval\s*\(|localStorage|indexedDB|SyncManager/,'No automatic polling or private offline snapshot');
console.log('Build 805 PASS: evidence-derived mobile guide, before/after proof, read-only consent after Start, stale feed refusal, manual upload recovery and no new authority.');
