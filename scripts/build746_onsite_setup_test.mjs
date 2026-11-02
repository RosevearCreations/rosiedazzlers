import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessOnsite746,ONSITE_EVENT746} from '../functions/api/_lib/onsite-setup-v746.js';
import {onRequestPost as onsitePost} from '../functions/api/detailer/onsite_setup_v746.js';
import {onRequestPost as actionPost} from '../functions/api/detailer/job_action.js';

const env={SUPABASE_URL:'https://mock-db.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const origin='https://rosiedazzlers.ca',bookingId='dab89e67-cc92-4b6a-832f-64b8d5f22842';
const staffId='ac697b64-72f5-4ed5-bbaa-c761bdf8c82d';
const actor={id:staffId,full_name:'Taylor Detailer',email:'staff@example.invalid',role_code:'detailer',is_active:true,
  can_manage_bookings:false,can_manage_progress:false,permissions_profile:null};
const booking={id:bookingId,updated_at:'2026-11-02T15:00:00Z',status:'confirmed',job_status:'scheduled',current_workflow_stage:'arrived',
  assigned_staff_user_id:staffId,assigned_staff_email:actor.email};
let currentBooking={...booking},intake=null,events=[],patches=0,writeEvents=true,mediaRows=[],updates=[];
const originalFetch=globalThis.fetch;
const respond=rows=>Response.json(rows);
const payload={
  booking_id:bookingId,action:'save',expected_stage:'arrived',expected_booking_updated_at:booking.updated_at,
  expected_intake_updated_at:null,vehicle_accessible_and_safe:true,keys_collected:true,
  water_hookup_located:true,water_tested:true,power_hookup_located:true,power_tested:true,
  owner_present_for_visual_inspection:true,existing_damage_notes:'None observed',valuables_present:false,valuables_notes:'',
  photo_consent:'internal_job_evidence',garbage_bag_estimate:'1 medium white Glad bag or less',extra_bag_count:0,
  extra_charge_notes:'',extra_bag_fee_acknowledged:false,inspection_acknowledged:true,
  existing_condition_acknowledged:true,keys_handed_over_acknowledged:true,owner_notes:'Customer discussed inspection',site_weather_notes:'Dry and level'
};
const ctx=(body,{cookie=true,requestOrigin=origin}={})=>({env,request:new Request(`${origin}/api/detailer/onsite_setup_v746`,{
  method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin,...(cookie?{Cookie:'rd_staff_session=test-staff-cookie'}:{})},body:JSON.stringify(body)
})});
const startCtx=(extra={})=>({env,request:new Request(`${origin}/api/detailer/job_action`,{
  method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:'rd_staff_session=test-staff-cookie'},body:JSON.stringify({
    booking_id:bookingId,action:'start',client_v745:true,expected_stage:'arrived',expected_updated_at:currentBooking.updated_at,
    expected_intake_updated_at:intake?.updated_at,...extra
  })
})});

globalThis.fetch=async(input,options={})=>{
  const url=new URL(input),table=url.pathname.split('/').pop(),method=options.method||'GET';
  assert.equal(url.origin,env.SUPABASE_URL,'Mock test cannot contact a real provider');
  if(table==='staff_auth_sessions')return respond([{id:'test-session',expires_at:'2030-01-01T00:00:00Z',revoked_at:null,staff_user:actor}]);
  if(table==='staff_users')return respond([actor]);
  if(table==='booking_staff_assignments')return respond([]);
  if(table==='bookings'){
    if(method==='PATCH'){
      patches++;const data=JSON.parse(options.body);currentBooking={...currentBooking,...data};return respond([currentBooking]);
    }
    return respond([currentBooking]);
  }
  if(table==='jobsite_intake'){
    if(method==='GET')return respond(intake?[intake]:[]);
    if(method==='PATCH'){
      if(!intake||url.searchParams.get('updated_at')!==`eq.${intake.updated_at}`)return respond([]);
      intake={...intake,...JSON.parse(options.body)};return respond([intake]);
    }
    if(method==='POST'){
      if(intake)return new Response('Duplicate',{status:409});
      intake={id:'intake-v746-1',...JSON.parse(options.body)[0]};return respond([intake]);
    }
  }
  if(table==='booking_events'){
    if(method==='GET')return respond(events.filter(e=>e.event_type===ONSITE_EVENT746).slice(-1).reverse().map((e,i)=>({...e,id:`audit-${i}`})));
    if(method==='POST'){
      if(!writeEvents)return new Response('Audit unavailable',{status:503});
      const item=JSON.parse(options.body);events.push(Array.isArray(item)?item[0]:item);return respond([]);
    }
  }
  if(table==='job_media')return respond(mediaRows);
  if(table==='job_updates')return respond(updates);
  throw Error(`Unexpected mock API: ${method} ${table}`);
};

