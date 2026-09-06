// Build 348 — bounded read-only I.T. system gate.
// Runs only on explicit operator request. No secret values, polling, provider mutation,
// database mutation, deployment mutation, or public-media promotion occurs here.
import { requireStaffAccess, serviceHeaders } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { bucketFor } from "../_lib/daip-media.js";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function configured(value) {
  return Boolean(String(value || "").trim());
}

function stripeMode(env) {
  const value = String(env?.STRIPE_SECRET_KEY || "").trim();
  if (!value) return "not_configured";
  if (value.startsWith("sk_test_")) return "test";
  if (value.startsWith("sk_live_")) return "live";
  return "unknown";
}

function paypalState(env) {
  const client = configured(env?.PAYPAL_CLIENT_ID);
  const secret = configured(env?.PAYPAL_CLIENT_SECRET);
  const mode = String(env?.PAYPAL_ENVIRONMENT || env?.PAYPAL_MODE || "").trim().toLowerCase();
  return {
    integration_source_available: false,
    credentials_present: client && secret,
    mode: mode || "not_integrated",
    sandbox_like: ["sandbox", "test"].includes(mode),
    secret_values_exposed: false,
  };
}

function runtime(request, env) {
  const url = new URL(request.url);
  return {
    hostname: url.hostname,
    branch: String(env?.CF_PAGES_BRANCH || "").trim() || null,
    commit_sha: String(env?.CF_PAGES_COMMIT_SHA || "").trim() || null,
    deployment_url: String(env?.CF_PAGES_URL || "").trim() || null,
  };
}

async function timed(label, work, timeoutMs = 3500) {
  const started = Date.now();
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve().then(work),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out.`)), timeoutMs);
      }),
    ]);
    return { ok: true, latency_ms: Date.now() - started, detail: result || null };
  } catch (error) {
    return { ok: false, latency_ms: Date.now() - started, error: error?.message || `${label} failed.` };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkDatabase(env) {
  if (!configured(env?.SUPABASE_URL) || !configured(env?.SUPABASE_SERVICE_ROLE_KEY)) {
    return { ok: false, configured: false, error: "Supabase service configuration is incomplete." };
  }
  const result = await timed("Supabase read", async () => {
    const response = await fetch(`${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/staff_users?select=id&limit=1`, {
      headers: serviceHeaders(env),
    });
    if (!response.ok) throw new Error(`Supabase read returned HTTP ${response.status}.`);
    await response.text();
    return { row_read: true };
  });
  return { configured: true, ...result };
}

async function checkBucket(label, bucket) {
  if (!bucket || typeof bucket.list !== "function") {
    return { ok: false, configured: false, error: `${label} binding is missing.` };
  }
  const result = await timed(`${label} read`, async () => {
    const listing = await bucket.list({ limit: 1 });
    return { read: true, object_count_sample: Array.isArray(listing?.objects) ? listing.objects.length : 0 };
  });
  return { configured: true, ...result };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = await requireStaffAccess({ request, env, allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const access = requireActionAccess(auth.actor, "it.runtime.view");
  if (!access.ok) return json({ ok: false, error: access.reason || "I.T. runtime access is required." }, 403);

  const { bucket: privateDaipBucket, binding: privateDaipBinding } = bucketFor(env);
  const [database, publicMedia, privateDaip] = await Promise.all([
    checkDatabase(env),
    checkBucket("Public R2 media", env?.R2_MEDIA),
    checkBucket("Private DAIP R2", privateDaipBucket),
  ]);

  const stripe = stripeMode(env);
  const paypal = paypalState(env);
  const checks = {
    database,
    public_r2: publicMedia,
    private_daip_r2: { ...privateDaip, binding: privateDaipBinding || null },
    authentication: { ok: true, actor_resolved: true, role: auth.actor?.role_code || null },
    stripe: {
      ok: stripe === "test" || stripe === "not_configured",
      configured: stripe !== "not_configured",
      mode: stripe,
      live_credential_detected: stripe === "live",
      secret_value_exposed: false,
    },
    paypal: {
      ok: false,
      ...paypal,
      note: "PayPal remains a tracked integration gap until sandbox-safe source exists and is accepted.",
    },
  };

  const blockers = [];
  const warnings = [];
  if (!database.ok) blockers.push("Database read proof failed.");
  if (!publicMedia.ok) blockers.push("Public R2 media read proof failed.");
  if (!privateDaip.ok) blockers.push("Private DAIP R2 read proof failed.");
  if (stripe === "live" && String(env?.CF_PAGES_BRANCH || "").trim() !== "main") blockers.push("Live Stripe credentials are present outside main.");
  if (stripe === "not_configured") warnings.push("Stripe is not configured in this runtime.");
  if (!paypal.integration_source_available) warnings.push("PayPal sandbox integration is not yet implemented in current source.");

  const requiredSourceAuthorities = [
    "Current Source Gate",
    "Protected Admin UI audit",
    "Responsive contract",
    "SEO metadata + one-H1 contract",
    "Maintenance/retention contract",
    "Fleet maintenance planning contract",
    "Payment readiness/acceptance/reconciliation contracts",
    "Rollback/recovery contract",
    "Production readiness contract",
  ];

  return json({
    ok: true,
    build: 348,
    generated_at: new Date().toISOString(),
    overall_state: blockers.length ? "blocked" : warnings.length ? "ready_with_warnings" : "ready",
    runtime: runtime(request, env),
    checks,
    blockers,
    warnings,
    source_authorities: requiredSourceAuthorities,
    contract: {
      read_only: true,
      explicit_operator_action: true,
      polling: false,
      database_mutation: false,
      r2_mutation: false,
      payment_provider_mutation: false,
      deployment_mutation: false,
      secret_values_exposed: false,
    },
  });
}

export async function onRequestPost() {
  return json({ ok: false, error: "System Gate is read-only. Use GET from the explicit I.T. control." }, 405);
}
