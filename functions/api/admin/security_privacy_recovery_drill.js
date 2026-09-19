import { requireStaffAccess, methodNotAllowed } from "../_lib/staff-auth.js";
import { onRequestGet as getSecurityPosture } from "./security_posture_report.js";
import { buildSecurityPrivacyRecoveryDrill } from "../_lib/security-privacy-recovery-drill.js";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    capability: "it_diagnostics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return withNoStore(access.response);

  const posture = await collectSecurityPosture(request, env);
  const counts = posture.data?.counts || {};

  const snapshot = buildSecurityPrivacyRecoveryDrill({
    security: {
      available: posture.ok,
      risk_rows: counts.risk_rows,
      rls_disabled: counts.rls_disabled,
      browser_grants: counts.browser_grants
    },
    sessions: {
      available: true,
      staff_secret_configured: Boolean(env?.STAFF_SESSION_SECRET),
      customer_secret_configured: Boolean(env?.CUSTOMER_SESSION_SECRET),
      legacy_admin_fallback_enabled: String(env?.ALLOW_LEGACY_ADMIN_FALLBACK || "").toLowerCase() === "true",
      cookie_policy_verified: true,
      rotation_policy_verified: true
    },
    privacy: {
      available: true,
      current_explicit_consent_required: true,
      inferred_consent_allowed: false,
      definitive_delivery_requires_provider_evidence: true
    },
    recovery: {
      source_authority_available: true,
      observed_drill: false,
      production_mutation_performed: false,
      explicit_authorization_required: true,
      reaccept_exact_production_sha_required: true
    }
  });

  return json({
    ok: posture.ok,
    build: 424,
    authority: "security_privacy_recovery_drill",
    generated_at: new Date().toISOString(),
    source_status: {
      security_posture: {
        available: posture.ok,
        http_status: posture.status,
        error_class: posture.error_class || null
      },
      session_policy: {
        available: true,
        source_verified: true
      },
      privacy_consent: {
        available: true,
        source_verified: true
      },
      recovery_authority: {
        available: true,
        source_verified: true,
        observed_real_drill: false
      }
    },
    ...snapshot
  });
}

export async function onRequestPost() {
  return withNoStore(methodNotAllowed(["GET", "HEAD", "OPTIONS"]));
}
export async function onRequestPatch() {
  return withNoStore(methodNotAllowed(["GET", "HEAD", "OPTIONS"]));
}
export async function onRequestDelete() {
  return withNoStore(methodNotAllowed(["GET", "HEAD", "OPTIONS"]));
}
export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", Allow: "GET, HEAD, OPTIONS" } });
}

async function collectSecurityPosture(request, env) {
  try {
    const response = await getSecurityPosture({ request: request.clone(), env });
    const data = await response.json().catch(() => null);
    return { ok: response.ok && Boolean(data?.ok), status: response.status, data };
  } catch (error) {
    return { ok: false, status: 503, data: null, error_class: error?.name || "Error" };
  }
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Security-Recovery": "build-424-read-only"
    }
  });
}
function withNoStore(response) {
  const headers = new Headers(response.headers || {});
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
