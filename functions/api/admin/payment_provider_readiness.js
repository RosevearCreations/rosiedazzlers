// Build 318 — read-only payment-provider readiness authority.
// Never returns secret values and never contacts or mutates a payment provider.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;

    const stripe = deriveStripeState(env);
    const paypal = derivePayPalState();
    const manual = deriveManualState();
    const blockers = [];
    const warnings = [];

    if (stripe.mode === "live") {
      blockers.push("A live Stripe secret is present in this environment. Development payment acceptance must not exercise live charging credentials.");
    } else if (!stripe.configured) {
      warnings.push("Stripe is not configured in this environment; final-balance checkout will use the existing manual fallback.");
    } else if (stripe.mode === "unknown") {
      warnings.push("Stripe is configured, but the key mode could not be classified as test or live. Treat provider testing as unaccepted until configuration is reviewed server-side.");
    }

    if (!paypal.integration_available) {
      warnings.push("PayPal is not integrated in the current source. Do not mark PayPal sandbox acceptance complete until an explicit integration is implemented and tested.");
    }

    const developmentStatus = blockers.length
      ? "blocked"
      : stripe.test_acceptance_ready
        ? "test_ready"
        : "manual_only";

    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      contract: {
        read_only: true,
        secret_values_exposed: false,
        automatic_charge: false,
        automatic_checkout_creation: false,
        automatic_customer_notification: false,
        recurring_billing: false,
        operator_action_required: true
      },
      development_status: developmentStatus,
      providers: { stripe, paypal, manual },
      blockers,
      warnings
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not calculate payment-provider readiness." }, 500);
  }
}

export async function onRequestPost() {
  return json({ ok: false, error: "Payment-provider readiness is read-only. Use an existing explicit operator payment workflow for mutations." }, 405);
}

function deriveStripeState(env) {
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
    provider: "stripe",
    integration_available: true,
    configured,
    mode,
    test_acceptance_ready: configured && mode === "test",
    live_credential_detected: configured && mode === "live",
    hosted_checkout_supported: true,
    automatic_charge: false,
    status: !configured
      ? "not_configured_manual_fallback"
      : mode === "test"
        ? "test_credentials_ready"
        : mode === "live"
          ? "live_credentials_present_development_blocked"
          : "configured_mode_unverified"
  };
}

function derivePayPalState() {
  return {
    provider: "paypal",
    integration_available: false,
    configured: false,
    mode: "not_integrated",
    test_acceptance_ready: false,
    hosted_checkout_supported: false,
    automatic_charge: false,
    status: "not_integrated_in_current_source"
  };
}

function deriveManualState() {
  return {
    provider: "manual",
    integration_available: true,
    configured: true,
    mode: "operator_recorded",
    test_acceptance_ready: true,
    hosted_checkout_supported: false,
    automatic_charge: false,
    status: "available_as_fail_closed_fallback"
  };
}
