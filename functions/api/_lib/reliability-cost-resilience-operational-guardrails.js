// Build 464 — Reliability, Cost & Resilience Operational Guardrails.
// Additive read-only enrichment over the retained Reliability/Security/Cost reassessment.

const DAY_MS = 24 * 60 * 60 * 1000;
const CURRENT_MAX_DAYS = 7;
const STALE_AFTER_DAYS = 30;

export function buildReliabilityCostResilienceOperationalGuardrails({ reassessment = {}, generated_at = null } = {}) {
  const nowIso = safeIso(generated_at) || safeIso(reassessment?.generated_at) || new Date().toISOString();
  const age = buildEvidenceAgeReview(reassessment, nowIso);
  const pressureCount = finiteNonNegative(reassessment?.counts?.operational_pressure) || 0;
  const unavailableCount = finiteNonNegative(reassessment?.counts?.unavailable_evidence) || 0;
  const ownerActionCount = finiteNonNegative(reassessment?.counts?.owner_action) || 0;
  const providerDependencyCount = finiteNonNegative(reassessment?.counts?.provider_dependency) || 0;

  const operationalGuardrails = {
    provider_cost_quota: Object.freeze({
      status: "external_evidence_required",
      provider_owned_evidence_required: true,
      cloudflare_billing_observed: false,
      cloudflare_cpu_observed: false,
      cloudflare_quota_observed: false,
      dollar_cost_observed: false,
      first_party_traffic_is_billing_proxy: false,
      conclusion: "Cloudflare billing, CPU, quota and dollar cost remain unavailable until supplied by an authorized provider-owned source."
    }),
    capacity_scaling: Object.freeze({
      status: pressureCount > 0 ? "operator_review" : "no_scaling_conclusion",
      operational_pressure_count: pressureCount,
      scaling_need_established: false,
      future_capacity_established: false,
      automatic_scaling_allowed: false,
      automatic_retry_expansion_allowed: false,
      automatic_cache_policy_change_allowed: false,
      conclusion: pressureCount > 0
        ? "Observed pressure warrants bounded operator review, not an automatic scaling conclusion."
        : "No current retained pressure establishes a scaling requirement or future-capacity guarantee."
    }),
    recovery_resilience: Object.freeze({
      status: "external_evidence_required",
      retained_recovery_readiness_is_real_restore_proof: false,
      real_production_restore_observed: false,
      secret_rotation_observed: false,
      dns_recovery_observed: false,
      r2_recovery_observed: false,
      provider_recovery_observed: false,
      automatic_restore_allowed: false,
      conclusion: "Recovery source readiness and drill metadata remain evidence inputs only; real Production recovery requires separate independently observed evidence."
    }),
    evidence_freshness: Object.freeze({
      status: age.status,
      current_max_days: CURRENT_MAX_DAYS,
      stale_after_days: STALE_AFTER_DAYS,
      review_required: age.aging_count > 0 || age.stale_count > 0 || age.undated_count > 0,
      revalidation_required: age.stale_count > 0,
      conclusion: age.detail
    }),
    authority_ceiling: Object.freeze({
      status: "locked_read_only",
      read_only: true,
      manual_refresh_only: true,
      permanent_polling: false,
      provider_mutation_allowed: false,
      schema_mutation_allowed: false,
      business_mutation_allowed: false,
      accounting_inventory_mutation_allowed: false,
      customer_outreach_allowed: false,
      conclusion: "This authority can classify evidence and safe next actions only; it cannot mutate runtime, provider or business state."
    })
  };

  const reviewRequired = pressureCount > 0 || unavailableCount > 0 || ownerActionCount > 0 ||
    providerDependencyCount > 0 || operationalGuardrails.evidence_freshness.review_required;

  return Object.freeze({
    ...reassessment,
    release_enrichment_build: 464,
    release_authority: "reliability_cost_resilience_operational_guardrails",
    retained_authorities: Object.freeze([423, 424, 434, 444, 454, 457]),
    generated_at: nowIso,
    evidence_age_review: Object.freeze(age),
    operational_guardrails: Object.freeze(operationalGuardrails),
    operational_review_required: reviewRequired,
    truth_boundary: Object.freeze({
      ...(reassessment?.truth_boundary || {}),
      cloudflare_billing_observed: false,
      cloudflare_cpu_observed: false,
      cloudflare_quota_observed: false,
      dollar_cost_observed: false,
      provider_cost_or_quota_inferred: false,
      scaling_need_inferred_from_first_party_traffic: false,
      real_recovery_inferred_from_source_green: false,
      stale_evidence_treated_as_current: false
    }),
    boundaries: Object.freeze({
      ...(reassessment?.boundaries || {}),
      read_only: true,
      manual_refresh_only: true,
      permanent_polling: false,
      automatic_scaling_allowed: false,
      automatic_retry_expansion_allowed: false,
      cache_policy_mutation_allowed: false,
      secret_rotation_allowed: false,
      production_restore_allowed: false,
      dns_mutation_allowed: false,
      destructive_r2_allowed: false,
      provider_mutation_allowed: false,
      schema_migration_allowed: false,
      business_mutation_allowed: false,
      accounting_inventory_mutation_allowed: false,
      customer_outreach_allowed: false
    })
  });
}

function buildEvidenceAgeReview(reassessment, nowIso) {
  const bucketNames = ["green_retained_controls", "operational_pressure", "owner_action", "provider_dependency"];
  const seen = new Set();
  const rows = [];
  for (const bucket of bucketNames) {
    const sourceRows = Array.isArray(reassessment?.buckets?.[bucket]) ? reassessment.buckets[bucket] : [];
    for (const item of sourceRows) {
      const id = String(item?.id || "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const observed = safeIso(item?.observed_at);
      if (!observed) {
        rows.push({ id, source: item?.source || "unknown", status: "undated", observed_at: null, age_days: null });
        continue;
      }
      const days = Math.max(0, Math.floor((Date.parse(nowIso) - Date.parse(observed)) / DAY_MS));
      const status = days > STALE_AFTER_DAYS ? "stale" : days > CURRENT_MAX_DAYS ? "aging" : "current";
      rows.push({ id, source: item?.source || "unknown", status, observed_at: observed, age_days: days });
    }
  }

  const currentCount = rows.filter((row) => row.status === "current").length;
  const agingCount = rows.filter((row) => row.status === "aging").length;
  const staleCount = rows.filter((row) => row.status === "stale").length;
  const undatedCount = rows.filter((row) => row.status === "undated").length;
  const ages = rows.map((row) => row.age_days).filter(Number.isFinite);
  const oldest = ages.length ? Math.max(...ages) : null;
  const status = rows.length === 0 ? "unavailable"
    : staleCount > 0 ? "stale_revalidation_required"
    : agingCount > 0 || undatedCount > 0 ? "review_required"
    : "current";

  return {
    status,
    current_max_days: CURRENT_MAX_DAYS,
    stale_after_days: STALE_AFTER_DAYS,
    evidence_count: rows.length,
    current_count: currentCount,
    aging_count: agingCount,
    stale_count: staleCount,
    undated_count: undatedCount,
    oldest_evidence_age_days: oldest,
    rows,
    detail: status === "stale_revalidation_required"
      ? "At least one attributable retained evidence item is older than 30 days and requires revalidation before being treated as current."
      : status === "review_required"
        ? "At least one attributable retained evidence item is aging or undated and requires operator review."
        : status === "current"
          ? "All attributable retained evidence in the bounded reassessment is seven days old or newer."
          : "No attributable retained evidence was available for age review."
  };
}

function safeIso(value) {
  const text = String(value ?? "").trim();
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
