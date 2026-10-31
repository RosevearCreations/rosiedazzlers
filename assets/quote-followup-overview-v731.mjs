// Build 731: review-only presentation of ORIGINAL server-verified signed receipts.
// No local or external receipt is independently certified by an overview.
const definitions=[
  ['nonproduction',723,'rosie_nonproduction_ledger_execution_authorization_checklist','Nonproduction execution checklist'],
  ['witness',723,'rosie_independent_witness_identity_disposition','Witness identity disposition'],
  ['owner',723,'rosie_owner_retention_expiry_policy_verification','Owner retention expiry'],
  ['owner',724,'rosie_owner_nonproduction_authorization_handoff','Owner handoff preparation'],
  ['witness',724,'rosie_witness_reference_conflict_review','Witness reference conflict'],
  ['nonproduction',724,'rosie_retention_backup_purge_trial_preconditions','Backup trial prerequisites'],
  ['owner',725,'rosie_private_owner_handoff_receipt_reconciliation','Owner handoff reconciliation'],
  ['witness',725,'rosie_witness_reference_conflict_aging','Witness conflict aging'],
  ['nonproduction',725,'rosie_nonproduction_retention_trial_readiness_review','Nonproduction trial readiness'],
  ['owner',726,'rosie_owner_handoff_exception_followup','Owner handoff exception'],
  ['witness',726,'rosie_witness_conflict_priority_queue','Witness priority review'],
  ['nonproduction',726,'rosie_nonproduction_trial_evidence_intake_guardrails','Trial evidence intake'],
  ['owner',727,'rosie_owner_exception_evidence_followup_queue','Owner exception follow-up'],
  ['witness',727,'rosie_witness_priority_disposition_audit','Witness disposition audit'],
  ['nonproduction',727,'rosie_nonproduction_trial_source_provenance_recheck','Trial source provenance'],
  ['owner',728,'rosie_owner_followup_aging_review','Owner aging review'],
  ['witness',728,'rosie_witness_audit_exception_review','Witness exception review'],
  ['nonproduction',728,'rosie_nonproduction_provenance_evidence_gap_tracking','Nonproduction evidence gaps'],
  ['owner',729,'rosie_owner_followup_aging_delta','Owner aging delta'],
  ['witness',729,'rosie_witness_audit_exception_continuity','Witness exception continuity'],
  ['nonproduction',729,'rosie_nonproduction_provenance_gap_drift','Nonproduction gap drift'],
  ['owner',730,'rosie_owner_aging_recovery_summary','Owner comparison recovery'],
  ['witness',730,'rosie_witness_exception_followup_timeline','Witness follow-up timeline'],
  ['nonproduction',730,'rosie_nonproduction_evidence_gap_recovery_summary','Nonproduction gap recovery']
];
export const EVIDENCE_KINDS731=Object.freeze(Object.fromEntries(definitions.map(
  ([scope,build,kind,label])=>[kind,Object.freeze({scope,build,kind,label})])));

const sha=/^[0-9a-f]{64}$/;
const actions={
  owner:'Obtain a genuine external delivery receipt and an independently reviewed owner handoff.',
  witness:'Obtain independent human witness identity and authentic external disposition.',
  nonproduction:'Obtain original provenance, independent custodian approval, disposable-environment RLS verification and observed backup evidence.'
};
export function localAgeBand731(ageHours){
  if(!Number.isSafeInteger(ageHours)||ageHours<0)return null;
  if(ageHours>=168)return {code:'168h',label:'168h+ critical local review age',rank:3};
  if(ageHours>=72)return {code:'72h',label:'72–167h overdue local review age',rank:2};
  if(ageHours>=24)return {code:'24h',label:'24–71h local follow-up attention',rank:1};
  return {code:'under24',label:'Under 24h local review age',rank:0};
}

export function overviewEvidenceItem731(verified,now=new Date()){
  const r=verified?.receipt,def=EVIDENCE_KINDS731[r?.kind];
  const at=Date.parse(r?.reviewed_at||r?.checked_at||'');
  if(!verified?.ok||!def||r.build!==def.build||
    !sha.test(verified.receipt_sha256||'')||r.proof_b_authorized!==false||
    typeof r.status!=='string'||!/^[A-Z0-9_]{8,120}$/.test(r.status)||
    !Number.isFinite(at)||at>now.getTime()+300000||
    now.getTime()-at>30*86400000)return null;
  for(const key of ['external_message_sent','sql_executed','connected_to_database',
    'backup_accessed','ledger_activated','independent_approval_received']){
    if(Object.hasOwn(r,key)&&r[key]!==false)return null;
  }
  const source_hashes=Object.fromEntries(Object.entries(r)
    .filter(([key,value])=>/(^signed_|^verified_|^source_).*_sha256$/.test(key)&&
      sha.test(value||'')));
  const age_hours=Math.max(0,Math.floor((now.getTime()-at)/3600000));
  const band=localAgeBand731(age_hours);
  const recorded_age=Number.isSafeInteger(r.current_local_age_hours)?
    r.current_local_age_hours:Number.isSafeInteger(r.local_queue_age_hours)?
      r.local_queue_age_hours:null;
  const recorded_window=[24,72,168].includes(r.local_review_window_hours)?
    r.local_review_window_hours:null;
  const gaps=Array.isArray(r.unresolved_gap_codes)?
    r.unresolved_gap_codes.filter(code=>/^[a-z_]{4,80}$/.test(code)).slice(0,8):[];
  return {scope:def.scope,build:def.build,kind:def.kind,label:def.label,
    receipt_sha256:verified.receipt_sha256,
    signer_fingerprint:sha.test(verified.signer_fingerprint||'')?
      verified.signer_fingerprint:null,
    reviewed_at:new Date(at).toISOString(),status:r.status,
    age_hours,age_band:band.code,age_label:band.label,age_rank:band.rank,
    recorded_local_queue_age_hours:recorded_age,
    recorded_local_review_window_hours:recorded_window,
    source_hashes,unresolved_gap_codes:gaps,
    outstanding_action:actions[def.scope],external_evidence_approved:false,
    proof_b_authorized:false};
}
