import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const api=read('functions/api/admin/roadside_share_v870.js');
const pub=read('functions/api/roadside_quote_v870.js');
const ui=read('assets/admin-booking-v870.js');
const client=read('assets/roadside-quote-v870.js');
const page=read('admin-booking.html');
const ddl=read('supabase/migrations/20261113000300_build870_roadside_quote_sharing.sql');
for(const p of ['functions/api/admin/roadside_share_v870.js',
 'functions/api/roadside_quote_v870.js','assets/admin-booking-v870.js',
 'assets/roadside-quote-v870.js'])
 execFileSync('node',['--check',p],{stdio:'pipe'});
assert.equal(page,read('admin-booking/index.html'),'Staff booking mirrors must be identical');
for(const id of ['rdShareConsent870','rdShareDelivery870','rdSharePackage870',
 'rdShareSize870','rdCreateShare870','rdShareUrl870','rdCopyShare870',
 'rdRevokeShare870','rdReconcileDeposit870','rdDepositStatus870'])
 assert(page.includes('id="'+id+'"'),'Missing staff control '+id);
assert(page.includes('/assets/admin-booking-v870.js'));
assert(!page.includes('id="rdShareConsent870" checked'));
assert(!page.includes('id="rdShareDelivery870" checked'));
for(const term of ['allowLegacyAdminFallback:false',"auth.auth_mode!=='session'",
 'confirm_customer_quote_sharing','confirm_customer_receive_link',
 'draft.contact_permission!==true','draft.customer_email','crypto.getRandomValues',
 "sha256(value)","share_url:link","action==='revoke'","action==='reconcile'",
 'verifyCanonicalBooking','stripe_payment_intent_id','paypal_capture_id',
 'verdict.payment_verified===true','verdict.booking_confirmed===true',
 'no_booking_or_payment_mutation:true'])
 assert(api.includes(term),'Missing staff consent/provider guard '+term);
for(const term of ['token_hash','revoke','enable row level security',
 'revoke all','to service_role','quote_snapshot_cents','consent_recorded_at',
 'rosie_roadside_deposit_checks_v870'])
 assert(ddl.includes(term),'Missing private data guard '+term);
assert(pub.includes('d.quote_cents!==s.quote_snapshot_cents'),
 'Published quote must fail closed when amount changes');
assert(pub.includes('d.contact_permission!==true'),
 'Consent withdrawal must invalidate public quote');
for(const term of ['booking_confirmed:false','deposit_verified:false',
 'photos_public:false','package_code','vehicle_size'])
 assert(pub.includes(term),'Missing private public projection '+term);
assert(!pub.includes('customer_email')&&!pub.includes('object_path')&&
 !pub.includes('preview_private'),'Never expose customer data/media to public link');
assert(client.includes("new URLSearchParams(location.hash.slice(1))"));
assert(client.includes("history.replaceState(null,'',location.pathname)"));
assert(client.includes("referrerPolicy:'no-referrer'"));
assert(ui.includes('navigator.clipboard.writeText')&&
 ui.includes("action:'reconcile'"));
const html=read('roadside-quote.html');
assert(html.includes('noindex,nofollow,noarchive'));
assert(html.includes('no-referrer'));
assert(html.includes('/assets/roadside-quote-v870.js'));
assert(html.includes('id="rdBookLink"'));
assert(!api.includes("status:'confirmed'")&&!api.includes('payment_status:"paid"'),
 'Reconciliation cannot mutate checkout/booking paid state');
console.log('Rosie 870 consent-scoped link, safe booking prefill and original provider deposit guard PASS');
