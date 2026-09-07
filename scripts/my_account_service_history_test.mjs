import assert from 'node:assert/strict';
import {
  bookingIsCompleted,
  buildAccountHistoryViewModel,
  vehicleLabel,
  packageLabel
} from '../assets/my-account-v355.js';

const payload = {
  bookings: [
    { id: 'done-1', job_status: 'completed', detailing_completed_at: '2026-09-06T18:00:00Z', package_code: 'complete_detail' },
    { id: 'scheduled-1', status: 'confirmed', job_status: 'scheduled', service_date: '2026-09-10', package_code: 'basic_detail' },
    { id: 'active-1', status: 'confirmed', job_status: 'in_progress', service_date: '2026-09-08', package_code: 'premium_wash' }
  ],
  service_history: [
    {
      booking_id: 'done-1',
      completed_at: '2026-09-06T18:00:00Z',
      package_code: 'complete_detail',
      vehicle_id: 'veh-1',
      vehicle: { id: 'veh-1', vehicle_name: 'Family CR-V', model_year: 2022, make: 'Honda', model: 'CR-V', vehicle_size: 'mid' }
    },
    {
      booking_id: 'done-0',
      completed_at: '2026-08-20T18:00:00Z',
      package_code: 'premium_wash',
      vehicle_id: null,
      vehicle: { id: null, vehicle_name: null, model_year: null, make: null, model: null, vehicle_size: 'small' }
    }
  ]
};

assert.equal(bookingIsCompleted(payload.bookings[0]), true, 'completed job must be treated as completed');
assert.equal(bookingIsCompleted(payload.bookings[1]), false, 'scheduled booking must remain current/upcoming');

const model = buildAccountHistoryViewModel(payload);
assert.deepEqual(model.currentBookings.map((row) => row.id), ['scheduled-1', 'active-1'], 'completed bookings must not be duplicated in current booking cards');
assert.deepEqual(model.serviceHistory.map((row) => row.booking_id), ['done-1', 'done-0'], 'service history must come from the canonical dashboard service_history contract');
assert.equal(model.latestService.booking_id, 'done-1', 'latest service context must use the first canonical service-history row');
assert.equal(vehicleLabel(model.latestService), 'Family CR-V', 'saved canonical vehicle name should win');
assert.equal(vehicleLabel(model.serviceHistory[1]), 'Small vehicle', 'safe vehicle-size fallback should remain available');
assert.equal(packageLabel('complete_detail'), 'Complete Detail');

const empty = buildAccountHistoryViewModel({ bookings: [], service_history: [] });
assert.equal(empty.currentBookings.length, 0);
assert.equal(empty.serviceHistory.length, 0);
assert.equal(empty.latestService, null);

console.log('MY ACCOUNT SERVICE HISTORY: PASS');
console.log('- completed bookings are removed from current/upcoming presentation');
console.log('- completed service history is consumed only from the authenticated dashboard service_history contract');
console.log('- canonical saved-vehicle labels are preserved with a safe vehicle-size fallback');
console.log('- maintenance context can use the latest completed service without inventing a cadence or due date');
