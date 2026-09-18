import assert from "node:assert/strict";
import { buildRecoveryExportOperationalProof } from "../functions/api/_lib/recovery-export-operational-proof.js";

const launchEvidence = [
  {
    evidence_key: "backups",
    status: "verified",
    verified_at: "2026-09-18T17:00:00Z",
    evidence_note: "Current Supabase backup snapshot and accountant package export CSV retained in secure cloud archive storage."
  },
  {
    evidence_key: "rollback_drill",
    status: "verified",
    verified_at: "2026-09-18T17:10:00Z",
    evidence_note: "Read-only rollback recovery drill observed against a known-good recovery point; no Production restore performed."
  },
  {
    evidence_key: "upload_recovery",
    status: "verified",
    verified_at: "2026-09-18T17:15:00Z",
    evidence_note: "R2 media upload recovery path observed without mutation."
  }
];

const financeReady = {
  status: "ready",
  scenarios: {
    accountant_export: {
      status: "ready",
      evidence: { manual_approval_required: true }
    }
  },
  export_manifest: {
    accountant_package: "/api/admin/accounting_accountant_package?year=2026",
    csv_exports: [
      { type: "general_ledger", endpoint: "/api/admin/accounting_export?type=general_ledger&year=2026" },
      { type: "profit_and_loss", endpoint: "/api/admin/accounting_export?type=profit_and_loss&year=2026" },
      { type: "balance_sheet", endpoint: "/api/admin/accounting_export?type=balance_sheet&year=2026" }
    ]
  }
};

const ready = buildRecoveryExportOperationalProof({
  launch_evidence: launchEvidence,
  finance_acceptance: financeReady
});
assert.equal(ready.status, "ready");
assert.equal(ready.backup.artifact_observed, true);
assert.equal(ready.backup.retention_location_observed, true);
assert.equal(ready.recovery_drill.observed, true);
assert.equal(ready.accountant_export.usable, true);
assert.equal(ready.accountant_export.classification, "runtime_proven");
assert.equal(ready.export_artifact.observed, true);
assert.equal(ready.truth_boundary.production_restore_performed, false);
assert.equal(ready.truth_boundary.export_generation_performed, false);
assert.equal(ready.truth_boundary.retention_location_inferred, false);
assert.equal(ready.backup.evidence_note_exposed, false);
assert.equal(ready.export_artifact.evidence_note_exposed, false);

const missingRetention = buildRecoveryExportOperationalProof({
  launch_evidence: [
    {
      evidence_key: "backups",
      status: "verified",
      verified_at: "2026-09-18T17:00:00Z",
      evidence_note: "Current backup snapshot observed."
    },
    launchEvidence[1]
  ],
  finance_acceptance: financeReady
});
assert.equal(missingRetention.status, "hold");
assert.equal(missingRetention.backup.artifact_observed, true);
assert.equal(missingRetention.backup.retention_location_observed, false);
assert.ok(missingRetention.outstanding.some((row) => row.id === "retention_location"));
assert.ok(missingRetention.outstanding.some((row) => row.id === "accountant_export_artifact"));

const financeReview = buildRecoveryExportOperationalProof({
  launch_evidence: launchEvidence,
  finance_acceptance: {
    ...financeReady,
    status: "review",
    scenarios: { accountant_export: { status: "review", evidence: { manual_approval_required: true } } }
  }
});
assert.equal(financeReview.status, "hold");
assert.equal(financeReview.accountant_export.usable, false);
assert.equal(financeReview.accountant_export.classification, "owner_action");
assert.ok(financeReview.outstanding.some((row) => row.id === "accountant_export_usability"));

const unavailable = buildRecoveryExportOperationalProof({
  launch_evidence: [],
  finance_acceptance: null
});
assert.equal(unavailable.status, "hold");
assert.equal(unavailable.accountant_export.classification, "unavailable");
assert.equal(unavailable.truth_boundary.source_route_presence_is_not_artifact_proof, true);
assert.equal(unavailable.truth_boundary.recovery_drill_executed_by_source, false);

console.log("BACKUP RESTORE ACCOUNTANT EXPORT OPERATIONAL PROOF TEST: PASS");
console.log(" - backup artifact and retention location remain owner-observed evidence");
console.log(" - recovery drill evidence is separate from source acceptance");
console.log(" - accountant-export usability comes from canonical read-only Finance acceptance");
console.log(" - source routes never fabricate retained export artifacts");
console.log(" - no restore or export generation is performed");
