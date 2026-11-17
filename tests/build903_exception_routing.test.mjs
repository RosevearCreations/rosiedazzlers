import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize903,project903} from '../assets/build903-exception-routing.mjs';
const book='5fd62295-1f83-4507-bf6f-bd5e1abb9fed';
const issue='166cd852-784d-4244-a793-3dde8d273348';
const supervisor='e97e48bf-4571-4e48-973f-285edda643ca';
const recipient='d7aa9520-5108-441d-bb69-45cd854e5ca0';
const ids=['0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd','8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce',
'73211e69-552e-489a-b9dd-e90481b1a0aa','2a35d74e-f789-4acc-9778-b1be9e9f3463',
'1c9a9fa7-c9e7-4bd6-9d7d-b1f9b79bcd41','95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a',
'bb884a6f-b5ed-418f-bdd0-cbe304a7f12b'];
const exception={id:issue,booking_id:book,open:true,subject:'worksite',sla_state:'OVERDUE',
 due_at:'2026-11-17T10:15:00Z',
 handoff:{verified:true,recipient_staff_user_id:supervisor,offer_id:ids[6]}};
const source=(receipts903=[],ex=exception)=>project903({booking_id:book,exception:ex,receipts903,now:'2026-11-17T12:00:00Z'});
const stamp=h=>'2026-11-17T'+String(h).padStart(2,'0')+':00:00Z';
const row=(id,h,kind,more={})=>({id,recorded_at:stamp(h),booking_id:book,exception_id:issue,
 event_kind:kind,staff_user_id:supervisor,note:'Signed original supervisor observation.',...more});
const claim=row(ids[0],10,'claim',{handoff_ack_id:ids[6]});
const route=row(ids[1],11,'route',{recipient_staff_user_id:recipient});
const accepted=row(ids[2],12,'accept_route',{related_receipt_id:route.id,staff_user_id:recipient,decision:'accepted'});
const draft=row(ids[3],13,'draft',{staff_user_id:recipient,recipient_staff_user_id:recipient,template_key:'safety_hold'});
const suppressed=row(ids[4],14,'suppress',{staff_user_id:recipient,related_receipt_id:draft.id});
const request=(action,extra={})=>({action,client_request_id:ids[5],booking_id:book,
 exception_id:issue,note:'Original signed exception routing receipt.',...extra});

test('strict source requests reject customer channels, outbound sends and artificial consent',()=>{
 assert.equal(normalize903(request('claim')).ok,true);
 assert.equal(normalize903(request('route',{recipient_staff_user_id:recipient})).ok,true);
 assert.equal(normalize903(request('accept_route',{route_id:route.id,decision:'accepted'})).ok,true);
 assert.equal(normalize903(request('draft',{template_key:'safety_hold'})).ok,true);
 assert.equal(normalize903(request('suppress',{draft_id:draft.id})).ok,true);
 for(const bad of [
 request('claim',{staff_user_id:supervisor}),
 request('route',{recipient_staff_user_id:recipient,customer_email:'x@example.invalid'}),
 request('accept_route',{route_id:route.id,decision:'approve_dispatch'}),
 request('draft',{template_key:'safety_hold',channel:'customer_sms'}),
 request('draft',{template_key:'sla_overdue',send_authorized:true}),
 request('draft',{template_key:'public_marketing'}),
 request('suppress',{draft_id:'wrong-id'}),
 request('send',{channel:'email'}),request('claim',{note:'short'})
 ])assert.equal(normalize903(bad).ok,false);
});
test('cannot create an owner without verified original 902 two-person handoff',()=>{
 assert.equal(source().owner_state,'UNCLAIMED');
 assert.throws(()=>source([claim],{...exception,handoff:{verified:false,recipient_staff_user_id:supervisor}}),/unverified/);
 assert.throws(()=>source([row(ids[0],10,'claim',{staff_user_id:recipient})]),/unverified/);
 assert.equal(source([claim]).owner_state,'OWNER_VERIFIED');
 assert.equal(source([claim]).owner_staff_user_id,supervisor);
});
test('routing requires distinct current owner and independent exact recipient acceptance',()=>{
 assert.equal(source([claim,route]).owner_state,'ROUTING_AWAITING_ACK');
 const after=source([claim,route,accepted]);
 assert.equal(after.owner_staff_user_id,recipient);
 assert.equal(after.owner_current,true);
 assert.throws(()=>source([claim,route,row(ids[2],12,'accept_route',{related_receipt_id:route.id,decision:'accepted'})]),/Invalid two-person/);
 assert.throws(()=>source([claim,route,accepted,accepted]),/Invalid two-person/);
 assert.throws(()=>source([claim,route,accepted,row(ids[6],13,'claim')]),/Conflicting/);
});
test('drafts always stay unsent and suppression removes active draft without bringing an older draft back',()=>{
 const prepared=source([claim,route,accepted,draft]);
 assert.equal(prepared.outbox.status,'UNSENT_INTERNAL_DRAFT');
 assert.equal(prepared.outbox.recipient_staff_user_id,recipient);
 assert.equal(prepared.authority.customer_contact_allowed,false);
 assert.equal(prepared.authority.delivery_enabled,false);
 assert.equal(prepared.authority.customer_consent_claimed,false);
 assert.equal(prepared.outbox.preview.includes('customer'),false);
 assert.equal(source([claim,route,accepted,draft,suppressed]).outbox,null);
 const older=row(ids[6],12,'draft',{staff_user_id:recipient,template_key:'handoff_pending'});
 assert.equal(source([claim,route,accepted,older,draft,suppressed]).outbox,null);
 assert.throws(()=>source([claim,draft]),/Draft without current/);
});
test('resolved original 901 incident or incomplete source fails closed for owner operations',()=>{
 assert.equal(source([claim],{...exception,open:false}).owner_current,false);
 assert.equal(source([claim],{...exception,open:false}).owner_state,'EXCEPTION_RESOLVED');
 assert.throws(()=>project903({booking_id:book,exception:null}),/incomplete/);
 assert.throws(()=>source(new Array(220).fill(claim)),/incomplete/);
 assert.throws(()=>source([{...claim,booking_id:recipient}]),/Malformed/);
});
test('server-only append-only DB, original source and no delivery or consent claim',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261117030000_build903_exception_routing_internal_outbox.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.match(sql,/one_owner_claim_idx/);
 assert.match(sql,/one_route_accept_idx/);
 assert.match(sql,/one_draft_suppression_idx/);
 assert.match(sql,/before update or delete/);
 assert.match(sql,/before truncate/);
 assert.match(sql,/channel='internal_task'/);
 assert.match(sql,/check\(not delivery_attempted\)/);
 assert.match(sql,/check\(not customer_consent_claimed\)/);
 const api=readFileSync(new URL('../functions/api/admin/exception_routing_v903.js',import.meta.url),'utf8');
 assert.match(api,/allowLegacyAdminFallback:false/);
 assert.match(api,/a.auth_mode!=='session'/);
 assert.match(api,/sameOrigin811/);
 assert.match(api,/hasActionAccess\(a.actor,'operations.assignment.manage'\)/);
 assert.match(api,/original two-person supervisor handoff/i);
 assert.match(api,/p.recipient_staff_user_id===a.actor.id/);
 assert.match(api,/customer_contact_authorized:false/);
 assert.doesNotMatch(api,/method:'PATCH'|method:'DELETE'|api\.stripe\.com|smtp|sms_send/);
 const previous=readFileSync(new URL('../functions/api/detailer/job_action.js',import.meta.url),'utf8');
 assert.match(previous,/requireJobdayTransition901/);
});
