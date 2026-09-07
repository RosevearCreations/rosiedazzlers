import assert from 'node:assert/strict';
import {
  bookingIsCompleted,
  buildAccountHistoryViewModel,
  buildVehicleServiceTimelines,
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

const timelinePayload = {
  vehicles: [
    { id: 'veh-1', vehicle_name: 'Family CR-V', model_year: 2022, make: 'Honda', model: 'CR-V', vehicle_size: 'mid' },
    { id: 'veh-2', vehicle_name: 'Work Truck', model_year: 2021, make: 'Ford', model: 'F-150', vehicle_size: 'oversize' }
  ],
  service_history: [
    {
      booking_id: 'veh2-new', completed_at: '2026-09-05T12:00:00Z', service_date: '2026-09-05', package_code: 'basic_detail', vehicle_id: 'veh-2',
      vehicle: { id: 'veh-2', vehicle_name: 'Stale truck label' }, vehicle_mileage_km: 91000
    },
    {
      booking_id: 'veh1-new', completed_at: '2026-09-04T12:00:00Z', service_date: '2026-09-04', package_code: 'complete_detail', vehicle_id: 'veh-1',
      vehicle: { id: 'veh-1', vehicle_name: 'Stale CR-V label' }, vehicle_mileage_km: 48000
    },
    {
      booking_id: 'veh1-old', completed_at: '2026-08-01T12:00:00Z', service_date: '2026-08-01', package_code: 'premium_wash', vehicle_id: 'veh-1',
      vehicle: { id: 'veh-1', vehicle_name: 'Stale CR-V label' }, vehicle_mileage_km: 46200
    },
    {
      booking_id: 'veh1-old', completed_at: '2026-07-31T12:00:00Z', service_date: '2026-07-31', package_code: 'premium_wash', vehicle_id: 'veh-1',
      vehicle: { id: 'veh-1', vehicle_name: 'Duplicate projection' }, vehicle_mileage_km: 46190
    },
    {
      booking_id: 'unknown-vehicle', completed_at: '2026-09-03T12:00:00Z', service_date: '2026-09-03', package_code: 'complete_detail', vehicle_id: 'veh-404',
      vehicle: { id: 'veh-404', vehicle_name: 'Not owned' }
    },
    {
      booking_id: 'mismatched-link', completed_at: '2026-09-02T12:00:00Z', service_date: '2026-09-02', package_code: 'basic_detail', vehicle_id: 'veh-1',
      vehicle: { id: 'veh-2', vehicle_name: 'Conflicting projection' }
    },
    {
      booking_id: 'unlinked-history', completed_at: '2026-09-01T12:00:00Z', service_date: '2026-09-01', package_code: 'premium_wash', vehicle_id: null,
      vehicle: { id: null, vehicle_size: 'small' }
    }
  ]
};

const timelines = buildVehicleServiceTimelines(timelinePayload);
assert.deepEqual(timelines.map((timeline) => timeline.vehicle.id), ['veh-2', 'veh-1'], 'vehicle timelines must be ordered by their latest completed service');
assert.deepEqual(timelines[0].services.map((row) => row.booking_id), ['veh2-new'], 'vehicle two must contain only its own canonical service');
assert.deepEqual(timelines[1].services.map((row) => row.booking_id), ['veh1-new', 'veh1-old'], 'vehicle one history must be descending and deduplicated by stable booking identity');
assert.equal(timelines[1].services[0].vehicle.vehicle_name, 'Family CR-V', 'canonical saved vehicle data must replace stale projected vehicle labels');
assert.equal(timelines.flatMap((timeline) => timeline.services).some((row) => row.booking_id === 'unknown-vehicle'), false, 'unknown vehicle links must fail closed');
assert.equal(timelines.flatMap((timeline) => timeline.services).some((row) => row.booking_id === 'mismatched-link'), false, 'conflicting vehicle projections must fail closed');
assert.equal(timelines.flatMap((timeline) => timeline.services).some((row) => row.booking_id === 'unlinked-history'), false, 'unlinked history must stay out of per-vehicle timelines');

const timelineModel = buildAccountHistoryViewModel(timelinePayload);
assert.equal(timelineModel.serviceHistory.length, timelinePayload.service_history.length, 'general service history must remain backward-compatible and retain unlinked historical records');
assert.equal(timelineModel.vehicleServiceTimelines.length, 2, 'vehicle timelines must be additive to the existing response presentation');

const ambiguousVehiclePayload = {
  vehicles: [
    { id: 'veh-dup', vehicle_name: 'Duplicate A' },
    { id: 'veh-dup', vehicle_name: 'Duplicate B' }
  ],
  service_history: [
    { booking_id: 'dup-booking', completed_at: '2026-09-01T12:00:00Z', service_date: '2026-09-01', package_code: 'basic_detail', vehicle_id: 'veh-dup', vehicle: { id: 'veh-dup' } }
  ]
};
assert.equal(buildVehicleServiceTimelines(ambiguousVehiclePayload).length, 0, 'ambiguous canonical vehicle identity must fail closed rather than blending records');

const empty = buildAccountHistoryViewModel({ bookings: [], service_history: [], vehicles: [] });
assert.equal(empty.currentBookings.length, 0);
assert.equal(empty.serviceHistory.length, 0);
assert.equal(empty.latestService, null);
assert.equal(empty.vehicleServiceTimelines.length, 0);

console.log('MY ACCOUNT SERVICE HISTORY: PASS');
console.log('- completed bookings are removed from current/upcoming presentation');
console.log('- completed service history is consumed only from the authenticated dashboard service_history contract');
console.log('- canonical saved-vehicle labels are preserved with a safe vehicle-size fallback');
console.log('- Build 358 per-vehicle timelines accept only unique canonical saved-vehicle links');
console.log('- invalid, conflicting, ambiguous and unlinked vehicle history fails closed instead of blending household vehicles');
console.log('- per-vehicle chronology is deterministic and duplicate booking projections are collapsed');
console.log('- general completed-service history remains backward-compatible while the vehicle timeline is additive');
console.log('- maintenance context can use the latest completed service without inventing a cadence or due date');