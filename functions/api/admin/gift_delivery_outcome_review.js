import {requireStaffAccess,serviceHeaders,json} from '../_lib/staff-auth.js';
import {sha256} from './gift_issuance_recovery_decisions.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION=/^cs_(?:test|live)_[a-zA-Z0-9_-]{8,220}$/;
const EVIDENCE=/^[A-Z0-9_-]{6,64}$/;
const SOURCES={
  owner_provider_outcome_triage:['provider_receipt','provider_dashboard_reference','internal_exception_note'],
  owner_recipient_confirmation:['recipient_direct_reply','verified_phone_conversation'],
  owner_no_resend_escalation:['provider_receipt','provider_dashboard_reference','internal_exception_note','recipient_reported_missing']
};
const TRIAGE={provider_accepted:'accepted_pending_recipient',provider_rejected:'rejected_no_resend',
  outcome_unknown:'unknown_no_resend',in_flight:'in_flight_no_resend'};
function privateResponse(response){const headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers});}
function answer(body,status=200){return privateResponse(json(body,status));}
async function access(request,env){
  const auth=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!auth.ok)return {ok:false,response:privateResponse(auth.response)};
  if(auth.auth_mode!=='session'||!auth.actor?.is_admin||!UUID.test(String(auth.actor.id||'')))
    return {ok:false,response:answer({ok:false,error:'Signed-in owner/admin access required.'},403)};
  return {ok:true,actor:auth.actor};
}
async function rows(env,path){const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{
  headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500)});
  if(!response.ok)throw Error('Gift outcome evidence unavailable');
  const result=await response.json();if(!Array.isArray(result))throw Error('Invalid evidence');return result;
}
function mask(value){return String(value||'').replace(/^(.)([^@]*)(@.*)$/,'$1***$3');}
export function reviewReadiness(attempt,reviews=[]){
  const triage=reviews.find(r=>r.event_kind==='owner_provider_outcome_triage');
  const confirmation=reviews.find(r=>r.event_kind==='owner_recipient_confirmation');
  const escalation=reviews.find(r=>r.event_kind==='owner_no_resend_escalation');
  return {provider_outcome:attempt.status,triage_decision:TRIAGE[attempt.status]||null,
    can_triage:!triage,can_record_recipient_confirmation:!!triage&&!confirmation,
    can_escalate_without_resend:!!triage&&!escalation,
    recipient_confirmed:!!confirmation,no_resend_escalated:!!escalation,
    reviews:reviews.map(r=>({id:r.id,event_kind:r.event_kind,decision_code:r.decision_code,
      evidence_kind:r.evidence_kind,evidence_reference:r.evidence_reference,
      observed_at:r.observed_at,created_at:r.created_at})),
    warning:confirmation?'Recipient confirmation was manually recorded from separately observed evidence. No provider receipt proves inbox arrival.':
      escalation?'Owner escalated without resending. Keep the single dispatch slot consumed.':
      'Provider outcome is not proof the recipient received the gift. Never resend automatically.'};
}
export async function onRequestGet({request,env}){
  const actor=await access(request,env);if(!actor.ok)return actor.response;
  const session=String(new URL(request.url).searchParams.get('session_id')||'').trim();
  if(!SESSION.test(session))return answer({ok:false,error:'Exact checkout session ID required.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(session)}&limit=1`);
    if(!cases.length)return answer({ok:true,build:688,case:null,gifts:[],safe_boundary:'No dispatch found. Nothing was sent.'});
    const c=cases[0];
    const gifts=await rows(env,`gift_certificates?select=id,checkout_line_number,recipient_email&stripe_session_id=eq.${encodeURIComponent(session)}&order=checkout_line_number.asc&limit=100`);
    const attempts=gifts.length?await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,status,notification_event_id,created_at&certificate_id=in.(${gifts.map(g=>g.id).join(',')})&limit=100`):[];
    const ids=attempts.map(a=>a.id);
    const receipts=ids.length?await rows(env,`gift_issuance_one_time_dispatch_receipts?select=attempt_id,provider_outcome,created_at&attempt_id=in.(${ids.join(',')})&limit=100`):[];
    const reviews=ids.length?await rows(env,`gift_issuance_delivery_outcome_reviews?select=id,attempt_id,event_kind,decision_code,evidence_kind,evidence_reference,observed_at,created_at&attempt_id=in.(${ids.join(',')})&order=created_at.asc&limit=300`):[];
    return answer({ok:true,build:688,case:{id:c.id},gifts:gifts.map(g=>{
      const a=attempts.find(x=>x.certificate_id===g.id);
      return {id:g.id,checkout_line_number:g.checkout_line_number,
        recipient_email_masked:mask(g.recipient_email),attempt_id:a?.id||null,
        notification_event_id:a?.notification_event_id||null,
        provider_receipt_exists:!!receipts.find(r=>r.attempt_id===a?.id),
        ...(a?reviewReadiness(a,reviews.filter(r=>r.attempt_id===a.id)):{provider_outcome:'not_dispatched',
          can_triage:false,can_record_recipient_confirmation:false,can_escalate_without_resend:false,
          reviews:[],warning:'No one-time provider dispatch exists. No outcome to review.'})};}),
      safe_boundary:'Evidence-only owner review. Zero dispatches, automatic resends, charges, balance changes or cross-business events.'});
  }catch{return answer({ok:false,error:'Gift outcome evidence unavailable; no action occurred.'},503);}
}
export async function onRequestPost({request,env}){
  const origin=request.headers.get('origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')
    return answer({ok:false,error:'Cross-origin evidence entry refused.'},403);
  const actor=await access(request,env);if(!actor.ok)return actor.response;
  const b=await request.json().catch(()=>({}));
  if(!SESSION.test(String(b.session_id||''))||
     ![b.case_id,b.certificate_id,b.attempt_id,b.review_id].every(x=>UUID.test(String(x||'')))||
     !SOURCES[b.event_kind]?.includes(b.evidence_kind)||!EVIDENCE.test(String(b.evidence_reference||''))||
     !Number.isFinite(Date.parse(b.observed_at||''))||
     Date.parse(b.observed_at)>Date.now()+30000||Date.parse(b.observed_at)<Date.now()-30*86400000||
     b.confirm_exact_gift!==true||b.confirm_independent_evidence!==true||b.confirm_no_resend!==true)
    return answer({ok:false,error:'Choose an exact certificate, dated source and non-personal reference; all no-resend acknowledgments are required.'},400);
  const allowed=b.event_kind==='owner_provider_outcome_triage'?Object.values(TRIAGE):
    b.event_kind==='owner_recipient_confirmation'?['recipient_explicitly_confirmed']:
    ['recipient_not_confirmed','evidence_conflict','manual_followup_required'];
  if(!allowed.includes(b.decision_code))return answer({ok:false,error:'Decision and review kind mismatch.'},400);
  try{
    const cases=await rows(env,`gift_issuance_review_cases?select=id,stripe_session_id&id=eq.${b.case_id}&limit=1`);
    if(cases[0]?.stripe_session_id!==b.session_id)
      return answer({ok:false,error:'Review case does not match checkout.'},409);
    const attempts=await rows(env,`gift_issuance_one_time_dispatch_attempts?select=id,certificate_id,status&id=eq.${b.attempt_id}&limit=1`);
    if(attempts[0]?.certificate_id!==b.certificate_id||
      (b.event_kind==='owner_provider_outcome_triage'&&TRIAGE[attempts[0].status]!==b.decision_code))
      return answer({ok:false,error:'Provider result or exact certificate mismatch. Refresh before saving.'},409);
    const hash=await sha256({session_id:b.session_id,case_id:b.case_id,
      certificate_id:b.certificate_id,attempt_id:b.attempt_id,event_kind:b.event_kind,
      decision_code:b.decision_code,evidence_kind:b.evidence_kind,
      evidence_reference:b.evidence_reference,observed_at:new Date(b.observed_at).toISOString()});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/record_gift_delivery_outcome_review`,{
      method:'POST',headers:serviceHeaders(env),redirect:'error',signal:AbortSignal.timeout(8500),
      body:JSON.stringify({p_id:b.review_id,p_case_id:b.case_id,p_certificate_id:b.certificate_id,
        p_attempt_id:b.attempt_id,p_owner_id:actor.actor.id,p_event_kind:b.event_kind,
        p_decision_code:b.decision_code,p_evidence_kind:b.evidence_kind,
        p_evidence_reference:b.evidence_reference,p_evidence_sha256:hash,
        p_observed_at:new Date(b.observed_at).toISOString()})});
    if(!response.ok)return answer({ok:false,error:'Atomic independent evidence check refused this outcome. No resend or charge occurred.'},409);
    const result=await response.json();return answer({ok:true,build:688,result,
      customer_messages_sent:0,provider_dispatches:0,payment_mutations:0,
      next_step:'Review the saved evidence. Recipient confirmation must be an explicit real-world acknowledgment; no resend is authorized.'});
  }catch{return answer({ok:false,error:'Evidence check unavailable. No send, resend or charge occurred.'},503);}
}
