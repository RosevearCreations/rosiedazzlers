import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentPackage807,exactDate807,historyProjection807,rebookingPath807,filterHistory807,
  followupTriage807,filterFollowup807} from '../assets/customer-service-experience-v807.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const ids=['00000001-0001-4001-8001-000000000001','00000002-0002-4002-8002-000000000002',
  '00000003-0003-4003-8003-000000000003','00000004-0004-4004-8004-000000000004'];
const now=new Date('2026-11-08T17:00:00Z');
const catalog={packages:[{code:'basic_detail',name:'Basic Detail',active:true,prices_cad:{small:85,mid:115}},
  {code:'retired_service',name:'Old Service',status:'retired',prices_cad:{small:90}},
  {code:'unpriced',name:'Unpriced Service',active:true,prices_cad:{small:0,mid:null}},
  {code:'interior',name:'Interior Detail',active:true,prices_cad:{oversize:150}}]};
const service=(id,serviceDate,code,extra={})=>({id,service_date:serviceDate,completed_at:`${serviceDate}T16:00:00Z`,
  package_code:code,service_area:'Tillsonburg',...extra});
const source=[service(ids[0],'2026-10-21','basic_detail'),service(ids[1],'2026-05-11','retired_service'),
  service(ids[2],'2025-09-30','interior'),service(ids[3],'2026-11-09','basic_detail'),
  service(ids[0],'2026-10-21','basic_detail'),service('not-uuid','2026-09-20','basic_detail'),
  service('00000005-0005-4005-8005-000000000005','2026-02-30','interior')];

assert.equal(exactDate807('2026-02-28T10:00:00Z'),'2026-02-28');
assert.equal(exactDate807('2026-02-30'),null,'No impossible service date');
assert.equal(exactDate807('<script>'),null);
assert.equal(currentPackage807(catalog,'retired_service'),null);
assert.equal(currentPackage807(catalog,'unpriced'),null);
assert.equal(currentPackage807(catalog,'interior').name,'Interior Detail');
assert.equal(currentPackage807(null,'interior'),null,'Missing live catalog cannot confer bookability');
const projected=historyProjection807(source,catalog,{now,season:'autumn'});
assert.deepEqual(projected.entries.map(x=>x.id),[ids[0],ids[1],ids[2]],'Only authentic, dated, unique prior services');
assert.deepEqual(projected.years,['2026','2025']);
assert.equal(projected.summary.completed,3);
assert.equal(projected.summary.repeatable,2);
assert.equal(projected.summary.uniqueServices,3);
assert.equal(projected.entries[0].recommendation.label,'Autumn idea');
assert.equal(projected.entries[0].recommendation.copy.includes('current conditions'),true);
assert.equal(projected.entries[1].catalogVerified,false);
assert.equal(rebookingPath807(projected.entries[1]),null,'Retired catalog service has no repeat shortcut');
assert.equal(rebookingPath807(projected.entries[0]),'/book?rebook_package=basic_detail&rebook_date=2026-10-21');
assert.equal(rebookingPath807({...projected.entries[0],id:'fake'}),null);
assert.equal(rebookingPath807({...projected.entries[0],catalogVerified:false}),null);
assert.equal(rebookingPath807({...projected.entries[0],serviceDate:'2026-02-30'}),null);
assert.equal(filterHistory807(projected.entries,{search:'tillsonburg'}).length,3);
assert.equal(filterHistory807(projected.entries,{search:'retired_service'}).length,1);
assert.equal(filterHistory807(projected.entries,{year:'2025'}).length,1);
assert.equal(filterHistory807(projected.entries,{service:'interior'}).length,1);
assert.equal(filterHistory807(projected.entries,{repeatableOnly:true}).length,2);
assert.equal(filterHistory807(projected.entries,{search:'no matching service'}).length,0);
assert.deepEqual(historyProjection807(source,null,{now}).entries.filter(row=>row.catalogVerified),[],'No catalog leaves history visible without unsafe links');
assert.throws(()=>historyProjection807(null,catalog,{now}));

