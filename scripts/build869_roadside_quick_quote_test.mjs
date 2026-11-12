import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const api=read('functions/api/admin/detailing_intake_v869.js');
const captureApi=read('functions/api/admin/detailing_intake_v868.js');
const captureUi=read('assets/admin-booking-v868.js');
const quoteUi=read('assets/admin-booking-v869.js');
const page=read('admin-booking.html');
const mirror=read('admin-booking/index.html');
const ddl=read('supabase/migrations/20261113000200_build869_quick_quote_media_budget.sql');
for(const [path] of [['functions/api/admin/detailing_intake_v869.js'],
 ['functions/api/admin/detailing_intake_v868.js'],
 ['assets/admin-booking-v868.js'],['assets/admin-booking-v869.js']]){
 execFileSync('node',['--check',path],{stdio:'pipe'});
}
assert.equal(page,mirror,'Mirrored staff booking routes must remain byte-identical');
assert(page.indexOf('id="newDetailingRequest"')<page.indexOf('data-banner'),
 'Photo-first workflow must appear before the large hero/banner');
for(const id of ['rdPrivatePhotoConsent','rdQuickName','rdQuickPhone','rdQuickEmail',
 'rdContactPermission','rdQuickQuote','rdQuotePanel','rdSaveQuickQuote',
 'rdOpenCanonicalBooking','rdLinkCanonicalBooking','rdLinkedBookingId',
 'rdQuotaStatus','rdQuotaProgress','rdQuoteReviewState'])
 assert(page.includes('id="'+id+'"'),'Missing roadside control: '+id);
assert(page.includes('href="/book"'),'Booking handoff must use canonical booking route');
assert(page.includes('/assets/admin-booking-v869.js'),'Quote review script not wired');
assert(!page.includes('id="rdPrivatePhotoConsent" checked'),
 'Photo permission can never be prechecked');
for(const guard of ["capability:'manage_bookings'","allowLegacyAdminFallback:false",
 "access.auth_mode!=='session'","action==='save_quick_quote'",
 "action==='link_existing_booking'","action==='confirm_private_photo_permission'",
 "confirm_canonical_checkout_completed","acknowledge_deposit_not_verified_here",
 "contact_permission","quote_cents","rpc/rosie869_storage_meter",
 "rpc/rosie869_link_existing_booking","deposit_collected:false",
 'pricing_and_deposit_from_canonical_checkout:true'])
 assert(api.includes(guard),'Missing original server boundary: '+guard);
assert(!api.includes('/api/checkout'),'Quote review must not charge through API');
assert(!api.includes('stripe.paymentIntents.create'),'Draft never captures payment');
for(const term of ['rosie869_reserve_media','pg_advisory_xact_lock',
 'private_photo_permission','DRAFT_MEDIA_LIMIT_HOLD','STORAGE_BUDGET_HOLD',
 'rosie869_link_existing_booking','lower(trim(b.customer_email))',
 "quote_review_state='booking_linked'",'public.bookings',
 'revoke all','to service_role','security invoker',
 'rosie869_one_intake_per_booking','rosie869_contact_shape'])
 assert(ddl.includes(term),'Missing atomic private storage/booking safety: '+term);
for(const term of ["action==='sign_upload'","current.private_photo_permission!==true",
 'rpc/rosie869_reserve_media',"status:'pending_upload'",
 "action==='confirm_upload'","action==='preview_private'"])
 assert(captureApi.includes(term),'Existing 868 upload safety changed: '+term);
for(const term of ['compressForRoadside','createImageBitmap','canvas.toBlob',
 'new File([jpg]','authorizePrivateCapture','await create()',
 'confirm_private_photo_permission','rosie:intake-selected','rosie:intake-media-updated',
 'sessionStorage'])
 assert(captureUi.includes(term),'Missing quick-capture compress/consent/resume: '+term);
for(const term of ["write('save_quick_quote'","write('link_existing_booking'",
 'storageView','rdSaveQuickQuote','rdLinkedBookingId',
 "href="/book"".replace('href="','')].filter(x=>x!=='/book"'))
 assert(quoteUi.includes(term),'Missing quote/handoff UI behavior: '+term);
assert(!quoteUi.includes('deposit_collected:true'),
 'No intake path may assert payment confirmed');
console.log('Rosie 869 roadside photo compression, private storage budget, quote and safe canonical booking handoff PASS');
