// Build 418 — Backup, Restore & Accountant Export Operational Proof
// Pure evidence classification only. No restore, export generation, provider call, schema or business mutation.

const ARTIFACT_PATTERN = /(backup|snapshot|export|dump|artifact|archive|point[- ]?in[- ]?time|pitr)/i;
const RETENTION_PATTERN = /(retention|retained|stored|storage|vault|bucket|archive|backup location|drive|supabase|cloud|offsite|r2)/i;
const EXPORT_PATTERN = /(accountant|accounting export|export package|year[- ]?end|csv|general ledger|profit and loss|balance sheet|accountant package)/i;
const DRILL_PATTERN = /(rollback|restore|recovery|drill|known[- ]?good|recovery point)/i;

export function buildRecoveryExportOperationalProof({
  launch_evidence = [],
  finance_acceptance = null,
  generated_at = new Date().toISOString()
} = {}) {
  const rows = Array.isArray(launch_evidence) ? launch_evidence : [];
  const byKey = new Map(rows.map((row) => [clean(row?.evidence_key), row]));
  const backupRow = byKey.get("backups") || null;
  const rollbackRow = byKey.get("rollback_drill") || null;
  const uploadRecoveryRow = byKey.get("upload_recovery") || null;

  const backup = classifyBackupEvidence(backupRow);
  const recoveryDrill = classifyRecoveryDrill(rollbackRow);
  const mediaRecovery = classifyOptionalEvidence(uploadRecoveryRow, /upload|media|r2|recovery|restore/i);
  const accountantExport = classifyAccountantExport(finance_acceptance);
  const exportArtifact = classifyRetainedExportArtifact(backupRow);

  const required = [
    stage("backup_artifact", "Current backup artifact observed", backup.artifact_observed, backup.classification,
      backup.artifact_observed
        ? "A dated owner-observed backup artifact is recorded."
        : "A source route or recovery runbook does not prove that a current backup artifact exists."),
    stage("retention_location", "Backup retention location observed", backup.retention_location_observed, backup.classification,
      backup.retention_location_observed
        ? "The verified backup evidence records a retention/storage location without exposing the note contents."
        : "Record where the verified backup is retained before treating backup recovery as operationally proven."),
    stage("recovery_drill", "Recovery / rollback drill observed", recoveryDrill.observed, recoveryDrill.classification,
      recoveryDrill.observed
        ? "A dated recovery/rollback drill observation is recorded."
        : "A separately authorized recovery/rollback drill still requires observed evidence; source acceptance does not execute one."),
    stage("accountant_export_usability", "Accountant export usability", accountantExport.usable, accountantExport.classification,
      accountantExport.detail),
    stage("accountant_export_artifact", "Retained accountant-export artifact observed", exportArtifact.observed, exportArtifact.classification,
      exportArtifact.observed
        ? "The verified evidence records an accountant/export artifact together with a retention location."
        : "Export routes and finance readiness do not prove that a current accountant-export artifact has been generated and retained.")
  ];

  const outstanding = required.filter((row) => row.status !== "verified");

  return {
    generated_at,
    authority: "backup_restore_accountant_export_operational_proof",
    status: outstanding.length ? "hold" : "ready",
    decision: outstanding.length ? "operational_proof_incomplete" : "operational_proof_complete",
    truth_boundary: {
      source_route_presence_is_not_artifact_proof: true,
      production_restore_performed: false,
      export_generation_performed: false,
      recovery_drill_executed_by_source: false,
      retention_location_inferred: false,
      provider_contact_performed: false,
      accounting_mutation_performed: false,
      business_data_mutation_performed: false,
      customer_identity_exposed: false
    },
    backup,
    recovery_drill: recoveryDrill,
    media_recovery: mediaRecovery,
    accountant_export: accountantExport,
    export_artifact: exportArtifact,
    required,
    outstanding: outstanding.map(({ id, title, status, classification }) => ({ id, title, status, classification }))
  };
}

function classifyBackupEvidence(row) {
  const status = clean(row?.status) || "pending";
  const note = clean(row?.evidence_note);
  const verifiedAt = clean(row?.verified_at) || null;
  const verified = status === "verified" && !!verifiedAt && !!note;
  const artifactObserved = verified && ARTIFACT_PATTERN.test(note);
  const retentionObserved = verified && RETENTION_PATTERN.test(note);
  return {
    status,
    classification: verified ? "owner_action_observed" : "owner_action",
    verified_at: verifiedAt,
    artifact_observed: artifactObserved,
    retention_location_observed: retentionObserved,
    evidence_note_present: !!note,
    artifact_language_present: ARTIFACT_PATTERN.test(note),
    retention_language_present: RETENTION_PATTERN.test(note),
    evidence_note_exposed: false
  };
}

