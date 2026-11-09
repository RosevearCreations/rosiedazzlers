import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROLE_DEVICE_MATRIX_830,ROLE_DEVICE_SCHEMA_830,roleDeviceRecovery830}
  from '../assets/build830-role-device-recovery.mjs';
import {onRequestGet} from '../functions/api/admin/worksite_field_evidence_v826.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.parse('2026-11-09T16:00:00.000Z');
const a='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const b='bb00dffd-194d-4cb1-84bd-50a95ab44e85';
const c='cc00dffd-194d-4cb1-84bd-50a95ab44e86';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const at=minutes=>new Date(now+minutes*60000).toISOString();
const obs=(n,minutes=-90,role='customer',device='phone',outcome='pass')=>({
  id:id(n),event_kind:'observation',actor_staff_user_id:a,role_id:role,
  device_class:device,browser_class:'chrome',route_path:'/account',viewport_width:390,
  observed_outcome:outcome,observed_at:at(minutes-1),recorded_at:at(minutes),
  evidence_ref:'PRIVATE-CUSTOMER-REFERENCE'
});
const sign=(n,target,minutes=-60,actor=b,decision='accepted_for_review')=>({
  id:id(n),event_kind:'signoff',target_event_id:id(target),actor_staff_user_id:actor,
  review_state:decision,recorded_at:at(minutes),evidence_ref:'PRIVATE-SIGNOFF-REF'
});
const cell=(r,role='customer',device='phone')=>r.cells.find(x=>x.roleId===role&&x.deviceClass===device);

const empty=roleDeviceRecovery830({now,sourceRevision:'invalid'});
assert.equal(empty.schema,ROLE_DEVICE_SCHEMA_830);
assert.equal(empty.sourceId,'rosiedazzlers');
assert.equal(empty.roleCount,4);assert.equal(empty.deviceCount,3);
assert.equal(empty.cellCount,12);
assert.equal(ROLE_DEVICE_MATRIX_830.length,12);
assert.equal(new Set(empty.cells.map(x=>x.cellId)).size,12);
assert.ok(empty.cells.every(x=>x.status==='NO_RECENT_SOURCE_OBSERVATION'&&
  x.ownerAccepted===false&&x.masterCompletionPercent===null&&
  x.independentITDeviceAuthorityVerified===false));
assert.equal(empty.completeHistory,false);
assert.equal(empty.genuineFieldDeviceAcceptanceCount,null);
assert.equal(empty.independentlyVerifiedRoleDevicePairs,null);
assert.equal(empty.allRolesDevicesAccepted,false);
assert.equal(empty.sourceConnectionState,'DISCONNECTED / HOLD');
assert.equal(empty.dataSentToAIPlatform,false);
assert.equal(empty.dataSentToCommsHub,false);
assert.equal(empty.canonicalHoldChanged,false);
assert.equal(empty.followupPolicyApproved,false);
assert.equal(empty.noBrowserAutomationOrPhysicalDeviceTestPerformed,true);

const linked=roleDeviceRecovery830({events:[sign(2,1),obs(1)],now,sourceRevision:'c'.repeat(40)});
assert.equal(linked.currentDeploymentRevisionClaim,'c'.repeat(40));
assert.equal(linked.historicalEventRevisionAvailable,false);
assert.equal(cell(linked).status,'LOCAL_PASS_SIGNED_FOR_REVIEW');
assert.equal(cell(linked).latestSignoffState,'LOCAL_SIGNOFF_UNVERIFIED');
assert.equal(cell(linked).latestRoute,'/account');
assert.equal(cell(linked).latestViewportWidth,390);
assert.equal(cell(linked,'customer','tablet').status,'NO_RECENT_SOURCE_OBSERVATION');
assert.equal(cell(linked,'admin','phone').status,'NO_RECENT_SOURCE_OBSERVATION');
assert.equal(linked.reviewedLocalPassCount,1);
for(const forbidden of [a,b,c,'PRIVATE-CUSTOMER-REFERENCE','PRIVATE-SIGNOFF-REF'])
  assert.equal(JSON.stringify(linked).includes(forbidden),false);

