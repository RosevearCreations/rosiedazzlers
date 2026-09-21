import assert from "node:assert/strict";
import { buildReliabilitySecurityCostReassessment } from "../functions/api/_lib/reliability-security-cost-reassessment.js";
import { buildReliabilityCostResilienceOperationalGuardrails } from "../functions/api/_lib/reliability-cost-resilience-operational-guardrails.js";

const generated = "2026-09-21T12:00:00.000Z";
const base = buildReliabilitySecurityCostReassessment({
  generated_at: generated,
  reliability: {
    diagnostics: { state: "stable", duration_ms: 400, failed_checks: 0, degraded_checks: 0 },
    traffic: { state: "stable", events_24h: 12, events_7d: 84, recent_to_prior_ratio: 1 }
  },
  security: {
    security: { state: "ready", risk_rows: 0, rls_disabled: 0, browser_grants: 0 },
    sessions: { state: "ready", staff_secret_configured: true, customer_secret_configured: true, legacy_admin_fallback_enabled: false },
    privacy: { state: "ready", current_explicit_consent_required: true, inferred_consent_allowed: false, definitive_delivery_requires_provider_evidence: true },
    recovery: { state: "owner_action", source_authority_available: true, observed_drill: false, production_mutation_performed: false }
  },
  readiness: {
    items: [
      { id: "runtime_identity", name: "Runtime identity", classification: "runtime_proven", detail: "exact", evidence: { latest_accepted_at: "2026-09-20T12:00:00.000Z" } },
      { id: "backup_old", name: "Backup evidence", classification: "owner_action", detail: "old", evidence: { latest_accepted_at: "2026-08-01T12:00:00.000Z" } },
      { id: "stripe_provider", name: "Stripe provider outcome", classification: "provider_dependent", detail: "external", evidence: { latest_accepted_at: "2026-09-18T12:00:00.000Z" } }
    ]
  },
  source_status: {
    reliability_performance_cost_capacity: { available: true },
    security_privacy_recovery_drill: { available: true },
    go_live_readiness: { available: true }
  }
});

const guarded = buildReliabilityCostResilienceOperationalGuardrails({ reassessment: base, generated_at: generated });
assert.equal(guarded.release_enrichment_build, 464);
assert.equal(guarded.release_authority, "reliability_cost_resilience_operational_guardrails");
assert.equal(guarded.operational_guardrails.provider_cost_quota.status, "external_evidence_required");
assert.equal(guarded.operational_guardrails.provider_cost_quota.cloudflare_quota_observed, false);
assert.equal(guarded.operational_guardrails.capacity_scaling.scaling_need_established, false);
assert.equal(guarded.operational_guardrails.recovery_resilience.real_production_restore_observed, false);
assert.equal(guarded.evidence_age_review.stale_count, 1);
assert.equal(guarded.evidence_age_review.status, "stale_revalidation_required");
assert.equal(guarded.boundaries.automatic_scaling_allowed, false);
assert.equal(guarded.boundaries.provider_mutation_allowed, false);
assert.equal(guarded.truth_boundary.stale_evidence_treated_as_current, false);

const pressureBase = buildReliabilitySecurityCostReassessment({
  generated_at: generated,
  reliability: {
    diagnostics: { state: "pressure", duration_ms: 3500, failed_checks: 1, degraded_checks: 0 },
    traffic: { state: "watch", events_24h: 80, events_7d: 160, recent_to_prior_ratio: 5 }
  },
  security: {
    security: { state: "ready" },
    sessions: { state: "ready" },
    privacy: { state: "ready" },
    recovery: { state: "owner_action" }
  },
  readiness: { items: [] },
  source_status: {
    reliability_performance_cost_capacity: { available: true },
    security_privacy_recovery_drill: { available: true },
    go_live_readiness: { available: true }
  }
});

const pressure = buildReliabilityCostResilienceOperationalGuardrails({ reassessment: pressureBase, generated_at: generated });
assert.equal(pressure.operational_guardrails.capacity_scaling.status, "operator_review");
assert.ok(pressure.operational_guardrails.capacity_scaling.operational_pressure_count > 0);
assert.equal(pressure.operational_guardrails.capacity_scaling.scaling_need_established, false);
assert.equal(pressure.boundaries.automatic_retry_expansion_allowed, false);

console.log("BUILD 464 RELIABILITY / COST / RESILIENCE OPERATIONAL GUARDRAILS TEST: PASS");
