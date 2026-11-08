import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewTarget817,selectFollowups817} from '../assets/admin-worksite-followups-v814.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const now=Date.parse('2026-11-08T18:00:00Z');
const rows=[
  {id:'a',status:'awaiting_staff',requested_at:'2026-11-06T10:00:00Z',booking_id:'BOOK-100',issue_category:'Power access',request_kind:'question',request_text:'Please confirm the driveway power outlet.'},
  {id:'b',status:'awaiting_staff',requested_at:'2026-11-08T12:00:00Z',booking_id:'BOOK-200',issue_category:'Water',request_kind:'question',request_text:'Where should we park?'},
  {id:'c',status:'staff_replied',requested_at:'2026-11-07T15:00:00Z',booking_id:'BOOK-300',issue_category:'Arrival',request_kind:'question',request_text:'Thanks for answering.'},
];
const owners=[
  {followup_id:'a',owner_staff_user_id:'staff-a',review_due_at:'2026-11-08T17:00:00Z'},
  {followup_id:'b',owner_staff_user_id:'staff-b',review_due_at:'2026-11-09T10:00:00Z'},
];
const find=(opts={})=>selectFollowups817(rows,{status:'all',ownershipReady:true,owners,now,...opts}).map(r=>r.id);
assert.equal(reviewTarget817(rows[0],owners[0],now),'past');
assert.equal(reviewTarget817(rows[1],owners[1],now),'soon');
assert.equal(reviewTarget817(rows[2],null,now),'none');
assert.equal(reviewTarget817(rows[0],{review_due_at:'invalid'},now),'unknown');
assert.deepEqual(find({query:'  book-200  '}),['b']);
assert.deepEqual(find({query:'POWER'}),['a']);
assert.deepEqual(find({query:'driveway'}),['a']);
assert.deepEqual(find({query:'not anywhere'}),[]);
assert.deepEqual(find({target:'past'}),['a']);
assert.deepEqual(find({target:'soon'}),['b']);
assert.deepEqual(find({target:'later'}),[]);
assert.deepEqual(find({target:'none'}),['c']);
assert.deepEqual(find({status:'mine',staffId:'staff-b'}),['b']);
assert.deepEqual(find({status:'unowned'}),[]);
assert.deepEqual(find({status:'priority'}),['a','b']);
assert.deepEqual(find({status:'aging'}),['a']);
assert.deepEqual(find({target:'past',ownershipReady:false,owners:[]}),[]);
assert.deepEqual(find({status:'unowned',ownershipReady:false,owners:[]}),[]);
assert.deepEqual(find({status:'mine',ownershipReady:false,owners:[]}),[]);
assert.deepEqual(find({target:'all',ownershipReady:false,owners:[]}),['a','b','c']);
const html=read('../admin-today.html');
assert.equal(html,read('../admin-today/index.html'));
assert.match(html,/id="build817StaffSearch"[^>]*type="search"/);
assert.match(html,/id="build817ReviewTarget" disabled/);
assert.match(html,/admin-worksite-followups-v814.mjs\?v=build(?:81[789]|820|821|822)/);
assert.match(html,/latest 150 (?:loaded|authorized) follow-ups/);
const ui=read('../assets/admin-worksite-followups-v814.mjs');
assert.match(ui,/targetSelect\.disabled=!ownershipReady/);
assert.match(ui,/Ownership priority unavailable/);
assert.doesNotMatch(ui,/localStorage|sessionStorage|sendgrid|twilio|stripe\.com/i);
assert.match(read('./current_booking_wizard_regression.sh'),/build817_followup_search_review_triage_test.mjs/);
console.log('Build 817 PASS: bounded staff search, review target triage, missing-owner fail-closed, accessible controls and mirrored route.');
