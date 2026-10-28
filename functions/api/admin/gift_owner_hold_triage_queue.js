// Build 695: bounded owner-only dashboard over existing immutable fifth/sixth evidence.
// READ ONLY: no seventh reviewer, owner event, customer contact, provider call or resend.
import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {summarizeSixthWitnessHold} from './gift_sixth_witness_hold_aging.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[A-Za-z0-9_-]{8,220}$/;
const ELIGIBLE=new Set(['still_disputed','documentary_gap','contradiction_not_resolved']);
const LIMIT=100;
function reply(body,status=200){const r=json(body,status),headers=new Headers(r.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers});}
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
  method:'GET',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw Error('Evidence source unavailable');
  const d=await r.json();if(!Array.isArray(d))throw Error('Invalid evidence response');return d;}
function idsFor(rows,key){const ids=[...new Set(rows.map(x=>x[key]))];
  if(ids.length>LIMIT||ids.some(x=>!UUID.test(String(x||''))))throw Error('Invalid scoped evidence identifiers');
  return ids;}
const age=(value,now)=>{const ms=Date.parse(value||'');return Number.isFinite(ms)?Math.max(0,Math.floor((now-ms)/3600000)):null;};

export function rankOwnerHoldTriage(fifth,hold,events,certificate,now=Date.now()){
  if(!ELIGIBLE.has(fifth.decision_code))return null;
  if(!SESSION.test(String(certificate?.stripe_session_id||'')))throw Error('Missing exact checkout source');
  const hasHold=!!hold;
  const base=summarizeSixthWitnessHold({id:certificate.id,
    checkout_line_number:certificate.checkout_line_number,
    attempt_id:fifth.attempt_id,fifth_review_id:fifth.id,
    fifth_decision:fifth.decision_code,fifth_age_hours:age(fifth.created_at,now),events},now);
  const priority=!hasHold?0:base.owner_48h_alert?1:base.review_window_expired?2:
    base.witness_24h_alert?3:base.initial_24h_alert?4:base.phase==='OWNER_HOLD_ACKNOWLEDGED_UNRESOLVED'?6:5;
  return {case_id:fifth.case_id,certificate_id:certificate.id,attempt_id:fifth.attempt_id,
    session_id:certificate.stripe_session_id,checkout_line_number:certificate.checkout_line_number,
    fifth_review_age_hours:age(fifth.created_at,now),fifth_hold_ack_recorded:hasHold,
    ...base,priority,attention:!hasHold?'FIFTH_HOLD_ACK_MISSING':
      priority===1?'OWNER_ACK_OVERDUE_48H':priority===2?'SIXTH_WITNESS_WINDOW_EXPIRED_14D':
      priority===3?'SIXTH_WITNESS_OVERDUE_24H':priority===4?'OWNER_ASSIGNMENT_OVERDUE_24H':
      priority===6?'HOLD_ACK_RECORDED_STILL_UNRESOLVED':'MANUAL_HOLD_MONITOR',
    recipient_email_masked:undefined,recipient_email:undefined,
    manual_hold:true,resend_permitted:false,delivery_confirmed:false,
    owner_action_automatic:false,customer_messages_sent:0,provider_requests:0,payment_mutations:0};
}

export async function onRequestGet({request,env}){
  const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return a.response;
  if(a.auth_mode!=='session'||!a.actor?.is_admin||a.actor?.role_code!=='admin')
    return reply({ok:false,error:'Signed-in owner required.'},403);
  try{
    const fifth=await rows(env,`gift_issuance_delivery_reopened_discrepancy_watch?select=id,case_id,certificate_id,attempt_id,decision_code,created_at&event_kind=eq.independent_discrepancy_reassessed&decision_code=in.(still_disputed,documentary_gap,contradiction_not_resolved)&order=created_at.desc&limit=${LIMIT}`);
    if(!fifth.length)return reply({ok:true,build:695,queue:[],sample_limit:LIMIT,
      truncated_possible:false,read_only:true,connection_state:'DISCONNECTED',
      notice:'No unresolved fifth-review events in the bounded query; no customer action authorized.'});
    const attemptIds=idsFor(fifth,'attempt_id'),certificateIds=idsFor(fifth,'certificate_id');
    const filter=`attempt_id=in.(${attemptIds.join(',')})`;
    const [prior,watch,certificates]=await Promise.all([
      rows(env,`gift_issuance_delivery_reopened_discrepancy_watch?select=attempt_id,event_kind&${filter}&event_kind=eq.owner_no_resend_hold_ack&limit=${LIMIT}`),
      rows(env,`gift_issuance_delivery_fifth_recurrence_closure_watch?select=attempt_id,event_kind,decision_code,created_at&${filter}&limit=${LIMIT*3}`),
      rows(env,`gift_certificates?select=id,stripe_session_id,checkout_line_number&id=in.(${certificateIds.join(',')})&limit=${LIMIT}`)
    ]);
    const byCertificate=new Map(certificates.map(x=>[x.id,x]));
    if(fifth.some(x=>!byCertificate.has(x.certificate_id)))throw Error('Missing certificate source');
    const now=Date.now(),queue=fifth.map(f=>rankOwnerHoldTriage(f,
      prior.find(x=>x.attempt_id===f.attempt_id),
      watch.filter(x=>x.attempt_id===f.attempt_id),
      byCertificate.get(f.certificate_id),now));
    queue.sort((a,b)=>a.priority-b.priority||
      (b.fifth_review_age_hours??0)-(a.fifth_review_age_hours??0)||
      String(a.attempt_id).localeCompare(String(b.attempt_id)));
    return reply({ok:true,build:695,queue,sample_limit:LIMIT,
      truncated_possible:fifth.length===LIMIT||watch.length===LIMIT*3,
      read_only:true,connection_state:'DISCONNECTED',
      notice:'Owner-only recent unresolved fifth-review triage. Not a complete audit when truncated. Manual HOLD/no-resend for every case.'});
  }catch{return reply({ok:false,error:'HOLD triage source unavailable; no case was cleared or modified.'},503);}
}
