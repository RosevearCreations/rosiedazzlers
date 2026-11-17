import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize904,revalidate904,project904,MANUAL_WINDOW_MS904} from '../assets/build904-manual-review.mjs';
const book='5fd62295-1f83-4507-bf6f-bd5e1abb9fed';
const exception='166cd852-784d-4244-a793-3dde8d273348';
const draft='e97e48bf-4571-4e48-973f-285edda643ca';
const owner='d7aa9520-5108-441d-bb69-45cd854e5ca0',reviewer='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const profileId='8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce',prefId='73211e69-552e-489a-b9dd-e90481b1a0aa';
const submitId='2a35d74e-f789-4acc-9778-b1be9e9f3463',reviewId='1c9a9fa7-c9e7-4bd6-9d7d-b1f9b79bcd41';
const authorityId='95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a',revokeId='bb884a6f-b5ed-418f-bdd0-cbe304a7f12b';
const booking={id:book,customer_profile_id:profileId};
const profile={id:profileId,notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
 updated_at:'2026-11-17T11:01:00Z',email:'original@example.invalid',phone:'5552223333',sms_phone:'5552223333'};
const preference={id:prefId,customer_profile_id:profileId,recorded_at:'2026-11-17T11:02:00Z',
 service_email:true,service_sms:false,service_phone:false,marketing_email:false,marketing_sms:false,marketing_phone:false};
const report903={booking_id:book,exception_id:exception,owner_current:true,
 owner_staff_user_id:owner,owner_state:'OWNER_VERIFIED',outbox:{id:draft,status:'UNSENT_INTERNAL_DRAFT'}};
const event=(id,time,kind,extra={})=>({id,booking_id:book,exception_id:exception,draft_id:draft,event_kind:kind,
 recorded_at:'2026-11-17T'+time+':00Z',staff_user_id:owner,channel:'email',purpose:'service',
 customer_profile_id:profileId,preference_id:prefId,profile_updated_at:profile.updated_at,note:'Signed original independent consent observation.',...extra});
const submit=event(submitId,'12:00','submit');
const review=event(reviewId,'12:03','review',{related_receipt_id:submitId,decision:'approved',staff_user_id:reviewer});
const authorize=event(authorityId,'12:06','authorize',{related_receipt_id:reviewId});
const revoke=event(revokeId,'12:07','revoke',{related_receipt_id:authorityId,staff_user_id:reviewer});
const view=(receipts904=[],other={})=>project904({
 booking,profile,preference,report903,receipts904,now:'2026-11-17T12:08:00Z',...other});
const req=(action,extra={})=>({action,client_request_id:revokeId,booking_id:book,exception_id:exception,
 note:'Original reviewer source observation.',...extra});

