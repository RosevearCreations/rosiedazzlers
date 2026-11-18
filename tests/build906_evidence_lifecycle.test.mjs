import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {project906,normalize906,REVIEW_WINDOW_MS906,RETENTION_REVIEW_DAYS906} from '../assets/build906-evidence-lifecycle.mjs';
const id='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',issue='166cd852-784d-4244-a793-3dde8d273348';
const auth='95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a',owner='d7aa9520-5108-441d-bb69-45cd854e5ca0';
const firstReview='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd',third='f90bc928-e1df-425a-9197-391ad79a5108';
const contactId='497dcf8f-7f4b-40b7-a5d8-f598e05f8475',auditId='faba8a8a-c666-40c0-8919-bbbe53e9c2a2';
const r904={booking_id:id,exception_id:issue,authority_id:auth,owner_staff_user_id:owner,
 review_actor_id:firstReview,channel:'email',manual_review_ready:true};
const r905={manual_contact_attestation_id:contactId,independent_staff_reviewed:true,consent_current:true,invalidation_count:0};
const contact={id:contactId,event_kind:'attest_contact',channel:'email',recorded_at:'2026-11-17T12:00:00Z'};
const channels={email:{allowed:true},sms:{allowed:true},phone:{allowed:false}};
const audit={id:auditId,booking_id:id,exception_id:issue,manual_authority_id:auth,
 contact_receipt_id:contactId,staff_user_id:third,channel:'email',
 decision:'corroborated',recorded_at:'2026-11-17T12:10:00Z',internal_only:true,
 provider_delivery_verified:false,automatic_send_enabled:false};
const view=(options={})=>project906({report904:r904,report905:r905,
 receipts905:[contact],reviews906:[],channels,now:'2026-11-17T13:00:00Z',...options});
test('strict source allowlist never accepts recipient, send or provider assertions',()=>{
 const base={action:'review',client_request_id:auditId,booking_id:id,exception_id:issue,authority_id:auth,
  contact_receipt_id:contactId,decision:'hold',note:'Original independent staff observation.'};
 assert.equal(normalize906(base).ok,true);
 for(const x of [{...base,send:true},{...base,decision:'delivered'},{...base,recipient_email:'x@invalid.test'},
  {...base,provider_receipt:'fake'}, {...base,contact_receipt_id:'invalid'},
  {...base,note:'bad'}])assert.equal(normalize906(x).ok,false);
});
test('cross-channel matrix only permits original authorized channel and live explicit consent',()=>{
 const x=view();assert.equal(x.can_corroborate,true);
 assert.equal(x.cross_channel_audit.length,3);
 assert.equal(x.cross_channel_audit.find(c=>c.channel==='email').eligible_for_manual_staff_review,true);
 assert.equal(x.cross_channel_audit.find(c=>c.channel==='sms').eligible_for_manual_staff_review,false);
 assert.equal(x.cross_channel_audit.find(c=>c.channel==='phone').explicit_current_consent,false);
 assert.equal(x.authority.send_enabled,false);assert.equal(x.authority.provider_delivery_verified,false);
 assert.equal(x.authority.customer_contact_proven,false);
});
test('expiry and independent review are time-bound; legacy audit never certifies delivery',()=>{
 assert.equal(REVIEW_WINDOW_MS906,86400000);assert.equal(RETENTION_REVIEW_DAYS906,90);
 const x=view({reviews906:[audit]});
 assert.equal(x.state,'INDEPENDENT_SOURCE_AUDIT_CORROBORATED_NOT_DELIVERED');
 assert.equal(x.can_review,false);
 assert.equal(view({reviews906:[audit],now:'2026-11-18T13:00:01Z'}).state,'PRIOR_AUDIT_STALE_HOLD');
 assert.equal(view({now:'2026-11-18T13:00:01Z'}).state,'REVIEW_WINDOW_EXPIRED_HOLD');
 assert.equal(view({now:'2027-03-01T12:00:00Z'}).retention_review_due,true);
});
test('withdrawn consent, invalidation and third-person custody fail closed',()=>{
 const hold=view({report905:{...r905,consent_current:false},reviews906:[audit]});
 assert.equal(hold.state,'PRIOR_AUDIT_STALE_HOLD');
 assert.equal(view({report905:{...r905,invalidation_count:1}}).can_corroborate,false);
 assert.throws(()=>view({reviews906:[{...audit,staff_user_id:owner}]}),/Untrusted independent/);
 assert.throws(()=>view({reviews906:[{...audit,staff_user_id:firstReview}]}),/Untrusted independent/);
 assert.throws(()=>view({reviews906:[{...audit,channel:'sms'}]}),/Untrusted independent/);
 assert.throws(()=>view({reviews906:new Array(150).fill(audit)}),/incomplete/);
});
test('private append-only schema and signed route preserve NO AUTO-SEND invariant',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261117200000_build906_evidence_lifecycle.sql',import.meta.url),'utf8');
 for(const x of [/enable row level security/,/from public,anon,authenticated,service_role/,/grant select,insert/,
  /before update or delete/,/before truncate/,/check\(not provider_delivery_verified\)/,
  /one_independent_review_per_contact_idx/])assert.match(sql,x);
 const route=readFileSync(new URL('../functions/api/admin/outbox_audit_v906.js',import.meta.url),'utf8');
 for(const x of [/staff904\(request,env\)/,/sameOrigin811/,/revalidate904/,/project906/,
  /Third independent supervisor/,/customer_contact_proven:false/,/provider_calls:0/])assert.match(route,x);
 assert.doesNotMatch(route,/sendSMS|sendMail|method:'DELETE'|method:'PATCH'|smtp|send_authorized:true/);
 const old=readFileSync(new URL('../functions/api/admin/outbox_manual_evidence_v905.js',import.meta.url),'utf8');
 assert.match(old,/reconcile905/);
});
