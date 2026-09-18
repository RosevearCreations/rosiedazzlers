// Build 420 — Search Console, GBP & Local Acquisition Evidence Closure.
// Pure read-only classifier over the retained Build 414 measurement payload.

const PROVIDERS = [
  ["search_console", "Google Search Console"],
  ["google_business_profile", "Google Business Profile"]
];

export function buildLocalAcquisitionEvidenceClosure(report = {}) {
  const firstParty = normalizeNonProvider(report?.first_party, "First-party acquisition evidence");
  const localProof = normalizeNonProvider(report?.local_proof, "Approved local proof");
  const providers = Object.fromEntries(PROVIDERS.map(([key, title]) => [
    key,
    normalizeProvider(report?.providers?.[key], title)
  ]));

  const items = [
    { id: "first_party", ...firstParty },
    { id: "local_proof", ...localProof },
    { id: "search_console", ...providers.search_console },
    { id: "google_business_profile", ...providers.google_business_profile }
  ];

  const blocking = items.filter((item) => item.state !== "observed");
  const providerDependent = blocking.filter((item) => item.classification === "provider_dependent").length;
  const ownerAction = blocking.filter((item) => item.classification === "owner_action").length;
  const unavailable = blocking.filter((item) => item.classification === "unavailable").length;
  const observed = items.length - blocking.length;

  return {
    build: 420,
    authority: "search_console_gbp_local_acquisition_evidence_closure",
    status: blocking.length ? "hold" : "ready",
    decision: blocking.length ? "local_acquisition_evidence_incomplete" : "local_acquisition_evidence_complete",
    generated_at: clean(report?.generated_at) || new Date().toISOString(),
    counts: {
      total: items.length,
      observed,
      provider_dependent: providerDependent,
      owner_action: ownerAction,
      unavailable
    },
    items,
    remaining_actions: blocking.map((item) => ({
      id: item.id,
      title: item.title,
      classification: item.classification,
      action: item.action
    })),
    truth_boundary: {
      ranking_inferred: false,
      indexing_inferred: false,
      maps_visibility_inferred: false,
      provider_success_inferred_from_first_party: false,
      provider_success_inferred_from_markup: false,
      google_credentials_exposed: false,
      customer_identity_exposed: false,
      provider_mutation_performed: false,
      analytics_mutation_performed: false
    }
  };
}

function normalizeProvider(source, title) {
  const evidenceState = clean(source?.evidence_state);
  const classification = normalizeClassification(source?.classification);
  const observed = evidenceState === "observed_snapshot" && classification === "owner_action";
  return {
    title,
    state: observed ? "observed" : "hold",
    classification: observed ? "owner_action_observed" : classification,
    evidence_state: evidenceState || "missing",
    observed_at: clean(source?.observed_at) || null,
    period_start: clean(source?.period_start) || null,
    period_end: clean(source?.period_end) || null,
    label_present: Boolean(clean(source?.label)),
    metrics_present: source?.metrics && typeof source.metrics === "object" && Object.keys(source.metrics).length > 0,
    action: observed
      ? "Retain this dated operator-observed snapshot and refresh it when it becomes stale."
      : clean(source?.action) || defaultAction(classification, title)
  };
}

function normalizeNonProvider(source, title) {
  const classification = normalizeClassification(source?.classification);
  const evidenceState = clean(source?.evidence_state);
  const observed = classification !== "unavailable" && evidenceState !== "unavailable";
  return {
    title,
    state: observed ? "observed" : "hold",
    classification: observed ? "observed" : classification,
    evidence_state: evidenceState || (observed ? "observed" : "unavailable"),
    action: observed
      ? "Retain bounded observed evidence; it does not prove Google provider outcomes."
      : clean(source?.reason) || defaultAction(classification, title)
  };
}

function normalizeClassification(value) {
  const classification = clean(value);
  if (classification === "provider_dependent" || classification === "owner_action" || classification === "unavailable") return classification;
  return classification || "unavailable";
}

function defaultAction(classification, title) {
  if (classification === "provider_dependent") return `Record a dated operator-observed ${title} snapshot.`;
  if (classification === "owner_action") return `Refresh the stale or incomplete ${title} evidence.`;
  return `Restore the bounded evidence source for ${title}.`;
}

function clean(value) {
  return String(value ?? "").trim();
}
