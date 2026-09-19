// Build 434 — Reliability, Security & Cost Reassessment
// Pure read-only classification helper. No provider/business mutation occurs here.

const STALE_EVIDENCE_MS = 30 * 24 * 60 * 60 * 1000;

export function buildReliabilitySecurityCostReassessment({
  reliability = {},
  security = {},
  readiness = {},
  source_status = {},
  generated_at = null
} = {}) {
  const nowIso = safeIso(generated_at) || new Date().toISOString();
  const buckets = {
    green_retained_controls: [],
    operational_pressure: [],
    stale_evidence: [],
    owner_action: [],
    provider_dependency: [],
    unavailable_evidence: []
  };

  classifyReliability(reliability, buckets, nowIso);
  classifySecurity(security, buckets, nowIso);
  classifyReadiness(readiness, buckets, nowIso);
  classifySources(source_status, buckets, nowIso);

  addUnique(buckets.unavailable_evidence, {
    id: "cost:cloudflare-provider-metrics",
    source: "truth_boundary",
    state: "unavailable_by_design",
    label: "Cloudflare billing and CPU-consumption measurements are not observed by this authority.",
    detail: "Use provider-owned billing/usage evidence when cost or CPU consumption must be established. First-party traffic counts are not a billing proxy.",
    safe_next_action: "Review provider-owned Cloudflare usage/billing evidence separately; do not infer cost from this snapshot.",
    observed_at: nowIso
  });

  const counts = Object.fromEntries(Object.entries(buckets).map(([key, rows]) => [key, rows.length]));
  const overall = counts.operational_pressure > 0
    ? "attention"
    : counts.unavailable_evidence > 0 || counts.stale_evidence > 0
      ? "partial"
      : counts.owner_action > 0 || counts.provider_dependency > 0
        ? "hold"
        : "green";

  return Object.freeze({
    build: 434,
    authority: "reliability_security_cost_reassessment",
    generated_at: nowIso,
    overall,
    counts: Object.freeze(counts),
    buckets: Object.freeze(Object.fromEntries(
      Object.entries(buckets).map(([key, rows]) => [key, Object.freeze(rows.map((row) => Object.freeze(row)))])
    )),
    metrics: Object.freeze({
      diagnostics_duration_ms: finiteNonNegative(reliability?.diagnostics?.duration_ms),
      diagnostics_failed_checks: finiteNonNegative(reliability?.diagnostics?.failed_checks),
      diagnostics_degraded_checks: finiteNonNegative(reliability?.diagnostics?.degraded_checks),
      traffic_events_24h: finiteNonNegative(reliability?.traffic?.events_24h),
      traffic_events_7d: finiteNonNegative(reliability?.traffic?.events_7d),
      traffic_recent_to_prior_ratio: finiteNonNegative(reliability?.traffic?.recent_to_prior_ratio),
      security_risk_rows: finiteNonNegative(security?.security?.risk_rows),
      security_rls_disabled: finiteNonNegative(security?.security?.rls_disabled),
      security_browser_grants: finiteNonNegative(security?.security?.browser_grants)
    }),
    truth_boundary: Object.freeze({
      cloudflare_billing_or_cpu_usage_measured: false,
      cloudflare_cost_amount_inferred: false,
      future_capacity_guaranteed: false,
      attack_likelihood_inferred: false,
      recovery_success_inferred: false,
      source_green_is_real_restore_evidence: false,
      source_green_is_secret_rotation_evidence: false,
      first_party_traffic_counts_only: true
    }),
    boundaries: Object.freeze({
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
      schema_migration_allowed: false
    })
  });
}

function classifyReliability(reliability, buckets, nowIso) {
  const diagnostics = objectOrEmpty(reliability?.diagnostics);
  const traffic = objectOrEmpty(reliability?.traffic);
  classifyState({
    id: "reliability:diagnostics",
    source: "reliability_performance_cost_capacity",
    label: "Production diagnostics",
    state: clean(diagnostics.state) || "unavailable",
    greenStates: ["stable"],
    pressureStates: ["watch", "pressure"],
    detail: diagnosticsDetail(diagnostics),
    action: "Review Production diagnostics and the slowest bounded dependency paths before expanding runtime work."
  }, buckets, nowIso);
  classifyState({
    id: "reliability:traffic",
    source: "reliability_performance_cost_capacity",
    label: "First-party traffic pressure",
    state: clean(traffic.state) || "unavailable",
    greenStates: ["stable"],
    pressureStates: ["watch", "pressure"],
    detail: trafficDetail(traffic),
    action: "Compare current traffic growth with request/error diagnostics before changing caching, retries or capacity."
  }, buckets, nowIso);
}

function classifySecurity(security, buckets, nowIso) {
  const items = [
    ["security", "Security posture", "Review aggregate security posture evidence before widening access or runtime exposure."],
    ["sessions", "Session and cookie controls", "Review staff/customer session-secret, cookie and rotation authority; do not rotate secrets from this screen."],
    ["privacy", "Consent and privacy controls", "Restore explicit consent/privacy authority before relying on customer communications."],
    ["recovery", "Recovery readiness", "Complete separately authorized observed recovery evidence; source readiness is not a real restore."]
  ];
  for (const [key, label, action] of items) {
    const row = objectOrEmpty(security?.[key]);
    const state = clean(row.state) || "unavailable";
    const base = {
      id: `security:${key}`,
      source: "security_privacy_recovery_drill",
      state,
      label,
      detail: safeSecurityDetail(key, row),
      safe_next_action: action,
      observed_at: nowIso
    };
    if (state === "ready") addUnique(buckets.green_retained_controls, base);
    else if (state === "owner_action") addUnique(buckets.owner_action, base);
    else if (state === "blocked") addUnique(buckets.operational_pressure, base);
    else addUnique(buckets.unavailable_evidence, base);
  }
}

