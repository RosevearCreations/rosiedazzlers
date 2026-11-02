import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QC_EVENT749,QC_ITEMS749,reconcileQuality749,qcReceiptId749} from '../functions/api/_lib/quality-v749.js';
import {onRequestPost as staffPost} from '../functions/api/detailer/quality_v749.js';

const booking='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const staff='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let serial=1;
const add=(type,payload={})=>({id:`00000000-0000-4000-8000-${String(serial++).padStart(12,'0')}`,booking_id:booking,created_at:new Date(Date.UTC(2026,10,2,12,serial)).toISOString(),event_type:type,payload});
const media=[{id:booking,stage:'arrival',visibility:'internal',review_status:'approved',media_url:'private/original.jpg'},
 {id:staff,stage:'final',visibility:'internal',review_status:'approved',media_url:'private/original-after.jpg'}];
let events=[];
let s=reconcileQuality749(events,[]);
assert.equal(s.source_ready,false);assert.equal(s.approved,false);assert.equal(s.photos.after,false);
for(const [phase,items] of Object.entries(QC_ITEMS749))for(const item of items)events.push(add(QC_EVENT749.check,{phase,item,result:'pass',note:'Observed directly'}));
s=reconcileQuality749(events,media);assert.equal(s.source_ready,true);assert.equal(s.approved,false);assert.equal(s.status,'ready_for_review');
const nA=events.slice();nA.push(add(QC_EVENT749.check,{phase:'before',item:'worksite_safety',result:'not_applicable',note:'Denied even with an explanatory note'}));
assert.equal(reconcileQuality749(nA,media).source_ready,false,'Safety cannot be bypassed with not applicable');
const submitted=add(QC_EVENT749.submit,{staff_user_id:staff,revision:s.revision});events.push(submitted);
s=reconcileQuality749(events,media);assert.equal(s.status,'review_pending');
events.push(add(QC_EVENT749.review,{submission_id:submitted.id,decision:'accepted',note:'Independent verified checklist'}));
s=reconcileQuality749(events,media);assert.equal(s.approved,true);
const issue=add(QC_EVENT749.issue,{kind:'damage_concern',note:'Damage must be inspected by owner',actor_id:staff});events.push(issue);
s=reconcileQuality749(events,media);assert.equal(s.approved,false);assert.equal(s.open_issue_count,1);assert.equal(s.status,'exception_hold');
events.push(add(QC_EVENT749.resolve,{issue_id:issue.id,evidence_id:staff,note:'Not permitted to close claim as rework'}));
s=reconcileQuality749(events,media);assert.equal(s.open_issue_count,1,'Claims/disputes cannot close as routine rework');
const before=events.slice(0,8),rework=add(QC_EVENT749.issue,{kind:'rework',note:'Door jamb still dusty',actor_id:staff});before.push(rework);
let r=reconcileQuality749(before,media);assert.equal(r.open_issue_count,1);
before.push(add(QC_EVENT749.resolve,{issue_id:rework.id,evidence_id:staff,actor_id:'manager',note:'Inspected follow-up photo'}));
r=reconcileQuality749(before,media);assert.equal(r.open_issue_count,0);assert.equal(r.approved,false,'New source revision needs fresh submission and review');
assert.equal(reconcileQuality749(before,[{...media[0],visibility:'customer'},media[1]]).source_ready,false,'Public or unreviewed photo does not stand in for private original evidence');
assert.equal(await qcReceiptId749(['submit',booking,staff,r.revision]),await qcReceiptId749(['submit',booking,staff,r.revision]));
assert.notEqual(await qcReceiptId749(['submit',booking,staff,r.revision]),await qcReceiptId749(['review',booking,r.revision]));

// Without a current signed-in staff session, no QC write is even attempted.
let calls=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{calls++;throw Error('No network needed for unauthenticated rejection');};
try{
  const response=await staffPost({request:new Request('https://rosiedazzlers.ca/api/detailer/quality_v749',{method:'POST',headers:{origin:'https://other.invalid','content-type':'application/json'},body:JSON.stringify({action:'check',booking_id:booking,expected_revision:'',phase:'before',item:'existing_condition',result:'pass'})}),env:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'invalid-test-only'}});
  assert.ok(response.status>=400);assert.equal(calls,0);
}finally{globalThis.fetch=originalFetch;}
const source=(p)=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const detailer=source('apps/detailer/detailer-app.js'),jobAction=source('functions/api/detailer/job_action.js'),signoff=source('functions/api/progress/signoff.js'),customer=source('progress.html');
assert.match(detailer,/quality749\.summary\?\.approved!==true/);assert.match(jobAction,/quality\.approved/);
assert.match(signoff,/qualitySnapshot749/);assert.match(customer,/quality749CustomerAck/);assert.match(customer,/signature_data_url:signCanvas\.toDataURL/);
assert.match(signoff,/acknowledgement_749/);assert.match(signoff,/signer_type=eq\.customer/);
assert.match(source('complete.html'),/acknowledgement_749: true/);
assert.equal(source('complete.html'),source('complete/index.html'));
assert.match(source('functions/api/detailer/quality_v749.js'),/submission\.staff_user_id===actor\.id/);
assert.match(source('functions/api/detailer/quality_v749.js'),/damage and customer claims require their separate authorized process/);
assert.match(source('functions/api/progress/view.js'),/quality_handoff_v749:qualityCustomer/);
assert.equal(source('progress.html'),source('progress/index.html'));
assert.equal(source('admin-progress.html'),source('admin-progress/index.html'));
assert.equal(source('admin-quality.html'),source('admin-quality/index.html'));
assert.match(source('admin-progress.html'),/admin-quality\.html/);
console.log('Build 749 PASS: pre/post checklist, evidence, independent review, claim hold, source-drift invalidation, genuine customer signoff and route parity.');
