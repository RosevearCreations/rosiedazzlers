// Durable launch-readiness consolidation authority.
// Read-only composition only: no provider contact, restore, export generation, schema change or business mutation.

const REQUIRED_OWNER_EVIDENCE = Object.freeze([
  "booking_e2e",
  "backups",
  "legal",
  "mobile",
  "accessibility",
  "analytics",
  "security",
  "monitoring",
  "operations"
]);

const RECOVERY_EVIDENCE = Object.freeze([
  "backups",
  "rollback_drill",
  "upload_recovery",
  "incident_closeout"
]);

const CONTROLLED_PILOT_EVIDENCE = Object.freeze([
  { id: "invite_scope", key: "operations", title: "Invite-only scope & operator ownership", note_pattern: /invite|known customer|internal|soft launch|controlled/i },
  { id: "booking", key: "booking_e2e", title: "Real booking path", note_pattern: /real|customer|internal|known|controlled|production|soft launch/i },
  { id: "communication", key: "email_delivery", title: "Consent-safe communication outcome", note_pattern: /deliver|message|email|sms|provider|controlled|production/i },
  { id: "mobile", key: "mobile", title: "Field / mobile workflow", note_pattern: /mobile|field|detailer|device|job|controlled/i },
  { id: "legal", key: "legal", title: "Current customer-facing policy / consent review" },
  { id: "incident_closeout", key: "incident_closeout", title: "Pilot incident closeout" }
]);

const EXPORT_CAPABILITIES = Object.freeze([
  {
    id: "accounting_export",
    label: "Accounting export",
    route: "/api/admin/accounting_export",
    classification: "source_ready",
    detail: "Authenticated CSV accounting exports exist; this readiness snapshot does not execute an export."
  },
  {
    id: "payment_accountant_package_export",
    label: "Payment accountant package",
    route: "/api/admin/payment_accountant_package_export",
    classification: "source_ready",
    detail: "Authenticated payment/refund accountant export exists; this readiness snapshot does not execute it."
  },
  {
    id: "editable_settings_audit_export",
    label: "Settings audit export",
    route: "/api/admin/editable_settings_audit_export",
    classification: "source_ready",
    detail: "Authenticated settings audit export exists; source availability is not proof of a recent retained backup."
  }
]);

export function buildLaunchReadinessConsolidation({
  readiness = {},
  support = {},
  launch_evidence = [],
  job_handoff = {},
  generated_at = new Date().toISOString()
} = {}) {
  const evidenceRows = Array.isArray(launch_evidence) ? launch_evidence : [];
  const evidenceByKey = new Map(evidenceRows.map((row) => [String(row?.evidence_key || "").trim(), row]));

  const runtimeItems = asArray(readiness?.items).filter((item) => item?.required_for_runtime === true);
  const runtimeUnavailable = runtimeItems.filter((item) => item?.classification === "unavailable");
  const supportCritical = integer(support?.alert_counts?.critical);
  const supportWarning = integer(support?.alert_counts?.warning);

  const externalHolds = asArray(readiness?.items)
    .filter((item) => ["provider_dependent", "owner_action"].includes(String(item?.classification || "")))
    .map((item) => ({
      id: clean(item?.id),
      title: clean(item?.title) || clean(item?.name) || "External evidence",
      classification: clean(item?.classification) || "owner_action",
      detail: clean(item?.detail),
      remediation: clean(item?.remediation)
    }));

  const requiredEvidence = REQUIRED_OWNER_EVIDENCE.map((key) => evidenceState(key, evidenceByKey.get(key)));
  const requiredOutstanding = requiredEvidence.filter((row) => row.status !== "verified");

  const recoveryEvidence = RECOVERY_EVIDENCE.map((key) => evidenceState(key, evidenceByKey.get(key)));
  const backupObserved = recoveryEvidence.find((row) => row.key === "backups")?.status === "verified";
  const rollbackObserved = recoveryEvidence.find((row) => row.key === "rollback_drill")?.status === "verified";

  const controlledSoftLaunch = buildControlledSoftLaunch({
    evidenceByKey,
    supportCritical,
    jobHandoff: job_handoff
  });

  const verifiedCount = evidenceRows.filter((row) => String(row?.status || "") === "verified").length;
  const failedCount = evidenceRows.filter((row) => String(row?.status || "") === "failed").length;
  const waivedCount = evidenceRows.filter((row) => String(row?.status || "") === "waived").length;
  const pendingCount = evidenceRows.filter((row) => !["verified", "failed", "waived"].includes(String(row?.status || ""))).length;

  const runtimeBlocked = runtimeUnavailable.length > 0 || supportCritical > 0;
  const controlledLaunchReady = !runtimeBlocked && requiredOutstanding.length === 0;
  const unrestrictedLaunchReady = controlledLaunchReady && externalHolds.length === 0 && failedCount === 0;

  const decision = runtimeBlocked
    ? "runtime_blocked"
    : unrestrictedLaunchReady
      ? "unrestricted_launch_evidence_complete"
      : controlledLaunchReady
        ? "controlled_launch_ready_external_holds_remain"
        : "controlled_launch_hold";

  return {
    generated_at,
    authority: "launch_readiness_consolidation",
    decision,
    source_runtime_status: runtimeBlocked ? "blocked" : "green",
    controlled_launch_status: controlledLaunchReady ? "ready" : "hold",
    unrestricted_launch_status: unrestrictedLaunchReady ? "ready" : "hold",
    truth_boundary: {
      source_runtime_green_is_not_unrestricted_launch_green: true,
      export_route_presence_is_not_backup_proof: true,
      provider_success_inferred: false,
      visual_proof_inferred: false,
      real_customer_journey_inferred: false,
      invite_only_scope_inferred: false,
      customer_identity_exposed: false,
      automatic_outreach_performed: false,
      restore_performed: false,
      export_performed: false,
      provider_contact_performed: false,
      business_mutation_performed: false
    },
    runtime: {
      required_items: runtimeItems.length,
      unavailable_required_items: runtimeUnavailable.map((item) => ({
        id: clean(item?.id),
        title: clean(item?.title) || clean(item?.name),
        detail: clean(item?.detail),
        remediation: clean(item?.remediation)
      })),
      support_critical: supportCritical,
      support_warning: supportWarning,
      release_identity: pickReleaseIdentity(readiness, support)
    },
    launch_evidence: {
      total: evidenceRows.length,
      verified: verifiedCount,
      failed: failedCount,
      waived: waivedCount,
      pending: pendingCount,
      required: requiredEvidence,
      required_outstanding: requiredOutstanding
    },
    recovery: {
      backup_evidence_observed: backupObserved,
      rollback_drill_observed: rollbackObserved,
      items: recoveryEvidence,
      rule: "A source route or repository file never proves that a current restorable backup/export exists."
    },
    exports: EXPORT_CAPABILITIES,
    controlled_soft_launch: controlledSoftLaunch,
    external_holds: externalHolds,
    next_actions: buildActions({
      runtimeUnavailable,
      supportCritical,
      requiredOutstanding,
      externalHolds,
      backupObserved,
      rollbackObserved,
      controlledSoftLaunch
    })
  };
}

