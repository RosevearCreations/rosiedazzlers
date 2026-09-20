// Build 419 — Customer & Staff Production Workflow Evidence
// Retains Build 418 recovery/export proof, Build 417 provider-evidence closure and Build 416 controlled soft-launch acceptance.
// Read-only composition only: no restore, export generation, provider contact or business mutation.

import { onRequestGet as getGoLiveReadiness } from "./go_live_readiness.js";
import { onRequestGet as getProductionDiagnostics } from "./production_diagnostics.js";
import { onRequestGet as getProviderEvidenceClosure } from "./provider_evidence_closure.js";
import { onRequestGet as getRecoveryExportOperationalProof } from "./recovery_export_operational_proof.js";
import { buildProductionSupportDiagnostics } from "../_lib/production-support-diagnostics.js";
import { listLaunchEvidence } from "../_lib/launch-readiness-evidence.js";
import { buildLaunchReadinessConsolidation } from "../_lib/launch-readiness-consolidation.js";
import { buildProductionWorkflowEvidence } from "../_lib/production-workflow-evidence.js";
import { buildProviderOutcomeDeliveryEvidence } from "../_lib/provider-outcome-delivery-evidence.js";
import { buildProviderEvidenceReconciliationRefresh } from "../_lib/provider-evidence-reconciliation-refresh.js";
import { buildProviderEvidenceClosureAvailabilityReview } from "../_lib/provider-evidence-closure-availability-review.js";
import { buildBackupRecoveryEvidenceClosure } from "../_lib/backup-recovery-evidence-closure.js";
import { buildRecoveryArtifactDrillEvidenceReview } from "../_lib/recovery-artifact-drill-evidence-review.js";
import { buildRecoveryEvidenceClosureDrillReadiness } from "../_lib/recovery-evidence-closure-drill-readiness.js";
import { buildAuthenticatedDeviceVisualAcceptance } from "../_lib/authenticated-device-visual-acceptance.js";
import { onRequestPost as getJobHandoffEvidence } from "./job_handoff_evidence.js";

