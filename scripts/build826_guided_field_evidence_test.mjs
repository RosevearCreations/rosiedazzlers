import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateEvidence826,classifyReviewHistory826,proposedMasterReadiness826,ROSIE_SHELL_826} from '../assets/build826-field-evidence-contract.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/worksite_field_evidence_v826.js';
import {MODULE_BASELINE_825} from '../assets/build825-module-baseline.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const ACTOR_A='aa00dffd-194d-4cb1-84bd-50a95ab44e84',ACTOR_B='bb00dffd-194d-4cb1-84bd-50a95ab44e85';
const TEST_NOW=Date.parse('2026-11-09T01:00:00.000Z');
const randomId=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const observed={request_id:randomId(1),event_kind:'observation',role_id:'detailer',
 device_class:'phone',browser_class:'chrome',route_path:'/app/detailer/',
 viewport_width:390,observed_outcome:'pass',observed_at:'2026-11-09T00:59:00.000Z',
 evidence_ref:'FIELD-PHONE-20261108'};
assert.equal(validateEvidence826(observed,{now:TEST_NOW})?.role_id,'detailer');
for(const bad of [
 {...observed,role_id:'sysop'},{...observed,device_class:'smartwatch'},
 {...observed,browser_class:'unknown'},{...observed,route_path:'/customer/42'},
 {...observed,route_path:'/app/../admin'},{...observed,route_path:'/admin?token=secret'},
 {...observed,viewport_width:99},{...observed,viewport_width:4000},
 {...observed,observed_outcome:'passed'},{...observed,evidence_ref:'private name'},
 {...observed,evidence_ref:'a'},{...observed,observed_at:'2026-09-01T00:00:00.000Z'},
 {...observed,observed_at:'2026-11-10T00:00:00.000Z'},
 {...observed,request_id:'bad'}]){
 assert.equal(validateEvidence826(bad,{now:TEST_NOW}),null,'Invalid observation input must fail closed');
}
assert.ok(validateEvidence826({...observed,route_path:'/admin-today.html'},{now:TEST_NOW}));
const signoff={request_id:randomId(2),event_kind:'signoff',target_event_id:randomId(11),
 review_state:'accepted_for_review',evidence_ref:'REVIEW-PHONE-20261108'};
const module=MODULE_BASELINE_825[0];
const review={request_id:randomId(3),event_kind:'module_review',target_event_id:randomId(12),
 module_id:module.id,review_state:'owner_review_candidate',evidence_ref:'MODULE-REVIEW-20261108'};
assert.ok(validateEvidence826(signoff,{now:TEST_NOW}));
assert.ok(validateEvidence826(review,{now:TEST_NOW}));
assert.equal(validateEvidence826({...review,module_id:'not-an-approved-module'},{now:TEST_NOW}),null);
assert.equal(validateEvidence826({...review,target_event_id:null},{now:TEST_NOW}),null);
assert.ok(validateEvidence826({...review,review_state:'hold',target_event_id:undefined},{now:TEST_NOW}));
const empty=classifyReviewHistory826([]);
assert.equal(empty.observations,0);
assert.equal(empty.independentSignerVerified,false);
const proposed=proposedMasterReadiness826({events:[],sourceRevision:'a'.repeat(40),generatedAt:new Date(TEST_NOW).toISOString()});
assert.equal(proposed.sourceId,'rosiedazzlers');
assert.equal(proposed.repository,'RosevearCreations/rosiedazzlers');
assert.equal(proposed.connectionState,'DISCONNECTED / HOLD');
assert.equal(proposed.integrationVerification,'AUTHORIZATION HELD');
assert.equal(proposed.dataSentToCommsHub,false);
assert.equal(proposed.masterOwnerApproved,false);
assert.equal(proposed.moduleReadiness.length,45);
assert.ok(proposed.moduleReadiness.every(x=>x.approvedDenominator===null&&x.percentageVerified===false));
assert.equal(proposedMasterReadiness826({sourceRevision:'synthetic'}).sourceRevision,null);
assert.equal(ROSIE_SHELL_826.ql364Handler,'functions/api/_lib/ql364-source-health.mjs');

let actor=ACTOR_A,role='operations_manager',hasPermission=true,signed=true,offline=false,writeCount=0,seq=10;
const db=[];
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'mock-secret',
 CF_PAGES_COMMIT_SHA:'a'.repeat(40)};
const getContext=()=>({request:new Request('https://www.rosiedazzlers.ca/api/admin/worksite_field_evidence_v826',
 {headers:{Cookie:'rd_staff_session=token'}}),env});
const postContext=(body,origin='https://www.rosiedazzlers.ca',cookie=true)=>({
 request:new Request('https://www.rosiedazzlers.ca/api/admin/worksite_field_evidence_v826',
 {method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:'rd_staff_session=token'}:{})},
 body:JSON.stringify(body)}),env});
