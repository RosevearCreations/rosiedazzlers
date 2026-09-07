#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  deriveBookingRebookingFunnel,
  deriveAnonymousBookingFunnel,
  deriveAnonymousRebookingIntent,
  deriveExactRepeatBookingOutcomes
} from '../functions/api/_lib/booking-rebooking-funnel.js';

const since = new Date('2026-04-01T00:00:00Z');
const until = new Date('2026-09-07T12:00:00Z');
const event = (session_id, event_type, created_at, extra = {}) => ({ session_id, event_type, created_at, payload:extra.payload || {}, checkout_state:extra.checkout_state || null });
const events = [
  event('s1','booking_step_view','2026-09-01T10:00:00Z',{payload:{step_number:1}}),
  event('s1','booking_step_view','2026-09-01T10:01:00Z',{payload:{step_number:2}}),
  event('s1','checkout_started','2026-09-01T10:05:00Z'),
  event('s1','checkout_completed','2026-09-01T10:06:00Z'),
  event('s2','booking_step_view','2026-09-02T10:00:00Z',{payload:{step_number:1}}),
  event('r1','booking_rebook_prompt_view','2026-09-03T10:00:00Z'),
  event('r1','booking_rebook_start','2026-09-03T10:01:00Z'),
  event('r1','booking_history_rebook_handoff','2026-09-03T10:02:00Z'),
  event('r1','checkout_started','2026-09-03T10:04:00Z'),
  event('r1','checkout_completed','2026-09-03T10:05:00Z'),
  event('r2','booking_rebook_prefill_applied','2026-09-04T10:00:00Z'),
  event('r2','checkout_started','2026-09-04T10:04:00Z'),
  event('old','booking_step_view','2026-01-01T10:00:00Z',{payload:{step_number:1}})
];

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const booking = (id, customer_profile_id, created_at, completed_at = null) => ({ id, customer_profile_id, created_at, service_date:created_at.slice(0,10), completed_at, status:completed_at?'completed':'confirmed', job_status:completed_at?'completed':'scheduled' });
const bookings = [
  booking('a1',A,'2026-01-01T12:00:00Z','2026-01-02T12:00:00Z'),
  booking('a2',A,'2026-05-01T12:00:00Z','2026-05-02T12:00:00Z'),
  booking('b1',B,'2026-07-01T12:00:00Z','2026-07-02T12:00:00Z'),
  booking('c1',C,'2026-02-01T12:00:00Z','2026-02-02T12:00:00Z'),
  booking('c2',C,'2026-06-01T12:00:00Z','2026-06-02T12:00:00Z'),
  booking('c3',C,'2026-08-01T12:00:00Z',null),
  booking('bad','not-an-id','2026-08-01T12:00:00Z',null)
];

const funnel = deriveAnonymousBookingFunnel(events.filter((row) => new Date(row.created_at) >= since));
assert.equal(funnel.funnel_start_sessions,2);
assert.equal(funnel.checkout_started_sessions,3);
assert.equal(funnel.checkout_completed_sessions,2);
assert.equal(funnel.start_to_checkout_completion_pct,100);

const intent = deriveAnonymousRebookingIntent(events.filter((row) => new Date(row.created_at) >= since));
assert.equal(intent.prompt_sessions,1);
assert.equal(intent.rebook_start_sessions,1);
assert.equal(intent.verified_handoff_sessions,2);
assert.equal(intent.rebook_intent_sessions,2);
assert.equal(intent.rebook_checkout_started_sessions,2);
assert.equal(intent.rebook_checkout_completed_sessions,1);
assert.equal(intent.intent_to_checkout_completion_pct,50);

const outcomes = deriveExactRepeatBookingOutcomes(bookings,since,until);
assert.equal(outcomes.observed_linked_customers,3);
assert.equal(outcomes.observed_repeat_customers,2);
assert.equal(outcomes.repeat_booking_creations_in_window,3);
assert.equal(outcomes.customers_rebooked_in_window,2);
assert.equal(outcomes.completed_repeat_services_in_window,2);
assert.equal(outcomes.identity_rule,'exact_customer_profile_id_only');
assert.equal(Object.prototype.hasOwnProperty.call(outcomes,'customer_profile_id'),false);

const all = deriveBookingRebookingFunnel({ events, bookings, since, until });
assert.equal(all.evidence_boundary.cross_layer_identity_join,false);
assert.equal(all.evidence_boundary.customer_identity_exposed,false);
assert.equal(all.booking_funnel.funnel_start_sessions,2);
assert.equal(all.repeat_booking_outcomes.observed_repeat_customers,2);

console.log('GREEN: Build 361 booking and rebooking funnel executable contract passed.');
