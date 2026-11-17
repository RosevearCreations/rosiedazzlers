import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize905,reconcile905,withinManualAuthority905} from '../assets/build905-outbox-evidence.mjs';
const booking='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',issue='166cd852-784d-4244-a793-3dde8d273348';
const authority='95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a',owner='d7aa9520-5108-441d-bb69-45cd854e5ca0';
const supervisor='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const contactId='497dcf8f-7f4b-40b7-a5d8-f598e05f8475',reviewId='faba8a8a-c666-40c0-8919-bbbe53e9c2a2';
const r904={booking_id:booking,exception_id:issue,authority_id:authority,manual_review_ready:true,
 owner_staff_user_id:owner,channel:'phone',consent:{allowed:true}};
const req=(action,extra={})=>({action,client_request_id:reviewId,booking_id:booking,exception_id:issue,
 authority_id:authority,note:'Original signed source evidence.',...extra});
const row=(event_kind,extra={})=>({
 id:event_kind==='attest_contact'?contactId:reviewId,booking_id:booking,exception_id:issue,
 manual_authority_id:authority,staff_user_id:owner,event_kind,channel:'phone',
 internal_only:true,provider_delivery_claimed:false,automatic_send_enabled:false,
 recorded_at:'2026-11-17T12:06:00Z',...extra
});
test('strict request allowlist rejects direct sends, forged provider receipts and injected PII',()=>{
 assert.equal(normalize905(req('invalidate')).ok,true);
 assert.equal(normalize905(req('attest_contact',{channel:'phone',occurred_at:'2026-11-17T12:04:00Z',
  outcome:'reached',evidence_basis:'call_log',evidence_reference:'LOG-REF-1234'})).ok,true);
 assert.equal(normalize905(req('verify_contact',{contact_receipt_id:contactId,decision:'corroborated',evidence_basis:'call_log'})).ok,true);
 for(const x of [
  req('send'),req('invalidate',{force:true}),req('invalidate',{contacted:true}),
  req('attest_contact',{channel:'phone',occurred_at:'2026-11-17T12:04:00Z',
   outcome:'reached',evidence_basis:'call_log',evidence_reference:'someone@example.invalid'}),
  req('verify_contact',{contact_receipt_id:contactId,decision:'delivered',evidence_basis:'call_log'}),
  req('verify_contact',{contact_receipt_id:contactId,decision:'corroborated',evidence_basis:'call_log',provider_receipt:'fake'}),
  req('invalidate',{note:'short'})
 ])assert.equal(normalize905(x).ok,false);
});
test('original authority times exclude stale, future, or pre-authority contact reports',()=>{
 const a={recorded_at:'2026-11-17T12:00:00Z'};
 assert.equal(withinManualAuthority905({authority:a,occurred_at:'2026-11-17T12:05:00Z',now:'2026-11-17T12:07:00Z'}),true);
 assert.equal(withinManualAuthority905({authority:a,occurred_at:'2026-11-17T11:59:00Z',now:'2026-11-17T12:07:00Z'}),false);
 assert.equal(withinManualAuthority905({authority:a,occurred_at:'2026-11-17T12:16:00Z',now:'2026-11-17T12:17:00Z'}),false);
 assert.equal(withinManualAuthority905({authority:a,occurred_at:'2026-11-17T12:09:00Z',now:'2026-11-17T12:07:00Z'}),false);
});
test('current 904 source and independent supervisor create reviewed attestation, never provider delivery proof',()=>{
 const contact=row('attest_contact',{id:contactId,occurred_at:'2026-11-17T12:04:00Z',evidence_basis:'call_log'});
 const review=row('verify_contact',{related_contact_id:contactId,staff_user_id:supervisor,evidence_basis:'call_log',decision:'corroborated'});
 const pending=reconcile905({report904:r904,receipts905:[contact]});
 assert.equal(pending.state,'MANUAL_CONTACT_ATTESTED_PENDING_REVIEW');
 assert.equal(pending.can_record_manual_contact,false);
 const checked=reconcile905({report904:r904,receipts905:[review,contact]});
 assert.equal(checked.independent_staff_reviewed,true);
 assert.equal(checked.authority.delivery_verified,false);
 assert.equal(checked.authority.customer_contact_proven,false);
 assert.equal(checked.authority.automatic_send,false);
});
test('withdrawn consent or signed invalidation immediately HOLD and preserves historical attestation',()=>{
 const contact=row('attest_contact',{id:contactId,occurred_at:'2026-11-17T12:04:00Z',evidence_basis:'call_log'});
 const stale=reconcile905({report904:{...r904,manual_review_ready:false,consent:{allowed:false}},receipts905:[contact]});
 assert.equal(stale.state,'CONSENT_OR_AUTHORITY_HOLD');
 const invalid=row('invalidate',{id:reviewId,channel:null});
 const withdrawn=reconcile905({report904:r904,receipts905:[contact,invalid]});
 assert.equal(withdrawn.can_record_manual_contact,false);
 assert.equal(withdrawn.state,'CONSENT_OR_AUTHORITY_HOLD');
 assert.equal(withdrawn.invalidation_count,1);
});
test('untrusted review, forged owner and incomplete evidence fail closed',()=>{
 const c=row('attest_contact',{id:contactId,occurred_at:'2026-11-17T12:04:00Z',evidence_basis:'call_log'});
 const review=row('verify_contact',{related_contact_id:contactId,staff_user_id:owner,evidence_basis:'call_log',decision:'corroborated'});
 assert.throws(()=>reconcile905({report904:r904,receipts905:[c,review]}),/Untrusted independent/);
 assert.throws(()=>reconcile905({report904:r904,receipts905:[{...c,staff_user_id:supervisor}]}),/Untrusted original/);
 assert.throws(()=>reconcile905({report904:r904,receipts905:new Array(160).fill(c)}),/incomplete/);
});
test('migration and API preserve signed source, immutability, NO AUTO-SEND and NO delivery claim',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261117050000_build905_outbox_invalidation_manual_evidence.sql',import.meta.url),'utf8');
 for(const pattern of [/enable row level security/,/from public,anon,authenticated/,/to service_role/,/before update or delete/,
  /before truncate/,/check\(not automatic_send_enabled\)/,/check\(not provider_delivery_claimed\)/,
  /one_attestation_per_authority_idx/,/one_review_per_attestation_idx/])assert.match(sql,pattern);
 const api=readFileSync(new URL('../functions/api/admin/outbox_manual_evidence_v905.js',import.meta.url),'utf8');
 for(const pattern of [/staff904\(request,env\)/,/sameOrigin811/,/source904\(env,booking\)/,
  /report\.can_record_manual_contact/,/actor!==r\.review_actor_id/,/withinManualAuthority905/,
  /customer_contact_proven:false/,/provider_calls:0/])assert.match(api,pattern);
 assert.doesNotMatch(api,/sendSMS|sendMail|api\.stripe|smtp|send_authorized:true|method:'PATCH'|method:'DELETE'/);
 const previous=readFileSync(new URL('../functions/api/admin/outbox_manual_review_v904.js',import.meta.url),'utf8');
 assert.match(previous,/staff as staff904/);
 assert.match(previous,/revalidate904/);
});
