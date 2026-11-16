// Build 897: pure CRM follow-up planning. Never an outbound authorization.
import {evaluateConsent743,deliveryEvidence743} from './notification-consent-preview-v743.mjs';
export const TEMPLATES897=Object.freeze([
 {id:'booking_update',label:'Booking question or update',purpose:'service',preview:'Review the original booking and customer question.'},
 {id:'support_reply',label:'Support response',purpose:'service',preview:'Review the customer issue and approved next step.'},
 {id:'service_followup',label:'Service follow-up',purpose:'service',preview:'Review completed service and any open customer request.'},
 {id:'maintenance_reminder',label:'Maintenance invitation',purpose:'marketing',preview:'Marketing contact requires separate, current permission.'},
 {id:'review_request',label:'Review request',purpose:'marketing',preview:'Marketing contact requires separate, current permission.'}
]);
export const CHANNELS897=Object.freeze(['email','sms','phone']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function normalizePlan897(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'Invalid plan.'};
 if(Object.keys(input).some(k=>!['customer_profile_id','client_request_id','template_id','channel','due_date'].includes(k)))return {ok:false,error:'Unexpected field.'};
 const customer_profile_id=String(input.customer_profile_id||'').trim(),client_request_id=String(input.client_request_id||'').trim();
 const template=TEMPLATES897.find(t=>t.id===input.template_id),channel=String(input.channel||'').trim().toLowerCase(),due_date=String(input.due_date||'').trim();
 if(!UUID.test(customer_profile_id)||!UUID.test(client_request_id)||!template||!CHANNELS897.includes(channel))return {ok:false,error:'Invalid customer, request, template or channel.'};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(due_date))return {ok:false,error:'Invalid due date.'};
 const parsed=new Date(due_date+'T00:00:00Z');
 if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==due_date)return {ok:false,error:'Invalid calendar date.'};
 const today=new Date(now), max=new Date(today.getTime()+90*86400000);
 if(Number.isNaN(today.getTime())||due_date<today.toISOString().slice(0,10)||due_date>max.toISOString().slice(0,10))return {ok:false,error:'Due date must be within 90 days.'};
 return {ok:true,customer_profile_id,client_request_id,template,channel,due_date};
}
export function consentMatrix897(profile,preference){
 const matrix={};
 for(const template of TEMPLATES897)for(const channel of CHANNELS897){
  const decision=evaluateConsent743({profile,preference,channel,purpose:template.purpose});
  matrix[template.id+':'+channel]={allowed:decision.allowed===true,reason:decision.reason,purpose:template.purpose};
 }
 return matrix;
}
export function auditRecord897(plan,decision,actor){
 if(!plan?.ok)throw Error('Unvalidated task');
 const allowed=decision?.allowed===true;
 return {customer_profile_id:plan.customer_profile_id,client_request_id:plan.client_request_id,
 notification_event_id:null,channel:plan.channel,purpose:plan.template.purpose,
 outcome:allowed?'planned_not_contacted':'blocked_by_preference',staff_actor_name:String(actor||'Authorized staff').slice(0,120),
 note_summary:'CRM897|'+plan.template.id+'|'+plan.due_date+'|'+(allowed?'consent_reviewed':'consent_hold'),
 staff_report_unverified:true,provider_delivery_verified:false,outbound_dispatched:false};
}
export function plannedTask897(row){
 const match=/^CRM897\|([a-z_]+)\|(\d{4}-\d{2}-\d{2})\|(consent_reviewed|consent_hold)$/.exec(String(row?.note_summary||''));
 if(!match||!TEMPLATES897.some(t=>t.id===match[1]))return null;
 return {id:row.id,template_id:match[1],channel:row.channel,due_date:match[2],purpose:row.purpose,
 outcome:row.outcome,recorded_at:row.recorded_at,state:row.outcome==='blocked_by_preference'?'CONSENT_HOLD':'INTERNAL_PLAN_ONLY',
 current_consent_must_be_rechecked:true,provider_delivery_verified:false,messages_sent:0};
}
export function sourceActivity897(event){
 const evidence=deliveryEvidence743(event);
 // No ordinary notification_events field is proof of independently signed delivery.
 return {id:event.id,event_type:event.event_type,channel:event.channel,
 source_status:event.status,created_at:event.created_at,
 evidence:{...evidence,definitive_delivery:false},provider_delivery_verified:false,
 next_action:'Review independent provider evidence before claiming delivery; never auto-retry.'};
}
