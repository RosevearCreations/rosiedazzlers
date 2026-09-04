import assert from 'node:assert/strict';
import {
  normalizeMaintenanceFollowupAction,
  buildMaintenanceReviewEvent,
  deriveMaintenanceReviewState,
  maintenanceFollowupMetrics,
  writableMaintenanceInterestStatuses,
  maintenanceReviewActions
} from '../functions/api/_lib/maintenance-retention-followup.js';

const interestId='11111111-1111-4111-8111-111111111111';
const bookingId='22222222-2222-4222-8222-222222222222';
const profileId='33333333-3333-4333-8333-333333333333';
const vehicleId='44444444-4444-4444-8444-444444444444';

assert.deepEqual(writableMaintenanceInterestStatuses(), ['new','contacted','interested','closed','unsubscribed']);
assert.deepEqual(maintenanceReviewActions(), ['reviewed','contacted','no_contact_needed']);

assert.deepEqual(normalizeMaintenanceFollowupAction({kind:'interest_status',interest_id:interestId,status:'contacted'}), {ok:true,kind:'interest_status',interest_id:interestId,status:'contacted'});
assert.equal(normalizeMaintenanceFollowupAction({kind:'interest_status',interest_id:interestId,status:'scheduled'}).ok, false);
assert.match(normalizeMaintenanceFollowupAction({kind:'interest_status',interest_id:interestId,status:'converted'}).error, /booking workflow/i);
assert.equal(normalizeMaintenanceFollowupAction({kind:'interest_status',interest_id:'bad',status:'new'}).ok, false);
assert.equal(normalizeMaintenanceFollowupAction({kind:'interest_status',interest_id:interestId,status:'qualified'}).ok, false);
assert.equal(normalizeMaintenanceFollowupAction({kind:'interest_status',interest_id:interestId,status:'new',customer_profile_id:profileId}).ok, false);

const review=normalizeMaintenanceFollowupAction({kind:'candidate_review',latest_booking_id:bookingId,action:'reviewed',note:'Check timing next week.'});
assert.equal(review.ok,true);
assert.equal(review.note,'Check timing next week.');
assert.equal(normalizeMaintenanceFollowupAction({kind:'candidate_review',latest_booking_id:bookingId,action:'send_reminder'}).ok,false);
assert.equal(normalizeMaintenanceFollowupAction({kind:'candidate_review',latest_booking_id:bookingId,action:'reviewed',booking_id:bookingId}).ok,false);

const event=buildMaintenanceReviewEvent({latest_booking_id:bookingId,customer_profile_id:profileId,customer_vehicle_id:vehicleId},{email:'staff@example.ca'},'contacted','Spoke by phone.',new Date('2026-09-04T20:00:00Z'));
assert.equal(event.booking_id,bookingId);
assert.equal(event.customer_id,profileId);
assert.equal(event.vehicle_id,vehicleId);
assert.equal(event.event_type,'maintenance_followup_contacted');
assert.equal(event.customer_visible,false);
assert.equal(event.event_at,'2026-09-04T20:00:00.000Z');
assert.match(event.event_note,/staff@example.ca/);
assert.match(event.event_note,/Spoke by phone/);
assert.equal(event.recommended_next_service,null);

const states=deriveMaintenanceReviewState([
  {...event, event_at:'2026-09-04T20:00:00.000Z'},
  {...event, event_type:'maintenance_followup_reviewed', event_at:'2026-09-03T20:00:00.000Z'}
]);
assert.equal(states.get(bookingId).action,'contacted');

const metrics=maintenanceFollowupMetrics(
  [{status:'new'},{status:'contacted'},{status:'interested'}],
  [{due:true,vehicle_identity_reliable:true,latest_review:{action:'reviewed'}},{due:false,vehicle_identity_reliable:false,latest_review:null}]
);
assert.deepEqual(metrics,{interest_total:3,interest_new:1,interest_contacted:1,interest_interested:1,reminder_candidates:2,due_reminders:1,identity_blocked:1,reviewed_candidates:1});

console.log('Maintenance retention follow-up contract: PASS');
