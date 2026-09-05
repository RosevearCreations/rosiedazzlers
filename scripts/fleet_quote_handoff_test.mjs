import assert from 'node:assert/strict';
import {
  buildFleetDraftQuote,
  classifyFleetLinkedQuotes,
  fleetQuoteAdminUrl,
  isDeterministicFleetQuote,
  validateFleetQuoteLead
} from '../functions/api/_lib/fleet-quote-handoff.js';

const LEAD_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const lead = {
  id: LEAD_ID,
  topic: 'fleet',
  full_name: 'Sam Driver',
  email: 'sam@example.ca',
  phone: '519-555-0101',
  service_area: 'Tillsonburg',
  vehicle_count: 6,
  preferred_cadence: 'As needed',
  message: 'Request type: Small business fleet\nBusiness / organization: Example Plumbing\nSix work vans',
  status: 'reviewing'
};

let out = validateFleetQuoteLead(lead);
assert.equal(out.ok, true);
assert.equal(out.id, LEAD_ID);

out = buildFleetDraftQuote(lead);
assert.equal(out.ok, true);
assert.equal(out.quote_id, LEAD_ID);
assert.equal(out.payload.id, LEAD_ID, 'quote UUID must be deterministic from the fleet lead');
assert.equal(out.payload.lead_id, LEAD_ID);
assert.equal(out.payload.customer_id, null);
assert.equal(out.payload.booking_id, null);
assert.equal(out.payload.status, 'draft');
assert.equal(out.payload.source_channel, 'fleet_public_inquiry');
assert.equal(out.payload.quoted_amount_cents, 0);
assert.equal(out.payload.accepted_amount_cents, 0);
assert.equal(out.payload.customer_name, 'Example Plumbing');
assert.match(out.payload.service_label, /6 vehicles/);
assert.equal(out.payload.follow_up_stage, 'prepare_quote');

for (const status of ['converted', 'closed', 'spam']) {
  out = validateFleetQuoteLead({ ...lead, status });
  assert.equal(out.ok, false, `${status} lead must not create a new quote`);
  assert.match(out.code, new RegExp(status));
}

out = validateFleetQuoteLead({ ...lead, topic: 'general' });
assert.equal(out.ok, false);
assert.equal(out.code, 'fleet_topic_required');

out = classifyFleetLinkedQuotes([], LEAD_ID);
assert.deepEqual(out, { ok: true, found: false, quote: null });

const existing = { id: OTHER_ID, lead_id: LEAD_ID, status: 'sent' };
out = classifyFleetLinkedQuotes([existing], LEAD_ID);
assert.equal(out.ok, true);
assert.equal(out.found, true);
assert.equal(out.quote, existing);

out = classifyFleetLinkedQuotes([{ id: OTHER_ID, lead_id: OTHER_ID }], LEAD_ID);
assert.equal(out.ok, false);
assert.equal(out.code, 'fleet_quote_link_mismatch');

out = classifyFleetLinkedQuotes([
  { id: LEAD_ID, lead_id: LEAD_ID },
  { id: OTHER_ID, lead_id: LEAD_ID }
], LEAD_ID);
assert.equal(out.ok, false);
assert.equal(out.code, 'fleet_quote_handoff_ambiguous');

assert.equal(isDeterministicFleetQuote({ id: LEAD_ID, lead_id: LEAD_ID }, LEAD_ID), true);
assert.equal(isDeterministicFleetQuote({ id: OTHER_ID, lead_id: LEAD_ID }, LEAD_ID), false);
assert.equal(fleetQuoteAdminUrl(LEAD_ID), `/admin-quotes.html?quote_id=${LEAD_ID}`);
assert.equal(fleetQuoteAdminUrl('not-a-uuid'), '/admin-quotes.html');

console.log('FLEET QUOTE HANDOFF TEST: PASS');
console.log('- draft quote identity is deterministic and replay-safe');
console.log('- existing linked quote is reused instead of duplicated');
console.log('- ambiguous duplicate links fail closed');
console.log('- closed, spam and converted leads cannot create a new draft quote');
console.log('- handoff creates no customer profile, booking, appointment or price authority');