const interests=[
  {id:ids[0],customer_label:'a***@example.com',interest_kind:'rebook',review_status:'pending_review',
    submitted_at:'2026-11-04T10:00:00Z',currently_allowed_channels:['email'],consent_fresh:true,consent_changed_since_submission:false,
    source_booking_id:ids[1],next_action:'Review manually'},
  {id:ids[1],customer_label:'b***@example.com',interest_kind:'maintenance',review_status:'pending_review',
    submitted_at:'2026-11-01T10:00:00Z',currently_allowed_channels:['email'],consent_fresh:true,consent_changed_since_submission:true},
  {id:ids[2],customer_label:'c***@example.com',interest_kind:'seasonal',review_status:'reviewed',
    submitted_at:'2026-10-12T10:00:00Z',currently_allowed_channels:['SMS-UNKNOWN'],consent_fresh:false,consent_changed_since_submission:false},
  {id:ids[0],customer_label:'duplicate',submitted_at:'2026-11-04T10:00:00Z'},
  {id:'bad',customer_label:'invalid',submitted_at:'2026-11-04T10:00:00Z'}
];
const queue=followupTriage807(interests,{now});
assert.equal(queue.summary.total,3);
assert.equal(queue.summary.pending,2);
assert.equal(queue.summary.consentReview,2);
assert.equal(queue.summary.staffReview,1);
assert.equal(queue.entries[0].daysOld,4);
assert.equal(queue.entries[0].triage,'staff_review');
assert.match(queue.entries[1].consentLabel,/changed since interest/);
assert.equal(queue.entries[1].needsConsentReview,true,'Changed consent never permits contact');
assert.deepEqual(queue.entries[2].channels,[],'Unknown channels are denied');
assert.equal(filterFollowup807(queue.entries,{review:'pending'}).length,2);
assert.equal(filterFollowup807(queue.entries,{review:'handled'}).length,1);
assert.equal(filterFollowup807([{review_status:null,triage:'consent_review'}],{review:'handled'}).length,0,'Unknown review status is not handled');
assert.equal(filterFollowup807(queue.entries,{triage:'consent_review'}).length,2);
assert.equal(filterFollowup807(queue.entries,{kind:'rebook'}).length,1);
assert.equal(filterFollowup807(queue.entries,{search:'a***@example.com'}).length,1);
assert.equal(filterFollowup807(queue.entries,{search:'not-shared-contact'}).length,0);
assert.throws(()=>followupTriage807(null,{now}));

const customer=read('../my-account.html'),customerMirror=read('../my-account/index.html');
const staff=read('../admin-notifications.html'),staffMirror=read('../admin-notifications/index.html');
assert.equal(customer,customerMirror,'Customer canonical and mirrored routes match');
assert.equal(staff,staffMirror,'Admin canonical and mirrored routes match');
for(const id of ['build807HistorySearch','build807HistoryYear','build807HistoryPackage','build807HistoryMode','build807HistoryClear','build807HistoryCounts'])
  assert.match(customer,new RegExp(`id="${id}"`));
for(const id of ['build807StaffSearch','build807StaffKind','build807StaffReview','build807StaffTriage','build807StaffClear','build807StaffVisible'])
  assert.match(staff,new RegExp(`id="${id}"`));
assert.match(customer,/customer-service-experience-v807\.css/);
assert.match(staff,/customer-service-experience-v807\.css/);
const customerCode=read('../assets/customer-followup-workbench-v744.js');
const staffCode=read('../assets/admin-customer-followup-review-v744.js');
const loader=read('../assets/my-account-v355.js');
assert.match(loader,/customer-followup-workbench-v744\.js\?v=20261108build807/);
assert.match(staff,/admin-customer-followup-review-v744\.js\?v=20261108build807/);
assert.match(customerCode,/historyProjection807\(history,catalog\)/);
assert.match(customerCode,/rebookingPath807\(row\)/);
assert.match(customerCode,/availabilitySequence807/);
assert.match(staffCode,/data\.read_only/);
assert.match(staffCode,/data\.no_dispatch/);
assert.match(staffCode,/followupTriage807\(data\.interests\)/);
assert.match(staffCode,/No interest state or consent clearance is inferred/);
assert.match(customerCode,/\/api\/client\/followup_interest_v744/);
assert.match(staffCode,/\/api\/admin\/customer_followup_review_v744/);
for(const code of [customerCode,staffCode]){
  assert.doesNotMatch(code,/localStorage|sessionStorage|setInterval\s*\(/,'No retained customer data or polling');
  assert.doesNotMatch(code,/\/api\/admin\/(?:process_notifications|send_message|booking_update)/,'No customer outreach or booking write');
}
assert.match(read('../functions/api/admin/customer_followup_review_v744.js'),/requireActionAccess\(access\.actor,'it\.notifications\.view'\)/);
assert.match(read('../functions/api/client/followup_interest_v744.js'),/ownedCompleted\(source\[0\],identity\)/);
console.log('Build 807 PASS: scoped history filters, live catalog repeat verification, safe rebooking, staff consent triage, mirrored routes and no automatic outreach.');
