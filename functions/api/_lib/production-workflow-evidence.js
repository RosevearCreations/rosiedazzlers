// Build 419 — Customer & Staff Production Workflow Evidence
// Pure evidence classification only. No booking, role, consent, provider, schema or business mutation.

const DEVICE_PATTERN = /(device|phone|mobile|tablet|desktop|viewport|screen|width|responsive|\b\d{3,4}\s*px\b)/i;

const ROLE_DEFINITIONS = Object.freeze([
  { id: "customer", key: "booking_e2e", title: "Customer workflow", role_pattern: /customer|booking|account|checkout|known customer|invite/i, requires_real_job: false },
  { id: "detailer", key: "mobile", title: "Detailer workflow", role_pattern: /detailer|field|assigned job|job workflow|mobile/i, requires_real_job: true },
  { id: "operations", key: "operations", title: "Operations workflow", role_pattern: /operations|dispatcher|dispatch|schedule|work queue|command cent(re|er)/i, requires_real_job: false },
  { id: "admin", key: "accessibility", title: "Admin workflow", role_pattern: /admin|administrator|back office|management/i, requires_real_job: false }
]);

export function buildProductionWorkflowEvidence({
  launch_evidence = [],
  job_handoff = {},
  generated_at = new Date().toISOString()
} = {}) {
  const rows = Array.isArray(launch_evidence) ? launch_evidence : [];
  const byKey = new Map(rows.map((row) => [clean(row?.evidence_key), row]));
  const handoffAvailable = job_handoff?.available === true;
  const jobsObserved = integer(job_handoff?.summary?.jobs_observed);
  const evidenceReadyJobs = integer(job_handoff?.summary?.evidence_ready);
  const completionOpen = integer(job_handoff?.summary?.completion_evidence_open);

  const roles = ROLE_DEFINITIONS.map((definition) =>
    classifyRole(definition, byKey.get(definition.key), { handoffAvailable, jobsObserved })
  );
  const required = roles.map((role) => ({
    id: role.id,
    title: role.title,
    status: role.status,
    classification: role.classification,
    detail: role.detail
  }));
  const outstanding = required.filter((row) => row.status !== "verified");

  return {
    generated_at,
    authority: "customer_staff_production_workflow_evidence",
    status: outstanding.length ? "hold" : "ready",
    decision: outstanding.length ? "workflow_evidence_incomplete" : "production_workflow_evidence_complete",
    scope: "bounded_production_observation",
    observed_window_days: integer(job_handoff?.window?.days) || null,
    observed_real_jobs: jobsObserved,
    evidence_ready_jobs: evidenceReadyJobs,
    completion_evidence_open: completionOpen,
    truth_boundary: {
      source_checks_are_not_real_device_proof: true,
      role_ceiling_inferred: false,
      role_access_changed: false,
      consent_inferred: false,
      customer_identity_exposed: false,
      evidence_note_exposed: false,
      cross_role_access_inferred: false,
      automatic_booking_created: false,
      automatic_message_sent: false,
      provider_contact_performed: false,
      business_data_mutation_performed: false
    },
    roles,
    required,
    outstanding: outstanding.map(({ id, title, status, classification }) => ({ id, title, status, classification }))
  };
}

function classifyRole(definition, row, { handoffAvailable, jobsObserved }) {
  const status = clean(row?.status) || "pending";
  const note = clean(row?.evidence_note);
  const verifiedAt = clean(row?.verified_at) || null;
  const roleLanguagePresent = definition.role_pattern.test(note);
  const deviceLanguagePresent = DEVICE_PATTERN.test(note);
  const datedObserved = status === "verified" && !!verifiedAt && !!note && roleLanguagePresent && deviceLanguagePresent;

  if (definition.requires_real_job && !handoffAvailable) {
    return {
      id: definition.id,
      key: definition.key,
      title: definition.title,
      status: "unavailable",
      classification: "unavailable",
      verified_at: null,
      evidence_note_present: !!note,
      role_language_present: roleLanguagePresent,
      device_or_viewport_language_present: deviceLanguagePresent,
      real_job_required: true,
      real_job_observed: false,
      evidence_note_exposed: false,
      detail: "The retained aggregate job-handoff source is unavailable, so real Detailer workflow observation cannot be proven."
    };
  }

  const realJobSatisfied = !definition.requires_real_job || jobsObserved > 0;
  const observed = datedObserved && realJobSatisfied;
  let detail;
  if (observed) {
    detail = definition.requires_real_job
      ? `A dated role-specific real-device/viewport observation is recorded and ${jobsObserved} eligible real job(s) are present in the bounded handoff window.`
      : "A dated role-specific real-device/viewport observation is recorded.";
  } else if (!datedObserved) {
    detail = "Record a verified dated observation that names this role workflow and the real device or representative viewport used.";
  } else {
    detail = "Role/device evidence is recorded, but no eligible real job is present in the bounded handoff window.";
  }

  return {
    id: definition.id,
    key: definition.key,
    title: definition.title,
    status: observed ? "verified" : "owner_action",
    classification: observed ? "owner_action_observed" : "owner_action",
    verified_at: observed ? verifiedAt : null,
    evidence_note_present: !!note,
    role_language_present: roleLanguagePresent,
    device_or_viewport_language_present: deviceLanguagePresent,
    real_job_required: definition.requires_real_job,
    real_job_observed: definition.requires_real_job ? jobsObserved > 0 : null,
    evidence_note_exposed: false,
    detail
  };
}
function integer(value) { const n=Number(value); return Number.isFinite(n)?Math.max(0,Math.trunc(n)):0; }
function clean(value) { return String(value ?? "").trim(); }