try{
  assert.equal(assessOnsite746(null,null).ready,false);
  assert.equal((await onsitePost(ctx({...payload,action:'load'},{cookie:false}))).status,401,'Session required');
  assert.equal((await onsitePost(ctx(payload,{requestOrigin:'https://attacker.invalid'}))).status,403,'Same origin required');
  assert.equal((await actionPost(startCtx())).status,409,'Cannot bypass missing onsite evidence by posting Start');
  assert.equal(patches,0);
  assert.equal((await onsitePost(ctx({...payload,expected_booking_updated_at:'stale'}))).status,409,'Stale booking refused');
  assert.equal((await onsitePost(ctx({...payload,extra_bag_count:-2}))).status,400,'Bad count refused');
  let result=await onsitePost(ctx({...payload,photo_consent:'declined'}));
  assert.equal(result.status,200,await result.clone().text());
  assert.equal((await result.json()).assessment.ready,false,'Photo refusal holds start');
  assert.equal(intake.intake_complete,'No - waiting on customer / site issue');
  assert.equal((await actionPost(startCtx())).status,409,'Held intake cannot start');
  assert.equal((await onsitePost(ctx(payload))).status,409,'Stale intake revision refused');
  result=await onsitePost(ctx({...payload,expected_intake_updated_at:intake.updated_at}));
  assert.equal(result.status,200,await result.clone().text());
  assert.equal((await result.json()).assessment.ready,true,'Complete, acknowledged intake is ready');
  assert.equal(events.length,2);assert.equal(events[1].payload.charge_created,false);
  assert.equal(events[1].payload.photo_publication_authorized,false);
  assert.equal((await actionPost(startCtx({expected_intake_updated_at:'old-revision'}))).status,409,'Stale receipt refused');
  assert.equal((await actionPost(startCtx())).status,409,'Before-photo/checklist still required');
  mediaRows=[{id:'old-proof',stage:'arrival',kind:'photo',visibility:'internal',media_url:'https://private.invalid/photo',review_status:'pending',created_at:'2020-01-01T00:00:00Z'}];
  updates=[{note:'[FIELD CHECKLIST] Condition, scope, hazards and setup confirmed.',visibility:'internal'}];
  assert.equal((await actionPost(startCtx())).status,409,'Photo captured before consent cannot satisfy start');
  mediaRows=[{...mediaRows[0],id:'proof-1',created_at:new Date(Date.now()+1000).toISOString()}];
  result=await actionPost(startCtx());
  assert.equal(result.status,200,await result.clone().text());
  assert.equal((await result.json()).booking.current_workflow_stage,'detailing','Authorized start applies');
  assert.equal(patches,1,'Only a verified start changes job stage');
  currentBooking={...booking};
  writeEvents=false;
  result=await onsitePost(ctx({...payload,expected_intake_updated_at:intake.updated_at,extra_bag_count:1,
    garbage_bag_estimate:'More than 1 medium white Glad bag',extra_charge_notes:'Discussed extra bag',extra_bag_fee_acknowledged:true}));
  assert.equal(result.status,503,'Failed event append cannot claim readiness');
  assert.equal((await actionPost(startCtx())).status,409,'Changed intake without matching receipt blocks start');
  const source=readFileSync(new URL('../apps/detailer/live-job-module.js',import.meta.url),'utf8');
  for(const token of ['onsite746Form','onsite746Consent','onsite746BagAck','onsite746Missing','expected_intake_updated_at','No automatic replay'])
    assert.ok(source.includes(token),`Mobile form missing ${token}`);
  assert.doesNotMatch(source,/localStorage|indexedDB|setInterval\s*\(/,'No persisted private checklist or background edits');
  assert.match(source,/rosie:private-capture-v747:/,'Only upload-session metadata may survive a refresh for deliberate recovery');
  console.log('Build 746 PASS: session and origin, assignment, onsite audit/revision, photo consent, bag policy, readiness, start gate and failed-audit recovery.');
}finally{globalThis.fetch=originalFetch;}
