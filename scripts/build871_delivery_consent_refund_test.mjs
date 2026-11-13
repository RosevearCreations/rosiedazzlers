import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assessStripeRefunds,assessPaypalCapture} from '../functions/api/_lib/roadside-refund-871.js';
const read=x=>readFileSync(x,'utf8');
for(const x of ['functions/api/admin/roadside_audit_v871.js','functions/api/_lib/roadside-refund-871.js',
 'functions/api/admin/roadside_share_v870.js','functions/api/roadside_quote_v870.js',
 'assets/admin-booking-v870.js','assets/admin-booking-v871.js'])
 execFileSync('node',['--check',x],{stdio:'pipe'});
const api=read('functions/api/admin/roadside_audit_v871.js');
const orig=read('functions/api/admin/roadside_share_v870.js');
const pub=read('functions/api/roadside_quote_v870.js');
const ui=read('assets/admin-booking-v871.js');
const ddl=read('supabase/migrations/20261113000400_build871_delivery_withdrawal_refund_audit.sql');
const page=read('admin-booking.html');
assert.equal(page,read('admin-booking/index.html'),'Admin booking mirror changed');
for(const t of ['rd871Channel','rd871EventType','rd871ConfirmDelivery','rd871LogDelivery',
 'rd871ConfirmWithdraw','rd871ConfirmRevoke','rd871StopCapture',
 'rd871WithdrawConsent','rd871Reconcile','rd871NetStatus','rd871AuditTrail'])
 assert(page.includes('id="'+t+'"'),'Missing staff workflow '+t);
assert(page.includes('/assets/admin-booking-v871.js'));
assert(!page.includes('id="rd871ConfirmWithdraw" checked'));
for(const t of ["allowLegacyAdminFallback:false","access.auth_mode!=='session'",
 "action==='record_delivery'","confirm_staff_witnessed_event",
 "action==='withdraw_consent'","confirm_customer_withdrawal_request",
 "confirm_revoke_all_quote_links","rpc/rosie871_record_quote_delivery",
 "rpc/rosie871_withdraw_quote_consent","action==='reconcile_net_deposit'",
 "assessStripeRefunds","assessPaypalCapture","verifyCanonicalBooking",
 "quote_share_withdrawn_at","no_booking_or_payment_mutation:true"])
 assert(api.includes(t),'Missing staff authority '+t);
for(const t of ['rosie871_protect_withdrawn_consent','quote_share_withdrawn_at',
 'rosie871_issue_roadside_share','rosie871_record_quote_delivery',
 'rosie871_withdraw_quote_consent','for update','contact_permission=false',
 'customer_name=null,customer_email=null,customer_phone=null',
 'revoked_at=t','enable row level security',
 'revoke all','to service_role','net_verified','net_cents is null'])
 assert(ddl.includes(t),'Missing original atomic DB guard '+t);
assert(orig.includes('rpc/rosie871_issue_roadside_share'));
assert(orig.includes("if(draft.quote_share_withdrawn_at)"));
assert(pub.includes("d.quote_share_withdrawn_at"));
assert(ui.includes("action:'withdraw_consent'")&&ui.includes("action:'reconcile_net_deposit'"));
const session={amount_total:5000,currency:'cad',payment_status:'paid'};
const pi='pi_test',charge={id:'ch_1',paid:true,status:'succeeded',payment_intent:pi,
 amount:5000,amount_refunded:0,currency:'cad'};
const list=data=>({object:'list',has_more:false,data});
const stripe=(c,r)=>assessStripeRefunds({session,charges:list([c]),refunds:list(r),paymentIntentId:pi});
let verified=stripe(charge,[]);
assert.equal(verified.state,'net_deposit_intact');
assert.equal(verified.net_cents,5000);
const refund={id:'re_1',charge:'ch_1',payment_intent:pi,amount:2000,currency:'cad',status:'succeeded'};
verified=stripe({...charge,amount_refunded:2000},[refund]);
assert.equal(verified.state,'partial_refund_verified');
assert.equal(verified.net_cents,3000);
verified=stripe({...charge,amount_refunded:5000},[{...refund,amount:5000}]);
assert.equal(verified.state,'full_refund_verified');
assert.equal(verified.net_cents,0);
assert.equal(stripe({...charge,amount_refunded:2000},[{...refund,status:'pending'}]).net_verified,false);
assert.equal(stripe({...charge,amount_refunded:2500},[refund]).net_verified,false);
assert.equal(assessStripeRefunds({session,charges:{...list([charge]),has_more:true},
 refunds:list([]),paymentIntentId:pi}).net_verified,false);
const bookingId='booking_123',captureId='CAPTURE_1';
const order={purchase_units:[{reference_id:bookingId,custom_id:bookingId,
 payments:{captures:[{id:captureId}]}}]};
const capture={id:captureId,amount:{value:'50.00',currency_code:'CAD'},status:'COMPLETED'};
const paypal=(status,other={})=>assessPaypalCapture({order,capture:{...capture,status,...other},
 bookingId,captureId,expectedCents:5000});
assert.equal(paypal('COMPLETED').net_cents,5000);
assert.equal(paypal('REFUNDED').net_cents,0);
assert.equal(paypal('PARTIALLY_REFUNDED').net_verified,false);
assert.equal(paypal('PENDING').net_verified,false);
assert.equal(paypal('COMPLETED',{amount:{value:'40.00',currency_code:'CAD'}}).net_verified,false);
assert.equal(assessPaypalCapture({order:{purchase_units:[]},capture,bookingId,captureId,
 expectedCents:5000}).net_verified,false);
console.log('Rosie 871 manual delivery, permanent consent withdrawal, private audit and refund-aware original payment guard PASS');
