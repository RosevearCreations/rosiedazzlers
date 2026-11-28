import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guidedDepositCents936,guidedEstimate936,exactPositiveCad936,minimumSlots936,slotFits936,createAvailabilityGate936} from '../assets/booking-terms-v936.mjs';
import {resolveAlaCarte889} from '../functions/api/_lib/ala-carte-v889.js';
import {recommendSmart906} from '../assets/book-smart-v906.mjs';
import {evaluateCapacity738} from '../functions/api/_lib/booking-capacity-v738.js';
test('Smart and guided checkout share existing deposit fallback and exact cent estimates',()=>{
 const p={code:'basic_detail',name:'Basic',prices_cad:{mid:125.11},deposit_cad:0};
 assert.equal(guidedDepositCents936(p),5000);assert.equal(guidedDepositCents936({...p,code:'complete_detail'}),10000);
 const smart=recommendSmart906({goal:'interior',condition:'light',size:'mid',catalog:{packages:[p],addons:[]}});
 assert.equal(smart.deposit_cad,50);assert.deepEqual(guidedEstimate936(p,'mid',[{code:'a',prices_cad:{mid:10.22}},{code:'b',price_cad:99},{code:'a',prices_cad:{mid:10.22}},{code:'c',quote_required:true,prices_cad:{mid:100}}]),{subtotal_cents:13533,deposit_cents:5000,quote_only:true});
 assert.equal(exactPositiveCad936(1.001),false);assert.equal(exactPositiveCad936(1.01),true);
});
test('manual minimum duration uses same server policy and respects full-day occupancy',()=>{
 const p={enabled:true,owner_approved:true,version:'fixture',deposit_cad:25,minimum_duration_slots:2};
 const c={booking_rules:{ala_carte_policy:p},addon_map:{wax:{code:'wax',name:'Wax',standalone_allowed:true,prices_cad:{mid:55}}}};
 const b={booking_mode:'ala_carte',service_codes:['wax'],vehicle_size:'mid',duration_slots:1};
 assert.equal(minimumSlots936(p),2);assert.equal(minimumSlots936({...p,minimum_duration_slots:3}),null);assert.equal(resolveAlaCarte889(c,b).ok,false);assert.equal(resolveAlaCarte889(c,{...b,duration_slots:2}).deposit_cents,2500);
 const date='2027-06-01',cap=evaluateCapacity738({date,nowMs:Date.parse('2027-05-01T12:00Z'),bookings:[{id:'a',status:'pending',start_slot:'AM',duration_slots:1}],requestedStartSlot:'AM',requestedDurationSlots:2});
 const out={ok:true,date,AM:cap.AM,PM:cap.PM,capacity_reconciliation_738:cap};
 assert.equal(slotFits936(out,date,'FULL',true),false);assert.equal(slotFits936(out,date,'PM'),true);assert.equal(slotFits936(out,'2027-06-02','PM'),false);assert.equal(slotFits936({...out,PM:'true'},date,'PM'),false);
});
test('reject stale responses even on same date and slot after area change or repeat request',()=>{
 const g=createAvailabilityGate936(),a={date:'2027-06-01',slot:'AM',area:'Oxford'},b={...a,area:'Norfolk'};
 const x=g.begin(a);assert.equal(g.accept(x,b),false);const y=g.begin(b);assert.equal(g.accept(x,a),false);assert.equal(g.accept(y,b),true);const z=g.begin(b);assert.equal(g.accept(y,b),false);assert.equal(g.accept(z,b),true);
 const manual=readFileSync('assets/ala-carte-booking-v889.js','utf8');assert.match(manual,/before936!==basketKey936\(\)/);assert.match(manual,/availabilityGate936.accept\(ticket,appointment936\(\)\)/);
 const server=readFileSync('functions/api/checkout.js','utf8');assert.match(server,/depositCents = guidedDepositCents936\(pkg\)/);assert.match(server,/new Set\(addonCodes\).size !== addonCodes.length/);assert.match(server,/checkCheckoutCapacity738/);
});
