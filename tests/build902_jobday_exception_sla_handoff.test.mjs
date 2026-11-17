import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize902,project902,POLICY902} from '../assets/build902-jobday-exceptions.mjs';
const book='5fd62295-1f83-4507-bf6f-bd5e1abb9fed';
const issue='166cd852-784d-4244-a793-3dde8d273348';
const offerId='e97e48bf-4571-4e48-973f-285edda643ca';
const ackId='d7aa9520-5108-441d-bb69-45cd854e5ca0';
const sender='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const supervisor='8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce';
const input=(action,extra={})=>({action,client_request_id:'73211e69-552e-489a-b9dd-e90481b1a0aa',
 booking_id:book,exception_id:issue,note:'Signed original safety handoff observation.',...extra});
const row=(id,time,extra={})=>({id,booking_id:book,recorded_at:time,...extra});
const incident=(severity='stop_work')=>row(issue,'2026-11-17T10:00:00Z',
 {event_kind:'escalation',severity,subject:'weather',staff_user_id:sender,note:'Actual original site issue recorded.'});
const offer=row(offerId,'2026-11-17T10:05:00Z',
 {exception_id:issue,event_kind:'offer',staff_user_id:sender,recipient_staff_user_id:supervisor});
const ack=row(ackId,'2026-11-17T10:11:00Z',
 {exception_id:issue,event_kind:'acknowledge',offer_id:offerId,decision:'accepted',staff_user_id:supervisor});
const view=(events901=[incident()],receipts902=[],now='2026-11-17T10:10:00Z')=>project902({booking_id:book,events901,receipts902,now});
test('strict 902 forms reject actor impersonation, SLA overrides and invented approvals',()=>{
 assert.equal(normalize902(input('offer',{recipient_staff_user_id:supervisor})).ok,true);
 assert.equal(normalize902(input('acknowledge',{offer_id:offerId,decision:'accepted'})).ok,true);
 assert.equal(normalize902(input('triage',{priority:'critical'})).ok,true);
 assert.equal(normalize902(input('escalate')).ok,true);
 for(const request of [
 input('offer',{recipient_staff_user_id:supervisor,actor_id:sender}),
 input('offer',{recipient_staff_user_id:'not-a-uuid'}),
 input('acknowledge',{offer_id:offerId,decision:'authorized'}),
 input('triage',{priority:'urgent'}),
 input('triage',{priority:'high',new_due_at:'tomorrow'}),
 input('escalate',{send_sms:true}),
 input('resolve',{decision:'resolved'}),
 input('escalate',{note:'brief'})
 ])assert.equal(normalize902(request).ok,false);
});
test('fixed original incident clock does not reset on handoff, triage or repeated escalations',()=>{
 assert.equal(POLICY902.stop_work,15);assert.equal(POLICY902.review,60);
 const report=view([incident()],[offer,ack],'2026-11-17T10:19:00Z').exceptions[0];
 assert.equal(report.due_at,'2026-11-17T10:15:00.000Z');
 assert.equal(report.sla_state,'ACK_ON_TIME');
 assert.equal(report.age_minutes,19);
 const triage=row('2a35d74e-f789-4acc-9778-b1be9e9f3463','2026-11-17T10:16:00Z',
 {exception_id:issue,event_kind:'triage',priority:'normal',staff_user_id:supervisor});
 const late=view([incident()],[offer,triage],'2026-11-17T10:20:00Z').exceptions[0];
 assert.equal(late.sla_state,'ACK_LATE');
 assert.equal(late.priority,'normal');
 assert.equal(late.due_at,report.due_at);
 const review=view([incident('review')],[],'2026-11-17T11:00:01Z').exceptions[0];
 assert.equal(review.sla_state,'OVERDUE');assert.equal(review.due_at,'2026-11-17T11:00:00.000Z');
});
test('without original independent acknowledgement, handoff is pending and SLA goes overdue',()=>{
 const p=view([incident()],[offer],'2026-11-17T10:16:00Z');
 assert.equal(p.open_queue.length,1);
 assert.equal(p.totals.pending_handoffs,1);
 assert.equal(p.totals.overdue,1);
 assert.equal(p.exceptions[0].handoff.verified,false);
 const wrong={...ack,staff_user_id:sender};
 assert.equal(view([incident()],[offer,wrong]).exceptions[0].handoff.verified,false);
 const real=view([incident()],[offer,ack]).exceptions[0];
 assert.equal(real.handoff.status,'TWO_PERSON_ACCEPTED');
 assert.equal(real.handoff.verified,true);
});
test('incident resolution is separate from crew handoff and SLA response',()=>{
 const resolution=row('1c9a9fa7-c9e7-4bd6-9d7d-b1f9b79bcd41','2026-11-17T10:20:00Z',
 {event_kind:'resolution',escalation_id:issue,decision:'resolved',staff_user_id:supervisor});
 const state=view([incident(),resolution],[offer,ack],'2026-11-17T10:30:00Z');
 assert.equal(state.exceptions[0].open,false);
 assert.equal(state.open_queue.length,0);
 assert.equal(state.exceptions[0].handoff.verified,true);
 assert.equal(state.evidence.dispatch_or_safety_approved,false);
});
test('original evidence mismatch, duplicate acknowledgements and incomplete windows fail closed',()=>{
 const altered={...ack,booking_id:'95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a'};
 assert.throws(()=>view([incident()],[altered]),/Malformed/);
 assert.throws(()=>view([incident()],[offer,ack,{...ack,id:'bb884a6f-b5ed-418f-bdd0-cbe304a7f12b'}]),/Conflicting/);
 assert.throws(()=>view(new Array(240).fill(incident())),/incomplete/);
});
test('private append-only DB, signed original route and no direct bookings/payments/automated alerts',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261117020000_build902_jobday_exception_sla_handoff.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/unique index.*one_ack_per_offer/);
 assert.match(sql,/before update or delete/);assert.match(sql,/before truncate/);
 assert.match(sql,/check\(not independent_physical_certification\)/);
 const route=readFileSync(new URL('../functions/api/admin/jobday_exceptions_v902.js',import.meta.url),'utf8');
 assert.match(route,/allowLegacyAdminFallback:false/);
 assert.match(route,/a.auth_mode!=='session'/);
 assert.match(route,/sameOrigin811/);
 assert.match(route,/hasActionAccess\(a.actor,'operations.assignment.manage'\)/);
 assert.match(route,/p.recipient_staff_user_id===a.actor.id/);
 assert.match(route,/issue.handoff.recipient_staff_user_id!==a.actor.id/);
 assert.match(route,/original.staff_user_id!==a.actor.id/);
 assert.doesNotMatch(route,/method:'PATCH'|method:'DELETE'|stripe|sendSMS/);
 const job=readFileSync(new URL('../functions/api/detailer/job_action.js',import.meta.url),'utf8');
 assert.match(job,/requireJobdayTransition901/);
 assert.match(job,/jobday_dispatch_hold/);
});
