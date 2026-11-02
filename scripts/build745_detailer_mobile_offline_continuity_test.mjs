import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MOBILE_STAGE_ACTIONS745,allowedMobileTransition745,mobileBoardGroups745,reconciliationMessage745} from '../assets/detailer-mobile-dayboard-v745.mjs';
import {directlyAssigned745,canWorkMobileBooking745} from '../functions/api/_lib/detailer-mobile-scope-v745.js';
import {onRequestGet as jobsGet} from '../functions/api/detailer/jobs.js';
import {onRequestPost as jobPost} from '../functions/api/detailer/job_action.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const staffId='ac697b64-72f5-4ed5-bbaa-c761bdf8c82d';
const bookingId='dab89e67-cc92-4b6a-832f-64b8d5f22842';
const nameOnlyId='dd2741bd-eab8-4529-a8e3-f4b3cadd8cab';
const env={SUPABASE_URL:'https://mock-db.invalid',SUPABASE_SERVICE_ROLE_KEY:'only-test-key'};
const base='https://rosiedazzlers.ca';
const user={id:staffId,full_name:'Taylor Detailer',email:'taylor@example.org',role_code:'detailer',is_active:true,
  can_manage_bookings:false,can_manage_progress:false,permissions_profile:null};
const assigned={id:bookingId,updated_at:'2026-11-02T10:00:00.000+00:00',service_date:'2026-11-02',start_slot:'AM',
  status:'confirmed',job_status:'scheduled',current_workflow_stage:'scheduled',customer_name:'Private Customer',
  customer_email:'private@customer.invalid',package_code:'basic_detail',city:'Tillsonburg',service_area:'Ontario',
  assigned_staff_user_id:staffId,assigned_staff_email:user.email,assigned_staff_name:user.full_name,
  notes:'Bring private access key.',trusted_service_latitude:43.1,progress_token:'authorized-live-token'};
const nameOnly={...assigned,id:nameOnlyId,assigned_staff_user_id:null,assigned_staff_email:null,assigned_staff_name:user.full_name};
let current={...assigned},patched=[],events=[],alerts=[],racing=false;
const originalFetch=globalThis.fetch;

const response=rows=>Response.json(rows);
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input);
  assert.equal(url.origin,env.SUPABASE_URL,'No external service may be contacted in acceptance');
  const table=url.pathname.split('/').pop(),method=options.method||'GET';
  if(table==='staff_auth_sessions')return response([{id:'session',expires_at:'2030-01-01T00:00:00Z',revoked_at:null,
    created_at:'2026-11-02T09:00:00Z',staff_user:user}]);
  if(table==='staff_users')return response([user]);
  if(table==='booking_staff_assignments')return response([]);
  if(table==='bookings'){
    if(method==='PATCH'){
      const expected=url.searchParams.get('updated_at');
      assert.equal(expected,`eq.${current.updated_at}`,'Mutation must carry exact server revision');
      if(racing)return response([]);
      const patch=JSON.parse(options.body);patched.push(patch);
      current={...current,...patch};return response([current]);
    }
    const id=url.searchParams.get('id');
    if(id?.startsWith('eq.'))return response(id.slice(3)===current.id?[current]:[]);
    const filter=url.searchParams.get('or')||'';
    assert.match(filter,/assigned_staff_user_id\.eq\./);
    assert.doesNotMatch(filter,/assigned_staff_name|assigned_to|ilike/,'No name-based authority in mobile query');
    return response([current]); // Auth-filtered DB result; nameOnly must never qualify.
  }
  if(table==='booking_events'&&method==='POST'){events.push(JSON.parse(options.body));return response([]);}
  throw new Error(`Unexpected fetch: ${method} ${table}`);
};