test('source allowlists reject self-approved sends, recipient edits and false consent assertions',()=>{
 assert.equal(normalize904(req('submit',{draft_id:draft,channel:'email'})).ok,true);
 assert.equal(normalize904(req('review',{submission_id:submitId,decision:'approved'})).ok,true);
 assert.equal(normalize904(req('authorize',{review_id:reviewId})).ok,true);
 assert.equal(normalize904(req('revoke',{authority_id:authorityId})).ok,true);
 for(const bad of [
 req('submit',{draft_id:draft,channel:'email',send:true}),
 req('submit',{draft_id:draft,channel:'marketing'}),
 req('submit',{draft_id:draft,channel:'sms',customer_email:'x@example.invalid'}),
 req('review',{submission_id:submitId,decision:'delivered'}),
 req('authorize',{review_id:reviewId,customer_consent_claimed:true}),
 req('authorize',{review_id:reviewId,staff_user_id:owner}),
 req('revoke',{authority_id:'bad-uuid'}),req('send',{review_id:reviewId}),
 req('submit',{draft_id:draft,channel:'email',note:'too short'})
 ])assert.equal(normalize904(bad).ok,false);
});
test('manual consent requires latest explicit service channel preference and current customer profile',()=>{
 const yes=revalidate904({booking,profile,preference,channel:'email'});
 assert.equal(yes.allowed,true);assert.equal(yes.preference_id,prefId);
 assert.equal(revalidate904({booking,profile,preference:{...preference,service_email:false},channel:'email'}).allowed,false);
 assert.equal(revalidate904({booking,profile:{...profile,notification_opt_in:false},preference,channel:'email'}).allowed,false);
 assert.equal(revalidate904({booking,profile:{...profile,archived_at:'2026-11-17T11:00:00Z'},preference,channel:'email'}).allowed,false);
 assert.equal(revalidate904({booking,profile,preference:null,channel:'email'}).allowed,false);
 assert.equal(revalidate904({booking,profile:{...profile,notification_channel:'sms'},preference,channel:'email'}).allowed,false);
 assert.equal(revalidate904({booking,profile,preference,channel:'sms'}).allowed,false);
 assert.equal(revalidate904({booking:{...booking,customer_profile_id:null},profile,preference,channel:'email'}).allowed,false);
});
test('separate reviewer and owner produce only time-limited INTERNAL manual readiness, never a send',()=>{
 const no=view([submit]);assert.equal(no.state,'PENDING_INDEPENDENT_REVIEW');
 const reviewed=view([submit,review]);assert.equal(reviewed.state,'REVIEWED_PENDING_OWNER_AUTHORITY');
 assert.equal(reviewed.review_fresh,true);
 const yes=view([submit,review,authorize]);assert.equal(yes.manual_review_ready,true);
 assert.equal(yes.state,'MANUAL_REVIEW_READY_NO_DELIVERY');
 assert.equal(yes.authority.outbound_send_enabled,false);
 assert.equal(yes.authority.provider_delivery_performed,false);
 assert.equal(yes.authority.customer_contact_executed,false);
 assert.equal(MANUAL_WINDOW_MS904,900000);
 assert.equal(view([submit,review,authorize],{now:'2026-11-17T12:22:00Z'}).manual_review_ready,false);
 assert.equal(view([submit,review,authorize],{now:'2026-11-17T12:08:00Z',report903:{...report903,owner_current:false}}).manual_review_ready,false);
});
test('new consent version, withdrawal, original draft suppression and revocation immediately HOLD readiness',()=>{
 const original=view([submit,review,authorize]);assert.equal(original.manual_review_ready,true);
 const changed={...preference,id:'fad2338a-0ebc-4a32-8c51-3df0affc8a78'};
 const stale=view([submit,review,authorize],{preference:changed});
 assert.equal(stale.manual_review_ready,false);
 assert.equal(stale.state,'MANUAL_AUTHORITY_EXPIRED_OR_STALE_HOLD');
 assert.equal(view([submit,review,authorize],{profile:{...profile,notification_opt_in:false}}).manual_review_ready,false);
 assert.equal(view([submit,review,authorize],{report903:{...report903,outbox:null}}).manual_review_ready,false);
 const revoked=view([submit,review,authorize,revoke]);assert.equal(revoked.state,'MANUAL_AUTHORITY_REVOKED');
 assert.equal(revoked.manual_review_ready,false);
});
test('forged self-approval, mismatched source, independent reviewer impersonation and missing source fail closed',()=>{
 assert.throws(()=>view([submit,{...review,staff_user_id:owner}]),/Untrusted independent reviewer/);
 assert.throws(()=>view([submit,review,{...authorize,staff_user_id:reviewer}]),/Untrusted manual authorization/);
 assert.throws(()=>view([submit,review,{...authorize,booking_id:profileId}]),/Malformed original/);
 assert.throws(()=>view(new Array(180).fill(submit)),/incomplete/);
 assert.throws(()=>project904({booking:null,report903}),/unavailable/);
 assert.throws(()=>view([submit,review,authorize,{...revoke,staff_user_id:profileId}]),/Untrusted manual revocation/);
});
test('migration restricts client grants, locks immutable evidence and forbids actual sends',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261117040000_build904_manual_outbox_review_consent.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/one_submit_per_draft_idx/);
 assert.match(sql,/one_review_per_submit_idx/);
 assert.match(sql,/one_authority_per_review_idx/);
 assert.match(sql,/one_revoke_per_authority_idx/);
 assert.match(sql,/before update or delete/);
 assert.match(sql,/before truncate/);
 assert.match(sql,/check\(not provider_send_enabled\)/);
 assert.match(sql,/check\(not automatic_send_enabled\)/);
 assert.match(sql,/check\(not customer_contact_executed\)/);
 const api=readFileSync(new URL('../functions/api/admin/outbox_manual_review_v904.js',import.meta.url),'utf8');
 assert.match(api,/allowLegacyAdminFallback:false/);
 assert.match(api,/a.auth_mode!=='session'/);
 assert.match(api,/sameOrigin811/);
 assert.match(api,/customer_communication_preference_versions/);
 assert.match(api,/revalidate904/);
 assert.match(api,/report904.review_fresh/);
 assert.match(api,/reviewed.staff_user_id===a.actor.id/);
 assert.match(api,/provider_calls:0/);
 assert.doesNotMatch(api,/method:'PATCH'|method:'DELETE'|api\.stripe\.com|sendSMS|smtp|send_authorized:true/);
 const old=readFileSync(new URL('../functions/api/detailer/job_action.js',import.meta.url),'utf8');
 assert.match(old,/requireJobdayTransition901/);
});
