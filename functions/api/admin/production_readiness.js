import { requireStaffAccess } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";

function json(payload, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(payload), { ...init, headers });
}

function stripeMode(env) {
  const secret = String(env?.STRIPE_SECRET_KEY || "").trim();
  if (!secret) return "not_configured";
  if (secret.startsWith("sk_test_")) return "test";
  if (secret.startsWith("sk_live_")) return "live";
  return "unknown";
}

function runtimeEvidence(request, env) {
  const url = new URL(request.url);
  const branch = String(env?.CF_PAGES_BRANCH || "").trim();
  const sha = String(env?.CF_PAGES_COMMIT_SHA || "").trim();
  const deploymentUrl = String(env?.CF_PAGES_URL || "").trim();
  const valuesPresent = [branch, sha, deploymentUrl].filter(Boolean).length;
  const state = valuesPresent === 3 ? "present" : valuesPresent > 0 ? "partial" : "unavailable";
  const hostname = url.hostname.toLowerCase();
  const developmentLike = branch === "dev" || branch.startsWith("build") || hostname.endsWith(".pages.dev") || hostname.startsWith("dev.");
  return {
    state,
    branch: branch || null,
    commit_sha: sha || null,
    deployment_url: deploymentUrl || null,
    request_hostname: hostname,
    development_like: developmentLike,
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = await requireStaffAccess({
    request,
    env,
    allowLegacyAdminFallback: true,
  });
  if (!auth.ok) return auth.response;

  const access = requireActionAccess(auth.actor, "it.runtime.view");
  if (!access.ok) {
    return json({ ok: false, error: access.reason || "I.T. runtime view access is required." }, { status: 403 });
  }

  const runtime = runtimeEvidence(request, env);
  const stripe = stripeMode(env);
  const blockers = [];
  const warnings = [];

  if (runtime.branch === "main" || runtime.request_hostname === "rosiedazzlers.ca" || runtime.request_hostname === "www.rosiedazzlers.ca") {
    blockers.push({ id: "production_runtime_detected", message: "This evidence view is running on a Production-like runtime. Development promotion evidence must be reviewed from Development." });
  }
  if (runtime.development_like && stripe === "live") {
    blockers.push({ id: "live_stripe_on_development", message: "A live Stripe secret is detected on a Development-like runtime." });
  }
  if (runtime.development_like && stripe === "unknown") {
    blockers.push({ id: "unknown_stripe_mode", message: "Stripe is configured, but its credential mode cannot be safely classified." });
  }
  if (runtime.state !== "present") {
    warnings.push({ id: "runtime_identity_incomplete", message: "Cloudflare Pages runtime branch/SHA/URL evidence is incomplete or unavailable. No deployment identity is being inferred." });
  }
  if (stripe === "not_configured") {
    warnings.push({ id: "stripe_not_configured", message: "Stripe is not configured in this runtime; payment-provider Production readiness cannot be proven here." });
  }

  const requiredEvidence = [
    {
      id: "current_source_gate",
      label: "Current Source Gate",
      state: "source_authority_present",
      live_run_verified: false,
      authority: ".github/workflows/development-source-gate.yml",
      note: "The runtime dashboard proves the authority exists in source; exact live run status remains GitHub release evidence.",
    },
    {
      id: "development_acceptance",
      label: "Cloudflare Development Acceptance",
      state: "source_authority_present",
      live_run_verified: false,
      authority: ".github/workflows/cloudflare-development-acceptance.yml",
      note: "Exact-SHA Development deployment acceptance remains a separate GitHub workflow boundary.",
    },
    {
      id: "rollback_readiness",
      label: "Development Rollback Readiness",
      state: "source_authority_present",
      live_run_verified: false,
      authority: ".github/workflows/development-rollback-readiness.yml",
      note: "Rollback readiness is a manual read-only prior-SHA drill and never moves Git refs.",
    },
    {
      id: "stuck_deployment_recovery",
      label: "Cloudflare Pages Recovery",
      state: "source_authority_present",
      live_run_verified: false,
      authority: ".github/workflows/cloudflare-pages-recovery.yml",
      note: "Recovery is manual, Development-only and exact-SHA guarded.",
    },
  ];

  let overallState = "ready_for_human_review";
  if (blockers.length) overallState = "blocked";
  else if (warnings.length || runtime.state !== "present" || stripe !== "test") overallState = "evidence_incomplete";

  return json({
    ok: true,
    build: 323,
    overall_state: overallState,
    generated_at: new Date().toISOString(),
    source_policy: {
      production_branch: "main",
      development_branch: "dev",
      frozen_production_baseline_sha: "512ae93a7867b897a26c532cf25282997858e82f",
      prior_accepted_development_sha: "bee75b7201ca5510b48a3bc2c0f07d487dcfb4ba",
      production_promotion_requires_explicit_user_authorization: true,
    },
    runtime,
    providers: {
      stripe: {
        configured: stripe !== "not_configured",
        mode: stripe,
        secret_value_exposed: false,
      },
    },
    dependencies: {
      r2_media_bound: Boolean(env?.R2_MEDIA),
    },
    release_authorities: requiredEvidence,
    blockers,
    warnings,
    contract: {
      read_only: true,
      evidence_only: true,
      git_mutation: false,
      cloudflare_mutation: false,
      production_promotion: false,
      database_mutation: false,
      automatic_promotion: false,
      operator_authorization_required: true,
      secret_values_exposed: false,
    },
    release_boundary: {
      production_closed: true,
      statement: "Development evidence only — Production remains closed.",
      readiness_is_not_authorization: true,
    },
  });
}

export async function onRequestPost() {
  return json({ ok: false, error: "Production readiness is read-only in Build 323." }, { status: 405 });
}
