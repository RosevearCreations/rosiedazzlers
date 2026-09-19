// Build 436 — Provider Outcome & Delivery Evidence Closure.
// Pure read-only classification of already-persisted provider evidence.
// No provider contact, payment/refund/message mutation or HOLD-backlog write occurs here.

const REQUIRED_IDS = Object.freeze(["stripe_payment", "paypal_payment", "refund", "delivery"]);

export function buildProviderOutcomeDeliveryEvidence({ closure = {}, generated_at = new Date().toISOString() } = {}) {
  const required = Array.isArray(closure?.required) ? closure.required : [];
  const rows = [
    outcomeRow("stripe_payment", "Stripe reconciled provider outcome", closure?.payments?.stripe?.observed === true, closure?.sources?.payment_readiness_available !== false, closure?.payments?.stripe?.latest_accepted_at, required, generated_at),
    outcomeRow("paypal_payment", "PayPal reconciled provider outcome", closure?.payments?.paypal?.observed === true, closure?.sources?.payment_readiness_available !== false, closure?.payments?.paypal?.latest_accepted_at, required, generated_at),
    outcomeRow("refund", "Linked definitive refund outcome", Number(closure?.refunds?.definitive_refunds || 0) > 0, closure?.sources?.refund_source_available !== false, closure?.refunds?.latest_refunded_at, required, generated_at),
    outcomeRow("delivery", "Definitive message delivery outcome", Number(closure?.delivery?.definitive_deliveries || 0) > 0, closure?.sources?.notification_source_available !== false, closure?.delivery?.latest_definitive_delivery_at, required, generated_at)
  ];

  const dated = rows.filter((row) => row.status === "observed_dated").length;
  const unavailable = rows.filter((row) => row.status === "unavailable").length;
  const allDated = dated === REQUIRED_IDS.length;
  const latestObservedAt = rows.map((row) => row.evidence_at).filter(Boolean).sort().at(-1) || null;

  return {
    generated_at,
    authority: "provider_outcome_delivery_evidence_closure",
    status: allDated ? "closure_candidate" : unavailable ? "unavailable" : "hold",
    decision: allDated ? "dated_provider_evidence_closure_candidate" : "retain_provider_outcomes_communications_hold",
    required_evidence_count: REQUIRED_IDS.length,
    dated_evidence_count: dated,
    unavailable_evidence_count: unavailable,
    latest_observed_at: latestObservedAt,
    rows,
    canonical_hold: {
      area: "Provider outcomes & communications",
      classification: allDated ? "closure_candidate" : unavailable ? "unavailable" : "provider_dependent",
      closure_candidate: allDated,
      operator_review_required: true,
      backlog_mutated: false,
      detail: allDated
        ? "All four required provider evidence classes are currently observed with attributable timestamps. The canonical HOLD may be narrowed only through an explicit operator-reviewed evidence update."
        : "One or more required provider evidence classes remain missing, unavailable or undated. Retain the canonical provider outcomes & communications HOLD."
    },
    truth_boundary: {
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      notification_send_performed: false,
      webhook_replay_performed: false,
      provider_configuration_mutated: false,
      secret_mutated: false,
      customer_mutated: false,
      permanent_polling: false,
      canonical_hold_mutated: false,
      provider_accepted_is_definitive_delivery: false
    }
  };
}

function outcomeRow(id, title, observed, sourceAvailable, evidenceAt, required, generatedAt) {
  const fallback = required.find((row) => row?.id === id) || {};
  const at = validDate(evidenceAt);
  let status = "provider_dependent";
  let classification = "provider_dependent";
  if (!sourceAvailable) {
    status = "unavailable";
    classification = "unavailable";
  } else if (observed && at) {
    status = "observed_dated";
    classification = "runtime_proven";
  } else if (observed) {
    status = "observed_undated";
  }
  return {
    id, title, status, classification,
    evidence_at: at,
    age_days: ageDays(at, generatedAt),
    detail: clean(fallback?.detail) || defaultDetail(status)
  };
}

function validDate(value) {
  const text = clean(value);
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function ageDays(value, generatedAt) {
  if (!value) return null;
  const observed = Date.parse(value);
  const generated = Date.parse(String(generatedAt || ""));
  if (!Number.isFinite(observed) || !Number.isFinite(generated)) return null;
  return Math.max(0, Math.floor((generated - observed) / 86400000));
}

function defaultDetail(status) {
  if (status === "unavailable") return "The authorized evidence source is unavailable; no provider outcome is inferred.";
  if (status === "observed_undated") return "Provider evidence is observed but lacks an attributable timestamp, so it does not narrow the canonical HOLD.";
  return "No dated provider outcome currently satisfies the retained evidence contract.";
}
function clean(value) { return String(value ?? "").trim(); }
