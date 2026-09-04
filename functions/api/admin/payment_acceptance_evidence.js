// Build 319 — read-only payment acceptance evidence authority.
// Reports persisted Development evidence without exposing secrets, contacting providers, or mutating payment state.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const SELECT = [
  "id",
  "booking_id",
  "customer_name",
  "amount_cents",
  "currency",
  "status",
  "provider",
  "provider_status",
  "external_checkout_id",
  "checkout_created_at",
  "expires_at",
  "paid_at",
  "paid_amount_cents",
  "provider_payment_intent_id",
  "provider_event_id",
  "cancelled_at",
  "created_at",
  "updated_at"
].join(",");

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const limit = clampLimit(url.searchParams.get("limit"));
    const stripeEnvironment = classifyStripeEnvironment(env);
    const blockers = [];
    const warnings = [];

    if (stripeEnvironment.mode === "live") {
      blockers.push("A live Stripe secret is present in Development. Payment acceptance evidence must not be exercised with live charging credentials.");
    } else if (stripeEnvironment.mode === "unknown") {
      blockers.push("The configured Stripe key cannot be classified as test or live. Development provider acceptance remains blocked until configuration is reviewed server-side.");
    } else if (stripeEnvironment.mode === "not_configured") {
      warnings.push("Stripe is not configured in this environment. Existing manual final-balance handling remains available, but it is not Stripe acceptance evidence.");
    }

    warnings.push("Persisted paid evidence shows application data state only. Build 319 does not assert that a Stripe webhook or provider callback independently verified the payment.");
    warnings.push("PayPal is not integrated in the current source and therefore has no sandbox acceptance evidence.");

    const source = await loadPaymentRequests(env, limit);
    const records = source.requests.map(toEvidenceRecord);
    const summary = summarize(records);

    const developmentStatus = deriveDevelopmentStatus({ stripeEnvironment, blockers, summary });

    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      table_ready: source.table_ready,
      source_warning: source.warning || null,
      contract: {
        read_only: true,
        secret_values_exposed: false,
        provider_mutation: false,
        automatic_charge: false,
        automatic_checkout_creation: false,
        automatic_customer_notification: false,
        recurring_billing: false,
        operator_action_required: true,
        webhook_verification_asserted: false
      },
      stripe_environment: stripeEnvironment,
      providers: {
        stripe: {
          integration_available: true,
          acceptance_basis: "persisted_application_evidence",
          webhook_verification: "not_asserted_by_build319"
        },
        paypal: {
          integration_available: false,
          mode: "not_integrated",
          acceptance_evidence: "not_integrated"
        },
        manual: {
          integration_available: true,
          mode: "operator_recorded",
          acceptance_evidence: "operational_fallback_not_provider_acceptance"
        }
      },
      development_status: developmentStatus,
      blockers,
      warnings,
      summary,
      records
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not calculate payment acceptance evidence." }, 500);
  }
}

export async function onRequestPost() {
  return json({ ok: false, error: "Payment acceptance evidence is read-only. Use an existing explicit operator payment workflow for mutations." }, 405);
}

function classifyStripeEnvironment(env) {
  const secret = String(env?.STRIPE_SECRET_KEY || "");
  const configured = !!secret;
  const mode = !configured
    ? "not_configured"
    : secret.startsWith("sk_test_")
      ? "test"
      : secret.startsWith("sk_live_")
        ? "live"
        : "unknown";

  return {
    configured,
    mode,
    test_mode_ready: configured && mode === "test",
    live_credential_detected: configured && mode === "live",
    secret_value_returned: false
  };
}

async function loadPaymentRequests(env, limit) {
  if (!hasSupabaseConfig(env)) {
    return { table_ready: false, requests: [], warning: "Supabase is not configured for payment evidence lookup." };
  }

  const endpoint = `${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=${encodeURIComponent(SELECT)}&order=created_at.desc&limit=${limit}`;
  const response = await fetch(endpoint, { method: "GET", headers: serviceHeaders(env) });
  const text = await response.text();
  const data = safeJson(text);

  if (!response.ok) {
    return {
      table_ready: false,
      requests: [],
      warning: data?.message || text || "final_balance_payment_requests is not ready for evidence lookup."
    };
  }

  return { table_ready: true, requests: Array.isArray(data) ? data : [], warning: null };
}

