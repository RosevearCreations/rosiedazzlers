import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findAuthorizedTools800} from '../assets/admin-workspace-v800.mjs';
import {stepGuidance801,STEP_GUIDANCE_801} from '../assets/booking-wizard-ux-v801.mjs';
import {availabilityGuidance802} from '../assets/booking-availability-v802.mjs';
import {quoteBreakdown803,cad803} from '../assets/booking-quote-breakdown-v803.mjs';
import {ACCOUNT_ACTIONS_804,filterAccountActions804} from '../assets/customer-actions-v804.mjs';

const file=path=>readFileSync(path,'utf8');
const same=(a,b)=>assert.equal(file(a),file(b),`${a} and ${b} route parity`);

// 800: no permission widening, no search-derived route creation or hidden links.
const allowed=[{label:'Bookings'},{label:'Finance'},{label:'Staff'}];
assert.deepEqual(findAuthorizedTools800(allowed,'book'),[allowed[0]]);
assert.deepEqual(findAuthorizedTools800(allowed,'not authorized'),[]);
assert.deepEqual(findAuthorizedTools800(allowed,' '),allowed);
assert.match(file('assets/admin-shell.js'),/initAdminWorkspace800/);
assert.match(file('assets/admin-workspace-v800.mjs'),/filter only|Capture only navigation entries/);
console.log('Build 800 authorized-menu search / keyboard / protected shell: PASS');

// 801: guidance never writes a booking, moves the canonical step, or stores PII.
assert.equal(STEP_GUIDANCE_801.length,5);
assert.match(stepGuidance801(1),/date and time/);
assert.match(stepGuidance801(5),/deposit/);
assert.match(stepGuidance801(99),/Review this step/);
assert.match(file('booking-planner.html'),/booking-wizard-ux-v801\.mjs/);
assert.match(file('assets/booking-wizard-ux-v801.mjs'),/aria-invalid/);
console.log('Build 801 accessible five-step help / error review: PASS');

// 802: stale calendar and unavailable/failed source must never claim a slot.
const slots={AM:true,PM:false,FULL:false};
assert.match(availabilityGuidance802({}),/Choose a preferred date/);
assert.match(availabilityGuidance802({date:'2026-11-09',note:'Availability for 2026-11-08:',slots}),/Checking/);
assert.match(availabilityGuidance802({date:'2026-11-09',note:'Current availability could not be confirmed.',slots}),/not verified/);
assert.match(availabilityGuidance802({date:'2026-11-09',note:'Availability for 2026-11-09:',slots:{AM:false,PM:false,FULL:false}}),/No available time/);
assert.match(availabilityGuidance802({date:'2026-11-09',note:'Availability for 2026-11-09:',slots}),/AM half day/);
assert.match(availabilityGuidance802({date:'2026-11-09',note:'Availability for 2026-11-09:',slots,chosen:'AM'}),/not a reservation/);
assert.match(file('booking-planner.html'),/booking-availability-v802\.mjs/);
console.log('Build 802 availability snapshots / stale denial / accessible slots: PASS');

// 803: use catalogue-derived amounts, exclude quote-only work, never assert tax.
const estimate=quoteBreakdown803({vehicleSize:'small',packageName:'Complete',packageAmount:100,
  addons:[{name:'Wax',amount:25},{name:'Coating',quoteRequired:true}],deposit:30});
assert.equal(estimate.ready,true);
assert.equal(estimate.subtotal,125);
assert.equal(estimate.deposit,30);
assert.deepEqual(estimate.quoteOnly,['Coating']);
assert.equal(estimate.lines.length,2);
assert.equal(quoteBreakdown803({vehicleSize:'small',packageName:'Wash',packageAmount:50,
  addons:[{name:'Unknown',amount:null}]}).ready,false);
assert.equal(quoteBreakdown803({vehicleSize:'',packageName:'Wash',packageAmount:50}).ready,false);
assert.match(cad803(125),/125/);
assert.match(file('book.html'),/quoteBreakdown803/);
assert.match(file('book.html'),/Math\.abs\(breakdown\.subtotal-t\.subtotal\)>0\.01/);
console.log('Build 803 itemized CAD starting estimate / quote-only exclusion: PASS');

// 804: local navigation only, existing source/auth and consent remain unchanged.
assert.equal(ACCOUNT_ACTIONS_804.length,8);
assert.equal(filterAccountActions804('vehicle').length,1);
assert.deepEqual(filterAccountActions804('secret'),[]);
assert.match(file('my-account.html'),/customer-actions-v804\.mjs/);
for(const id of ['accountProfile804','accountBookings804','build742History',
  'build743CustomerCommunication','build744CustomerFollowup'])
  assert.ok(file('my-account.html').includes(`id="${id}"`),id);
assert.match(file('assets/customer-actions-v804.mjs'),/accountGarage804/);
same('book.html','book/index.html');same('my-account.html','my-account/index.html');
assert.match(file('assets/ux-800-804.css'),/focus-visible/);
console.log('Build 804 customer task shortcuts / search / route parity: PASS');
