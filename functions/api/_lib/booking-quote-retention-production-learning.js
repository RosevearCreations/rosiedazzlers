// Build 441 — pure read-only booking, quote and retention production-learning derivation.
// Aggregate evidence only. No customer identity, causal claim, segmentation, pricing or mutation authority.

export function buildBookingQuoteRetentionProductionLearning({
  funnel = {},
  retention = {},
  quote_rows = [],
  source_status = {},
  generated_at = null
} = {}) {
  const when = generated_at || new Date().toISOString();
  const booking = summarizeBooking(funnel);
  const quotes = summarizeQuotes(quote_rows);
  const repeat = summarizeRepeat(funnel, retention);
  const maintenance = summarizeMaintenance(retention);
  const communication = summarizeCommunication(retention);
  const priorities = [
    bookingPriority(booking),
    quotePriority(quotes),
    repeatPriority(repeat),
    maintenancePriority(maintenance),
    communicationPriority(communication)
  ];

  const availableSources = Object.values(source_status || {}).filter((row) => row && row.available === true).length;
  const restrictedSources = Object.values(source_status || {}).filter((row) => row && row.restricted === true).length;
  const totalSources = Object.keys(source_status || {}).length;
  const overall = availableSources === totalSources && totalSources > 0
    ? (priorities.some((row) => row.evidence_state === "partial" || row.evidence_state === "provider_dependent") ? "partial" : "observed")
    : availableSources > 0
      ? "partial"
      : restrictedSources > 0
        ? "restricted"
        : "unavailable";

  return {
    build: 441,
    mode: "booking_quote_retention_production_learning",
    generated_at: when,
    evidence_status: overall,
    booking,
    quotes,
    repeat_booking: repeat,
    maintenance_interest: maintenance,
    communication,
    priorities,
    source_status,
    boundaries: {
      read_only_learning: true,
      manual_refresh_only: true,
      correlation_only: true,
      causal_claim_authority: false,
      cross_layer_identity_join: false,
      customer_identity_exposed: false,
      raw_session_identifiers_exposed: false,
      automatic_segmentation_allowed: false,
      automatic_outreach_allowed: false,
      automatic_discount_allowed: false,
      pricing_mutation_allowed: false,
      automatic_booking_allowed: false,
      automatic_maintenance_enrollment_allowed: false,
      payment_mutation_allowed: false,
      provider_mutation_allowed: false,
      schema_authority: false,
      permanent_polling_allowed: false
    }
  };
}

function summarizeBooking(funnel) {
  const data = funnel && typeof funnel === "object" ? funnel : {};
  const booking = object(data.booking_funnel);
  const stages = Array.isArray(booking.stages) ? booking.stages : [];
  const largest = stages
    .filter((row) => Number.isFinite(Number(row?.drop_from_previous)) && Number(row.drop_from_previous) > 0)
    .sort((a, b) => Number(b.drop_from_previous) - Number(a.drop_from_previous))[0] || null;
  const coverage = object(data.coverage);
  return {
    state: booking.funnel_start_sessions > 0 ? (coverage.analytics_possibly_truncated ? "partial" : "observed") : "unavailable",
    window_days: numberOrNull(data?.window?.days),
    funnel_start_sessions: whole(booking.funnel_start_sessions),
    checkout_started_sessions: whole(booking.checkout_started_sessions),
    checkout_completed_sessions: whole(booking.checkout_completed_sessions),
    start_to_checkout_completion_pct: numberOrNull(booking.start_to_checkout_completion_pct),
    checkout_completion_pct: numberOrNull(booking.checkout_completion_pct),
    abandoned_after_checkout_start: whole(booking.abandoned_after_checkout_start),
    largest_observed_stage_drop: largest ? {
      stage: clean(largest.label || largest.key),
      sessions_lost: whole(largest.drop_from_previous),
      drop_pct: numberOrNull(largest.drop_from_previous_pct)
    } : null,
    evidence_possibly_truncated: coverage.analytics_possibly_truncated === true,
    identity_join: false
  };
}

function summarizeQuotes(rows) {
  const safe = Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object") : [];
  const statuses = {};
  let sent = 0;
  let accepted = 0;
  let declined = 0;
  let quotedCents = 0;
  let acceptedCents = 0;
  for (const row of safe) {
    const status = normalize(row.status) || "unknown";
    statuses[status] = (statuses[status] || 0) + 1;
    if (row.sent_at) sent += 1;
    if (row.accepted_at) accepted += 1;
    if (row.declined_at) declined += 1;
    quotedCents += nonNegative(row.quoted_amount_cents);
    acceptedCents += nonNegative(row.accepted_amount_cents);
  }
  return {
    state: safe.length ? (safe.length >= 250 ? "partial" : "observed") : "unavailable",
    rows_observed: safe.length,
    row_limit: 250,
    possibly_truncated: safe.length >= 250,
    sent_quotes: sent,
    accepted_quotes: accepted,
    declined_quotes: declined,
    unresolved_quotes: Math.max(safe.length - accepted - declined, 0),
    accepted_of_sent_pct: sent > 0 ? round1((accepted / sent) * 100) : null,
    quoted_value_cents_aggregate: quotedCents,
    accepted_value_cents_aggregate: acceptedCents,
    status_counts: statuses,
    customer_identity_exposed: false,
    pricing_change_authorized: false
  };
}

