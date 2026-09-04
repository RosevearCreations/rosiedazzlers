import assert from 'node:assert/strict';
import { deriveFleetLead, fleetPipelineMetrics, normalizeFleetLeadPatch, parseFleetMessage } from '../functions/api/_lib/fleet-account-pipeline.js';

let out = normalizeFleetLeadPatch({ lead_id: 'abc', status: 'reviewing', staff_note: 'Called customer' });
assert.equal(out.ok, true);
assert.deepEqual(out.patch, { status: 'reviewing', staff_note: 'Called customer' });

out = normalizeFleetLeadPatch({ lead_id: 'abc', status: 'converted' });
assert.equal(out.ok, false);
assert.match(out.error, /booking\/quote workflow/i);

for (const forbidden of ['converted_booking_id','booking_id','quote_id','email','phone','vehicle_count','preferred_cadence','recurring','payment']) {
  out = normalizeFleetLeadPatch({ lead_id: 'abc', [forbidden]: 'x' });
  assert.equal(out.ok, false, `${forbidden} must be blocked`);
}

out = normalizeFleetLeadPatch({ lead_id: 'abc', status: 'made_up' });
assert.equal(out.ok, false);

const parsed = parseFleetMessage('Request type: Small business fleet\nBusiness / organization: Acme Plumbing\nThree service vans\nOutdoor lot');
assert.equal(parsed.request_type, 'Small business fleet');
assert.equal(parsed.business_name, 'Acme Plumbing');
assert.equal(parsed.request_details, 'Three service vans\nOutdoor lot');

const lead = deriveFleetLead({ id:'1', topic:'fleet', full_name:'Sam', message:'Request type: Workplace group\nBusiness / organization: Example Co\nNeeds review', vehicle_count:4, status:'new' });
assert.equal(lead.business_name, 'Example Co');
assert.equal(lead.is_open, true);
assert.equal(lead.needs_follow_up, true);
assert.equal(lead.conversion_locked, true);

const converted = deriveFleetLead({ id:'2', topic:'fleet', status:'converted', vehicle_count:2 });
assert.equal(converted.is_open, false);
assert.equal(converted.conversion_locked, true);

const metrics = fleetPipelineMetrics([lead, converted]);
assert.equal(metrics.total, 2);
assert.equal(metrics.open, 1);
assert.equal(metrics.new, 1);
assert.equal(metrics.converted, 1);
assert.equal(metrics.vehicles_requested, 6);

console.log('FLEET ACCOUNT PIPELINE TEST: PASS');
