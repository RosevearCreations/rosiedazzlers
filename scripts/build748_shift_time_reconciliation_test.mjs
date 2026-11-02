import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {reconcileShift748,SHIFT_SOURCE748,SHIFT_TYPES748,stableReceiptId748} from '../functions/api/_lib/shift-reconciliation-v748.js';
import {onRequestPost as staffPost} from '../functions/api/detailer/shift_v748.js';
import {onRequestPost as reviewPost} from '../functions/api/admin/shift_review_v748.js';

const bookingId='dab89e67-cc92-4b6a-832f-64b8d5f22842',staffId='ac697b64-72f5-4ed5-bbaa-c761bdf8c82d',reviewerId='11111111-2222-4333-8444-555555555555';
const origin='https://rosiedazzlers.ca',env={SUPABASE_URL:'https://database.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const staff={id:staffId,full_name:'Rosie Detailer',email:'detailer@example.invalid',role_code:'detailer',is_active:true,can_manage_bookings:false};
const manager={id:reviewerId,full_name:'Operations',email:'manager@example.invalid',role_code:'admin',is_active:true,can_manage_bookings:true};
let actor=staff,booking={id:bookingId,current_workflow_stage:'dispatched',assigned_staff_user_id:staffId,assigned_staff_email:staff.email};
let rows=[],events=[],payrollWrites=0,insertCount=0,receiptCount=0;
const realFetch=globalThis.fetch,respond=body=>Response.json(body);
const request=(leaf,body,{cookie=true,requestOrigin=origin}={})=>({env,request:new Request(`${origin}/api/${leaf}`,{
  method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json',...(cookie?{Cookie:'rd_staff_session=test'}:{})},body:JSON.stringify(body)
})});
const call=async(handler,leaf,body,opts)=>{const res=await handler(request(leaf,body,opts));return {status:res.status,body:await res.json()};};
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input),method=options.method||'GET',table=url.pathname.split('/').pop();
  assert.equal(url.origin,env.SUPABASE_URL,'No provider requests permitted during regression');
  if(table.startsWith('payroll')||table.startsWith('accounting')){payrollWrites++;throw Error('Shift review cannot mutate payroll/accounting');}
  if(table==='staff_auth_sessions')return respond([{id:'session',expires_at:'2030-01-01T00:00:00Z',staff_user:actor}]);
  if(table==='staff_users')return respond([actor]);
  if(table==='bookings')return respond([booking]);
  if(table==='booking_staff_assignments')return respond([]);
  if(table==='job_time_entries'){
    if(method==='GET')return respond(rows);
    const row=JSON.parse(options.body)[0];
    if(rows.some(x=>x.id===row.id))return new Response('duplicate',{status:409});
    assert.equal(row.minutes,0);assert.equal(row.source,SHIFT_SOURCE748);insertCount++;
    rows.push({...row,created_at:row.event_time});return respond([row]);
  }
  if(table==='booking_events'){
    if(method==='GET')return respond(url.searchParams.has('id')?events.filter(e=>`eq.${e.id}`===url.searchParams.get('id')):events);
    const row=JSON.parse(options.body)[0];
    if(events.some(x=>x.id===row.id))return new Response('duplicate',{status:409});
    receiptCount++;events.unshift({...row,created_at:new Date().toISOString()});return respond([row]);
  }
  throw Error(`Unexpected mock ${method} ${url.pathname}`);
};