export async function onRequestGet({ request, env }) {
  const generatedAt = new Date().toISOString();

  const [
    readinessResult,
    diagnosticsResult,
    launchEvidenceResult,
    jobHandoffResult,
    providerClosureResult,
    recoveryExportResult
  ] = await Promise.all([
    collect(() => getGoLiveReadiness({ request: request.clone(), env })),
    collect(() => getProductionDiagnostics({ request: request.clone(), env })),
    collectLaunchEvidence(env),
    collectJobHandoff(request, env),
    collect(() => getProviderEvidenceClosure({ request: request.clone(), env })),
    collect(() => getRecoveryExportOperationalProof({ request: request.clone(), env }))
  ]);

  for (const result of [readinessResult, diagnosticsResult, providerClosureResult, recoveryExportResult]) {
    if (result.status === 401 || result.status === 403) {
      return json({ ok: false, error: "Unauthorized." }, result.status);
    }
  }

  const sourceErrors = [];
  if (!readinessResult.ok) sourceErrors.push({ source: "go_live_readiness", action: "Restore the authenticated readiness source and refresh manually." });
  if (!diagnosticsResult.ok) sourceErrors.push({ source: "production_diagnostics", action: "Restore Production diagnostics and refresh manually." });
  if (!launchEvidenceResult.ok) sourceErrors.push({ source: "launch_readiness_evidence", action: "Restore the retained launch-evidence source; missing evidence remains unavailable." });
  if (!providerClosureResult.ok) sourceErrors.push({ source: "provider_evidence_closure", action: "Restore the read-only provider evidence source; missing provider evidence remains a HOLD." });
  if (!recoveryExportResult.ok) sourceErrors.push({ source: "recovery_export_operational_proof", action: "Restore the read-only recovery/export evidence source; missing artifact proof remains a HOLD." });

  const support = buildProductionSupportDiagnostics({
    readiness: readinessResult.data || {},
    diagnostics: diagnosticsResult.data || {},
    source_errors: sourceErrors,
    generated_at: generatedAt
  });

  const consolidation = buildLaunchReadinessConsolidation({
    readiness: readinessResult.data || {},
    support,
    launch_evidence: launchEvidenceResult.items,
    job_handoff: jobHandoffResult,
    generated_at: generatedAt
  });

  const productionWorkflowEvidence = buildProductionWorkflowEvidence({
    launch_evidence: launchEvidenceResult.items,
    job_handoff: jobHandoffResult,
    generated_at: generatedAt
  });

  const providerOutcomeDeliveryEvidence = buildProviderOutcomeDeliveryEvidence({
    closure: providerClosureResult.data?.closure || {},
    generated_at: generatedAt
  });

  const providerEvidenceReconciliationRefresh = buildProviderEvidenceReconciliationRefresh({
    closure: providerClosureResult.data?.closure || {},
    outcome: providerOutcomeDeliveryEvidence,
    generated_at: generatedAt
  });

  const providerEvidenceClosureAvailabilityReview = buildProviderEvidenceClosureAvailabilityReview({
    reconciliation: providerEvidenceReconciliationRefresh,
    outcome: providerOutcomeDeliveryEvidence,
    generated_at: generatedAt
  });

  const backupRecoveryEvidenceClosure = buildBackupRecoveryEvidenceClosure({
    proof: recoveryExportResult.data?.proof || null,
    source_available: recoveryExportResult.ok && Boolean(recoveryExportResult.data?.proof),
    generated_at: generatedAt
  });

  const recoveryArtifactDrillEvidenceReview = buildRecoveryArtifactDrillEvidenceReview({
    closure: backupRecoveryEvidenceClosure,
    generated_at: generatedAt
  });

  const recoveryEvidenceClosureDrillReadiness = buildRecoveryEvidenceClosureDrillReadiness({
    closure: backupRecoveryEvidenceClosure,
    review: recoveryArtifactDrillEvidenceReview,
    source_available: recoveryExportResult.ok && Boolean(recoveryExportResult.data?.proof),
    generated_at: generatedAt
  });

  const authenticatedDeviceVisualAcceptance = buildAuthenticatedDeviceVisualAcceptance({
    launch_evidence: launchEvidenceResult.items,
    workflow_evidence: productionWorkflowEvidence,
    source_available: launchEvidenceResult.ok && Boolean(productionWorkflowEvidence),
    generated_at: generatedAt
  });

  return json({
    ok: consolidation.source_runtime_status === "green",
    build: 419,
    authority: "customer_staff_production_workflow_evidence",
    retained_recovery_build: 418,
    retained_recovery_authority: "backup_restore_accountant_export_operational_proof",
    retained_provider_build: 417,
    retained_provider_authority: "payment_refund_delivery_provider_evidence_closure",
    retained_build: 416,
    retained_authority: "controlled_soft_launch_real_world_acceptance",
    capstone_retained_authority: "launch_readiness_consolidation_next_roadmap_renewal",
    production_workflow_evidence: productionWorkflowEvidence,
    provider_evidence_closure: providerClosureResult.data?.closure || null,
    provider_outcome_delivery_evidence: providerOutcomeDeliveryEvidence,
    current_provider_evidence_authority: "provider_outcome_delivery_evidence_closure",
    provider_evidence_reconciliation_refresh: providerEvidenceReconciliationRefresh,
    current_provider_reconciliation_authority: "provider_evidence_reconciliation_refresh",
    provider_evidence_closure_availability_review: providerEvidenceClosureAvailabilityReview,
    current_provider_availability_review_authority: "provider_evidence_closure_availability_review",
    recovery_export_operational_proof: recoveryExportResult.data?.proof || null,
    backup_recovery_evidence_closure: backupRecoveryEvidenceClosure,
    current_recovery_evidence_authority: "backup_recovery_evidence_closure",
    recovery_artifact_drill_evidence_review: recoveryArtifactDrillEvidenceReview,
    current_recovery_review_authority: "recovery_artifact_drill_evidence_review",
    recovery_evidence_closure_drill_readiness: recoveryEvidenceClosureDrillReadiness,
    current_recovery_closure_readiness_authority: "recovery_evidence_closure_drill_readiness",
    authenticated_device_visual_acceptance: authenticatedDeviceVisualAcceptance,
    current_device_visual_authority: "authenticated_device_visual_acceptance",
    source_status: {
      go_live_readiness: state(readinessResult),
      production_diagnostics: state(diagnosticsResult),
      provider_evidence_closure: state(providerClosureResult),
      recovery_export_operational_proof: state(recoveryExportResult),
      launch_readiness_evidence: {
        available: launchEvidenceResult.ok,
        warning: launchEvidenceResult.warning || null
      },
      job_handoff_evidence: {
        available: jobHandoffResult.available,
        http_status: jobHandoffResult.http_status,
        warning: jobHandoffResult.warning || null
      },
      production_workflow_evidence: {
        available: launchEvidenceResult.ok && jobHandoffResult.available,
        classification: productionWorkflowEvidence.status
      },
      provider_evidence_reconciliation_refresh: {
        available: providerClosureResult.ok,
        classification: providerEvidenceReconciliationRefresh.status
      },
      provider_evidence_closure_availability_review: {
        available: providerClosureResult.ok,
        classification: providerEvidenceClosureAvailabilityReview.status
      },
      recovery_artifact_drill_evidence_review: {
        available: recoveryExportResult.ok,
        classification: recoveryArtifactDrillEvidenceReview.status
      },
      recovery_evidence_closure_drill_readiness: {
        available: recoveryExportResult.ok,
        classification: recoveryEvidenceClosureDrillReadiness.status
      },
      authenticated_device_visual_acceptance: {
        available: launchEvidenceResult.ok,
        classification: authenticatedDeviceVisualAcceptance.status
      }
    },
    ...consolidation
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", Allow: "GET, HEAD, OPTIONS" }
  });
}