function evidenceState(key, row) {
  const status = clean(row?.status) || "pending";
  return {
    key,
    status,
    verified_at: clean(row?.verified_at) || null,
    has_note: !!clean(row?.evidence_note),
    classification: status === "verified" ? "owner_action_observed" : "owner_action"
  };
}

function buildActions({
  runtimeUnavailable,
  supportCritical,
  requiredOutstanding,
  externalHolds,
  backupObserved,
  rollbackObserved,
  controlledSoftLaunch
}) {
  const actions = [];
  if (supportCritical > 0 || runtimeUnavailable.length) {
    actions.push({
      priority: "blocker",
      action: "Resolve current runtime/diagnostic blockers and rerun exact-SHA acceptance before relying on launch readiness."
    });
  }
  if (!backupObserved) {
    actions.push({
      priority: "owner_action",
      action: "Record current backup/export evidence only after confirming a real restorable/exportable artifact and its retention location."
    });
  }
  if (!rollbackObserved) {
    actions.push({
      priority: "owner_action",
      action: "Record a bounded recovery/rollback drill after observing the approved recovery procedure; do not perform a Production restore merely to clear this item."
    });
  }
  for (const row of requiredOutstanding.slice(0, 6)) {
    actions.push({
      priority: "owner_action",
      action: `Complete and record launch evidence for ${row.key.replaceAll("_", " ")}.`
    });
  }
  if (controlledSoftLaunch?.status !== "ready") {
    actions.push({
      priority: "owner_action",
      action: `Controlled soft launch remains on HOLD with ${controlledSoftLaunch?.outstanding?.length || 0} pilot evidence item(s) outstanding. Use only authorized internal/known-customer scenarios and record observed evidence without customer-identifying notes.`
    });
  }
  if (externalHolds.length) {
    actions.push({
      priority: "external_hold",
      action: `${externalHolds.length} provider/owner evidence item(s) remain outside source/runtime acceptance. Review them without inventing success.`
    });
  }
  if (!actions.length) {
    actions.push({
      priority: "observe",
      action: "Continue controlled Production observation and keep evidence dated; any new source write requires exact-SHA reacceptance."
    });
  }
  return actions;
}