try{
  const timed=[['clock_in','08:00'],['travel_start','08:10'],['travel_stop','08:40'],['work_start','08:45'],['break_start','10:15'],['break_stop','10:30'],['work_stop','12:00'],['clock_out','12:10']]
    .map(([action,time],i)=>({id:`event-${i}`,source:SHIFT_SOURCE748,entry_type:SHIFT_TYPES748[action],event_time:`2026-11-02T${time}:00Z`}));
  const computed=reconcileShift748(timed);
  assert.equal(computed.ready_to_submit,true);assert.equal(computed.totals.shift_minutes,250);
  assert.equal(computed.totals.work_minutes,180);assert.equal(computed.totals.travel_minutes,30);assert.equal(computed.totals.break_minutes,15);
  assert.equal(computed.paid_candidate_minutes,210);
  assert.equal(reconcileShift748(timed.slice(0,-1)).ready_to_submit,false,'Open shifts cannot submit');
  assert.equal(reconcileShift748([...timed.slice(0,4),timed[3],...timed.slice(4)]).ready_to_submit,false,'Duplicate state changes flagged');
  assert.equal(await stableReceiptId748(['submit',bookingId,staffId,computed.revision]),await stableReceiptId748(['submit',bookingId,staffId,computed.revision]));

  let result=await call(staffPost,'detailer/shift_v748',{action:'load',booking_id:bookingId},{cookie:false});assert.equal(result.status,401);
  result=await call(staffPost,'detailer/shift_v748',{action:'load',booking_id:bookingId},{requestOrigin:'https://not-rosie.invalid'});assert.equal(result.status,403);
  result=await call(staffPost,'detailer/shift_v748',{action:'load',booking_id:bookingId});assert.equal(result.status,200);
  let revision=result.body.summary.revision;
  const operationIds=['11111111-2222-4333-8444-111111111111','11111111-2222-4333-8444-222222222222','11111111-2222-4333-8444-333333333333','11111111-2222-4333-8444-444444444444','11111111-2222-4333-8444-666666666666','11111111-2222-4333-8444-777777777777','11111111-2222-4333-8444-888888888888','11111111-2222-4333-8444-999999999999'];
  result=await call(staffPost,'detailer/shift_v748',{action:'punch',booking_id:bookingId,punch:'break_start',expected_revision:revision,operation_id:operationIds[0]});
  assert.equal(result.status,409,'Cannot start break before clock-in');
  const actions=['clock_in','travel_start','travel_stop','work_start','break_start','break_stop','work_stop','clock_out'];
  for(let i=0;i<actions.length;i++){
    result=await call(staffPost,'detailer/shift_v748',{action:'punch',booking_id:bookingId,punch:actions[i],expected_revision:revision,operation_id:operationIds[i],note:'Operator observed event'});
    assert.equal(result.status,200,`${actions[i]}: ${JSON.stringify(result.body)}`);
    revision=result.body.summary.revision;
  }
  assert.equal(result.body.summary.ready_to_submit,true);assert.equal(insertCount,8);
  result=await call(staffPost,'detailer/shift_v748',{action:'punch',booking_id:bookingId,punch:'clock_in',expected_revision:'stale',operation_id:operationIds[0]});
  assert.equal(result.status,200,'Same UUID is idempotent even with original expected revision');assert.equal(result.body.already_saved,true);assert.equal(insertCount,8);
  result=await call(staffPost,'detailer/shift_v748',{action:'punch',booking_id:bookingId,punch:'clock_in',expected_revision:'stale',operation_id:'44444444-2222-4333-8444-555555555555'});
  assert.equal(result.status,409,'New punch with stale revision refused');
  result=await call(staffPost,'detailer/shift_v748',{action:'submit',booking_id:bookingId,expected_revision:revision});
  assert.equal(result.status,200,JSON.stringify(result.body));const submissionId=result.body.submission_id;
  assert.equal(result.body.payroll_posted,false);assert.equal(receiptCount,1);
  result=await call(staffPost,'detailer/shift_v748',{action:'submit',booking_id:bookingId,expected_revision:revision});
  assert.equal(result.body.already_saved,true);assert.equal(receiptCount,1,'No duplicate submit audit');
  result=await call(reviewPost,'admin/shift_review_v748',{action:'queue'});assert.equal(result.status,403,'Detailer cannot read manager queue');
  result=await call(reviewPost,'admin/shift_review_v748',{action:'review',booking_id:bookingId,staff_user_id:staffId,submission_id:submissionId,expected_revision:revision,decision:'accepted',note:'I reviewed this shift evidence.'});
  assert.equal(result.status,403,'Submitting staff cannot self-approve');
  actor=manager;
  result=await call(reviewPost,'admin/shift_review_v748',{action:'queue'});assert.equal(result.status,200);assert.equal(result.body.queue.length,1);
  result=await call(reviewPost,'admin/shift_review_v748',{action:'load',booking_id:bookingId,staff_user_id:staffId});assert.equal(result.status,200);
  assert.equal(result.body.receipt.submission.id,submissionId);
  result=await call(reviewPost,'admin/shift_review_v748',{action:'review',booking_id:bookingId,staff_user_id:staffId,submission_id:submissionId,expected_revision:'stale',decision:'accepted',note:'Reviewed all source records.'});
  assert.equal(result.status,409);
  result=await call(reviewPost,'admin/shift_review_v748',{action:'review',booking_id:bookingId,staff_user_id:staffId,submission_id:submissionId,expected_revision:revision,decision:'accepted',note:'I compared service, travel and break source.'});
  assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(receiptCount,2);
  result=await call(reviewPost,'admin/shift_review_v748',{action:'review',booking_id:bookingId,staff_user_id:staffId,submission_id:submissionId,expected_revision:revision,decision:'accepted',note:'Different note attempt.'});
  assert.equal(result.status,409,'No second review or overwritten decision');assert.equal(receiptCount,2);
  result=await call(reviewPost,'admin/shift_review_v748',{action:'queue'});assert.equal(result.body.queue[0].reviewed,true);
  assert.equal(payrollWrites,0,'No payroll/accounting mutation from source reconciliation');

  const app=readFileSync(new URL('../apps/detailer/detailer-app.js',import.meta.url),'utf8');
  for(const token of ['shiftPendingKey748','shift748Retry','continuityVerified()','expected_revision','shift748Submit'])assert.ok(app.includes(token),`Mobile source missing ${token}`);
  const detailer=readFileSync(new URL('../app/detailer/index.html',import.meta.url),'utf8');
  for(const token of ['data-shift-punch="clock_in"','data-shift-punch="break_start"','data-shift-punch="travel_start"','shift748Summary'])assert.ok(detailer.includes(token));
  const admin=readFileSync(new URL('../admin-payroll.html',import.meta.url),'utf8');
  assert.equal(admin,readFileSync(new URL('../admin-payroll/index.html',import.meta.url),'utf8'));
  for(const token of ['shift748QueueRefresh','shift748Accept','shift748Correction','source.summary.revision'])assert.ok(admin.includes(token));
  const script=admin.match(/<script(?: type="module")?>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
  const check=spawnSync(process.execPath,['--check','--input-type=module'],{input:script,encoding:'utf8'});assert.equal(check.status,0,check.stderr);
  console.log('Build 748 PASS: shift/travel/break state, bounded time, session/assignment, stale/idempotent punch, submission, independent review, no payroll writes and UI parity.');
}finally{globalThis.fetch=realFetch;}
