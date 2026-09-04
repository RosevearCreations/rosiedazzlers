// Build 321 — read-only Stripe/local payment reconciliation authority.
// Compares provider Checkout Session evidence with persisted payment requests and booking finance events.
// Never charges, creates checkout sessions, writes finance entries, or asserts webhook verification.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";
import { statusKind } from "../_lib/final-balance-links.js";

const REQUEST_SELECT = [
  "id","booking_id","customer_name","customer_email","amount_cents","currency","status","provider","provider_status",
  "external_checkout_id","checkout_created_at","paid_at","paid_amount_cents","provider_payment_intent_id","provider_event_id",
  "expires_at","cancelled_at","created_at","updated_at"
].join(",");

const MAX_REQUESTS = 25;

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const limit = clampLimit(url.searchParams.get("limit"));
    const stripeEnvironment = classifyStripeEnvironment(env);
    const developmentLike = isDevelopmentLike(env);
    const blockers = [];
    const warnings = [
      "Provider reconciliation is read-only. Booking finance entries are not written automatically because the current finance writer has no database-enforced provider idempotency key.",
      "Build 321 does not assert webhook verification. Stripe Checkout Session state is queried directly when credentials and environment policy allow it."
    ];

    if (developmentLike && stripeEnvironment.mode === "live") {
      blockers.push("Live Stripe credentials are blocked for Development reconciliation. No provider request was made.");
    } else if (stripeEnvironment.mode === "unknown") {
      blockers.push("The configured Stripe credential mode is unknown. Provider reconciliation fails closed until the server-side configuration is corrected.");
    } else if (stripeEnvironment.mode === "not_configured") {
      warnings.push("Stripe is not configured in this environment, so provider-side reconciliation evidence is unavailable.");
    }

    const source = await loadPaymentRequests(env, limit);
    const stripeRows = source.requests.filter((row) => normalize(row.provider) === "stripe" && row.external_checkout_id);
    const finance = await loadFinalPaymentFinance(env, stripeRows.map((row) => row.booking_id).filter(Boolean));
    const providerContactAllowed = stripeEnvironment.configured && stripeEnvironment.mode !== "unknown" && !(developmentLike && stripeEnvironment.mode === "live");

    const records = [];
    for (const row of stripeRows) {
      let provider = { ok: false, status: "not_checked", reason: "Provider contact is unavailable under the current environment policy." };
      if (providerContactAllowed) provider = await loadStripeCheckoutSession(env, row.external_checkout_id);
      records.push(toReconciliationRecord(row, provider, finance.byBooking.get(String(row.booking_id || "")) || emptyFinance()));
    }

    const summary = summarize(records);
    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      table_ready: source.table_ready,
      source_warning: source.warning || null,
      contract: {
        read_only: true,
        secret_values_exposed: false,
        provider_contact_read_only: true,
        provider_mutation: false,
        finance_mutation: false,
        automatic_charge: false,
        automatic_checkout_creation: false,
        automatic_customer_notification: false,
        recurring_billing: false,
        webhook_verification_asserted: false,
        operator_action_required: true
      },
      stripe_environment: {
        ...stripeEnvironment,
        development_like: developmentLike,
        provider_contact_allowed: providerContactAllowed,
        secret_value_returned: false
      },
      blockers,
      warnings,
      finance_source_ready: finance.ready,
      finance_warning: finance.warning,
      summary,
      records
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not calculate payment reconciliation readiness." }, 500);
  }
}

export async function onRequestPost() {
  return json({
    ok: false,
    error: "Payment reconciliation is read-only in Build 321. Record any finance correction through the existing explicit booking-finance workflow after operator review."
  }, 405);
}

async function loadPaymentRequests(env, limit) {
  if (!hasSupabaseConfig(env)) return { table_ready: false, requests: [], warning: "Supabase is not configured for reconciliation lookup." };
  const endpoint = `${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=${encodeURIComponent(REQUEST_SELECT)}&provider=eq.stripe&external_checkout_id=not.is.null&order=updated_at.desc&limit=${limit}`;
  const response = await fetch(endpoint, { method: "GET", headers: serviceHeaders(env) });
  const text = await response.text();
  const data = safeJson(text);
  if (!response.ok) return { table_ready: false, requests: [], warning: data?.message || text || "Payment request source is unavailable." };
  return { table_ready: true, requests: Array.isArray(data) ? data : [], warning: null };
}