function summarizeRepeat(funnel, retention) {
  const outcomes = object(funnel?.repeat_booking_outcomes);
  const learning = object(retention?.learning);
  const retained = object(learning.repeat_booking);
  const hasEvidence = whole(outcomes.observed_linked_customers) > 0 || whole(retained.exact_profile_rows) > 0;
  const partial = retained.status === "partial" || funnel?.coverage?.booking_history_possibly_truncated === true;
  return {
    state: hasEvidence ? (partial ? "partial" : "observed") : "unavailable",
    observed_linked_customers: whole(outcomes.observed_linked_customers),
    observed_repeat_customers: whole(outcomes.observed_repeat_customers),
    observed_repeat_customer_pct: numberOrNull(outcomes.observed_repeat_customer_pct),
    customers_rebooked_in_window: whole(outcomes.customers_rebooked_in_window),
    completed_repeat_services_in_window: whole(outcomes.completed_repeat_services_in_window),
    median_days_previous_to_repeat_booking: numberOrNull(outcomes.median_days_previous_to_repeat_booking),
    completed_jobs_with_later_booking: whole(retained.completed_jobs_with_later_booking),
    identity_rule: "exact_customer_profile_id_only",
    correlation_only: true
  };
}

function summarizeMaintenance(retention) {
  const learning = object(retention?.learning);
  const data = object(learning.maintenance_interest);
  return {
    state: clean(data.status) || "unavailable",
    records_observed: whole(data.total),
    vehicles_requested: whole(data.vehicles_requested),
    preferred_cycle_counts: object(data.preferred_cycle_counts),
    exact_profile_linkage: clean(data.exact_profile_linkage) || "unavailable",
    consent_inferred: false,
    enrollment_inferred: false
  };
}

function summarizeCommunication(retention) {
  const learning = object(retention?.learning);
  const data = object(learning.communication);
  return {
    state: clean(data.status) || "unavailable",
    event_count: whole(data.event_count),
    provider_dependent_events: whole(data.provider_dependent_events),
    definitive_delivered_events: whole(data.definitive_delivered_events),
    current_explicit_opt_in_profiles: whole(data.current_explicit_opt_in_profiles),
    provider_acceptance_is_not_delivery: true,
    dispatch_time_consent_gate_remains_authoritative: true
  };
}

function bookingPriority(data) {
  if (data.state === "unavailable") return priority("booking_funnel", "unavailable", "Booking funnel evidence is unavailable.", "Use the existing Booking & Rebooking Funnel surface and restore bounded first-party telemetry before changing the funnel.");
  if (!data.largest_observed_stage_drop) return priority("booking_funnel", data.state, "No positive stage drop is established in the bounded booking funnel.", "Keep observing the existing funnel; do not invent a friction cause from absent evidence.");
  const drop = data.largest_observed_stage_drop;
  return priority("booking_funnel", data.state, "Largest observed anonymous funnel drop: " + drop.stage + ".", String(drop.sessions_lost) + " session(s) were lost at that transition in the bounded window. Review the owning step for clarity/usability; this is correlation, not proof of cause.");
}

function quotePriority(data) {
  if (data.state === "unavailable") return priority("quote_pipeline", "unavailable", "Quote-pipeline evidence is unavailable.", "Restore the existing quote pipeline evidence before changing quote wording, follow-up or pricing.");
  return priority("quote_pipeline", data.state, "Current quote pipeline has " + data.accepted_quotes + " accepted, " + data.declined_quotes + " declined and " + data.unresolved_quotes + " unresolved row(s).", "Review unresolved/declined quote evidence in the existing Quotes workflow. Do not infer price sensitivity or change pricing from status counts alone.");
}

function repeatPriority(data) {
  if (data.state === "unavailable") return priority("repeat_booking", "unavailable", "Exact-profile repeat-booking evidence is unavailable.", "Preserve the existing retention workflow and improve evidence completeness before creating a retention program conclusion.");
  return priority("repeat_booking", data.state, String(data.observed_repeat_customers) + " exact-profile customer(s) show repeat-booking evidence.", "Use observed timing and repeat behaviour to inform owner review only. Do not auto-segment, contact or enroll customers.");
}

function maintenancePriority(data) {
  if (!data.records_observed) return priority("maintenance_interest", "unavailable", "No bounded maintenance-interest evidence is currently observed.", "Do not infer demand or enrollment eligibility from booking history.");
  return priority("maintenance_interest", data.state === "ready" ? "observed" : "partial", String(data.records_observed) + " maintenance-interest record(s) are available.", "Review aggregate cadence interest only; current evidence does not authorize exact-profile linkage, consent inference or automatic enrollment.");
}

function communicationPriority(data) {
  if (data.provider_dependent_events > 0) return priority("communication_delivery", "provider_dependent", String(data.provider_dependent_events) + " communication event(s) remain provider-dependent.", "Keep delivery outcome as a provider HOLD. Provider acceptance is not definitive delivery and does not authorize outreach.");
  if (data.state === "unavailable") return priority("communication_delivery", "unavailable", "Communication delivery evidence is unavailable.", "Do not infer deliverability or outreach readiness.");
  return priority("communication_delivery", data.state === "ready" ? "observed" : "partial", "Current communication evidence contains no provider-dependent event in the bounded snapshot.", "Dispatch-time explicit consent remains authoritative for any future customer contact.");
}

function priority(area, evidenceState, finding, nextReview) {
  return { area, evidence_state: evidenceState, finding, bounded_operator_review: nextReview, automatic_action_authorized: false };
}

function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value) { return String(value ?? "").trim(); }
function normalize(value) { return clean(value).toLowerCase(); }
function whole(value) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }
function nonNegative(value) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.round(n) : 0; }
function numberOrNull(value) { const n = Number(value); return Number.isFinite(n) ? n : null; }
function round1(value) { return Math.round(Number(value) * 10) / 10; }
