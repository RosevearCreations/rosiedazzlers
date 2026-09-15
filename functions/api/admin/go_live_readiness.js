// Build 406 — Go-Live Evidence & Provider Readiness Convergence
// Authenticated, read-only readiness evidence. No provider or business-data mutation.

import { requireStaffAccess } from "../_lib/staff-auth.js";

const CHECK_TIMEOUT_MS = 3500;
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
  items.push(...paymentEvidence(env));
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
  for (const item of items) counts[item.classification] = (counts[item.classification] || 0) + 1;

  const runtimeUnavailable = items.some((item) => item.required_for_runtime && item.classification === "unavailable");
  const pendingExternal = items.some((item) => item.classification === "provider_dependent" || item.classification === "owner_action");

  return json({
    ok: !runtimeUnavailable,
    build: 406,
    authority: "go_live_evidence_provider_readiness_convergence",
    generated_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    classifications: CLASSIFICATIONS,
    truth_boundary: {
      server_state_authoritative: true,
      provider_success_inferred: false,
      unavailable_is_failure: false,
      automatic_provider_or_business_mutation: false,
      automatic_background_replay: false
    },
    decision: runtimeUnavailable ? "runtime_evidence_incomplete" : pendingExternal ? "external_evidence_review_required" : "evidence_review_complete",
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
    return item("runtime_identity", "Cloudflare runtime identity", "unavailable",
      "Exact Pages runtime identity is not fully observable from this request.",
      "Use the exact-SHA Development/Production acceptance workflow and verify the request is served by the intended Pages environment.",
      { pages: onPages, exact_commit_sha_present: exact, branch_present: !!branch, host: new URL(request.url).host }, true);
  }
  return item("runtime_identity", "Cloudflare runtime identity", "runtime_proven",
    "This authenticated runtime exposes exact Cloudflare Pages source identity.", null,
    { pages: true, commit_sha: sha, branch, host: new URL(request.url).host }, true);
}

function authEvidence(access) {
  return item("staff_authorization", "Admin / I.T. authorization boundary", "runtime_proven",
    "This request passed the staff I.T. diagnostics authorization boundary.", null,
    { auth_mode: access.auth_mode || "unknown", role: access.actor?.role_code || null }, true);
}

