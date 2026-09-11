// Build 379 — Production Observability & Self-Diagnostics
// Authenticated, read-only, bounded operator diagnostics. No recurring polling and no provider/business-data mutation.

import { requireStaffAccess } from "../_lib/staff-auth.js";

const CHECK_TIMEOUT_MS = 3500;
const FAILURE_FAMILIES = ["source", "build", "deploy", "configuration", "runtime"];

export async function onRequestGet({ request, env }) {
  const startedAt = Date.now();
  const access = await requireStaffAccess({
    request,
    env,
    capability: "it_diagnostics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const checks = [];
  checks.push(deploymentCheck(env, request));
  checks.push(buildIdentityCheck(env));
  checks.push(authCheck(access));
  checks.push(await supabaseCheck(env));
  checks.push(await r2Check(env));
  checks.push(await criticalApiCheck(request));
  checks.push(paymentConfigurationCheck(env));

  const overall = checks.some((check) => check.status === "failed")
    ? "failed"
    : checks.some((check) => check.status === "degraded")
      ? "degraded"
      : "healthy";

  return json({
    ok: overall !== "failed",
    build: 379,
    authority: "production_observability_self_diagnostics",
    overall,
    failure_families: FAILURE_FAMILIES,
    generated_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt,
    actor: {
      role: access.actor?.role_code || (access.actor?.is_admin ? "admin" : "staff"),
      auth_mode: access.auth_mode || "unknown"
    },
    checks
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", Allow: "GET, OPTIONS" }
  });
}

function deploymentCheck(env, request) {
  const onPages = String(env?.CF_PAGES || "") === "1";
  const branch = clean(env?.CF_PAGES_BRANCH);
  const pagesUrl = clean(env?.CF_PAGES_URL);
  const host = new URL(request.url).host;
  if (!onPages || !branch || !pagesUrl) {
    return result("Pages deployment", "degraded", "deploy",
      "Cloudflare Pages deployment metadata is incomplete.",
      "Confirm the request is running in the intended Pages project/environment and that the Git-backed deployment completed successfully.",
      { pages: onPages, branch_present: !!branch, deployment_url_present: !!pagesUrl, host });
  }
  return result("Pages deployment", "ok", null,
    "Cloudflare Pages deployment metadata is present.", null,
    { pages: true, branch, host, deployment_url_present: true });
}

function buildIdentityCheck(env) {
  const sha = clean(env?.CF_PAGES_COMMIT_SHA);
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    return result("Build identity", "degraded", "build",
      "The runtime did not expose an exact 40-character Pages commit SHA.",
      "Use the exact-SHA Development/Production workflow evidence to identify the deployed source. Do not infer release identity from a branch name alone.",
      { exact_commit_sha_present: false });
  }
  return result("Build identity", "ok", null,
    "Runtime build identity is exact-SHA addressable.", null,
    { exact_commit_sha_present: true, commit_sha: sha });
}

function authCheck(access) {
  return result("Staff authentication", "ok", null,
    "The diagnostics request passed the staff/IT authorization boundary.", null,
    { auth_mode: access.auth_mode || "unknown", role: access.actor?.role_code || null });
}

async function supabaseCheck(env) {
  const serviceKey = supabaseServiceKey(env);
  if (!clean(env?.SUPABASE_URL) || !serviceKey) {
    return result("Supabase", "degraded", "configuration",
      "Supabase service configuration is incomplete.",
      "Confirm SUPABASE_URL and the configured service-role secret in the current Pages environment. Do not paste secret values into diagnostics or logs.",
      { configured: false, reachable: false });
  }
  try {
    const response = await withTimeout(fetch(
      `${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/staff_users?select=id&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: "application/json" } }
    ));
    if (!response.ok) {
      return result("Supabase", "failed", "runtime",
        `Supabase read-only health request returned HTTP ${response.status}.`,
        "Check Supabase project availability, service-role configuration, schema availability, and Pages environment bindings before retrying.",
        { configured: true, reachable: false, http_status: response.status });
    }
    return result("Supabase", "ok", null,
      "A bounded read-only Supabase request succeeded.", null,
      { configured: true, reachable: true, http_status: response.status });
  } catch (error) {
    return result("Supabase", "failed", "runtime",
      "The bounded Supabase health request failed.",
      "Check Supabase availability and Pages environment bindings; then use manual Refresh Diagnostics after the dependency is healthy.",
      { configured: true, reachable: false, error_class: errorClass(error) });
  }
}

async function r2Check(env) {
  if (!env?.R2_MEDIA || typeof env.R2_MEDIA.list !== "function") {
    return result("R2 media", "degraded", "configuration",
      "The R2_MEDIA binding is unavailable.",
      "Confirm the rosiedazzlers-media R2 binding is attached to this Pages environment under R2_MEDIA.",
      { configured: false, reachable: false });
  }
  try {
    await withTimeout(env.R2_MEDIA.list({ limit: 1 }));
    return result("R2 media", "ok", null,
      "A bounded read-only R2 list request succeeded.", null,
      { configured: true, reachable: true });
  } catch (error) {
    return result("R2 media", "failed", "runtime",
      "The bounded R2 read-only health request failed.",
      "Check the R2_MEDIA binding, bucket availability, and Cloudflare service status before retrying.",
      { configured: true, reachable: false, error_class: errorClass(error) });
  }
}

async function criticalApiCheck(request) {
  try {
    const healthUrl = new URL("/api/health", request.url);
    const response = await withTimeout(fetch(healthUrl.toString(), {
      headers: { Accept: "application/json", "Cache-Control": "no-cache" }
    }));
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.ok !== true) {
      return result("Critical API runtime", "failed", "runtime",
        `The canonical /api/health probe did not return healthy JSON${response ? ` (HTTP ${response.status})` : ""}.`,
        "Inspect the exact Pages deployment and Functions logs, then verify /api/health manually. Do not promote from source-only evidence.",
        { reachable: response.ok, http_status: response.status });
    }
    return result("Critical API runtime", "ok", null,
      "The canonical /api/health route returned healthy JSON.", null,
      { reachable: true, http_status: response.status });
  } catch (error) {
    return result("Critical API runtime", "failed", "runtime",
      "The bounded canonical health probe failed.",
      "Inspect the current Pages Functions deployment and runtime logs, then retry manually after the dependency is healthy.",
      { reachable: false, error_class: errorClass(error) });
  }
}

function paymentConfigurationCheck(env) {
  const stripeSecret = clean(env?.STRIPE_SECRET_KEY);
  const stripeWebhook = clean(env?.STRIPE_WEBHOOK_SECRET) || clean(env?.STRIPE_WEBHOOK_SECRET_QUOTES);
  const paypalClient = clean(env?.PAYPAL_CLIENT_ID);
  const paypalSecret = clean(env?.PAYPAL_CLIENT_SECRET) || clean(env?.PAYPAL_SECRET);
  const paypalWebhook = clean(env?.PAYPAL_WEBHOOK_ID);
  const stripeConfigured = !!stripeSecret;
  const stripeWebhookConfigured = !!stripeWebhook;
  const paypalConfigured = !!paypalClient && !!paypalSecret;
  const paypalWebhookConfigured = !!paypalWebhook;
  const complete = stripeConfigured && stripeWebhookConfigured && paypalConfigured && paypalWebhookConfigured;
  const stripeMode = stripeSecret.startsWith("sk_test_") ? "test" : stripeSecret.startsWith("sk_live_") ? "live" : stripeConfigured ? "configured_unknown_mode" : "missing";

  if (!complete) {
    return result("Payment configuration", "degraded", "configuration",
      "One or more payment-provider configuration authorities are incomplete.",
      "Review the current Pages environment variables for Stripe checkout/webhook and PayPal client/webhook configuration. This diagnostic reports presence only and never validates by creating or capturing a payment.",
      { stripe_configured: stripeConfigured, stripe_webhook_configured: stripeWebhookConfigured, stripe_mode: stripeMode, paypal_configured: paypalConfigured, paypal_webhook_configured: paypalWebhookConfigured });
  }
  return result("Payment configuration", "ok", null,
    "Stripe and PayPal configuration authorities are present. No live provider mutation was performed.", null,
    { stripe_configured: true, stripe_webhook_configured: true, stripe_mode: stripeMode, paypal_configured: true, paypal_webhook_configured: true });
}

function result(name, status, failureFamily, detail, remediation, evidence = {}) {
  return {
    name,
    status,
    failure_family: failureFamily,
    detail,
    remediation: remediation || null,
    evidence
  };
}

function supabaseServiceKey(env) {
  return clean(env?.SUPABASE_SERVICE_ROLE_KEY) || clean(env?.SUPABASE_SERVICE_KEY) || clean(env?.SUPABASE_SERVICE_ROLE) || clean(env?.SUPABASE_SECRET_KEY);
}

async function withTimeout(promise, ms = CHECK_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("diagnostic_timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function clean(value) { return String(value || "").trim(); }
function errorClass(error) { return error?.message === "diagnostic_timeout" ? "timeout" : (error?.name || "Error"); }
function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Diagnostics": "build-379-read-only"
    }
  });
}
