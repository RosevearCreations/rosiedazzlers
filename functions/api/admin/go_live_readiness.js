// Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance
// Authenticated, bounded, read-only readiness evidence. No provider or business-data mutation.

import { requireStaffAccess } from "../_lib/staff-auth.js";

const CHECK_TIMEOUT_MS = 3500;
const PROVIDER_LIMIT = 20;
const EVENT_LIMIT = 40;
const CLASSIFICATIONS = Object.freeze([
  "source_ready",
  "runtime_proven",
  "provider_dependent",
  "owner_action",
  "unavailable"
]);

export async function onRequestGet({ request, env }) {
  const startedAt = Date.now();
  const access = await requireStaffAccess({
    request,
    env,
    capability: "it_diagnostics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const items = [];
  items.push(runtimeIdentity(env, request));
  items.push(authEvidence(access));
  items.push(await supabaseEvidence(env));
  items.push(await r2Evidence(env));
  items.push(releaseAcceptanceEvidence(env));
  items.push(...await paymentEvidence(env));
  items.push(providerItem(
    "communication_delivery",
    "Email / SMS delivery evidence",
    "Delivery is provider-dependent until queued/delivered/failed outcomes are independently observed for the current release.",
    "Run controlled delivery acceptance with consent-safe test recipients; retain provider outcome evidence without exposing message contents or secrets."
  ));
  items.push(ownerItem(
    "search_local_proof",
    "Search Console / Google Business Profile proof",
    "External search/local-profile proof cannot be inferred from repository source or a successful deployment.",
    "Review current Search Console and Google Business Profile evidence before changing verified local-search claims."
  ));
  items.push(ownerItem(
    "backup_export_proof",
    "Backup / export recovery proof",
    "Repository source cannot prove a current restorable backup/export exists.",
    "Perform the approved read-only/export verification and record the observed evidence separately; any restore remains separately authorized."
  ));
  items.push(ownerItem(
    "responsive_visual_proof",
    "Representative phone / tablet / desktop visual proof",
    "Responsive source checks are retained, but source checks are not independent visual-browser evidence.",
    "Observe the critical public, booking, Customer, Detailer and Admin paths at representative phone, tablet and desktop widths."
  ));

  const counts = Object.fromEntries(CLASSIFICATIONS.map((key) => [key, 0]));
  for (const current of items) counts[current.classification] = (counts[current.classification] || 0) + 1;

  const runtimeUnavailable = items.some((current) => current.required_for_runtime && current.classification === "unavailable");
  const pendingExternal = items.some((current) => current.classification === "provider_dependent" || current.classification === "owner_action");
  const paymentProviderReady = items
    .filter((current) => ["stripe_provider_outcome", "paypal_provider_outcome"].includes(current.id))
    .every((current) => current.classification === "runtime_proven");

  return json({
    ok: !runtimeUnavailable,
    build: 407,
    authority: "payment_provider_live_outcome_reconciliation_acceptance",
    generated_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    classifications: CLASSIFICATIONS,
    truth_boundary: {
      server_state_authoritative: true,
      provider_success_inferred: false,
      unavailable_is_failure: false,
      automatic_provider_or_business_mutation: false,
      automatic_background_replay: false,
      provider_contact_performed_by_this_check: false,
      persisted_verified_webhook_required_for_provider_green: true,
      reconciled_internal_payment_required_for_provider_green: true
    },
    payment_provider_readiness: paymentProviderReady ? "green" : "hold",
    decision: runtimeUnavailable
      ? "runtime_evidence_incomplete"
      : pendingExternal
        ? "external_evidence_review_required"
        : "evidence_review_complete",
    counts,
    actor: {
      role: access.actor?.role_code || (access.actor?.is_admin ? "admin" : "staff"),
      auth_mode: access.auth_mode || "unknown"
    },
    items
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", Allow: "GET, HEAD, OPTIONS" }
  });
}

function runtimeIdentity(env, request) {
  const sha = clean(env?.CF_PAGES_COMMIT_SHA);
  const branch = clean(env?.CF_PAGES_BRANCH);
  const onPages = String(env?.CF_PAGES || "") === "1";
  const exact = /^[0-9a-f]{40}$/i.test(sha);
  if (!onPages || !exact || !branch) {
    return item(
      "runtime_identity",
      "Cloudflare runtime identity",
      "unavailable",
      "Exact Pages runtime identity is not fully observable from this request.",
      "Use the exact-SHA Development/Production acceptance workflow and verify the request is served by the intended Pages environment.",
      { pages: onPages, exact_commit_sha_present: exact, branch_present: !!branch, host: new URL(request.url).host },
      true
    );
  }
  return item(
    "runtime_identity",
    "Cloudflare runtime identity",
    "runtime_proven",
    "This authenticated runtime exposes exact Cloudflare Pages source identity.",
    null,
    { pages: true, commit_sha: sha, branch, host: new URL(request.url).host },
    true
  );
}

function authEvidence(access) {
  return item(
    "staff_authorization",
    "Admin / I.T. authorization boundary",
    "runtime_proven",
    "This request passed the staff I.T. diagnostics authorization boundary.",
    null,
    { auth_mode: access.auth_mode || "unknown", role: access.actor?.role_code || null },
    true
  );
}

async function supabaseEvidence(env) {
  const key = supabaseServiceKey(env);
  if (!clean(env?.SUPABASE_URL) || !key) {
    return item(
      "supabase_runtime",
      "Supabase runtime",
      "unavailable",
      "Required Supabase runtime configuration is incomplete in this environment.",
      "Confirm SUPABASE_URL and the service-role secret binding without exposing secret values.",
      { configured: false, reachable: false },
      true
    );
  }
  try {
    const response = await withTimeout(fetch(
      `${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/staff_users?select=id&limit=1`,
      { headers: readHeaders(env) }
    ));
    if (!response.ok) {
      return item(
        "supabase_runtime",
        "Supabase runtime",
        "unavailable",
        `The bounded read-only Supabase evidence request returned HTTP ${response.status}.`,
        "Inspect current Supabase availability, schema authority and Pages bindings; then refresh manually.",
        { configured: true, reachable: false, http_status: response.status },
        true
      );
    }
    return item(
      "supabase_runtime",
      "Supabase runtime",
      "runtime_proven",
      "A bounded read-only Supabase request succeeded in the current runtime.",
      null,
      { configured: true, reachable: true, http_status: response.status },
      true
    );
  } catch (error) {
    return item(
      "supabase_runtime",
      "Supabase runtime",
      "unavailable",
      "The bounded read-only Supabase evidence request could not complete.",
      "Inspect Supabase and Pages runtime availability; then refresh manually.",
      { configured: true, reachable: false, error_class: errorClass(error) },
      true
    );
  }
}

async function r2Evidence(env) {
  if (!env?.R2_MEDIA || typeof env.R2_MEDIA.list !== "function") {
    return item(
      "r2_runtime",
      "R2 media runtime",
      "unavailable",
      "The R2_MEDIA binding is not observable in this environment.",
      "Confirm the approved media bucket binding is attached as R2_MEDIA. No bucket mutation is required for this check.",
      { configured: false, reachable: false },
      true
    );
  }
  try {
    await withTimeout(env.R2_MEDIA.list({ limit: 1 }));
    return item(
      "r2_runtime",
      "R2 media runtime",
      "runtime_proven",
      "A bounded read-only R2 list request succeeded.",
      null,
      { configured: true, reachable: true },
      true
    );
  } catch (error) {
    return item(
      "r2_runtime",
      "R2 media runtime",
      "unavailable",
      "The bounded read-only R2 evidence request could not complete.",
      "Inspect the R2_MEDIA binding/bucket/service status; then refresh manually.",
      { configured: true, reachable: false, error_class: errorClass(error) },
      true
    );
  }
}

function releaseAcceptanceEvidence(env) {
  const sha = clean(env?.CF_PAGES_COMMIT_SHA);
  const branch = clean(env?.CF_PAGES_BRANCH);
  return item(
    "release_acceptance",
    "Exact-SHA release acceptance",
    "source_ready",
    "Source/runtime metadata supports exact-SHA release verification, but this endpoint does not self-certify the external GitHub/Cloudflare Production acceptance workflow.",
    "Use the exact-SHA GitHub release verifier as the promotion authority; a successful page load alone is not Production GREEN.",
    { exact_commit_sha_present: /^[0-9a-f]{40}$/i.test(sha), branch: branch || null },
    false
  );
}

async function paymentEvidence(env) {
  const stripeSecret = clean(env?.STRIPE_SECRET_KEY);
  const stripeWebhook = clean(env?.STRIPE_WEBHOOK_SECRET) || clean(env?.STRIPE_WEBHOOK_SECRET_QUOTES);
  const paypalClient = clean(env?.PAYPAL_CLIENT_ID);
  const paypalSecret = clean(env?.PAYPAL_CLIENT_SECRET) || clean(env?.PAYPAL_SECRET);
  const paypalWebhook = clean(env?.PAYPAL_WEBHOOK_ID);

  const stripeConfigured = !!stripeSecret && !!stripeWebhook;
  const paypalConfigured = !!paypalClient && !!paypalSecret && !!paypalWebhook;
  const stripeMode = stripeSecret.startsWith("sk_test_")
    ? "test"
    : stripeSecret.startsWith("sk_live_")
      ? "live"
      : stripeSecret
        ? "configured_unknown_mode"
        : "missing";
  const paypalMode = classifyPayPalMode(env);

  const [stripeOutcome, paypalOutcome] = await Promise.all([
    providerOutcomeEvidence(env, "stripe", stripeConfigured),
    providerOutcomeEvidence(env, "paypal", paypalConfigured)
  ]);

  return [
    item(
      "stripe_configuration",
      "Stripe configuration authority",
      stripeConfigured ? "source_ready" : "unavailable",
      stripeConfigured
        ? "Required Stripe secret/webhook configuration is present; no provider call or payment mutation was performed."
        : "Required Stripe configuration presence is incomplete.",
      stripeConfigured ? null : "Review the current environment configuration. Do not paste or expose secret values.",
      { configured: stripeConfigured, webhook_configured: !!stripeWebhook, mode: stripeMode },
      false
    ),
    stripeOutcome,
    item(
      "paypal_configuration",
      "PayPal configuration authority",
      paypalConfigured ? "source_ready" : "unavailable",
      paypalConfigured
        ? "Required PayPal client/secret/webhook configuration is present; no provider call or payment mutation was performed."
        : "Required PayPal configuration presence is incomplete.",
      paypalConfigured ? null : "Review the current environment configuration. Do not paste or expose secret values.",
      { configured: paypalConfigured, webhook_configured: !!paypalWebhook, mode: paypalMode },
      false
    ),
    paypalOutcome
  ];
}

async function providerOutcomeEvidence(env, provider, configured) {
  if (!configured) {
    return providerItem(
      `${provider}_provider_outcome`,
      `${providerLabel(provider)} verified provider outcome`,
      `${providerLabel(provider)} configuration is incomplete, so live-outcome reconciliation evidence cannot be evaluated.`,
      "Correct server-side provider configuration first; do not paste secrets into diagnostics."
    );
  }
  if (!clean(env?.SUPABASE_URL) || !supabaseServiceKey(env)) {
    return item(
      `${provider}_provider_outcome`,
      `${providerLabel(provider)} verified provider outcome`,
      "unavailable",
      "Persisted payment evidence cannot be read because Supabase service configuration is unavailable.",
      "Restore the approved Supabase service binding, then refresh this read-only evidence.",
      {
        provider,
        provider_contact_performed: false,
        provider_success_observed_by_this_check: false,
        reconciled_records: 0
      },
      false
    );
  }

  try {
    const [paymentsResponse, eventsResponse] = await Promise.all([
      withTimeout(fetch(providerPaymentRequestUrl(env, provider), { headers: readHeaders(env) })),
      withTimeout(fetch(providerWebhookEventUrl(env, provider), { headers: readHeaders(env) }))
    ]);

    if (!paymentsResponse.ok || !eventsResponse.ok) {
      return item(
        `${provider}_provider_outcome`,
        `${providerLabel(provider)} verified provider outcome`,
        "unavailable",
        `Persisted ${providerLabel(provider)} evidence lookup was incomplete.`,
        "Inspect the retained payment-request and webhook-event tables, then refresh. Do not create a transaction merely to satisfy this diagnostic.",
        {
          provider,
          provider_contact_performed: false,
          provider_success_observed_by_this_check: false,
          payment_http_status: paymentsResponse.status,
          event_http_status: eventsResponse.status,
          reconciled_records: 0
        },
        false
      );
    }

    const payments = asArray(await paymentsResponse.json().catch(() => []));
    const events = asArray(await eventsResponse.json().catch(() => []));
    const reconciliation = reconcileProviderEvidence(provider, payments, events);

    if (reconciliation.reconciled_records > 0) {
      return item(
        `${provider}_provider_outcome`,
        `${providerLabel(provider)} verified provider outcome`,
        "runtime_proven",
        `Persisted verified ${providerLabel(provider)} webhook evidence is linked to an internal payment request and reconciles amount/currency without contacting or mutating the provider.`,
        null,
        reconciliation,
        false
      );
    }

    return item(
      `${provider}_provider_outcome`,
      `${providerLabel(provider)} verified provider outcome`,
      "provider_dependent",
      `No persisted ${providerLabel(provider)} outcome currently satisfies the Build 407 live-payment reconciliation contract.`,
      "Use an already-authorized controlled provider acceptance when appropriate. The readiness check itself never creates, captures, refunds or replays a payment.",
      reconciliation,
      false
    );
  } catch (error) {
    return item(
      `${provider}_provider_outcome`,
      `${providerLabel(provider)} verified provider outcome`,
      "unavailable",
      `The bounded persisted ${providerLabel(provider)} evidence lookup could not complete.`,
      "Inspect Supabase/runtime availability and refresh. Do not create a provider transaction merely to clear this diagnostic.",
      {
        provider,
        provider_contact_performed: false,
        provider_success_observed_by_this_check: false,
        reconciled_records: 0,
        error_class: errorClass(error)
      },
      false
    );
  }
}

function reconcileProviderEvidence(provider, payments, events) {
  const acceptedStatuses = new Set(["settled", "replayed", "refund_recorded"]);
  const providerPayments = payments.filter((row) => normalize(row?.provider) === provider);
  const providerEvents = events.filter((row) => normalize(row?.provider) === provider);
  const paymentById = new Map(providerPayments.map((row) => [clean(row?.id), row]).filter(([id]) => id));
  const acceptedEvents = providerEvents.filter((row) => acceptedStatuses.has(normalize(row?.status)) && clean(row?.provider_event_id));

  let reconciledRecords = 0;
  let identityMatchedRecords = 0;
  let amountMatchedRecords = 0;
  let paidRecords = 0;
  let replayObserved = 0;
  let latestAcceptedAt = null;
  let latestAcceptedStatus = null;
  let latestAcceptedEventType = null;

  for (const event of acceptedEvents) {
    const payment = paymentById.get(clean(event?.quote_deposit_payment_request_id));
    if (!payment) continue;

    const eventReference = clean(event?.payment_reference);
    const paymentReference = clean(payment?.payment_reference) || clean(payment?.external_checkout_id);
    const referenceMatches = !!eventReference && !!paymentReference && eventReference === paymentReference;
    const identityMatches = clean(event?.quote_deposit_payment_request_id) === clean(payment?.id)
      && !!clean(event?.provider_event_id)
      && (referenceMatches || !eventReference || !paymentReference);

    if (identityMatches) identityMatchedRecords += 1;

    const expectedCents = integerCents(payment?.amount_cents);
    const paidCents = integerCents(payment?.paid_amount_cents);
    const paymentStatus = normalize(payment?.payment_status);
    const paidLike = ["paid", "refunded", "partial_refund"].includes(paymentStatus) && !!payment?.paid_at;
    if (paidLike) paidRecords += 1;

    const amountMatches = expectedCents > 0 && paidCents === expectedCents;
    if (amountMatches) amountMatchedRecords += 1;

    const currency = clean(payment?.currency).toUpperCase();
    const reconciled = identityMatches && paidLike && amountMatches && /^[A-Z]{3}$/.test(currency);
    if (!reconciled) continue;

    reconciledRecords += 1;
    if (normalize(event?.status) === "replayed") replayObserved += 1;
    const acceptedAt = clean(event?.updated_at) || clean(event?.created_at);
    if (!latestAcceptedAt || acceptedAt > latestAcceptedAt) {
      latestAcceptedAt = acceptedAt || latestAcceptedAt;
      latestAcceptedStatus = normalize(event?.status) || null;
      latestAcceptedEventType = clean(event?.provider_event_type) || null;
    }
  }

  return {
    provider,
    provider_contact_performed: false,
    provider_success_observed_by_this_check: reconciledRecords > 0,
    accepted_webhook_statuses: [...acceptedStatuses],
    payment_records_checked: providerPayments.length,
    webhook_events_checked: providerEvents.length,
    definitive_verified_events: acceptedEvents.length,
    identity_matched_records: identityMatchedRecords,
    paid_records: paidRecords,
    amount_matched_records: amountMatchedRecords,
    reconciled_records: reconciledRecords,
    replay_observed: replayObserved > 0,
    latest_accepted_status: latestAcceptedStatus,
    latest_accepted_event_type: latestAcceptedEventType,
    latest_accepted_at: latestAcceptedAt,
    idempotent_identity_rule: "provider + provider_event_id + internal payment-request id",
    reconciliation_rule: "verified settled/replayed/refund-recorded webhook + linked internal payment + exact paid amount + valid currency"
  };
}

function providerPaymentRequestUrl(env, provider) {
  const select = [
    "id",
    "booking_id",
    "confirmed_booking_id",
    "payment_status",
    "provider",
    "amount_cents",
    "paid_amount_cents",
    "currency",
    "external_checkout_id",
    "payment_reference",
    "paid_at",
    "updated_at"
  ].join(",");
  return `${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(select)}&provider=eq.${encodeURIComponent(provider)}&order=updated_at.desc&limit=${PROVIDER_LIMIT}`;
}

function providerWebhookEventUrl(env, provider) {
  const select = [
    "id",
    "provider",
    "provider_event_id",
    "provider_event_type",
    "quote_deposit_payment_request_id",
    "booking_id",
    "payment_reference",
    "status",
    "created_at",
    "updated_at"
  ].join(",");
  return `${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/quote_payment_webhook_events?select=${encodeURIComponent(select)}&provider=eq.${encodeURIComponent(provider)}&order=updated_at.desc&limit=${EVENT_LIMIT}`;
}

function providerItem(id, name, detail, action) {
  return item(
    id,
    name,
    "provider_dependent",
    detail,
    action,
    {
      provider_success_observed_by_this_check: false,
      provider_contact_performed: false,
      reconciled_records: 0
    },
    false
  );
}

function ownerItem(id, name, detail, action) {
  return item(id, name, "owner_action", detail, action, { automated_proof_available: false }, false);
}

function item(id, name, classification, detail, action, evidence = {}, requiredForRuntime = false) {
  if (!CLASSIFICATIONS.includes(classification)) classification = "unavailable";
  return {
    id,
    name,
    classification,
    detail,
    action: action || null,
    evidence,
    required_for_runtime: !!requiredForRuntime
  };
}

function readHeaders(env) {
  const key = supabaseServiceKey(env);
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

function supabaseServiceKey(env) {
  return clean(env?.SUPABASE_SERVICE_ROLE_KEY)
    || clean(env?.SUPABASE_SERVICE_KEY)
    || clean(env?.SUPABASE_SERVICE_ROLE)
    || clean(env?.SUPABASE_SECRET_KEY);
}

function classifyPayPalMode(env) {
  const base = clean(env?.PAYPAL_API_BASE).toLowerCase();
  if (!clean(env?.PAYPAL_CLIENT_ID)) return "missing";
  if (base.includes("sandbox")) return "sandbox";
  if (!base || base.includes("api-m.paypal.com")) return "live_or_default";
  return "configured_custom";
}

function providerLabel(provider) {
  return provider === "paypal" ? "PayPal" : "Stripe";
}

async function withTimeout(promise, ms = CHECK_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("readiness_timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function integerCents(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) ? parsed : Math.round(parsed);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return clean(value).toLowerCase();
}

function clean(value) {
  return String(value || "").trim();
}

function errorClass(error) {
  return error?.message === "readiness_timeout" ? "timeout" : (error?.name || "Error");
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Readiness": "build-407-read-only"
    }
  });
}
