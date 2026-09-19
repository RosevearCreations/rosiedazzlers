// Build 433 — Support Automation & Exception Handling
// Staff-only, manually refreshed, bounded and read-only.
// Composes retained diagnostic/reconciliation evidence without exposing customer records
// or performing provider/business mutations.

import { requireStaffAccess } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { onRequestGet as getSupportDiagnostics } from "./support_diagnostics.js";
import { onRequestGet as getPaymentReconciliation } from "./payment_reconciliation_readiness.js";

const PAYMENT_LIMIT = 5;
const SOURCE_TIMEOUT_MS = 8000;
const SEVERITY_ORDER = Object.freeze({ critical: 0, warning: 1, hold: 2, action: 3, info: 4 });

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: null, allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const action = requireActionAccess(access.actor, "it.runtime.view");
  if (!action.ok) return action.response;

  const generatedAt = new Date().toISOString();
  const paymentRequest = withQuery(request, "limit", String(PAYMENT_LIMIT));
  const [support, payment] = await Promise.all([
    collectSource("support_diagnostics", () => getSupportDiagnostics({ request: request.clone(), env }), SOURCE_TIMEOUT_MS),
    collectSource("payment_reconciliation", () => getPaymentReconciliation({ request: paymentRequest, env }), SOURCE_TIMEOUT_MS)
  ]);

  const queue = [];

  if (support.available) {
    for (const alert of Array.isArray(support.data?.alerts) ? support.data.alerts : []) {
      queue.push(fromSupportAlert(alert, support.data?.generated_at || generatedAt, generatedAt));
    }
  } else if (!support.restricted) {
    queue.push(sourceFailure(
      "support_diagnostics",
      "critical",
      "Core support diagnostics are unavailable.",
      "Restore the retained read-only Production support diagnostics source, then refresh this queue manually.",
      "/admin-system-health.html",
      "I.T. System Health",
      generatedAt
    ));
  }

  if (payment.available) {
    const data = payment.data || {};
    if (data.source_warning) {
      queue.push(sourceFailure(
        "payment_reconciliation",
        "warning",
        "Payment reconciliation source evidence is unavailable or incomplete.",
        "Open Payment Reconciliation and review the source warning before relying on provider/local finance state.",
        "/admin-payment-reconciliation.html",
        "Payment Reconciliation",
        generatedAt
      ));
    }
    if (data.finance_warning) {
      queue.push(sourceFailure(
        "payment_reconciliation",
        "warning",
        "Booking finance reconciliation evidence is incomplete.",
        "Open Payment Reconciliation and review finance evidence before adding or changing any finance record.",
        "/admin-payment-reconciliation.html",
        "Payment Reconciliation",
        generatedAt
      ));
    }
    for (const blocker of Array.isArray(data.blockers) ? data.blockers : []) {
      queue.push({
        id: "payment:blocker:" + slug(blocker),
        source: "payment_reconciliation",
        severity: "hold",
        family: "provider",
        state: "blocked",
        label: "Payment provider reconciliation is blocked.",
        dependency: "provider_dependent",
        observed_at: data.generated_at || generatedAt,
        freshness: freshness(data.generated_at || generatedAt, generatedAt),
        safe_next_action: clean(blocker) || "Review Payment Provider Readiness before relying on provider evidence.",
        surface: { href: "/admin-payment-readiness.html", label: "Payment Provider Readiness" }
      });
    }
    for (const record of Array.isArray(data.records) ? data.records : []) {
      const item = fromPaymentRecord(record, data.generated_at || generatedAt, generatedAt);
      if (item) queue.push(item);
    }
  } else if (!payment.restricted) {
    queue.push(sourceFailure(
      "payment_reconciliation",
      "warning",
      "Payment reconciliation evidence could not be refreshed.",
      "Use the dedicated Payment Reconciliation screen to confirm whether the source or provider is unavailable. Do not infer payment state.",
      "/admin-payment-reconciliation.html",
      "Payment Reconciliation",
      generatedAt
    ));
  }

  const sorted = dedupe(queue).sort(compare);
  const counts = countSeverities(sorted);
  const overall = counts.critical
    ? "critical"
    : counts.warning
      ? "warning"
      : counts.hold
        ? "hold"
        : counts.action
          ? "action"
          : "clear";

  return responseJson({
    ok: counts.critical === 0,
    build: 433,
    authority: "support_automation_exception_handling",
    generated_at: generatedAt,
    overall,
    counts,
    source_status: {
      support_diagnostics: sourceState(support),
      payment_reconciliation: sourceState(payment)
    },
    queue: sorted,
    evidence_surfaces: evidenceSurfaces(),
    boundaries: {
      read_only: true,
      manual_refresh_only: true,
      permanent_polling: false,
      business_mutation_allowed: false,
      provider_mutation_allowed: false,
      booking_mutation_allowed: false,
      customer_profile_mutation_allowed: false,
      accounting_inventory_posting_allowed: false,
      secret_rotation_allowed: false,
      production_restore_allowed: false,
      destructive_r2_allowed: false,
      release_protection_bypass_allowed: false,
      customer_records_included: false,
      customer_message_contents_included: false,
      secret_values_included: false,
      payment_record_limit: PAYMENT_LIMIT
    }
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function fromSupportAlert(alert, observedAt, generatedAt) {
  const severity = normalizeSeverity(alert?.severity);
  const family = clean(alert?.family) || "support";
  const surface = surfaceFor(family, clean(alert?.source));
  return {
    id: clean(alert?.id) || "support:" + slug(alert?.label),
    source: clean(alert?.source) || "support_diagnostics",
    severity,
    family,
    state: clean(alert?.state) || "unavailable",
    label: clean(alert?.label) || "Support evidence requires review.",
    dependency: severity === "hold" ? "provider_dependent" : severity === "action" ? "owner_action" : "internal_support",
    observed_at: observedAt,
    freshness: freshness(observedAt, generatedAt),
    safe_next_action: clean(alert?.corrective_action) || "Open the linked diagnostic surface and review the bounded evidence before taking action.",
    surface
  };
}

function fromPaymentRecord(record, fallbackObservedAt, generatedAt) {
  const state = clean(record?.reconciliation_state);
  if (!state || ["matched_paid", "provider_open", "recovery_ready"].includes(state)) return null;

  let severity = "warning";
  let dependency = "internal_support";
  if (state === "blocked_provider_unavailable") {
    severity = "hold";
    dependency = "provider_dependent";
  } else if (["finance_reconciliation_required", "request_state_reconciliation_required"].includes(state)) {
    severity = "action";
    dependency = "owner_action";
  } else if (["blocked_identity_mismatch", "local_provider_discrepancy", "complete_unpaid_review"].includes(state)) {
    severity = "critical";
    dependency = "owner_action";
  }

  return {
    id: "payment:" + state,
    source: "payment_reconciliation",
    severity,
    family: "payment",
    state,
    label: paymentLabel(state),
    dependency,
    observed_at: clean(record?.updated_at) || fallbackObservedAt,
    freshness: freshness(clean(record?.updated_at) || fallbackObservedAt, generatedAt),
    safe_next_action: clean(record?.operator_next_step) || "Review the dedicated payment reconciliation evidence before any finance or provider action.",
    surface: { href: "/admin-payment-reconciliation.html", label: "Payment Reconciliation" }
  };
}

function paymentLabel(state) {
  const labels = {
    blocked_provider_unavailable: "Payment provider evidence is unavailable.",
    blocked_identity_mismatch: "Payment identity or amount evidence does not match.",
    finance_reconciliation_required: "A payment requires finance reconciliation review.",
    request_state_reconciliation_required: "A tracked payment request state requires reconciliation.",
    local_provider_discrepancy: "Local and provider payment evidence disagree.",
    complete_unpaid_review: "Provider checkout completion is not confirmed payment evidence.",
    manual_review: "Payment evidence needs manual review."
  };
  return labels[state] || "Payment reconciliation needs review.";
}

function sourceFailure(source, severity, label, action, href, surfaceLabel, observedAt) {
  return {
    id: "source:" + source + ":" + slug(label),
    source,
    severity,
    family: "source",
    state: "unavailable",
    label,
    dependency: "internal_support",
    observed_at: observedAt,
    freshness: "fresh",
    safe_next_action: action,
    surface: { href, label: surfaceLabel }
  };
}

function surfaceFor(family, source) {
  if (source === "payment_reconciliation" || family === "payment") {
    return { href: "/admin-payment-reconciliation.html", label: "Payment Reconciliation" };
  }
  if (family === "provider") {
    return { href: "/admin-payment-readiness.html", label: "Payment Provider Readiness" };
  }
  if (["deploy", "runtime", "build", "source"].includes(family)) {
    return { href: "/admin-runtime-health.html", label: "Runtime & CPU Diagnostics" };
  }
  if (family === "operator") {
    return { href: "/admin-launch-readiness.html", label: "Launch Readiness" };
  }
  return { href: "/admin-system-health.html", label: "I.T. System Health" };
}

function evidenceSurfaces() {
  return [
    { family: "runtime", label: "Runtime & CPU Diagnostics", href: "/admin-runtime-health.html", purpose: "Browser/API failure timing and runtime evidence." },
    { family: "system", label: "I.T. System Health", href: "/admin-system-health.html", purpose: "Deployment, API, database, storage, authentication and provider configuration evidence." },
    { family: "payment", label: "Payment Reconciliation", href: "/admin-payment-reconciliation.html", purpose: "Read-only provider/local payment reconciliation evidence." },
    { family: "provider", label: "Payment Provider Readiness", href: "/admin-payment-readiness.html", purpose: "Provider configuration/readiness without charging or provider mutation." },
    { family: "media", label: "Media Health", href: "/admin-media-health.html", purpose: "Managed public-media health and bounded delivery diagnostics." },
    { family: "inventory", label: "Inventory Workbench", href: "/admin-inventory-manager.html", purpose: "Inventory review surface; any correction remains an explicit separate action." },
    { family: "booking", label: "Bookings", href: "/admin-booking.html", purpose: "Booking review surface; this queue never changes a booking." },
    { family: "incident", label: "Incident Reports", href: "/admin-incident-reports.html", purpose: "Private incident review; report creation remains a separate explicit workflow." }
  ];
}

async function collectSource(name, runner, timeoutMs) {
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve().then(runner),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("source_timeout")), timeoutMs); })
    ]);
    const data = await result.json().catch(() => null);
    return {
      name,
      available: result.ok && Boolean(data),
      restricted: result.status === 401 || result.status === 403,
      status: result.status,
      data,
      error_class: null
    };
  } catch (error) {
    return {
      name,
      available: false,
      restricted: false,
      status: 503,
      data: null,
      error_class: error?.message === "source_timeout" ? "timeout" : (error?.name || "Error")
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function withQuery(request, key, value) {
  const url = new URL(request.url);
  url.searchParams.set(key, value);
  return new Request(url.toString(), request);
}

function sourceState(source) {
  return {
    available: source?.available === true,
    restricted: source?.restricted === true,
    http_status: Number(source?.status) || null,
    generated_at: clean(source?.data?.generated_at) || null,
    error_class: source?.error_class || null
  };
}

function freshness(observedAt, generatedAt) {
  const observed = Date.parse(String(observedAt || ""));
  const generated = Date.parse(String(generatedAt || ""));
  if (!Number.isFinite(observed) || !Number.isFinite(generated)) return "unavailable";
  const age = Math.max(0, generated - observed);
  if (age <= 15 * 60 * 1000) return "fresh";
  if (age <= 24 * 60 * 60 * 1000) return "recent";
  return "historical";
}

function countSeverities(queue) {
  const counts = { critical: 0, warning: 0, hold: 0, action: 0, info: 0, total: queue.length };
  for (const item of queue) counts[normalizeSeverity(item?.severity)] += 1;
  return counts;
}

function dedupe(queue) {
  const seen = new Set();
  const output = [];
  for (const item of queue) {
    const key = clean(item?.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function compare(a, b) {
  return (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
    || freshnessRank(a.freshness) - freshnessRank(b.freshness)
    || String(a.label || "").localeCompare(String(b.label || ""));
}

function freshnessRank(value) {
  return ({ fresh: 0, recent: 1, historical: 2, unavailable: 3 })[value] ?? 4;
}

function normalizeSeverity(value) {
  const severity = clean(value).toLowerCase();
  return Object.prototype.hasOwnProperty.call(SEVERITY_ORDER, severity) ? severity : "warning";
}

function slug(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "unknown";
}

function clean(value) {
  return String(value ?? "").trim();
}

function responseJson(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Support-Exceptions": "build-433-read-only"
    }
  });
}
