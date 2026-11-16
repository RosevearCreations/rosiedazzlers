import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEMPLATES897,CHANNELS897,normalizePlan897,consentMatrix897,auditRecord897,plannedTask897,sourceActivity897} from '../assets/build897-crm-consent-handoff.mjs';
const uid='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',requestId='166cd852-784d-4244-a793-3dde8d273348';
const profile={id:uid,email:'customer@example.com',phone:'5195550199',notification_opt_in:true,notification_channel:'email',is_active:true};
const at=new Date('2026-11-16T12:00:00Z');
const input={customer_profile_id:uid,client_request_id:requestId,template_id:'booking_update',channel:'email',due_date:'2026-11-17'};
test('template catalogue has service vs marketing separation',()=>{
 assert.equal(TEMPLATES897.length,5);assert.deepEqual(CHANNELS897,['email','sms','phone']);
 assert.equal(TEMPLATES897.find(x=>x.id==='review_request').purpose,'marketing');
});
test('strict ID, fixed plan and bounded date reject arbitrary message bodies and recipients',()=>{
 assert.equal(normalizePlan897(input,at).ok,true);
 for(const row of [{...input,body:'sensitive private text'},{...input,recipient:'another person'}, {...input,customer_profile_id:'forged'},
 {...input,due_date:'2027-03-01'},{...input,due_date:'2026-02-30'}, {...input,channel:'push'}, {...input,template_id:'unknown'}])
  assert.equal(normalizePlan897(row,at).ok,false);
});
test('service matrix respects current profile; marketing requires separate explicit opt-in',()=>{
 const current=consentMatrix897(profile,null);
 assert.equal(current['booking_update:email'].allowed,true);
 assert.equal(current['booking_update:sms'].allowed,false);
 assert.equal(current['booking_update:phone'].allowed,false);
 assert.equal(current['review_request:email'].allowed,false);
 assert.equal(consentMatrix897({...profile,notification_opt_in:false},null)['booking_update:email'].allowed,false);
});
test('marketing permission, current withdrawal and channel drift',()=>{
 const pref={service_email:true,service_sms:false,service_phone:false,marketing_email:true,marketing_sms:false,marketing_phone:false};
 assert.equal(consentMatrix897(profile,pref)['review_request:email'].allowed,true);
 assert.equal(consentMatrix897(profile,{...pref,marketing_email:false})['review_request:email'].allowed,false);
 assert.equal(consentMatrix897({...profile,notification_channel:'sms'},pref)['review_request:email'].allowed,false);
 assert.equal(consentMatrix897({...profile,notification_opt_in:false},pref)['review_request:email'].allowed,false);
});
test('audited internal plan never asserts send, recipient or provider delivery',()=>{
 const plan=normalizePlan897(input,at), decision=consentMatrix897(profile,null)['booking_update:email'];
 const row=auditRecord897(plan,decision,'Staff');
 assert.equal(row.outcome,'planned_not_contacted');assert.equal(row.outbound_dispatched,false);
 assert.equal(row.provider_delivery_verified,false);assert.equal(row.notification_event_id,null);
 assert.equal(row.note_summary,'CRM897|booking_update|2026-11-17|consent_reviewed');
 assert.equal(row.recipient_email,undefined);assert.equal(row.message_body,undefined);
 const item=plannedTask897({...row,id:requestId,recorded_at:at.toISOString()});
 assert.equal(item.state,'INTERNAL_PLAN_ONLY');assert.equal(item.current_consent_must_be_rechecked,true);
});
test('opted-out customer creates only a blocked staff review record',()=>{
 const plan=normalizePlan897(input,at),row=auditRecord897(plan,{allowed:false},'Staff');
 assert.equal(row.outcome,'blocked_by_preference');assert.equal(plannedTask897(row).state,'CONSENT_HOLD');
 assert.equal(plannedTask897({note_summary:'some other private note'}),null);
});
test('notification statuses cannot synthesize independent provider receipts',()=>{
 for(const status of ['queued','sent','failed','delivered']){
 const activity=sourceActivity897({id:requestId,channel:'email',event_type:'booking_update',status,created_at:at.toISOString(),
 sent_at:status==='sent'?at.toISOString():null});
 assert.equal(activity.provider_delivery_verified,false);assert.equal(activity.evidence.definitive_delivery,false);
 }
});
test('API source has original signed-session/same-origin gates and HOLD Master status',()=>{
 const source=readFileSync(new URL('../functions/api/admin/crm_consent_handoff_v897.js',import.meta.url),'utf8');
 assert.match(source,/staffAccess811/);assert.match(source,/sameOrigin811/);
 assert.match(source,/operator_handoff_status:'HOLD_UNENROLLED'/);
 assert.match(source,/master_calls:0/);
 const ui=readFileSync(new URL('../admin-customer-crm-communications.html',import.meta.url),'utf8');
 assert.match(ui,/data-build897/);assert.match(ui,/No message sent/);
});