function classifyRecoveryDrill(row) {
  const status = clean(row?.status) || "pending";
  const note = clean(row?.evidence_note);
  const verifiedAt = clean(row?.verified_at) || null;
  const observed = status === "verified" && !!verifiedAt && !!note && DRILL_PATTERN.test(note);
  return {
    status,
    classification: observed ? "owner_action_observed" : "owner_action",
    observed,
    verified_at: observed ? verifiedAt : null,
    note_present: !!note,
    scope_language_present: DRILL_PATTERN.test(note),
    production_restore_inferred: false,
    evidence_note_exposed: false
  };
}

function classifyOptionalEvidence(row, pattern) {
  const status = clean(row?.status) || "pending";
  const note = clean(row?.evidence_note);
  const verifiedAt = clean(row?.verified_at) || null;
  const observed = status === "verified" && !!verifiedAt && !!note && pattern.test(note);
  return {
    status,
    classification: observed ? "owner_action_observed" : "owner_action",
    observed,
    verified_at: observed ? verifiedAt : null,
    note_present: !!note,
    evidence_note_exposed: false
  };
}

function classifyAccountantExport(finance) {
  if (!finance || typeof finance !== "object") {
    return {
      status: "unavailable",
      classification: "unavailable",
      usable: false,
      finance_status: "unavailable",
      package_route_present: false,
      csv_export_count: 0,
      export_types: [],
      detail: "Finance close/accountant-export evidence is unavailable from the canonical read-only authority."
    };
  }

  const scenario = finance?.scenarios?.accountant_export || {};
  const manifest = finance?.export_manifest || {};
  const csv = Array.isArray(manifest?.csv_exports) ? manifest.csv_exports : [];
  const packageRoute = clean(manifest?.accountant_package);
  const manifestValid = packageRoute.startsWith("/api/admin/accounting_accountant_package")
    && csv.length > 0
    && csv.every((row) => clean(row?.endpoint).startsWith("/api/admin/accounting_export"));

  const scenarioStatus = clean(scenario?.status) || "unavailable";
  const usable = scenarioStatus === "ready" && manifestValid;
  const classification = usable
    ? "runtime_proven"
    : scenarioStatus === "unavailable"
      ? "unavailable"
      : "owner_action";

  return {
    status: usable ? "ready" : scenarioStatus,
    classification,
    usable,
    finance_status: clean(finance?.status) || "unavailable",
    package_route_present: !!packageRoute,
    csv_export_count: csv.length,
    export_types: csv.map((row) => clean(row?.type)).filter(Boolean),
    manual_approval_required: scenario?.evidence?.manual_approval_required !== false,
    detail: usable
      ? "The canonical read-only Finance acceptance authority reports accountant-export readiness and exposes its retained package/CSV manifest."
      : scenarioStatus === "review"
        ? "Accountant export remains review-required by the canonical Finance acceptance authority."
        : "Accountant-export usability cannot currently be proven from the canonical Finance acceptance authority."
  };
}

function classifyRetainedExportArtifact(row) {
  const status = clean(row?.status) || "pending";
  const note = clean(row?.evidence_note);
  const verifiedAt = clean(row?.verified_at) || null;
  const observed = status === "verified"
    && !!verifiedAt
    && EXPORT_PATTERN.test(note)
    && ARTIFACT_PATTERN.test(note)
    && RETENTION_PATTERN.test(note);
  return {
    status: observed ? "verified" : "owner_action",
    classification: observed ? "owner_action_observed" : "owner_action",
    observed,
    verified_at: observed ? verifiedAt : null,
    export_language_present: EXPORT_PATTERN.test(note),
    artifact_language_present: ARTIFACT_PATTERN.test(note),
    retention_language_present: RETENTION_PATTERN.test(note),
    evidence_note_exposed: false
  };
}

function stage(id, title, verified, fallbackClassification, detail) {
  const classification = verified ? "owner_action_observed" : (fallbackClassification || "owner_action");
  return {
    id,
    title,
    status: verified ? "verified" : (classification === "unavailable" ? "unavailable" : "owner_action"),
    classification,
    detail
  };
}

function clean(value) { return String(value ?? "").trim(); }