const session=()=>({id:actor,full_name:'Synthetic Test Actor',is_active:true,role_code:role,can_manage_bookings:true,
 permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':hasPermission}}});
const realFetch=globalThis.fetch;
globalThis.fetch=async(url,opts={})=>{
 if(offline)throw Error('database offline');
 const path=new URL(url),table=path.pathname.split('/').pop(),q=path.searchParams,method=opts.method||'GET';
 if(table==='staff_auth_sessions')return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:session()}]:[]);
 if(table!=='rosie_field_acceptance_events_v826')throw Error('Unexpected database table: '+table);
 if(method==='POST'){
   writeCount++;
   const payload=JSON.parse(opts.body)[0];
   const row={id:randomId(++seq),recorded_at:new Date(TEST_NOW).toISOString(),...payload};
   db.push(row);return Response.json([row]);
 }
 let rows=db.slice();
 if(q.has('request_id'))rows=rows.filter(x=>q.get('request_id')==='eq.'+x.request_id);
 if(q.has('actor_staff_user_id'))rows=rows.filter(x=>q.get('actor_staff_user_id')==='eq.'+x.actor_staff_user_id);
 if(q.has('id'))rows=rows.filter(x=>q.get('id')==='eq.'+x.id);
 if(q.has('order'))rows.reverse();
 const limit=Number(q.get('limit')||100);
 return Response.json(rows.slice(0,limit));
};
try{
 signed=false;assert.equal((await onRequestGet(getContext())).status,401);signed=true;
 role='detailer';assert.equal((await onRequestGet(getContext())).status,403);
 role='operations_manager';hasPermission=false;assert.equal((await onRequestGet(getContext())).status,403);
 hasPermission=true;
 assert.equal((await onRequestPost(postContext(observed,'https://fake.invalid'))).status,403);
 assert.equal((await onRequestPost(postContext(observed,'https://www.rosiedazzlers.ca',false))).status,401);
 // Production validator checks current time instead of the test's fixed time.
 const currentObservation={...observed,observed_at:new Date(Date.now()-60000).toISOString()};
 assert.equal((await onRequestPost(postContext({...currentObservation,route_path:'/evil'}))).status,400);
 assert.equal(writeCount,0);
 const first=await onRequestPost(postContext(currentObservation));assert.equal(first.status,201,await first.clone().text());
 const saved=await first.json();assert.equal(saved.canonical_hold_changed,false);
 assert.equal(saved.independent_verification,false);assert.equal(writeCount,1);
 const replay=await onRequestPost(postContext(currentObservation));assert.equal(replay.status,200);
 assert.equal((await replay.json()).replayed,true);assert.equal(writeCount,1);
 assert.equal((await onRequestPost(postContext({...currentObservation,evidence_ref:'OTHER-EVIDENCE-826'}))).status,409);
 const actualSignoff={...signoff,target_event_id:saved.event_id};
 assert.equal((await onRequestPost(postContext(actualSignoff))).status,403,'No self-signoff');
 actor=ACTOR_B;
 const second=await onRequestPost(postContext(actualSignoff));assert.equal(second.status,201,await second.clone().text());
 const accepted=await second.json();assert.equal(writeCount,2);
 const candidate={...review,target_event_id:accepted.event_id};
 assert.equal((await onRequestPost(postContext(candidate))).status,403,'No self-review of signoff');
 actor=ACTOR_A;
 const third=await onRequestPost(postContext(candidate));assert.equal(third.status,201,await third.clone().text());
 assert.equal(writeCount,3);
 let result=await onRequestGet(getContext());assert.equal(result.status,200);
 const data=await result.json();assert.equal(data.events.length,3);
 assert.equal(data.master_preview.moduleReadiness.find(x=>x.moduleId===module.id)?.reviewState,'owner_review_candidate');
 assert.equal(data.master_preview.dataSentToAIPlatform,false);
 assert.equal(data.master_preview.masterEventPublicationAuthorized,false);
 assert.equal(data.source_authority.original_comms_test_receipt_verified,false);
 assert.equal(data.source_authority.percentages_recalculated,false);
 assert.ok(!JSON.stringify(data).includes('Synthetic Test Actor'),'No staff names in response');
 offline=true;assert.equal((await onRequestGet(getContext())).status,401);
}finally{globalThis.fetch=realFetch;}
const sql=read('../supabase/migrations/20261109022500_build826_guided_field_evidence_decision_history.sql');
for(const token of ['enable row level security','revoke all on public.rosie_field_acceptance_events_v826',
 'grant select,insert on public.rosie_field_acceptance_events_v826 to service_role',
 'unique (actor_staff_user_id,request_id)','on delete restrict'])assert.ok(sql.includes(token),'Required append-only source condition missing '+token);
assert.doesNotMatch(sql,/grant\s+(?:update|delete)|security definer/i);
const api=read('../functions/api/admin/worksite_field_evidence_v826.js');
for(const name of ['staffAccess811','operations.assignment.manage','sameOrigin811','sourceRevision','readback','private'])
 assert.ok(api.toLowerCase().includes(name.toLowerCase()),'Missing source API contract '+name);
assert.doesNotMatch(api,/sendgrid|twilio|stripe\.com|customer_visible|onRequestDelete|onRequestPatch/i);
const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'),'Mirrored acceptance pages must match');
for(const id of ['build826GuidedEvidence','build826Role','build826Device','build826Browser','build826Viewport','build826ObservedAt',
 'build826CaptureSubmit','build826SignoffTarget','build826SignoffSubmit','build826ModuleId','build826ModuleSubmit','build826HistoryRows','build826MasterState']){
 assert.ok(page.includes('id="'+id+'"'),'Missing accessible field '+id);
}
assert.match(page,/build826-guided-field-evidence\.mjs\?v=build826/);
assert.match(read('../assets/build826-guided-field-evidence.css'),/@media\(max-width:650px\)/);
assert.match(read('./current_booking_wizard_regression.sh'),/build826_guided_field_evidence_test\.mjs/);
console.log('Build 826 PASS: safe real-device operator form, independent supervisor anti-self-review, append-only audited module history, no fake owner trust, no cross-shell writes, accessible mirrored routes.');