async function supabaseEvidence(env) {
  const key = supabaseServiceKey(env);
  if (!clean(env?.SUPABASE_URL) || !key) {
    return item("supabase_runtime", "Supabase runtime", "unavailable",
      "Required Supabase runtime configuration is incomplete in this environment.",
      "Confirm SUPABASE_URL and the service-role secret binding without exposing secret values.",
      { configured: false, reachable: false }, true);
  }
  try {
    const response = await withTimeout(fetch(
      `${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/staff_users?select=id&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" } }
    ));
    if (!response.ok) {
      return item("supabase_runtime", "Supabase runtime", "unavailable",
        `The bounded read-only Supabase evidence request returned HTTP ${response.status}.`,
        "Inspect current Supabase availability, schema authority and Pages bindings; then refresh manually.",
        { configured: true, reachable: false, http_status: response.status }, true);
    }
    return item("supabase_runtime", "Supabase runtime", "runtime_proven",
      "A bounded read-only Supabase request succeeded in the current runtime.", null,
      { configured: true, reachable: true, http_status: response.status }, true);
  } catch (error) {
    return item("supabase_runtime", "Supabase runtime", "unavailable",
      "The bounded read-only Supabase evidence request could not complete.",
      "Inspect Supabase and Pages runtime availability; then refresh manually.",
      { configured: true, reachable: false, error_class: errorClass(error) }, true);
  }
}

async function r2Evidence(env) {
  if (!env?.R2_MEDIA || typeof env.R2_MEDIA.list !== "function") {
    return item("r2_runtime", "R2 media runtime", "unavailable",
      "The R2_MEDIA binding is not observable in this environment.",
      "Confirm the approved media bucket binding is attached as R2_MEDIA. No bucket mutation is required for this check.",
      { configured: false, reachable: false }, true);
  }
  try {
    await withTimeout(env.R2_MEDIA.list({ limit: 1 }));
    return item("r2_runtime", "R2 media runtime", "runtime_proven",
      "A bounded read-only R2 list request succeeded.", null,
      { configured: true, reachable: true }, true);
  } catch (error) {
    return item("r2_runtime", "R2 media runtime", "unavailable",
      "The bounded read-only R2 evidence request could not complete.",
      "Inspect the R2_MEDIA binding/bucket/service status; then refresh manually.",
      { configured: true, reachable: false, error_class: errorClass(error) }, true);
  }
}

function releaseAcceptanceEvidence(env) {
  const sha = clean(env?.CF_PAGES_COMMIT_SHA);
  const branch = clean(env?.CF_PAGES_BRANCH);
  return item("release_acceptance", "Exact-SHA release acceptance", "source_ready",
    "Source/runtime metadata supports exact-SHA release verification, but this endpoint does not self-certify the external GitHub/Cloudflare Production acceptance workflow.",
    "Use the exact-SHA GitHub release verifier as the promotion authority; a successful page load alone is not Production GREEN.",
    { exact_commit_sha_present: /^[0-9a-f]{40}$/i.test(sha), branch: branch || null }, false);
}

function paymentEvidence(env) {
  const stripeSecret = clean(env?.STRIPE_SECRET_KEY);
  const stripeWebhook = clean(env?.STRIPE_WEBHOOK_SECRET) || clean(env?.STRIPE_WEBHOOK_SECRET_QUOTES);
  const paypalClient = clean(env?.PAYPAL_CLIENT_ID);
  const paypalSecret = clean(env?.PAYPAL_CLIENT_SECRET) || clean(env?.PAYPAL_SECRET);
  const paypalWebhook = clean(env?.PAYPAL_WEBHOOK_ID);

  const stripeConfigured = !!stripeSecret && !!stripeWebhook;
  const paypalConfigured = !!paypalClient && !!paypalSecret && !!paypalWebhook;
  const stripeMode = stripeSecret.startsWith("sk_test_") ? "test" : stripeSecret.startsWith("sk_live_") ? "live" : stripeSecret ? "configured_unknown_mode" : "missing";

  return [
    item("stripe_configuration", "Stripe configuration authority", stripeConfigured ? "source_ready" : "unavailable",
      stripeConfigured ? "Required Stripe secret/webhook configuration is present; no provider call or payment mutation was performed." : "Required Stripe configuration presence is incomplete.",
      stripeConfigured ? null : "Review the current environment configuration. Do not paste or expose secret values.",
      { configured: stripeConfigured, webhook_configured: !!stripeWebhook, mode: stripeMode }, false),
    providerItem("stripe_provider_outcome", "Stripe controlled provider outcome",
      "A configured Stripe environment does not prove current-release checkout, webhook settlement, refund or final-balance outcomes.",
      "Run the separately authorized controlled acceptance and retain definitive provider outcome evidence."),
    item("paypal_configuration", "PayPal configuration authority", paypalConfigured ? "source_ready" : "unavailable",
      paypalConfigured ? "Required PayPal client/secret/webhook configuration is present; no provider call or payment mutation was performed." : "Required PayPal configuration presence is incomplete.",
      paypalConfigured ? null : "Review the current environment configuration. Do not paste or expose secret values.",
      { configured: paypalConfigured, webhook_configured: !!paypalWebhook }, false),
    providerItem("paypal_provider_outcome", "PayPal controlled provider outcome",
      "A configured PayPal environment does not prove current-release authorization/capture/webhook/refund outcomes.",
      "Run the separately authorized controlled acceptance before treating PayPal as accepted business evidence.")
  ];
}

function providerItem(id, name, detail, action) {
  return item(id, name, "provider_dependent", detail, action, { provider_success_observed_by_this_check: false }, false);
}
function ownerItem(id, name, detail, action) {
  return item(id, name, "owner_action", detail, action, { automated_proof_available: false }, false);
}
function item(id, name, classification, detail, action, evidence = {}, requiredForRuntime = false) {
  if (!CLASSIFICATIONS.includes(classification)) classification = "unavailable";
  return { id, name, classification, detail, action: action || null, evidence, required_for_runtime: !!requiredForRuntime };
}
function supabaseServiceKey(env) {
  return clean(env?.SUPABASE_SERVICE_ROLE_KEY) || clean(env?.SUPABASE_SERVICE_KEY) || clean(env?.SUPABASE_SERVICE_ROLE) || clean(env?.SUPABASE_SECRET_KEY);
}
async function withTimeout(promise, ms = CHECK_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error("readiness_timeout")), ms); });
  try { return await Promise.race([promise, timeout]); }
  finally { clearTimeout(timeoutId); }
}
function clean(value) { return String(value || "").trim(); }
function errorClass(error) { return error?.message === "readiness_timeout" ? "timeout" : (error?.name || "Error"); }
function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Readiness": "build-406-read-only"
    }
  });
}
