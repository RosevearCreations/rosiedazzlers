import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outcome819,latestReturnedHandoff819,outcomeSummary819} from '../assets/build819-followup-outcomes.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const waiting={id:'a',status:'awaiting_staff',requested_at:'2026-11-08T10:00:00Z'};
const replied={id:'b',status:'staff_replied',staff_response:'Your answer is in your account.',staff_responded_at:'2026-11-08T11:00:00Z'};
const needs={id:'c',status:'needs_more_help',staff_response:'Please check the outlet at arrival.',staff_responded_at:'2026-11-08T11:00:00Z',customer_decided_at:'2026-11-08T12:00:00Z',customer_feedback:'The power outlet is still unclear.'};
const confirmed={id:'d',status:'confirmed',staff_response:'Your answer is in your account.',staff_responded_at:'2026-11-08T11:00:00Z',customer_decided_at:'2026-11-08T13:00:00Z'};
const broken={id:'e',status:'confirmed',customer_decided_at:null};
assert.equal(outcome819(waiting).kind,'waiting');
assert.equal(outcome819(replied).kind,'responded');
assert.equal(outcome819(needs).kind,'needs_help');
assert.equal(outcome819(confirmed).kind,'confirmed');
assert.equal(outcome819(confirmed).closureConfirmed,true);
assert.match(outcome819(confirmed).guidance,/separate worksite issue/i);
assert.equal(outcome819(broken).kind,'review');
assert.equal(outcome819({...confirmed,staff_response:null}).kind,'review');
assert.equal(outcome819({...replied,staff_response:''}).kind,'review');
assert.equal(outcome819({...waiting,staff_response:'Premature'}).kind,'review');
assert.equal(outcome819({...needs,customer_feedback:null}).kind,'review');
assert.equal(outcome819({status:'unexpected'}).kind,'review');
assert.deepEqual(outcomeSummary819([waiting,replied,needs,confirmed,broken]),{waiting:1,responded:1,needs_help:1,confirmed:1,review:1,total:5});
assert.deepEqual(outcomeSummary819(null),{waiting:0,responded:0,needs_help:0,confirmed:0,review:0,total:0});
const events=[
  {followup_id:'b',event_kind:'request_submitted',recorded_at:'2026-11-08T09:00:00Z',followup_revision:0},
  {followup_id:'b',event_kind:'staff_responded',recorded_at:'2026-11-08T11:00:00Z',followup_revision:1,actor_staff_user_id:'private-staff-id'},
  {followup_id:'b',event_kind:'unknown',recorded_at:'2026-11-08T12:00:00Z',followup_revision:2},
  {followup_id:'b',event_kind:'staff_responded',recorded_at:'invalid',followup_revision:3},
];
assert.deepEqual(latestReturnedHandoff819(replied,events),{label:'Staff response recorded',recordedAt:'2026-11-08T11:00:00Z',revision:1});
assert.equal(latestReturnedHandoff819(waiting,events),null);
assert.equal(latestReturnedHandoff819(null,events),null);
const html=read('../admin-today.html');assert.equal(html,read('../admin-today/index.html'));
assert.match(html,/admin-worksite-followups-v814\.mjs\?v=build(?:819|820|821|822)/);
assert.match(html,/worksite-issues-v811\.css\?v=build(?:819|820|821|822)/);
const app=read('../assets/admin-worksite-followups-v814.mjs');
for(const token of ['ensureOutcomeSurface819','build819OutcomeSummary','build819HandoffStatus','outcomeCard819','latestReturnedHandoff819','data-build819-followup','handoffFeedback819','focus({preventScroll:false})'])assert.ok(app.includes(token),`Missing UI contract: ${token}`);
assert.match(app,/const readback=await load\(\);handoffFeedback819\(row\.id/);
assert.match(app,/filters are retained/);
assert.match(app,/No matching event was returned in the bounded audit history/);
assert.doesNotMatch(read('../assets/build819-followup-outcomes.mjs'),/fetch\(|localStorage|sessionStorage|private_note|booking_changed|sendgrid|twilio/i);
assert.match(read('./current_booking_wizard_regression.sh'),/build819_followup_outcome_handoff_test.mjs/);
console.log('Build 819 PASS: truthful bounded outcomes, closure guidance, audit handoff, accessible saved-action feedback and mirrored routes.');
