// Build 543 — read-only, fail-closed Staff & Mobile Closure Evidence Integrity Review.
export function buildStaffMobileClosureEvidenceIntegrityReview({
  closure_freshness = {}, closure_outcome_continuity = {}, generated_at = null
} = {}) {
  const now = timestamp(generated_at) || new Date().toISOString();
  const fresh = record(closure_freshness), source = record(closure_outcome_continuity);
  const recognized = fresh.staff_mobile_closure_freshness_build === 533 &&
    fresh.staff_mobile_closure_freshness_authority === "staff_mobile_closure_evidence_freshness_review" &&
    fresh.source_recognized === true && source.closure_outcome_build === 523 &&
    source.closure_outcome_authority === "staff_mobile_remediation_closure_outcome_continuity" &&
    source.source_recognized === true;
  const age = Date.parse(now) - Date.parse(fresh.generated_at);
  const snapshotCurrent = Number.isFinite(age) && age >= -60000 && age <= 600000;
  const a = Array.isArray(fresh.rows) ? fresh.rows : [];
  const b = Array.isArray(source.rows) ? source.rows : [];
  const fm = index(a), sm = index(b);
  const exactRows = Boolean(fm && sm && a.length > 0 && a.length === b.length &&
    [...fm.keys()].every(k => sm.has(k)));
  const rows = b.map(item => {
    const original = record(item), current = record(fm?.get(key(original)));
    const readiness = record(original.retained_closure_readiness);
    const context = record(readiness.context);
    const owner = record(original.owner_closure_outcome);
    const comparison = record(current.comparison_context);
    const freshState = current.freshness_state;
    const expectedState = owner.outcome === "close" ? "closure_outcome_current" :
      owner.outcome === "retain_open" ? "retain_open_outcome_current" : null;
    const contextExact = ["measure_definition","owning_workflow_scope","role_scope","device_browser_context","window_or_sample_definition"]
      .every(field => Boolean(String(context[field] ?? "").trim()) && context[field] === comparison[field]) &&
      ["matching_row_count","attributable_row_count","materially_like_for_like_row_count","unconfounded_like_for_like_row_count"]
      .every(field => Number.isInteger(Number(readiness[field])) && Number(readiness[field]) >= 1 &&
        Number(readiness[field]) === Number(comparison[field]));
    const cf = record(current.freshness);
    const traceExact = Boolean(owner.readiness_trace_key) &&
      owner.readiness_trace_key === readiness.expected_readiness_trace_key &&
      owner.trace_matches === true && owner.attributable === true &&
      cf.trace_current === true && cf.owner_outcome_reference === owner.outcome_reference &&
      Boolean(owner.outcome_reference) && timestamp(owner.reviewed_at) === timestamp(cf.owner_reviewed_at) &&
      timestamp(readiness.latest_evidence_observed_at) === timestamp(cf.latest_retained_evidence_observed_at);
    const reviewsExact = owner.review_complete === true && owner.context_reviewed === true &&
      owner.material_confounders_reviewed === true && owner.weather_site_context_reviewed === true &&
      cf.review_complete === true && cf.context_reviewed === true &&
      cf.material_confounders_reviewed === true && cf.weather_site_context_reviewed === true &&
      cf.retained_evidence_current === true && cf.owner_review_current === true;
    const boundary = record(current.outcome_boundary);
    const freshValid = freshState === expectedState && boundary.current === true &&
      boundary.review_required === false && cf.owner_outcome === owner.outcome &&
      original.status === (owner.outcome === "close" ? "closure_outcome_observed" :
        "closure_retained_open_outcome_observed");
    const state = !recognized ? "staff_mobile_integrity_source_unavailable" :
      !snapshotCurrent || !freshValid ? "retained_closure_freshness_review_required" :
      !contextExact ? "workflow_role_device_sample_identity_review_required" :
      !traceExact ? "closure_owner_trace_identity_review_required" :
      !reviewsExact ? "weather_confounder_owner_review_required" :
      "staff_mobile_closure_integrity_current";
    return Object.freeze({evidence_id:key(original), integrity_state:state,
      retained_outcome:owner.outcome || null, context_identity_exact:contextExact,
      owner_trace_identity_exact:traceExact, weather_confounder_review_exact:reviewsExact,
      automatic_closure_performed:false});
  });
  const status = !recognized ? "staff_mobile_integrity_source_unavailable" :
    !snapshotCurrent ? "retained_closure_freshness_review_required" :
    !exactRows ? "staff_mobile_row_set_identity_review_required" :
    rows.find(r => r.integrity_state !== "staff_mobile_closure_integrity_current")?.integrity_state ||
    "staff_mobile_closure_integrity_current";
  return Object.freeze({generated_at:now, staff_mobile_closure_integrity_build:543,
    staff_mobile_closure_integrity_authority:"staff_mobile_closure_evidence_integrity_review",
    retained_freshness_build:533, retained_closure_outcome_build:523,
    retained_readiness_build:513, status, source_recognized:recognized,
    freshness_snapshot_current:snapshotCurrent, row_set_identity_exact:exactRows,
    definition_count:rows.length, review_required_count:rows.filter(r=>r.integrity_state!=="staff_mobile_closure_integrity_current").length,
    rows:Object.freeze(rows), truth_boundary:Object.freeze({remediation_effective:null,causation:null,
      staff_fault:null,device_fault:null,business_impact:null,
      role_or_permission_changed:false,job_or_task_action_performed:false,
      support_exception_mutated:false,outreach_sent:false,
      canonical_hold_mutated:false,schema_or_storage_mutated:false,permanent_polling:false})});
}
function record(v){return v && typeof v==="object" && !Array.isArray(v) ? v : {};}
function key(v){return String(v?.evidence_id ?? "").trim();}
function index(rows){const m=new Map();for(const r of rows){const k=key(r);if(!k||m.has(k))return null;m.set(k,r);}return m;}
function timestamp(v){const s=String(v??"").trim();return s && Number.isFinite(Date.parse(s))?new Date(s).toISOString():null;}