async function loadFinalPaymentFinance(env, bookingIds) {
  const unique = [...new Set(bookingIds.map(String).filter(Boolean))];
  const byBooking = new Map();
  if (!unique.length) return { ready: true, warning: null, byBooking };
  if (!hasSupabaseConfig(env)) return { ready: false, warning: "Supabase is not configured for booking finance lookup.", byBooking };

  const ids = unique.join(",");
  const endpoint = `${env.SUPABASE_URL}/rest/v1/booking_events?select=booking_id,created_at,event_type,payload&booking_id=in.(${encodeURIComponent(ids)})&event_type=eq.booking_finance_final_payment&order=created_at.asc`;
  const response = await fetch(endpoint, { method: "GET", headers: serviceHeaders(env) });
  const text = await response.text();
  const rows = safeJson(text);
  if (!response.ok) return { ready: false, warning: rows?.message || text || "Booking finance source is unavailable.", byBooking };

  for (const row of Array.isArray(rows) ? rows : []) {
    const bookingId = String(row?.booking_id || "");
    if (!bookingId) continue;
    const current = byBooking.get(bookingId) || emptyFinance();
    const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
    const amountCad = Number(payload.amount_cad || 0);
    current.final_payment_count += 1;
    current.final_payment_cents += Math.round(amountCad * 100);
    current.last_final_payment_at = payload.recorded_at || row.created_at || current.last_final_payment_at;
    byBooking.set(bookingId, current);
  }
  return { ready: true, warning: null, byBooking };
}

async function loadStripeCheckoutSession(env, sessionId) {
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
    });
    const text = await response.text();
    const data = safeJson(text);
    if (!response.ok || !data?.id) {
      return { ok: false, status: "provider_error", reason: data?.error?.message || text || "Stripe session lookup failed." };
    }
    return {
      ok: true,
      status: normalize(data.status) || "unknown",
      payment_status: normalize(data.payment_status) || "unknown",
      amount_total: Number(data.amount_total || 0),
      currency: String(data.currency || "").toUpperCase(),
      client_reference_id: data.client_reference_id || null,
      metadata_request_id: data?.metadata?.final_balance_payment_request_id || null,
      metadata_booking_id: data?.metadata?.booking_id || null,
      payment_intent_reference_present: !!data.payment_intent
    };
  } catch (err) {
    return { ok: false, status: "provider_error", reason: err?.message || "Stripe session lookup failed." };
  }
}

function toReconciliationRecord(row, provider, finance) {
  const requestState = statusKind(row);
  const localPaid = requestState === "paid" || !!row.paid_at;
  const localPaidCents = Number(row.paid_amount_cents || 0);
  const expectedCents = Number(row.amount_cents || 0);
  const expectedCurrency = String(row.currency || "CAD").toUpperCase();
  const financeCents = Number(finance.final_payment_cents || 0);
  const providerPaid = provider.ok && provider.payment_status === "paid";
  const providerComplete = provider.ok && provider.status === "complete";

  const requestIdentityPresent = provider.ok && !!(provider.client_reference_id || provider.metadata_request_id);
  const requestIdentityMatches = provider.ok && (
    provider.client_reference_id === row.id || provider.metadata_request_id === row.id
  );
  const bookingIdentityMatches = provider.ok && (!provider.metadata_booking_id || !row.booking_id || provider.metadata_booking_id === row.booking_id);
  const amountMatches = provider.ok && provider.amount_total === expectedCents;
  const currencyMatches = provider.ok && provider.currency === expectedCurrency;
  const identityMatches = requestIdentityPresent && requestIdentityMatches && bookingIdentityMatches && amountMatches && currencyMatches;
  const financeCoversRequest = expectedCents > 0 && financeCents >= expectedCents;

  let reconciliationState = "blocked_provider_unavailable";
  let severity = "blocked";
  let operatorNextStep = "Provider evidence is unavailable. Do not post or reverse money from this screen.";

  if (provider.ok && !identityMatches) {
    reconciliationState = "blocked_identity_mismatch";
    operatorNextStep = "Provider amount, currency or request identity does not match this Rosie Dazzlers request. Review manually; do not post finance automatically.";
  } else if (providerPaid && !localPaid) {
    reconciliationState = financeCoversRequest ? "request_state_reconciliation_required" : "finance_reconciliation_required";
    severity = "action";
    operatorNextStep = financeCoversRequest
      ? "A final-payment finance entry already covers this request, but the tracked payment request is not marked paid. Review the existing finance entry before changing request state."
      : "Stripe reports paid and identity matches, but Rosie Dazzlers has no covering final-payment finance entry. Use the existing Booking Workbench finance workflow once after review; Build 321 does not auto-post it.";
  } else if (providerPaid && localPaid && financeCoversRequest) {
    reconciliationState = "matched_paid";
    severity = "ok";
    operatorNextStep = "Provider, tracked request and booking final-payment ledger agree. No reconciliation action is needed.";
  } else if (providerPaid && localPaid && !financeCoversRequest) {
    reconciliationState = "finance_reconciliation_required";
    severity = "action";
    operatorNextStep = "Provider and tracked request show paid, but the booking final-payment ledger does not cover the request amount. Review before adding exactly one finance entry.";
  } else if (localPaid && !providerPaid) {
    reconciliationState = "local_provider_discrepancy";
    severity = "blocked";
    operatorNextStep = "Rosie Dazzlers records payment but Stripe does not report this Checkout Session paid. Investigate before changing either side.";
  } else if (providerComplete && !providerPaid) {
    reconciliationState = "complete_unpaid_review";
    severity = "blocked";
    operatorNextStep = "Stripe reports the Checkout Session complete but not paid. This is not payment evidence; review the provider session before any local finance change.";
  } else if (provider.ok && provider.status === "open") {
    reconciliationState = "provider_open";
    severity = "neutral";
    operatorNextStep = "Checkout remains open. No reconciliation is due.";
  } else if (provider.ok && provider.status === "expired") {
    reconciliationState = "recovery_ready";
    severity = "neutral";
    operatorNextStep = "Checkout is expired and unpaid. Use Payment Recovery if a new customer handoff is needed.";
  } else if (provider.ok) {
    reconciliationState = "manual_review";
    severity = "blocked";
    operatorNextStep = "Provider state is not conclusive enough for a finance change. Review manually.";
  }

  return {
    request_id: row.id,
    booking_id: row.booking_id || null,
    customer_name: row.customer_name || "",
    customer_email: row.customer_email || "",
    amount_cents: expectedCents,
    currency: expectedCurrency,
    request_status: normalize(row.status) || "unknown",
    provider_status_persisted: normalize(row.provider_status) || "unknown",
    local_paid: localPaid,
    local_paid_amount_cents: localPaidCents,
    local_paid_at: row.paid_at || null,
    finance_final_payment_count: finance.final_payment_count,
    finance_final_payment_cents: financeCents,
    finance_last_final_payment_at: finance.last_final_payment_at,
    provider_lookup_ok: provider.ok,
    provider_session_status: provider.ok ? provider.status : provider.status || "not_checked",
    provider_payment_status: provider.ok ? provider.payment_status : "unknown",
    provider_amount_cents: provider.ok ? provider.amount_total : null,
    provider_currency: provider.ok ? provider.currency : null,
    provider_payment_intent_reference_present: provider.ok ? provider.payment_intent_reference_present : false,
    persisted_payment_intent_reference_present: !!row.provider_payment_intent_id,
    persisted_provider_event_reference_present: !!row.provider_event_id,
    provider_identity_evidence_present: requestIdentityPresent,
    identity_matches: identityMatches,
    amount_matches: amountMatches,
    currency_matches: currencyMatches,
    webhook_verified: false,
    reconciliation_state: reconciliationState,
    severity,
    operator_next_step: operatorNextStep,
    checkout_created_at: row.checkout_created_at || null,
    expires_at: row.expires_at || null,
    updated_at: row.updated_at || null
  };
}