function classifyReadiness(readiness, buckets, nowIso) {
  for (const item of Array.isArray(readiness?.items) ? readiness.items : []) {
    const classification = clean(item?.classification) || "unavailable";
    const base = {
      id: `readiness:${clean(item?.id) || slug(item?.name)}`,
      source: "go_live_readiness",
      state: classification,
      label: cleanLabel(item?.name) || "Readiness evidence",
      detail: cleanLabel(item?.detail) || "Current readiness evidence requires review.",
      safe_next_action: cleanLabel(item?.action) || "Review the owning evidence source before relying on this capability.",
      observed_at: latestEvidenceTime(item) || nowIso
    };
    if (classification === "runtime_proven") addUnique(buckets.green_retained_controls, base);
    else if (classification === "provider_dependent") addUnique(buckets.provider_dependency, base);
    else if (classification === "owner_action") addUnique(buckets.owner_action, base);
    else if (classification === "unavailable") addUnique(buckets.unavailable_evidence, base);

    const latest = latestEvidenceTime(item);
    if (latest && ageMs(latest, nowIso) > STALE_EVIDENCE_MS) {
      addUnique(buckets.stale_evidence, {
        ...base,
        id: `${base.id}:stale`,
        state: "stale",
        detail: `The latest attributable evidence is older than 30 days (${latest}).`,
        safe_next_action: "Refresh the owning evidence source before treating this historical outcome as current."
      });
    }
  }
}

function classifySources(sourceStatus, buckets, nowIso) {
  for (const [source, state] of Object.entries(objectOrEmpty(sourceStatus))) {
    if (state?.available === true) continue;
    addUnique(buckets.unavailable_evidence, {
      id: `source:${slug(source)}`,
      source,
      state: state?.restricted === true ? "restricted" : "unavailable",
      label: `${source.replaceAll("_", " ")} evidence source is unavailable.`,
      detail: state?.error_class ? `Source error class: ${cleanLabel(state.error_class)}.` : "The bounded source did not return current evidence.",
      safe_next_action: "Restore or authorize the owning read-only evidence source, then refresh manually.",
      observed_at: nowIso
    });
  }
}

function classifyState({id, source, label, state, greenStates, pressureStates, detail, action}, buckets, nowIso) {
  const item = { id, source, state, label, detail, safe_next_action: action, observed_at: nowIso };
  if (greenStates.includes(state)) addUnique(buckets.green_retained_controls, item);
  else if (pressureStates.includes(state)) addUnique(buckets.operational_pressure, item);
  else addUnique(buckets.unavailable_evidence, item);
}

function diagnosticsDetail(row) {
  const duration = finiteNonNegative(row?.duration_ms);
  const failed = finiteNonNegative(row?.failed_checks);
  const degraded = finiteNonNegative(row?.degraded_checks);
  return `State ${clean(row?.state) || "unavailable"}; duration ${duration ?? "unavailable"} ms; failed checks ${failed ?? "unavailable"}; degraded checks ${degraded ?? "unavailable"}.`;
}

function trafficDetail(row) {
  const d = finiteNonNegative(row?.events_24h);
  const w = finiteNonNegative(row?.events_7d);
  const ratio = finiteNonNegative(row?.recent_to_prior_ratio);
  return `First-party analytics events: 24h ${d ?? "unavailable"}, 7d ${w ?? "unavailable"}, recent/prior ratio ${ratio ?? "unavailable"}.`;
}

function safeSecurityDetail(key, row) {
  if (key === "security") return `Aggregate risk rows ${finiteNonNegative(row?.risk_rows) ?? "unavailable"}, RLS disabled ${finiteNonNegative(row?.rls_disabled) ?? "unavailable"}, browser grants ${finiteNonNegative(row?.browser_grants) ?? "unavailable"}.`;
  if (key === "sessions") return `Staff secret configured ${boolLabel(row?.staff_secret_configured)}, customer secret configured ${boolLabel(row?.customer_secret_configured)}, legacy fallback enabled ${boolLabel(row?.legacy_admin_fallback_enabled)}.`;
  if (key === "privacy") return `Explicit consent required ${boolLabel(row?.current_explicit_consent_required)}, inferred consent allowed ${boolLabel(row?.inferred_consent_allowed)}, provider delivery evidence required ${boolLabel(row?.definitive_delivery_requires_provider_evidence)}.`;
  if (key === "recovery") return `Source authority available ${boolLabel(row?.source_authority_available)}, observed drill ${boolLabel(row?.observed_drill)}, Production mutation performed ${boolLabel(row?.production_mutation_performed)}.`;
  return "Current aggregate evidence.";
}

function latestEvidenceTime(item) {
  const evidence = objectOrEmpty(item?.evidence);
  return safeIso(evidence.latest_accepted_at) || safeIso(evidence.updated_at) || safeIso(item?.observed_at);
}
function ageMs(thenIso, nowIso) {
  const a = Date.parse(thenIso), b = Date.parse(nowIso);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, b - a) : 0;
}
function addUnique(target, item) {
  if (!item?.id || target.some((row) => row.id === item.id)) return;
  target.push(item);
}
function boolLabel(value) { return value === true ? "yes" : value === false ? "no" : "unavailable"; }
function finiteNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function objectOrEmpty(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function clean(value) { return String(value ?? "").trim().toLowerCase(); }
function cleanLabel(value) { return String(value ?? "").trim().slice(0, 600); }
function safeIso(value) {
  const text = String(value ?? "").trim();
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
function slug(value) { return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "unknown"; }
