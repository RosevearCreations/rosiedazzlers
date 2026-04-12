import { syncAccountingRecordForBooking } from "../_lib/accounting.js";

import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

const FINANCE_EVENT_TYPES = [
  "booking_finance_deposit",
  "booking_finance_final_payment",
  "booking_finance_tip",
  "booking_finance_refund",
  "booking_finance_other"
];

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const bookingId = String(url.searchParams.get("booking_id") || "").trim();
    if (!isUuid(bookingId)) return withCors(json({ error: "Valid booking_id is required." }, 400));

    const access = await requireStaffAccess({ request, env, capability: "work_booking", bookingId, allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const eventTypeFilter = FINANCE_EVENT_TYPES.map((x) => `event_type.eq.${x}`).join(",");
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events?select=id,created_at,event_type,event_note,actor_name,payload&booking_id=eq.${encodeURIComponent(bookingId)}&or=(${eventTypeFilter})&order=created_at.asc`, {
      headers: serviceHeaders(env)
    });
    if (!res.ok) return withCors(json({ error: `Could not load finance entries. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);
    const items = [];
    const summary = { deposit: 0, final_payment: 0, tip: 0, refund: 0, other: 0, collected_total: 0 };

    for (const row of Array.isArray(rows) ? rows : []) {
      const payload = row && typeof row.payload === "object" && row.payload ? row.payload : {};
      const entryType = String(payload.entry_type || row.event_type || "").replace("booking_finance_", "");
      const amount = Number(payload.amount_cad || 0);
      items.push({
        id: row.id,
        created_at: row.created_at,
        entry_type: entryType,
        amount_cad: amount,
        payment_method: payload.payment_method || "",
        note: payload.note || row.event_note || "",
        recorded_at: payload.recorded_at || row.created_at,
        actor_name: row.actor_name || ""
      });
      if (Object.prototype.hasOwnProperty.call(summary, entryType)) summary[entryType] += amount;
      if (["deposit", "final_payment", "tip", "other"].includes(entryType)) summary.collected_total += amount;
      if (entryType === "refund") summary.collected_total -= amount;
    }

    return withCors(json({ ok: true, entries: items, summary }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || "").trim();
    if (!isUuid(bookingId)) return withCors(json({ error: "Valid booking_id is required." }, 400));

    const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId, allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const entryType = String(body.entry_type || "").trim().toLowerCase();
    const amountCad = Number(body.amount_cad || 0);
    const paymentMethod = String(body.payment_method || "").trim();
    const note = String(body.note || "").trim();
    const recordedAt = String(body.recorded_at || "").trim() || null;

    if (!["deposit", "final_payment", "tip", "refund", "other"].includes(entryType)) return withCors(json({ error: "Invalid entry_type." }, 400));
    if (!(amountCad > 0)) return withCors(json({ error: "amount_cad must be greater than 0." }, 400));

    const actorName = access.actor?.full_name || access.actor?.email || "Staff";
    const payload = {
      entry_type: entryType,
      amount_cad: Math.round(amountCad * 100) / 100,
      payment_method: paymentMethod || null,
      note: note || null,
      recorded_at: recordedAt,
      recorded_by_staff_user_id: access.actor?.id || null,
      recorded_by_email: access.actor?.email || null
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([{
        booking_id: bookingId,
        event_type: `booking_finance_${entryType}`,
        actor_name: actorName,
        event_note: `${entryType.replaceAll("_", " ")} ${payload.amount_cad.toFixed(2)}${paymentMethod ? ` via ${paymentMethod}` : ""}`,
        payload
      }])
    });
    if (!res.ok) return withCors(json({ error: `Could not record finance entry. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);

    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_name,customer_email,customer_phone,service_date,start_slot,package_code,vehicle_size,status,job_status,total_price,deposit_amount,notes&id=eq.${encodeURIComponent(bookingId)}&limit=1`, {
      headers: serviceHeaders(env)
    });
    if (bookingRes.ok) {
      const bookingRows = await bookingRes.json().catch(() => []);
      const bookingRow = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
      if (bookingRow) {
        await syncAccountingRecordForBooking(env, bookingRow, { actor: access.actor, source: "finance" });
      }
    }

    return withCors(json({ ok: true, entry: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}

export async function onRequestPut() { return withCors(methodNotAllowed()); }
export async function onRequestDelete() { return withCors(methodNotAllowed()); }

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
