import {EXCEPTION_CODES713,liveExceptions713} from './quote-followup-workload-v713.mjs';

export const RESOLUTION_EVIDENCE_EVENT714='quote_staff_followup_exception_resolution_evidence';
const clean=value=>String(value??'').trim();
const same=(a,b)=>Boolean(a&&b&&Object.keys(b).every(key=>a[key]===b[key]));

// A suggested destination is a workload comparison, not a statement about live
// shift availability or capacity. The manager must select the actual target.
export function staffBalance714(roster=[],groups=[]){
  const byId=new Map(groups.filter(g=>g.staff_user_id).map(g=>[g.staff_user_id,g]));
  return roster.filter(s=>s&&s.is_active===true&&
    ['admin','senior_detailer','detailer'].includes(s.role_code)&&
    (s.role_code==='admin'||s.can_manage_bookings===true)).map(s=>{
    const group=byId.get(s.id);
    return {staff_user_id:s.id,staff_name:clean(s.full_name).slice(0,120)||'Active staff member',
      role_code:s.role_code,assigned_sample:group?.assigned||0,
      overdue_sample:group?.overdue||0,critical_sample:group?.critical||0};
  }).sort((a,b)=>a.assigned_sample-b.assigned_sample||
    a.overdue_sample-b.overdue_sample||a.staff_name.localeCompare(b.staff_name));
}

// A source event after the original exception review must demonstrate the actual
// remedy. A changed due date alone is not evidence that consent or ownership was fixed.
export function resolutionProof714(code,escalation,originalReview){
  if(!EXCEPTION_CODES713.includes(code)||!originalReview||
    liveExceptions713(escalation).includes(code))return null;
  const f=escalation.followup,p=originalReview.payload||{};
  const proof=code==='overdue_without_owner'&&f.assignment_current&&
    clean(f.assignment?.id)!==clean(p.assignment_event_id)?
      {kind:'current_staff_assignment',event_id:f.assignment.id}:
    code==='overdue_consent_recheck'&&f.recheck_current&&
    clean(f.latest_check?.id)!==clean(p.consent_recheck_event_id)?
      {kind:'current_internal_consent_recheck',event_id:f.latest_check.id}:
    code==='escalation_owner_review_pending'&&escalation.owner_review_current&&
    clean(escalation.latest?.id)!==clean(p.escalation_event_id)?
      {kind:'current_escalation_owner_review',event_id:escalation.latest.id}:
    code==='stale_escalation_audit'&&escalation.history.length>0&&
    escalation.latest_event_current&&
    clean(escalation.latest?.id)!==clean(p.escalation_event_id)?
      {kind:'current_escalation_audit',event_id:escalation.latest.id}:null;
  return proof;
}

export function evidenceCurrent714(events,code,escalation,originalReview){
  const latest=events.find(e=>e.event_type===RESOLUTION_EVIDENCE_EVENT714&&
    e.payload?.exception_code===code&&e.payload?.action==='verify_resolution');
  const proof=resolutionProof714(code,escalation,originalReview),f=escalation.followup;
  return Boolean(latest&&proof&&same(latest.payload.marker,f.resolution.marker)&&
    clean(latest.payload.exception_review_event_id)===clean(originalReview.id)&&
    clean(latest.payload.proof_event_id)===clean(proof.event_id)&&
    clean(latest.payload.assignment_event_id)===clean(f.assignment?.id)&&
    clean(latest.payload.consent_recheck_event_id)===clean(f.latest_check?.id)&&
    clean(latest.payload.escalation_event_id)===clean(escalation.latest?.id)&&
    clean(latest.payload.outcome_event_id)===clean(f.resolution.latest_outcome_event_id)&&
    clean(latest.payload.resolution_event_id)===clean(f.resolution.latest_resolution_event_id));
}