const getCtx=({cookie=true,bridge=false}={})=>({request:new Request(`${base}/api/detailer/jobs?scope=mobile_v745`,{
  headers:{...(cookie?{Cookie:'rd_staff_session=valid-test-token'}:{}),...(bridge?{'x-staff-user-id':staffId}:{})}
}),env});
const actionCtx=(data,{cookie=true,origin=base,bridge=false}={})=>({request:new Request(`${base}/api/detailer/job_action`,{
  method:'POST',headers:{'Content-Type':'application/json',Origin:origin,
    ...(cookie?{Cookie:'rd_staff_session=valid-test-token'}:{}),...(bridge?{'x-staff-user-id':staffId}:{})},body:JSON.stringify(data)
}),env});
const mobileBody=(action='accept')=>({booking_id:bookingId,client_v745:true,action,
  expected_updated_at:current.updated_at,expected_stage:current.current_workflow_stage});

try {
  assert.equal(allowedMobileTransition745('scheduled','accept'),true);
  assert.equal(allowedMobileTransition745('scheduled','complete'),false);
  assert.equal(allowedMobileTransition745('detailing','pause'),true);
  assert.equal(allowedMobileTransition745('paused','resume'),true);
  assert.equal(allowedMobileTransition745('completed','dispatch'),false);
  assert.equal(MOBILE_STAGE_ACTIONS745.arrived.join(','),'start');
  const board=mobileBoardGroups745([
    {...assigned,id:'b',service_date:'2026-11-03',start_slot:'PM'},
    {...assigned,id:'a',service_date:'2026-11-02',start_slot:'PM'},
    {...assigned,id:'c',service_date:'2026-11-02',start_slot:'AM'},
    {...assigned,id:'done',current_workflow_stage:'awaiting_payment'}
  ],{now:new Date('2026-11-02T14:00:00Z')});
  assert.deepEqual(board.groups.map(g=>g.jobs.map(j=>j.id)),[['c','a'],['b']]);
  assert.equal(mobileBoardGroups745(board.groups.flatMap(g=>g.jobs),{filter:'today',now:new Date('2026-11-02T14:00:00Z')}).total,2);
  assert.match(reconciliationMessage745({assignmentGone:true}),/no longer assigned/);
  assert.match(reconciliationMessage745({stageChanged:true}),/changed/);
  assert.equal(directlyAssigned745(user,nameOnly),false);
  assert.equal(directlyAssigned745(user,assigned),true);
  assert.equal(await canWorkMobileBooking745({env,actor:{...user,is_detailer:true},booking:nameOnly}),false);

  assert.equal((await jobsGet(getCtx({cookie:false}))).status,401,'Anonymous board rejected');
  assert.equal((await jobsGet(getCtx({cookie:false,bridge:true}))).status,401,'Bridge cannot load mobile board');
  let result=await jobsGet(getCtx());assert.equal(result.status,200,await result.clone().text());
  let data=await result.json();assert.equal(data.workspace.build,745);
  assert.equal(data.workspace.canonical_assignment_only,true);
  assert.equal(data.workspace.offline_snapshot_persisted,false);
  assert.equal(data.workspace.automatic_replay,false);
  assert.equal(data.jobs.length,1);
  assert.equal(data.jobs[0].id,bookingId);
  assert.equal(data.jobs[0].updated_at,assigned.updated_at);
  assert.equal(data.jobs[0].notes,assigned.notes,'Staff instructions kept only in authorized response');
  assert.equal(JSON.stringify(data).includes('private@customer.invalid'),false,'Customer email omitted');
  assert.equal(JSON.stringify(data).includes('43.1'),false,'Private trusted coordinates omitted');
  assert.equal(JSON.stringify(data).includes('assigned_staff_email'),false,'Assignment identities omitted');

  assert.equal((await jobPost(actionCtx(mobileBody(),{cookie:false,bridge:true}))).status,401);
  assert.equal((await jobPost(actionCtx(mobileBody(),{origin:'https://attacker.invalid'}))).status,403,'Cross-site session POST denied');
  assert.equal((await jobPost(actionCtx({...mobileBody(),expected_updated_at:'2026-11-01T10:00:00Z'}))).status,409,'Stale revision rejected');
  assert.equal((await jobPost(actionCtx({...mobileBody(),expected_stage:'arrived'}))).status,409,'Stale stage rejected');
  assert.equal((await jobPost(actionCtx(mobileBody('complete')))).status,409,'Disallowed stage transition rejected');
  assert.equal(patched.length,0);assert.equal(events.length,0);

  current={...current,assigned_staff_user_id:null,assigned_staff_email:null,assigned_staff_name:user.full_name};
  assert.equal((await jobPost(actionCtx(mobileBody()))).status,403,'Name-only assignment cannot mutate');
  assert.equal(events.length,0);
  current={...assigned};
  racing=true;
  assert.equal((await jobPost(actionCtx(mobileBody()))).status,409,'CAS lost; no replay or duplicate event');
  assert.equal(events.length,0);
  racing=false;
  result=await jobPost(actionCtx(mobileBody()));assert.equal(result.status,200,await result.clone().text());
  data=await result.json();assert.equal(data.action,'accept');assert.equal(data.booking.current_workflow_stage,'accepted');
  assert.equal(patched.length,1);assert.equal(events.length,1);
  assert.equal((await jobPost(actionCtx({...mobileBody(),expected_updated_at:assigned.updated_at,expected_stage:'scheduled'}))).status,409,'Repeat of applied action cannot replay');
  assert.equal(events.length,1);

  const html=read('../app/detailer/index.html');
  const client=read('../apps/detailer/detailer-app.js');
  const live=read('../apps/detailer/live-job-module.js');
  const build400=read('../assets/build400-detailer-mobile-qol.js');
  const build432=read('../assets/build432-staff-workflow-refinement.js');
  const worker=read('../service-worker.js');
  for(const snippet of ['data-build745-filter="today"','data-build745-filter="week"','data-build745-filter="all"','build745ContinuityStatus','aria-pressed','Refresh &amp; reconcile'])
    assert.ok(html.includes(snippet),`Mobile accessible board missing ${snippet}`);
  for(const snippet of ['scope=mobile_v745','expected_updated_at','client_v745:true','reconciliationRequired','addEventListener(\'offline\'','addEventListener(\'online\'','continuityEpoch','wasDisconnected'])
    assert.ok(client.includes(snippet),`Offline safety missing ${snippet}`);
  assert.ok(live.includes("document.body.dataset.build745Sync==='verified'"),'Field evidence must be disabled until reverified');
  assert.doesNotMatch(client,/localStorage|indexedDB|SyncManager|setInterval\s*\(/i,'No persisted private snapshots or auto replay');
  assert.match(client,/rosie:shift-punch-v748:/,'Only a clock-operation UUID/revision is kept for deliberate idempotent recovery');
  assert.match(client,/shift748\.pending=\{operation_id:crypto\.randomUUID\(\),punch,expected_revision:/,'No private job snapshot or note is persisted with the clock operation');
  assert.ok(build400.includes('tabTimers745')&&build400.includes('if(ephemeral745)return tabTimers745.get'),'Build 400 cosmetic timer is not job-keyed persistent storage on Build 745');
  assert.ok(build432.includes('lastJobInTab745')&&build432.includes('ephemeral745?lastJobInTab745'),'Build 432 last viewed job stays in volatile tab memory');
  assert.ok(worker.includes('/api/'),'API cache exclusion contract retained');
  assert.doesNotMatch(worker,/sync\.register|addEventListener\(['"]sync['"]/i,'No background mutation replay');
  assert.deepEqual(alerts,[]);
  console.log('Build 745 PASS: assigned-only mobile day board, role/session scope, origin and optimistic-concurrency gates, offline read-only recovery, no automatic replay.');
} finally {globalThis.fetch=originalFetch;}
