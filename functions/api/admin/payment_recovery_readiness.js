// Build 320 — read-only recovery readiness for tracked final-balance payment requests.
import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";
import { statusKind } from "../_lib/final-balance-links.js";

const SELECT = [
  "id","booking_id","customer_name","customer_email","amount_cents","currency","status",
  "provider","provider_status","payment_url","checkout_url","external_checkout_id","checkout_created_at",
  "expires_at","cancelled_at","cancelled_reason","paid_at","paid_amount_cents","created_at","updated_at"
].join(",");

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    if (!hasSupabaseConfig(env)) {
      return json({ ok: true, table_ready: false, rows: [], counts: emptyCounts(), warning: "Supabase is not configured." });
    }

    const url = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 100) || 100));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=${encodeURIComponent(SELECT)}&order=created_at.desc&limit=${limit}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) {
      return json({ ok: true, table_ready: false, rows: [], counts: emptyCounts(), warning: data?.message || text || "Payment request table is unavailable." });
    }

    const rows = (Array.isArray(data) ? data : []).map(classifyRequest);
    const counts = rows.reduce((acc, row) => {
      acc[row.recovery_state] = Number(acc[row.recovery_state] || 0) + 1;
      return acc;
    }, emptyCounts());

    return json({
      ok: true,
      table_ready: true,
      generated_at: new Date().toISOString(),
      contract: {
        read_only: true,
        provider_contact: false,
        automatic_charge: false,
        automatic_checkout_creation: false,
        automatic_customer_notification: false,
        recurring_billing: false,
        duplicate_checkout_creation: false,
        operator_action_required: true
      },
      rows,
      counts,
      warning: null
    });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not calculate payment recovery readiness." }, 500);
  }
}

export async function onRequestPost() {
  return json({ ok: false, error: "Payment recovery readiness is read-only. Use the explicit recovery action after reviewing one request." }, 405);
}

function classifyRequest(row) {
  const kind = statusKind(row);
  const provider = String(row?.provider || "manual").trim().toLowerCase() || "manual";
  const hasCheckout = !!(row?.checkout_url && row?.external_checkout_id);
  let recoveryState = "checkout_needed";
  let action = "prepare_checkout";
  let reason = "No hosted checkout is currently recorded for this open request.";

  if (kind === "paid") {
    recoveryState = "paid_closed";
    action = "none";
    reason = "Payment is already recorded. Do not create or recover another checkout.";
  } else if (kind === "expired") {
    recoveryState = "recovery_required";
    action = "recover_expired";
    reason = "The customer link has expired. Recovery requires an explicit operator confirmation and a new future expiry.";
  } else if (kind === "cancelled") {
    recoveryState = "recovery_required";
    action = "recover_cancelled";
    reason = "The request is cancelled. Recovery requires an explicit operator confirmation before reopening it.";
  } else if (provider === "stripe" && hasCheckout) {
    recoveryState = "reuse_guarded";
    action = "verify_or_reuse";
    reason = "A Stripe checkout already exists. The mutation endpoint must verify and reuse it rather than blindly creating another session.";
  } else if (provider === "manual") {
    recoveryState = "manual_handoff";
    action = "manual_or_prepare";
    reason = "This request is on the manual path. An operator may deliberately prepare a provider checkout if appropriate.";
  }

  return {
    id: row?.id || null,
    booking_id: row?.booking_id || null,
    customer_name: row?.customer_name || null,
    customer_email: row?.customer_email || null,
    amount_cents: Number(row?.amount_cents || 0),
    currency: String(row?.currency || "CAD").toUpperCase(),
    status: row?.status || null,
    provider,
    provider_status: row?.provider_status || null,
    checkout_created_at: row?.checkout_created_at || null,
    expires_at: row?.expires_at || null,
    paid_at: row?.paid_at || null,
    paid_amount_cents: Number(row?.paid_amount_cents || 0),
    payment_url: row?.payment_url || null,
    has_checkout_reference: hasCheckout,
    recovery_state: recoveryState,
    recovery_action: action,
    recovery_reason: reason,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null
  };
}

function emptyCounts() {
  return { checkout_needed: 0, reuse_guarded: 0, recovery_required: 0, manual_handoff: 0, paid_closed: 0 };
}
function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY));
}
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