function toEvidenceRecord(row) {
  const provider = normalize(row.provider || "manual");
  const status = normalize(row.status);
  const providerStatus = normalize(row.provider_status);
  const cancelledAt = row.cancelled_at || null;
  const failed = ["failed", "error"].includes(status) || ["failed", "error"].includes(providerStatus);
  const cancelled = !!cancelledAt || ["cancelled", "canceled", "expired"].includes(status) || ["cancelled", "canceled", "expired"].includes(providerStatus);
  const paidState = ["paid", "complete", "completed", "succeeded"].includes(status) || ["paid", "complete", "completed", "succeeded"].includes(providerStatus);
  const persistedPaid = !!row.paid_at && paidState;
  const checkoutEvidence = provider === "stripe" && !!row.external_checkout_id && !!row.checkout_created_at;

  let evidenceState = "request_record_only";
  if (failed) evidenceState = "failed_record";
  else if (cancelled) evidenceState = "cancelled_or_expired_record";
  else if (provider === "stripe" && persistedPaid) evidenceState = "stripe_persisted_paid_evidence";
  else if (provider === "stripe" && checkoutEvidence) evidenceState = "stripe_checkout_evidence";
  else if (provider === "stripe") evidenceState = "stripe_request_pending";
  else if (provider === "manual" && persistedPaid) evidenceState = "manual_persisted_paid";
  else if (provider === "manual") evidenceState = "manual_request";
  else if (provider === "paypal") evidenceState = "paypal_record_not_current_integration";

  return {
    request_id: row.id,
    booking_id: row.booking_id,
    customer_name: row.customer_name || "",
    amount_cents: Number(row.amount_cents || 0),
    paid_amount_cents: Number(row.paid_amount_cents || 0),
    currency: String(row.currency || "CAD").toUpperCase(),
    provider,
    status: status || "unknown",
    provider_status: providerStatus || "unknown",
    evidence_state: evidenceState,
    checkout_evidence_present: checkoutEvidence,
    persisted_paid_evidence_present: persistedPaid,
    provider_payment_intent_reference_present: !!row.provider_payment_intent_id,
    provider_event_reference_present: !!row.provider_event_id,
    webhook_verified: false,
    checkout_created_at: row.checkout_created_at || null,
    paid_at: row.paid_at || null,
    expires_at: row.expires_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function summarize(records) {
  const summary = {
    total_records: records.length,
    stripe_records: 0,
    stripe_checkout_evidence: 0,
    stripe_persisted_paid_evidence: 0,
    manual_records: 0,
    manual_persisted_paid: 0,
    failed_records: 0,
    cancelled_or_expired_records: 0,
    pending_records: 0
  };

  for (const record of records) {
    if (record.provider === "stripe") summary.stripe_records += 1;
    if (record.provider === "manual") summary.manual_records += 1;
    if (record.evidence_state === "stripe_checkout_evidence") summary.stripe_checkout_evidence += 1;
    if (record.evidence_state === "stripe_persisted_paid_evidence") summary.stripe_persisted_paid_evidence += 1;
    if (record.evidence_state === "manual_persisted_paid") summary.manual_persisted_paid += 1;
    if (record.evidence_state === "failed_record") summary.failed_records += 1;
    if (record.evidence_state === "cancelled_or_expired_record") summary.cancelled_or_expired_records += 1;
    if (["request_record_only", "stripe_request_pending", "manual_request"].includes(record.evidence_state)) summary.pending_records += 1;
  }

  return summary;
}

function deriveDevelopmentStatus({ stripeEnvironment, blockers, summary }) {
  if (blockers.length) return stripeEnvironment.mode === "live" ? "blocked_live_credential" : "blocked_unknown_credential";
  if (stripeEnvironment.mode !== "test") return "manual_only";
  if (summary.stripe_persisted_paid_evidence > 0) return "persisted_paid_evidence_present";
  if (summary.stripe_checkout_evidence > 0) return "checkout_evidence_present";
  return "configuration_ready_evidence_pending";
}

function clampLimit(value) {
  const parsed = Number(value || 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(1, Math.min(200, Math.trunc(parsed)));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}
