import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

const EVENT_ROW_LIMIT = 2500;
const BOOKING_ROW_LIMIT = 1000;
const FUNNEL_EVENTS = [
  "booking_step_view", "checkout_started", "checkout_completed",
  "booking_confirmation_view", "booking_rebook_prompt_view", "booking_rebook_start",
  "customer_self_service_path_selected"
];

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "view_analytics", allowLegacyAdminFallback: true });
  if (!access.ok) return access.response;
  const requestedDays = Number(new URL(request.url).searchParams.get("days") || 30);
  const days = Number.isFinite(requestedDays) ? Math.max(1, Math.min(90, Math.floor(requestedDays))) : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  try {
    const headers = serviceHeaders(env);
    const eventUrl = `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=event_type,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${EVENT_ROW_LIMIT}`;
    const bookingUrl = `${env.SUPABASE_URL}/rest/v1/bookings?select=status,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${BOOKING_ROW_LIMIT}`;
    const [eventResponse, bookingResponse] = await Promise.all([fetch(eventUrl, { headers }), fetch(bookingUrl, { headers })]);
    if (!eventResponse.ok || !bookingResponse.ok) throw new Error("One or more funnel evidence layers are unavailable.");
    const events = await eventResponse.json();
    const bookings = await bookingResponse.json();
    if (!Array.isArray(events) || !Array.isArray(bookings)) throw new Error("Invalid evidence response.");
    const eventCounts = Object.fromEntries(FUNNEL_EVENTS.map((name) => [name, 0]));
    for (const row of events) {
      if (Object.hasOwn(eventCounts, row?.event_type)) eventCounts[row.event_type] += 1;
      if (row?.checkout_state === "started" && row?.event_type !== "checkout_started") eventCounts.checkout_started += 1;
      if (row?.checkout_state === "completed" && row?.event_type !== "checkout_completed") eventCounts.checkout_completed += 1;
    }
    const canonical = { observed: bookings.length, confirmed: 0, completed: 0, cancelled: 0, other: 0 };
    for (const row of bookings) {
      const state = String(row?.status || "").trim().toLowerCase();
      if (["confirmed", "scheduled", "assigned", "in_progress"].includes(state)) canonical.confirmed += 1;
      else if (state === "completed") canonical.completed += 1;
      else if (state === "cancelled" || state === "canceled") canonical.cancelled += 1;
      else canonical.other += 1;
    }
    const incomplete = events.length >= EVENT_ROW_LIMIT || bookings.length >= BOOKING_ROW_LIMIT;
    return json({ ok: true, status: !events.length && !bookings.length ? "unavailable" : incomplete ? "partial" : "observed", generated_at: new Date().toISOString(), window: { days, start_at: since, end_at: new Date().toISOString() }, anonymous_event_layer: { rows_scanned: events.length, row_limit: EVENT_ROW_LIMIT, counts: eventCounts }, canonical_booking_layer: { rows_scanned: bookings.length, row_limit: BOOKING_ROW_LIMIT, counts: canonical }, evidence: { denominator_coverage: incomplete ? "bounded_partial" : "bounded_observed", row_limit_reached: incomplete, layers_joined: false, identity_join: false, customer_identity_exposed: false, raw_session_identifiers_exposed: false, messages_sent: false, booking_mutation: false, note: "Anonymous interaction counts and canonical booking status counts are separate evidence layers. Their counts must not be presented as one person-level conversion cohort." } });
  } catch (error) {
    return json({ ok: false, status: "unavailable", error: error?.message || "Booking funnel evidence is unavailable.", evidence: { layers_joined: false, identity_join: false, customer_identity_exposed: false } }, 503);
  }
}

export async function onRequestPost() { return methodNotAllowed(); }
