import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const api=read('functions/api/admin/detailing_intake_v868.js');
const ui=read('assets/admin-booking-v868.js');
const html=read('admin-booking.html');
const ddl=read('supabase/migrations/20261113000100_build868_camera_first_private_intake.sql');
for(const str of ['manage_bookings','allowLegacyAdminFallback:false',
 "access.auth_mode!=='session'","action==='create'","action==='save'",
 "action==='sign_upload'","action==='confirm_upload'",
 "action==='preview_private'",'pending_upload','stored_private',
 'booking_created:false','appointment_reserved:false',
 'MAX','maximum_assets_per_draft:8'].filter(x=>x!=='MAX'))
 assert(api.includes(str),'Missing original staff-only intake contract '+str);
assert(!api.includes('/rest/v1/bookings'),'A camera draft cannot create a booking');
assert(!api.includes('/api/checkout'),'A camera draft cannot charge');
assert(!api.includes('object/public/'),'A camera draft cannot publish media');
assert(api.includes('object/info/'),'Upload confirmation must check actual stored object');
assert(api.includes('new URL(uploadUrl).origin!==origin'),'Private upload must be same-origin Supabase');
for(const id of ['rdTakePhotos','rdTakeVideo','rdSelectMedia','rdCreateIntake',
 'rdIntakeLabel','rdIntakeNotes','rdIntakeId','rdSavedIntakes',
 'rdPhotoCapture','rdVideoCapture','rdSaveIntake','rdIntakeMedia'])
 assert(html.includes('id="'+id+'"'), 'Missing New Booking element '+id);
assert(html.includes('capture="environment"'),'Mobile camera capture mode absent');
assert(html.includes('/assets/admin-booking-v868.js'),'New Booking script not wired');
for(const s of ["call('create')","call('sign_upload'","call('confirm_upload'",
 "call('save'","call('preview_private'","await create()","listSaved()"])
 assert(ui.includes(s),'Missing camera-first saving/resume behaviour: '+s);
for(const s of ['enable row level security','revoke all','to service_role',
 'rosie-intake-private','false,41943040','intake_draft',
 'pending_upload','stored_private'])
 assert(ddl.includes(s),'Missing private draft and bucket safeguard '+s);
assert(!ddl.includes('grant select on public.rosie_detailing_intake_v868 to anon'));
console.log('Rosie 868 private staff draft, capture, storage, resume and booking/payment separation PASS');