const unsigned=roleDeviceRecovery830({events:[obs(1)],now});
assert.equal(cell(unsigned).status,'LOCAL_PASS_NEEDS_SEPARATE_REVIEW');
const selfReviewed=roleDeviceRecovery830({events:[sign(2,1,-60,a),obs(1)],now});
assert.equal(cell(selfReviewed).status,'SOURCE_EVENT_CONFLICT');
const returned=roleDeviceRecovery830({events:[sign(2,1,-60,b,'returned'),obs(1)],now});
assert.equal(cell(returned).status,'RETURNED_FOR_NEW_EVIDENCE');
const negative=roleDeviceRecovery830({events:[obs(4,-20,'customer','phone','blocked'),obs(1)],now});
assert.equal(cell(negative).status,'CURRENT_LOCAL_FAILURE_OR_BLOCK');
assert.equal(negative.currentLocalNegativeCount,1);
assert.equal(cell(negative).negativeHistoryCleared,false);
const retest=roleDeviceRecovery830({events:[sign(5,4,-10),obs(4,-20),obs(3,-80,'customer','phone','fail')],now});
assert.equal(cell(retest).status,'LOCAL_RETEST_REVIEW_REQUIRED');
assert.equal(cell(retest).localRetestAfterNegative,true);
assert.equal(cell(retest).latestNegativeInWindow,true);
assert.equal(cell(retest).negativeHistoryCleared,false);
assert.equal(retest.retestReviewRequiredCount,1);
const due=roleDeviceRecovery830({events:[{
  ...obs(1),recorded_at:at(-31*1440),observed_at:at(-31*1440-1)
}],now});
assert.equal(cell(due).status,'DRAFT_FOLLOWUP_DUE');
assert.equal(cell(due).latestLocalObservationAged,true);
assert.equal(due.proposedFollowupDays,30);
assert.equal(due.followupPolicyApproved,false);
const duplicate=roleDeviceRecovery830({events:[obs(1),obs(1),sign(2,1)],now});
assert.equal(cell(duplicate).status,'SOURCE_EVENT_CONFLICT');
const badRoute=roleDeviceRecovery830({events:[{...obs(1),route_path:'/account?customer=private'}],now});
assert.equal(cell(badRoute).status,'SOURCE_EVENT_CONFLICT');
const noDate=roleDeviceRecovery830({events:[{...obs(3),recorded_at:'invalid'},obs(1),sign(2,1)],now});
assert.equal(cell(noDate).status,'SOURCE_EVENT_CONFLICT','Malformed rows must not hide behind older pass');
const badReview=roleDeviceRecovery830({events:[{...sign(2,1),recorded_at:'invalid'},obs(1)],now});
assert.equal(cell(badReview).status,'SOURCE_EVENT_CONFLICT');
const future=roleDeviceRecovery830({events:[{...obs(1),observed_at:at(15)}],now});
assert.equal(cell(future).status,'SOURCE_EVENT_CONFLICT');
const pgTime=roleDeviceRecovery830({events:[obs(1),sign(2,1)].map(e=>({
  ...e,recorded_at:e.recorded_at.replace('.000Z','+00:00'),
  ...(e.observed_at?{observed_at:e.observed_at.replace('.000Z','.000000+00:00')}:{}),
})),now});
assert.equal(cell(pgTime).status,'LOCAL_PASS_SIGNED_FOR_REVIEW');
const capped=roleDeviceRecovery830({events:Array.from({length:101},(_,n)=>
  obs(n+100,-n,'detailer','desktop')),now});
assert.equal(capped.sourceWindowReturned,100);
assert.equal(capped.completeHistory,false);
assert.equal(cell(capped,'detailer','desktop').sourceWindowMayOmitHistory,true);

let signed=false,role='detailer',allowed=true,sourceOk=true;
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'mock',
  CF_PAGES_COMMIT_SHA:'e'.repeat(40)};
const request=new Request('https://rosiedazzlers.ca/api/admin/worksite_field_evidence_v826',
  {headers:{Cookie:'rd_staff_session=token'}});
globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path.endsWith('/staff_auth_sessions'))return Response.json(signed?[{
    expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{
      id:a,role_code:role,is_active:true,can_manage_bookings:true,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':allowed}}}
  }]:[]);
  if(path.endsWith('/rosie_field_acceptance_events_v826'))return sourceOk?
    Response.json([sign(2,1),obs(1)]):Response.json({error:'offline'},{status:503});
  throw Error('Unexpected destination');
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='operations_manager';allowed=false;
  assert.equal((await onRequestGet({request,env})).status,403);
  allowed=true;
  const response=await onRequestGet({request,env});assert.equal(response.status,200);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  const payload=await response.json();
  assert.equal(payload.role_device_recovery_preview.cellCount,12);
  assert.equal(cell(payload.role_device_recovery_preview).status,'LOCAL_PASS_SIGNED_FOR_REVIEW');
  assert.equal(payload.role_device_recovery_preview.currentDeploymentRevisionClaim,'e'.repeat(40));
  assert.equal(payload.role_device_recovery_preview.allRolesDevicesAccepted,false);
  assert.equal(JSON.stringify(payload.role_device_recovery_preview).includes(a),false);
  sourceOk=false;
  const offline=await onRequestGet({request,env});assert.equal(offline.status,503);
  assert.equal(Object.hasOwn(await offline.json(),'role_device_recovery_preview'),false);
}finally{globalThis.fetch=originalFetch;}

const page=read('../admin-handoff-acceptance.html');
assert.equal(page,read('../admin-handoff-acceptance/index.html'));
for(const id of ['build830Recovery','build830Heading','build830RoleFilter','build830StateFilter',
  'build830Refresh','build830Status','build830Count','build830Rows'])
  assert.ok(page.includes('id="'+id+'"'),'Missing accessible Build 830 '+id);
assert.match(page,/build830-role-device-ui\.mjs\?v=build830/);
assert.match(read('../assets/build830-role-device.css'),/@media\(max-width:650px\)/);
assert.doesNotMatch(read('../assets/build830-role-device-ui.mjs'),/localStorage|sessionStorage|innerHTML|method:\s*['"]POST/);
assert.match(read('../functions/api/admin/worksite_field_evidence_v826.js'),/role_device_recovery_preview:roleDeviceRecovery830/);
assert.match(read('./current_booking_wizard_regression.sh'),/build830_role_device_recovery_test\.mjs/);
console.log('Build 830 PASS: 12 real-role/device local cells, signed supervisor isolation, stale/conflict/negative/retest safeguards, manual recovery and no invented device/owner acceptance.');
