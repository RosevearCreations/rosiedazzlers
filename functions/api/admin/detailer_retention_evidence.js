import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

const ROW_LIMIT = 2500;
const ELIGIBLE_STATES = new Set(["confirmed", "scheduled", "assigned", "in_progress", "completed"]);

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "view_analytics", allowLegacyAdminFallback: true });
  if (!access.ok) return access.response;

  const requestedDays = Number(new URL(request.url).searchParams.get("days") || 90);
  const days = Number.isFinite(requestedDays) ? Math.max(7, Math.min(365, Math.floor(requestedDays))) : 90;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  try {
    const url = `${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_id,status,created_at,service_date&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc&limit=${ROW_LIMIT}`;
    const response = await fetch(url, { headers: serviceHeaders(env) });
    if (!response.ok) throw new Error("Canonical booking evidence is unavailable.");
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Invalid canonical booking evidence response.");

    const exactCustomers = new Map();
    let eligibleBookings = 0;
    let excludedMissingCanonicalCustomer = 0;

    for (const row of rows) {
      const state = String(row?.status || "").trim().toLowerCase();
      if (!ELIGIBLE_STATES.has(state)) continue;
      eligibleBookings += 1;
      const customerId = String(row?.customer_id || "").trim();
      if (!customerId) {
        excludedMissingCanonicalCustomer += 1;
        continue;
      }
      exactCustomers.set(customerId, (exactCustomers.get(customerId) || 0) + 1);
    }

    let repeatCustomers = 0;
    let repeatBookingRows = 0;
    for (const count of exactCustomers.values()) {
      if (count >= 2) {
        repeatCustomers += 1;
        repeatBookingRows += count - 1;
      }
    }

    const customersObserved = exactCustomers.size;
    const repeatCustomerRate = customersObserved ? repeatCustomers / customersObserved : null;
    const boundedPartial = rows.length >= ROW_LIMIT;

    return json({
      ok: true,
      status: !rows.length ? "unavailable" : boundedPartial ? "partial" : "observed",
      generated_at: new Date().toISOString(),
      window: { days, start_at: since, end_at: new Date().toISOString() },
      counts: {
        booking_rows_scanned: rows.length,
        eligible_booking_rows: eligibleBookings,
        canonical_customers_observed: customersObserved,
        repeat_customers: repeatCustomers,
        repeat_booking_rows: repeatBookingRows,
        excluded_missing_canonical_customer: excludedMissingCanonicalCustomer
      },
      rates: { repeat_customer_rate: repeatCustomerRate },
      evidence: {
        row_limit: ROW_LIMIT,
        row_limit_reached: boundedPartial,
        identity_key: "customer_id_exact",
        fuzzy_identity_matching: false,
        email_or_name_matching: false,
        automatic_customer_scoring: false,
        customer_ids_exposed: false,
        booking_mutation: false,
        outreach_triggered: false,
        note: "Repeat evidence is aggregate-only and uses exact canonical customer_id values inside the bounded observation window. Missing canonical IDs are excluded rather than guessed."
      }
    });
  } catch (error) {
    return json({
      ok: false,
      status: "unavailable",
      error: error?.message || "Retention evidence is unavailable.",
      evidence: { fuzzy_identity_matching: false, automatic_customer_scoring: false, customer_ids_exposed: false }
    }, 503);
  }
}

export async function onRequestPost() { return methodNotAllowed(); }
