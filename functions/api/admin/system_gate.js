// Build 353 — bounded read-only I.T. readiness and release-control gate.
// Runs only on explicit operator request. No secret values, polling, provider mutation,
// database/schema mutation, deployment mutation, or public-media promotion occurs here.
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
  const branch = String(env?.CF_PAGES_BRANCH || "").trim() || null;
  const commitSha = String(env?.CF_PAGES_COMMIT_SHA || "").trim() || null;
  return {
    hostname: url.hostname,
    branch,
    commit_sha: commitSha,
    deployment_url: String(env?.CF_PAGES_URL || "").trim() || null,
    environment: branch === "main" ? "production" : branch ? "development" : "unknown",
    source_identity_available: Boolean(branch && commitSha),
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

function diagnostic(category, state, label, detail, correctiveAction) {
  return {
    category,
    state,
    label,
    detail,
    corrective_action: correctiveAction,
  };
}

function buildDiagnostics({ runtimeInfo, database, publicMedia, privateDaip, stripe, paypal }) {
  const diagnostics = [];
  diagnostics.push(runtimeInfo.source_identity_available
    ? diagnostic("deployment", "green", "Runtime source identity", `Branch ${runtimeInfo.branch} exposes an exact Cloudflare commit SHA.`, "No action required. Confirm GitHub exact-SHA gates before promotion.")
    : diagnostic("deployment", "amber", "Runtime source identity", "Cloudflare branch/SHA metadata is unavailable in this runtime.", "Verify the Pages deployment environment and its CF_PAGES_BRANCH / CF_PAGES_COMMIT_SHA metadata."));
  diagnostics.push(database.ok
    ? diagnostic("database", "green", "Supabase read authority", "A bounded staff_users read succeeded.", "No action required.")
    : diagnostic("database", "red", "Supabase read authority", database.error || "The database proof failed.", "Check Supabase binding/configuration and service-role access; do not change schema merely to clear this health check."));
  diagnostics.push(publicMedia.ok
    ? diagnostic("configuration", "green", "Public R2 binding", "The public media bucket binding accepted a bounded list read.", "No action required.")
    : diagnostic("configuration", "red", "Public R2 binding", publicMedia.error || "Public media R2 is unavailable.", "Restore the R2_MEDIA Pages binding and verify read access."));
  diagnostics.push(privateDaip.ok
    ? diagnostic("configuration", "green", "Private DAIP R2 binding", "The private DAIP bucket binding accepted a bounded list read.", "No action required.")
    : diagnostic("configuration", "red", "Private DAIP R2 binding", privateDaip.error || "Private DAIP R2 is unavailable.", "Restore the canonical private DAIP R2 binding and verify read access without making raw media public."));
  diagnostics.push(stripe === "unknown"
    ? diagnostic("provider", "red", "Stripe configuration", "A Stripe credential exists but its safe mode cannot be identified.", "Review the Stripe environment variable in Cloudflare. Never paste the secret into this screen or source.")
    : stripe === "not_configured"
      ? diagnostic("provider", "amber", "Stripe configuration", "Stripe is not configured in this runtime.", "Configure the intended Stripe test/live environment only when payment acceptance requires it.")
      : diagnostic("provider", "green", "Stripe configuration", `Stripe ${stripe} mode is detected without exposing the credential.`, runtimeInfo.environment === "development" && stripe === "live" ? "Replace live credentials in Development with test credentials before payment testing." : "No action required."));
  diagnostics.push(paypal.integration_source_available
    ? diagnostic("provider", "green", "PayPal integration", "Current source contains an accepted PayPal integration authority.", "No action required.")
    : diagnostic("provider", "amber", "PayPal integration", "PayPal remains a tracked source integration gap.", "Implement and accept sandbox-safe PayPal source before treating PayPal as Production-ready."));
  return diagnostics;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = await requireStaffAccess({ request, env, allowLegacyAdminFallback: true });
  if (!auth.ok) return auth.response;
  const access = requireActionAccess(auth.actor, "it.runtime.view");
  if (!access.ok) return json({ ok: false, error: access.reason || "I.T. runtime access is required." }, 403);

  const runtimeInfo = runtime(request, env);
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
      ok: stripe !== "unknown",
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
  if (!runtimeInfo.source_identity_available) warnings.push("Cloudflare runtime branch/SHA identity is unavailable.");
  if (!database.ok) blockers.push("Database read proof failed.");
  if (!publicMedia.ok) blockers.push("Public R2 media read proof failed.");
  if (!privateDaip.ok) blockers.push("Private DAIP R2 read proof failed.");
  if (stripe === "unknown") blockers.push("Stripe credential mode is unrecognized.");
  if (stripe === "live" && runtimeInfo.branch !== "main") blockers.push("Live Stripe credentials are present outside main.");
  if (stripe === "test" && runtimeInfo.branch === "main") warnings.push("Production runtime currently detects Stripe test credentials.");
  if (stripe === "not_configured") warnings.push("Stripe is not configured in this runtime.");
  if (!paypal.integration_source_available) warnings.push("PayPal sandbox integration is not yet implemented in current source.");

  const requiredSourceAuthorities = [
    "Current Source Gate",
    "I.T. Readiness & Release Control Authority",
    "Staff API Authority",
    "Staff Access Matrix Authority",
    "Protected Admin UI audit",
    "Responsive contract",
    "SEO metadata + one-H1 contract",
    "Maintenance/retention contract",
    "Fleet maintenance planning contract",
    "Payment readiness/acceptance/reconciliation contracts",
    "Rollback/recovery contract",
    "Production readiness contract",
  ];

  const diagnostics = buildDiagnostics({ runtimeInfo, database, publicMedia, privateDaip, stripe, paypal });
  const overallState = blockers.length ? "blocked" : warnings.length ? "ready_with_warnings" : "ready";

  return json({
    ok: true,
    build: 353,
    generated_at: new Date().toISOString(),
    overall_state: overallState,
    traffic_light: blockers.length ? "red" : warnings.length ? "amber" : "green",
    runtime: runtimeInfo,
    checks,
    diagnostics,
    configuration: {
      supabase_service_configured: configured(env?.SUPABASE_URL) && configured(env?.SUPABASE_SERVICE_ROLE_KEY),
      public_r2_binding_configured: Boolean(env?.R2_MEDIA && typeof env.R2_MEDIA.list === "function"),
      private_daip_r2_binding_configured: Boolean(privateDaipBucket && typeof privateDaipBucket.list === "function"),
      private_daip_binding_name: privateDaipBinding || null,
      stripe_configured: stripe !== "not_configured",
      stripe_mode: stripe,
      paypal_credentials_present: paypal.credentials_present,
      paypal_mode: paypal.mode,
      secret_values_exposed: false,
    },
    release_control: {
      environment: runtimeInfo.environment,
      runtime_branch: runtimeInfo.branch,
      runtime_commit_sha: runtimeInfo.commit_sha,
      exact_runtime_identity_visible: runtimeInfo.source_identity_available,
      github_ci_status_fetched_by_runtime: false,
      github_ci_authority: "GitHub exact-SHA checks remain the release authority; this runtime endpoint does not require a GitHub token.",
      deliberate_promotion_required: true,
      exact_sha_gates_required: true,
      production_business_data_mutation: "closed",
      database_schema_mutation: "closed",
      r2_mutation: "closed",
      payment_provider_mutation: "closed",
      deployment_mutation: "closed",
    },
    blockers,
    warnings,
    source_authorities: requiredSourceAuthorities,
    contract: {
      read_only: true,
      explicit_operator_action: true,
      polling: false,
      database_mutation: false,
      schema_mutation: false,
      r2_mutation: false,
      payment_provider_mutation: false,
      deployment_mutation: false,
      production_business_data_mutation: false,
      secret_values_exposed: false,
    },
  });
}

export async function onRequestPost() {
  return json({ ok: false, error: "System Gate is read-only. Use GET from the explicit I.T. control." }, 405);
}
