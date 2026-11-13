import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {eligibleWatch880,chainWindow880,graceExpiry880}
 from '../functions/api/_lib/roadside-history-v880.js';
const read=p=>readFileSync(p,'utf8');
const files=['functions/api/_lib/roadside-history-v880.js',
 'functions/api/admin/roadside_history_v880.js',
 'functions/api/admin/roadside_watch_append_v880.js',
 'functions/api/admin/roadside_rotation_receipt_v880.js',
 'assets/admin-booking-v880.js'];
for(const path of files)execFileSync('node',['--check',path],{stdio:'pipe'});
const id='00000000-0000-4000-8000-000000000880',t=Date.now();
const watch={ok:true,delivery_watch:{verified:true,state:'ORIGINAL_DELIVERY_CURRENT_SNAPSHOT',
 source_chain_sha256:'a'.repeat(64),latest_original_signed_event_at:new Date(t-1000).toISOString()},
 owner_sla_renewal:{state:'CURRENT_SOURCE_ACKNOWLEDGED',source_check_id:id}};
assert.equal(eligibleWatch880(watch).verified,true);
assert.equal(eligibleWatch880({...watch,delivery_watch:{...watch.delivery_watch,verified:false}}).verified,false);
assert.equal(eligibleWatch880({...watch,owner_sla_renewal:{state:'OWNER_SLA_RENEWAL_HOLD'}}).verified,true);
assert.equal(eligibleWatch880({...watch,owner_sla_renewal:{state:'OWNER_SLA_RENEWAL_HOLD'}}).source_check_id,null);
assert.equal(eligibleWatch880({...watch,owner_sla_renewal:{state:'UNEXPECTED'}}).verified,false);
assert.equal(eligibleWatch880({...watch,owner_sla_renewal:{state:'OWNER_SLA_RENEWAL_REQUIRED',source_check_id:id}}).verified,true);
const older={id:'old',observed_at:new Date(t-10000).toISOString(),
 entry_sha256:'b'.repeat(64),previous_entry_sha256:null};
const newer={id:'new',observed_at:new Date(t).toISOString(),
 entry_sha256:'c'.repeat(64),previous_entry_sha256:'b'.repeat(64)};
assert.equal(chainWindow880([newer,older],'watch').verified,true);
assert.equal(chainWindow880([newer,{...older,entry_sha256:'f'.repeat(64)}],'watch').verified,false);
assert.equal(chainWindow880([newer,newer],'watch').verified,false);
const rotation=[{id:'r1',observed_at:new Date(t-5000).toISOString(),
 receipt_sha256:'d'.repeat(64),previous_receipt_sha256:null}];
assert.equal(chainWindow880(rotation,'rotation').verified,true);
const prev='ed25519-sha256:older',active='ed25519-sha256:next';
const expiry=new Date(t+3600000).toISOString();
const receipt={id:'r1',observed_at:new Date(t).toISOString(),
 previous_issuer_key_id:prev,active_issuer_key_id:active,grace_verify_until:expiry};
const roster={ok:true,rows:[{issuer_id:prev,status:'previous',verify_until:expiry},
 {issuer_id:active,status:'active'}]};
assert.equal(graceExpiry880({receipts:[receipt],roster,nowMs:t}).state,'OWNER_GRACE_REVIEW_REQUIRED');
assert.equal(graceExpiry880({receipts:[receipt],roster,nowMs:t+7200000}).receipts[0].state,'GRACE_EXPIRED');
assert.equal(graceExpiry880({receipts:[{...receipt,grace_verify_until:expiry.replace('Z','+00:00')}],roster,nowMs:t}).receipts[0].state,'GRACE_EXPIRING_7_DAYS');
assert.equal(graceExpiry880({receipts:[receipt],roster:{ok:false},nowMs:t}).verified,false);
assert.equal(graceExpiry880({receipts:[receipt],roster:{ok:true,rows:[roster.rows[1]]},nowMs:t}).receipts[0].state,
 'HISTORICAL_PIN_REMOVED_HOLD');
const html=read('admin-booking.html');
assert.equal(html,read('admin-booking/index.html'));
for(const key of ['rd880Capture','rd880History','rd880Receipt','rd880HistoryResult',
 'rd880GraceResult','rd880CaptureResult','rd880ReceiptResult',
 '/assets/admin-booking-v880.js'])assert(html.includes(key),'Missing owner UI '+key);
const sql=read('supabase/migrations/20261113195500_build880_original_watch_rotation_history.sql');
assert(sql.includes('enable row level security'));
assert(sql.includes('revoke all on public.rosie_roadside_native_watch_v880 from public,anon,authenticated'));
assert(sql.includes('revoke all on public.rosie_roadside_rotation_receipts_v880 from public,anon,authenticated'));
assert(sql.includes('before update or delete'));
assert(sql.includes('security invoker'));
assert(sql.includes('pg_advisory_xact_lock'));
assert(sql.includes('rosie880_append_native_watch'));
assert(sql.includes('rosie880_append_rotation_receipt'));
const one=read('functions/api/admin/roadside_watch_append_v880.js');
const two=read('functions/api/admin/roadside_rotation_receipt_v880.js');
const history=read('functions/api/admin/roadside_history_v880.js');
for(const s of [one,two,history])assert(s.includes('allowLegacyAdminFallback:false'));
for(const s of [one,two])assert(s.includes("request.headers.get('Origin')"));
assert(one.indexOf('watchOriginal({')<one.indexOf('rosie880_append_native_watch'));
assert(two.indexOf('verifyRotation({')<two.indexOf('rosie880_append_rotation_receipt'));
assert(!two.includes('writeCloudflare')&&!two.includes('rotateSecret'));
console.log('Rosie 880 original immutable watch custody, rotation receipts and issuer grace monitoring: PASS');
