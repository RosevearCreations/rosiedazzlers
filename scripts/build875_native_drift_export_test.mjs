import assert from 'node:assert/strict';
import {createHmac,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyResendSvix,parseResendNativeDelivery,matchOriginalResendDispatch}
 from '../functions/api/_lib/roadside-native-resend-v875.js';
import {assessRoadsideRefundDrift} from '../functions/api/_lib/roadside-refund-drift-v875.js';
const paths=[
 'functions/api/_lib/roadside-native-resend-v875.js',
 'functions/api/roadside_native_resend_v875.js',
 'functions/api/_lib/roadside-refund-drift-v875.js',
 'functions/api/admin/roadside_refund_drift_v875.js',
 'functions/api/admin/roadside_audit_v871.js',
 'functions/api/admin/roadside_provider_mapping_v874.js',
 'assets/admin-booking-v875.js'];
for(const path of paths)execFileSync('node',['--check',path],{stdio:'pipe'});
const read=p=>readFileSync(p,'utf8');
const admin=read('admin-booking.html');
assert.equal(admin,read('admin-booking/index.html'),'Admin booking mirror must be exact');
for(const s of ['rd875CheckNative','rd875Drift','rd875Refund','rd875CheckClosure','rd875Download',
 '/assets/admin-booking-v875.js'])assert(admin.includes(s),'Missing original owner UI: '+s);
const ui=read('assets/admin-booking-v875.js');
assert(ui.includes('URL.createObjectURL')&&ui.includes('URL.revokeObjectURL'));
assert(ui.includes("e875('rd875Download').disabled=true"));
const signedRoute=read('functions/api/roadside_native_resend_v875.js');
assert(signedRoute.includes("ROSIE_ROADSIDE_NATIVE_PROVIDER!=='resend_svix'"));
assert(signedRoute.indexOf('verifyResendSvix(')<signedRoute.indexOf('const rows=await readRows(env,'));
assert(signedRoute.includes('rosie872_admit_provider_receipt'));
assert(!signedRoute.includes('NOTIFICATIONS_EMAIL_WEBHOOK_URL'));
const driftRoute=read('functions/api/admin/roadside_refund_drift_v875.js');
assert(driftRoute.includes('allowLegacyAdminFallback:false')&&driftRoute.includes("auth.actor?.is_admin!==true"));
assert(driftRoute.includes('refundReadback(env,bookingId)'));
assert(driftRoute.includes('external_notification_sent:false'));
const proofKey=Buffer.alloc(32,0x37),secret='whsec_'+proofKey.toString('base64');
const id='msg_875_original_1234567',timestamp=String(Math.floor(Date.now()/1000));
const native={type:'email.delivered',created_at:new Date().toISOString(),data:{
 email_id:'bd75b8e8-0000-4000-8000-000000000875',to:['Original@example.ca'] }};
const raw=JSON.stringify(native);
const sig=b=>createHmac('sha256',proofKey).update(id+'.'+timestamp+'.'+b).digest('base64');
const headers=new Headers({'svix-id':id,'svix-timestamp':timestamp,
 'svix-signature':'v1,'+sig(raw)});
const good=await verifyResendSvix({secret,headers,rawBody:raw});
assert.equal(good.ok,true);
assert.equal(good.native_event_id,id);
assert.equal((await verifyResendSvix({secret,headers,rawBody:raw+' '})).ok,false);
assert.equal((await verifyResendSvix({secret,headers:{...Object.fromEntries(headers),'svix-timestamp':String(Number(timestamp)-500)},rawBody:raw})).ok,false);
assert.equal((await verifyResendSvix({secret:'whsec_bad',headers,rawBody:raw})).ok,false);
assert.equal((await verifyResendSvix({secret,headers:new Headers(),rawBody:raw})).ok,false);
const mapped=parseResendNativeDelivery(raw);
assert.equal(mapped.ok,true);
assert.equal(mapped.event_type,'delivered');
assert.equal(parseResendNativeDelivery(JSON.stringify({...native,type:'email.opened'})).ok,false);
assert.equal(parseResendNativeDelivery(JSON.stringify({...native,data:{...native.data,to:['a@b.ca','c@d.ca']}})).ok,false);
const recipientHash=createHash('sha256').update('original@example.ca').digest('hex');
const dispatch={id:'00000000-0000-4000-8000-000000000875',
 provider_message_id:native.data.email_id,recipient_hash:recipientHash,
 provider:'email',state:'provider_accepted'};
assert.equal((await matchOriginalResendDispatch(mapped,dispatch)).ok,true);
assert.equal((await matchOriginalResendDispatch(mapped,{...dispatch,recipient_hash:'0'.repeat(64)})).ok,false);
assert.equal((await matchOriginalResendDispatch(mapped,{...dispatch,state:'claimed'})).ok,false);
assert.equal((await matchOriginalResendDispatch(mapped,{...dispatch,provider:'sms'})).ok,false);
const bookingId='00000000-0000-4000-8000-000000000002';
const today=new Date().toISOString();
const snapshot={booking_id:bookingId,checked_at:today,provider:'paypal',source:'paypal_live',
 state:'partial_refund_verified',gross_cents:10000,refunded_cents:2000,net_cents:8000,net_verified:true};
const live={provider:snapshot.provider,source:snapshot.source,state:snapshot.state,
 gross_cents:snapshot.gross_cents,refunded_cents:snapshot.refunded_cents,
 net_cents:snapshot.net_cents,net_verified:true};
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot,live}).state,'SOURCE_STABLE');
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot,live:{...live,refunded_cents:3000,net_cents:7000}}).state,'REFUND_COMPLETENESS_DRIFT');
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot,live:{net_verified:false,reason:'provider timeout'}}).state,'PROVIDER_SOURCE_HOLD');
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot:{...snapshot,checked_at:new Date(Date.now()-16*60000).toISOString()},live}).state,'STALE_SOURCE_BASELINE');
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot:null,live}).state,'BASELINE_MISSING');
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot:{...snapshot,booking_id:'wrong'},live}).state,'BOOKING_ID_MISMATCH');
assert.equal(assessRoadsideRefundDrift({bookingId,snapshot,live:{...live,net_cents:6000}}).state,'PROVIDER_SOURCE_HOLD');
console.log('Rosie 875 native HMAC, original identity, drift and owner export UI: PASS');