function summarize(records) {
  const summary = {
    total_checked: records.length,
    matched_paid: 0,
    reconciliation_required: 0,
    blocked_discrepancy: 0,
    provider_open: 0,
    recovery_ready: 0,
    manual_review: 0
  };
  for (const record of records) {
    if (record.reconciliation_state === "matched_paid") summary.matched_paid += 1;
    else if (["finance_reconciliation_required", "request_state_reconciliation_required"].includes(record.reconciliation_state)) summary.reconciliation_required += 1;
    else if (["blocked_identity_mismatch", "local_provider_discrepancy", "complete_unpaid_review", "blocked_provider_unavailable"].includes(record.reconciliation_state)) summary.blocked_discrepancy += 1;
    else if (record.reconciliation_state === "provider_open") summary.provider_open += 1;
    else if (record.reconciliation_state === "recovery_ready") summary.recovery_ready += 1;
    else summary.manual_review += 1;
  }
  return summary;
}

function classifyStripeEnvironment(env) {
  const secret = String(env?.STRIPE_SECRET_KEY || "");
  const configured = !!secret;
  const mode = !configured ? "not_configured" : secret.startsWith("sk_test_") ? "test" : secret.startsWith("sk_live_") ? "live" : "unknown";
  return { configured, mode };
}
function isDevelopmentLike(env) {
  const branch = String(env?.CF_PAGES_BRANCH || "").toLowerCase();
  const environment = String(env?.ENVIRONMENT || env?.APP_ENV || "").toLowerCase();
  return branch === "dev" || branch.startsWith("build") || ["dev","development","preview","test"].includes(environment);
}
function emptyFinance() { return { final_payment_count: 0, final_payment_cents: 0, last_final_payment_at: null }; }
function clampLimit(value) { const n = Number(value || MAX_REQUESTS); return Number.isFinite(n) ? Math.max(1, Math.min(MAX_REQUESTS, Math.trunc(n))) : MAX_REQUESTS; }
function normalize(value) { return String(value || "").trim().toLowerCase(); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