async function collect(runner) {
  try {
    const response = await runner();
    const data = await response.json().catch(() => null);
    return { ok: response.ok && Boolean(data), status: response.status, data };
  } catch (error) {
    return { ok: false, status: 503, data: null, error_class: error?.name || "Error" };
  }
}

async function collectLaunchEvidence(env) {
  try {
    const result = await listLaunchEvidence(env);
    return {
      ok: result?.ready === true,
      warning: result?.warning || null,
      items: Array.isArray(result?.items) ? result.items : []
    };
  } catch (error) {
    return { ok: false, warning: error?.message || "Launch evidence unavailable.", items: [] };
  }
}

async function collectJobHandoff(request, env) {
  try {
    const headers = new Headers(request.headers);
    headers.set("Content-Type", "application/json");
    const pilotRequest = new Request(request.url, { method: "POST", headers, body: JSON.stringify({ days: 45 }) });
    const response = await getJobHandoffEvidence({ request: pilotRequest, env });
    const data = await response.json().catch(() => null);
    return {
      available: response.ok && data?.ok === true,
      http_status: response.status,
      warning: response.ok ? null : (data?.error || "Job-handoff evidence is unavailable to this operator/session."),
      summary: data?.summary || {},
      window: data?.window || {}
    };
  } catch (error) {
    return { available: false, http_status: 503, warning: error?.message || "Job-handoff evidence is unavailable.", summary: {}, window: {} };
  }
}

function state(result) {
  return {
    available: result?.ok === true,
    http_status: Number(result?.status) || null,
    error_class: result?.error_class || null
  };
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Launch-Readiness": "build-418-read-only"
    }
  });
}
