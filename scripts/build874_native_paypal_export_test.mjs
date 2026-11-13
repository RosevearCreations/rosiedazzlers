import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {assessPaypalPartialRefundLedger} from '../functions/api/_lib/roadside-paypal-refund-v874.js';
import {mapNativeRoadsideProviderEvent,checkNativeMappingAgainstDispatch} from '../functions/api/_lib/roadside-native-mapping-v874.js';
const files=['functions/api/_lib/roadside-paypal-refund-v874.js',
 'functions/api/_lib/roadside-native-mapping-v874.js',
 'functions/api/admin/roadside_audit_v871.js',
 'functions/api/admin/roadside_provider_mapping_v874.js',
 'functions/api/admin/roadside_closure_export_v874.js'];
for(const path of files)execFileSync('node',['--check',path],{stdio:'pipe'});
const bookingId='00000000-0000-4000-8000-000000000001';
const dispatchId='00000000-0000-4000-8000-000000000002';
const captureId='9ABCD123456789012';
const refundId='RFUND9ABC12345678';
const money=n=>({currency_code:'CAD',value:n});
const seller={total_refunded_amount:money('20.00')};
const order={purchase_units:[{reference_id:bookingId,custom_id:bookingId,
 payments:{captures:[{id:captureId,status:'PARTIALLY_REFUNDED',seller_receivable_breakdown:seller}]}}]};
const capture={id:captureId,status:'PARTIALLY_REFUNDED',amount:money('100.00'),
 seller_receivable_breakdown:seller};
const row={booking_id:bookingId,provider:'paypal',provider_refund_id:refundId,
 refund_amount_cents:2000,currency:'CAD'};
const live={id:refundId,status:'COMPLETED',amount:money('20.00'),
 links:[{rel:'up',method:'GET',href:'https://api-m.paypal.com/v2/payments/captures/'+captureId}]};
const input={order,capture,bookingId,captureId,expectedCents:10000,
 refundRows:[row],liveRefunds:[live]};
const assess=x=>assessPaypalPartialRefundLedger(x);
assert.deepEqual([assess(input).state,assess(input).refunded_cents,assess(input).net_cents],
 ['partial_refund_verified',2000,8000]);
const hold=x=>assert.equal(assess(x).net_verified,false);
hold({...input,capture:{...capture,seller_receivable_breakdown:null},order:{
 purchase_units:[{...order.purchase_units[0],payments:{captures:[{id:captureId,status:'PARTIALLY_REFUNDED'}]}}]}});
hold({...input,refundRows:[]});
hold({...input,refundRows:[row,row],liveRefunds:[live,live]});
hold({...input,capture:{...capture,seller_receivable_breakdown:{total_refunded_amount:money('30.00')}}});
hold({...input,liveRefunds:[{...live,status:'PENDING'}]});
hold({...input,liveRefunds:[{...live,amount:money('22.00')}]});
hold({...input,liveRefunds:[{...live,links:[]}]});
hold({...input,refundRows:[{...row,booking_id:'00000000-0000-4000-8000-000000000099'}]});
hold({...input,capture:{...capture,status:'FAILED'}});
const event={id:'event0001',type:'email.delivered',
 data:{message_id:'message0001',metadata:{quote_dispatch_id:dispatchId}}};
assert.equal(mapNativeRoadsideProviderEvent(event).canonical.dispatch_id,dispatchId);
assert.equal(checkNativeMappingAgainstDispatch(event,{id:dispatchId,provider_message_id:'message0001',state:'provider_accepted'}).ok,true);
assert.equal(checkNativeMappingAgainstDispatch(event,{id:dispatchId,provider_message_id:'other0001',state:'provider_accepted'}).ok,false);
assert.equal(mapNativeRoadsideProviderEvent({...event,type:'email.opened'}).ok,false);
const read=x=>readFileSync(x,'utf8');
const audit=read('functions/api/admin/roadside_audit_v871.js');
const mapper=read('functions/api/admin/roadside_provider_mapping_v874.js');
const exportApi=read('functions/api/admin/roadside_closure_export_v874.js');
assert(audit.includes('assessPaypalPartialRefundLedger')&&audit.includes('/v2/payments/refunds/'));
assert(mapper.includes('allowLegacyAdminFallback:false')&&mapper.includes('dry_run_only:true'));
assert(!mapper.includes('rosie872_admit_provider_receipt'));
assert(exportApi.includes('allowLegacyAdminFallback:false')&&exportApi.includes('SHA-256'));
assert(exportApi.includes('Content-Disposition')&&exportApi.includes('closure.id')===false);
console.log('Rosie 874: PayPal refund ledger, native dry run, private export contracts PASSED');
