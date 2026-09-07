import assert from 'node:assert/strict';
import {
  CRM_QUEUE_POLICY,
  normalizeCrmQueueAction,
  deriveCrmOperationalQueue,
  crmQueueMetrics,
  queueAuditEventType,
  queueAuditSummary
} from '../functions/api/_lib/crm-operational-work-queue.js';

const CUSTOMER_A='11111111-1111-4111-8111-111111111111';
const CUSTOMER_B='22222222-2222-4222-8222-222222222222';
const BOOKING_A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOOKING_B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NOW=new Date('2026-09-07T12:00:00.000Z');

const profiles=[
  {id:CUSTOMER_A,full_name:'Retention One',email:'one@example.test',phone:'555-0101',is_active:true,archived_at:null,notification_opt_in:true,notification_channel:'email'},
  {id:CUSTOMER_B,full_name:'Recent Two',email:'two@example.test',is_active:true,archived_at:null,notification_opt_in:false,notification_channel:'none'}
];
const bookings=[
  {id:BOOKING_A,customer_profile_id:CUSTOMER_A,status:'completed',job_status:'completed',completed_at:'2026-02-01T12:00:00.000Z',service_date:'2026-02-01',created_at:'2026-01-20T12:00:00.000Z',price_total_cents:32000},
  {id:BOOKING_B,customer_profile_id:CUSTOMER_B,status:'completed',job_status:'completed',completed_at:'2026-09-04T12:00:00.000Z',service_date:'2026-09-04',created_at:'2026-09-01T12:00:00.000Z',price_total_cents:22000}
];
const vehicles=[
  {id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',customer_profile_id:CUSTOMER_A,next_cleaning_due_at:'2026-07-20T12:00:00.000Z'}
];

const queue=deriveCrmOperationalQueue({profiles,bookings,vehicles,auditEvents:[],now:NOW});
assert.equal(queue.length,2);
assert.equal(queue[0].customer_profile_id,CUSTOMER_A);
assert.equal(queue[0].priority,'high');
assert.deepEqual(queue[0].reasons.map((row)=>row.code).sort(),['maintenance_due','reengagement_due']);
assert.equal(queue[0].contact_context.outreach_consent,null);
assert.equal(queue[0].contact_context.automatic_send_allowed,false);
assert.equal(queue[1].customer_profile_id,CUSTOMER_B);
assert.equal(queue[1].reasons[0].code,'recent_service_followup');

const metrics=crmQueueMetrics(queue);
assert.equal(metrics.total,2);
assert.equal(metrics.high_priority,1);
assert.equal(metrics.maintenance_due,1);
assert.equal(metrics.reengagement_due,1);
assert.equal(metrics.recent_service_followup,1);

const reviewed=deriveCrmOperationalQueue({profiles:[profiles[1]],bookings:[bookings[1]],vehicles:[],auditEvents:[{customer_profile_id:CUSTOMER_B,event_type:'crm_queue_reviewed',created_at:'2026-09-05T12:00:00.000Z'}],now:NOW});
assert.equal(reviewed.length,0,'recently reviewed unchanged signal should be held out of queue');

const withOpenBooking=deriveCrmOperationalQueue({profiles:[profiles[0]],bookings:[bookings[0],{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',customer_profile_id:CUSTOMER_A,status:'confirmed',job_status:'scheduled',service_date:'2026-09-20',created_at:'2026-09-01T12:00:00.000Z'}],vehicles:[],auditEvents:[],now:NOW});
assert.equal(withOpenBooking.length,0,'open booking should suppress re-engagement-only candidate');

assert.equal(normalizeCrmQueueAction({customer_profile_id:CUSTOMER_A,action:'contacted'}).ok,false);
assert.equal(normalizeCrmQueueAction({customer_profile_id:CUSTOMER_A,action:'contacted',manual_contact_confirmed:true}).ok,true);
assert.equal(normalizeCrmQueueAction({customer_profile_id:CUSTOMER_A,action:'reviewed',unexpected:true}).ok,false);
assert.equal(queueAuditEventType('reviewed'),'crm_queue_reviewed');
assert.match(queueAuditSummary('contacted','Customer requested a spring check-in.'),/completed manual CRM contact/);
assert.equal(CRM_QUEUE_POLICY.reengagement_after_days,120);

console.log('GREEN: CRM operational work queue executable contract passed.');
