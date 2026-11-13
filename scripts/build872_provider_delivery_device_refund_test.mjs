import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const js=['assets/admin-booking-v872.js','functions/api/admin/roadside_send_v872.js',
 'functions/api/admin/roadside_field_v872.js','functions/api/roadside_quote_delivery_v872.js'];
for(const file of js)execFileSync('node',['--check',file],{stdio:'pipe'});
const migration=read('supabase/migrations/20261113000500_build872_provider_receipts_refund_review_device.sql');
const send=read(js[1]),field=read(js[2]),webhook=read(js[3]),ui=read(js[0]);
const page=read('admin-booking.html');
assert.equal(page,read('admin-booking/index.html'));
for(const name of ['rd872Send','rd872ConsentSend','rd872NoRetry','rd872ProviderStatus','rd872OpenCase',
 'rd872ReviewHold','rd872CloseCase','rd872OwnerReason','rd872PhysicalDevice',
 'rd872StartDevice','rd872CompleteDevice','rd872OwnerObserved','rd872OwnerPrivateMedia','rd872OwnerAccept'])
 assert(page.includes('id="'+name+'"'),'Missing Rosie 872 staff UI '+name);
assert(page.includes('/assets/admin-booking-v872.js'));
for(const token of ['rosie872_claim_quote_dispatch','rosie872_admit_provider_receipt',
 'rosie872_review_refund_case','for update','contact_permission is distinct from true',
 'quote_share_withdrawn_at is not null','one_open_per_booking','to service_role',
 'revoke all','enable row level security','net_verified is distinct from true',
 "interval '15 minutes'"])
 assert(migration.includes(token),'Missing private database guard '+token);
assert(send.includes('allowLegacyAdminFallback:false')&&send.includes("auth.auth_mode!=='session'"));
assert(send.includes('dispatchNotificationThroughProvider'));
assert(send.includes('confirm_customer_email_delivery'));
assert(send.includes('confirm_one_attempt_no_automatic_retry'));
assert(send.includes('provider_accepted')&&send.includes('dispatch_unknown'));
assert(!send.includes('delivery_confirmed:true'));
assert(webhook.includes('HMAC')&&webhook.includes('crypto.subtle.sign'));
assert(webhook.includes('rosie872_admit_provider_receipt'));
assert(webhook.includes("Math.abs(Math.floor(Date.now()/1000)-Number(timestamp))>300"));
assert(webhook.includes('provider_message_id')&&webhook.includes('receipt_after_withdrawal'));
for(const t of ['open_refund_exception','review_refund_exception','start_device_challenge',
 'complete_device_challenge','owner_accept_device','originalProof','crypto.subtle.verify',
 'public_key_digest','stored_private','Date.parse(m.verified_at)<Date.parse(c.issued_at)',
 'auth.actor?.is_admin!==true','confirm_original_device_observed'])
 assert(field.includes(t),'Missing source-bound refund/device contract '+t);
assert(ui.includes('crypto.subtle.generateKey')&&ui.includes('crypto.subtle.sign'));
assert(ui.includes('/api/admin/detailing_intake_v868')&&ui.includes("state==='owner_accepted'"));
console.log('Rosie 872 provider receipts, non-retry, refund holds, original-browser/owner acceptance PASS');
