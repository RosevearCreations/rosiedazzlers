// Build 446 — Provider Evidence Reconciliation Refresh.
// Enriches retained read-only provider evidence with explicit source and age/freshness classification.
// No provider contact, payment/refund/message mutation, backlog write or permanent polling occurs here.

const FRESH_DAYS = 30;
const AGING_DAYS = 90;

export function buildProviderEvidenceReconciliationRefresh({ closure = {}, outcome = {}, generated_at = new Date().toISOString() } = {}) {
  const sourceAvailability = {
    stripe_payment: closure?.sources?.payment_readiness_available !== false,
    paypal_payment: closure?.sources?.payment_readiness_available !== false,
    refund: closure?.sources?.refund_source_available !== false,
    delivery: closure?.sources?.notification_source_available !== false
  };
  const sourceNames = {
    stripe_payment: "retained payment reconciliation evidence",
    paypal_payment: "retained payment reconciliation evidence",
    refund: "persisted linked refund evidence",
    delivery: "persisted notification delivery evidence"
  };
  const sourceRows = Array.isArray(outcome?.rows) ? outcome.rows : [];
  const rows = ["stripe_payment","paypal_payment","refund","delivery"].map((id) => {
    const row = sourceRows.find((item) => item?.id === id) || {};
    const available = sourceAvailability[id] !== false;
    const evidenceAt = validDate(row?.evidence_at);
    const ageDays = evidenceAt ? ageInDays(evidenceAt, generated_at) : null;
    const freshness = !available ? "unavailable"
      : !evidenceAt ? (row?.status === "observed_undated" ? "undated" : "missing")
      : ageDays <= FRESH_DAYS ? "current"
      : ageDays <= AGING_DAYS ? "aging"
      : "stale";
    return {
      id, title: row?.title || id, source: sourceNames[id], source_available: available,
      evidence_at: evidenceAt, age_days: ageDays, freshness,
      reconciliation_status: row?.status || (available ? "provider_dependent" : "unavailable"),
      source_gap: !available || !evidenceAt,
      detail: String(row?.detail || "").trim() || "No dated provider evidence currently satisfies the retained contract."
    };
  });
  const dated = rows.filter((row) => row.evidence_at).length;
  const stale = rows.filter((row) => row.freshness === "stale").length;
  const aging = rows.filter((row) => row.freshness === "aging").length;
  const sourceGaps = rows.filter((row) => row.source_gap).length;
  const ages = rows.map((row) => row.age_days).filter((value) => Number.isFinite(value));
  const oldestAge = ages.length ? Math.max(...ages) : null;
  let status = "current";
  if (sourceGaps) status = rows.some((row) => row.freshness === "unavailable") ? "unavailable" : "provider_dependent";
  else if (stale) status = "stale_review";
  else if (aging) status = "aging_review";
  return {
    generated_at, authority: "provider_evidence_reconciliation_refresh", status,
    decision: status === "current" ? "provider_evidence_current_operator_review_still_required" : "retain_provider_outcomes_communications_hold",
    freshness_policy: { current_max_days: FRESH_DAYS, aging_max_days: AGING_DAYS },
    required_evidence_count: rows.length, dated_evidence_count: dated, source_gap_count: sourceGaps,
    aging_evidence_count: aging, stale_evidence_count: stale, oldest_evidence_age_days: oldestAge, rows,
    canonical_hold: {
      area: "Provider outcomes & communications", classification: "provider_dependent",
      closure_candidate: outcome?.status === "closure_candidate" && sourceGaps === 0,
      operator_review_required: true, backlog_mutated: false,
      detail: sourceGaps ? "One or more provider evidence classes are missing, undated or unavailable; retain the canonical HOLD."
        : stale ? "All provider evidence classes are dated, but at least one item is stale and requires operator reconciliation before any HOLD narrowing."
        : "Provider evidence age and source are explicit; any HOLD narrowing still requires explicit operator review."
    },
    truth_boundary: {
      provider_contact_performed: false, payment_or_refund_mutation_performed: false, notification_send_performed: false,
      webhook_replay_performed: false, provider_configuration_mutated: false, secret_mutated: false,
      customer_mutated: false, canonical_hold_mutated: false, permanent_polling: false
    }
  };
}
function validDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
function ageInDays(value, generatedAt) {
  const observed = Date.parse(value), generated = Date.parse(String(generatedAt || ""));
  if (!Number.isFinite(observed) || !Number.isFinite(generated)) return null;
  return Math.max(0, Math.floor((generated - observed) / 86400000));
}