function buildControlledSoftLaunch({ evidenceByKey, supportCritical, jobHandoff }) {
  const handoffAvailable = jobHandoff?.available === true;
  const summary = jobHandoff?.summary || {};
  const jobsObserved = integer(summary?.jobs_observed);
  const evidenceReadyJobs = integer(summary?.evidence_ready);
  const completionOpen = integer(summary?.completion_evidence_open);
  const stages = CONTROLLED_PILOT_EVIDENCE.map((definition) =>
    pilotEvidenceState(definition, evidenceByKey.get(definition.key))
  );
  const mobileVerified = stages.find((row) => row.id === "mobile")?.status === "verified";
  stages.push({
    id: "field_observation",
    title: "Observed field workflow",
    status: !handoffAvailable ? "unavailable" : (mobileVerified && jobsObserved > 0 ? "verified" : "owner_action"),
    classification: !handoffAvailable ? "unavailable" : (mobileVerified && jobsObserved > 0 ? "owner_action_observed" : "owner_action"),
    detail: !handoffAvailable ? "The retained job-handoff evidence source is unavailable to this operator/session." : jobsObserved > 0 ? `${jobsObserved} eligible real job(s) are present in the bounded handoff window.` : "No eligible real job is present in the bounded handoff window; source checks do not create one."
  });
  stages.push({
    id: "completion_observation",
    title: "Observed completion / office handoff",
    status: !handoffAvailable ? "unavailable" : (evidenceReadyJobs > 0 ? "verified" : "owner_action"),
    classification: !handoffAvailable ? "unavailable" : (evidenceReadyJobs > 0 ? "owner_action_observed" : "owner_action"),
    detail: !handoffAvailable ? "Completion evidence cannot be evaluated from the retained handoff source." : evidenceReadyJobs > 0 ? `${evidenceReadyJobs} job(s) contain the retained before/field/completion/after evidence set.` : "No real job currently satisfies the retained completion-evidence set."
  });
  const monitoring = evidenceState("monitoring", evidenceByKey.get("monitoring"));
  stages.push({
    id: "support_observation",
    title: "Support / monitoring observation",
    status: monitoring.status === "verified" && supportCritical === 0 ? "verified" : "owner_action",
    classification: monitoring.status === "verified" && supportCritical === 0 ? "owner_action_observed" : "owner_action",
    detail: supportCritical > 0 ? `${supportCritical} critical support alert(s) are still active.` : monitoring.status === "verified" ? "Monitoring evidence is recorded and no critical support alert is active." : "Monitoring evidence still requires an operator-observed record."
  });
  const outstanding = stages.filter((row) => row.status !== "verified");
  return {
    status: outstanding.length ? "hold" : "ready",
    decision: outstanding.length ? "pilot_evidence_incomplete" : "controlled_pilot_evidence_complete",
    scope: "invite_only_authorized_internal_or_known_customer",
    source_available: handoffAvailable,
    observed_window_days: integer(jobHandoff?.window?.days) || null,
    observed_real_jobs: jobsObserved,
    evidence_ready_jobs: evidenceReadyJobs,
    completion_evidence_open: completionOpen,
    customer_identity_exposed: false,
    participant_authorization_inferred: false,
    provider_success_inferred: false,
    automatic_booking_created: false,
    automatic_message_sent: false,
    stages,
    outstanding: outstanding.map((row) => ({ id: row.id, title: row.title, status: row.status }))
  };
}

function pilotEvidenceState(definition, row) {
  const status = clean(row?.status) || "pending";
  const note = clean(row?.evidence_note);
  const noteMatches = definition.note_pattern ? definition.note_pattern.test(note) : true;
  const verified = status === "verified" && !!note && noteMatches;
  return {
    id: definition.id,
    key: definition.key,
    title: definition.title,
    status: verified ? "verified" : "owner_action",
    classification: verified ? "owner_action_observed" : "owner_action",
    verified_at: verified ? (clean(row?.verified_at) || null) : null,
    note_present: !!note,
    note_matches_scope: noteMatches,
    detail: verified ? "Observed evidence is recorded for this controlled-pilot stage." : definition.note_pattern && note && !noteMatches ? "Evidence exists, but its note does not establish the controlled real-world pilot scope." : "Observed controlled-pilot evidence is still required."
  };
}

function pickReleaseIdentity(readiness, support) {
  const runtime = asArray(readiness?.items).find((item) => item?.id === "runtime_identity")?.evidence || {};
  const supportIdentity = support?.release_identity || support?.runtime_identity || {};
  return {
    commit_sha: clean(runtime?.commit_sha) || clean(supportIdentity?.commit_sha) || null,
    branch: clean(runtime?.branch) || clean(supportIdentity?.branch) || null,
    host: clean(runtime?.host) || clean(supportIdentity?.host) || null
  };
}

function asArray(value) { return Array.isArray(value) ? value : []; }
function integer(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}
function clean(value) { return String(value ?? "").trim(); }
