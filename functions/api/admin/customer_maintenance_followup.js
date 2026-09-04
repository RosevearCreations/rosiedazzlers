import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";
import { loadMembershipPlanSettings, buildMembershipReminderCandidates } from "../_lib/membership-reminders.js";
import {
  normalizeMaintenanceFollowupAction,
  buildMaintenanceReviewEvent,
  deriveMaintenanceReviewState,
  maintenanceFollowupMetrics,
  writableMaintenanceInterestStatuses,
  maintenanceReviewActions
} from "../_lib/maintenance-retention-followup.js";

const REVIEW_EVENT_TYPES = [
  "maintenance_followup_reviewed",
  "maintenance_followup_contacted",
  "maintenance_followup_no_contact_needed"
];

export async function onRequestGet({ request, env }) {
  return handleRead({ request, env });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const normalized = normalizeMaintenanceFollowupAction(body);
    if (!normalized.ok) return withCors(json({ ok: false, error: normalized.error }, 400));

    if (normalized.kind === "interest_status") {
      const current = await fetchInterestById(env, normalized.interest_id);
      if (!current) return withCors(json({ ok: false, error: "Maintenance interest request not found." }, 404));
      if (["scheduled", "converted"].includes(String(current.status || "").toLowerCase())) {
        return withCors(json({ ok: false, error: "Scheduled or converted interest is locked to its approved booking workflow." }, 409));
      }
      const updated = await updateInterestStatus(env, normalized.interest_id, normalized.status);
      return withCors(json({
        ok: true,
        kind: normalized.kind,
        interest: updated,
        creates_appointment: false,
        marks_conversion: false,
        sends_notification: false,
        recurring_billing: false
      }));
    }

    const settings = await loadMembershipPlanSettings(env);
    const candidates = await buildMembershipReminderCandidates(env, settings, {
      origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, ""),
      limit: 500
    });
    const candidate = candidates.find((row) => String(row.latest_booking_id || "") === normalized.latest_booking_id);
    if (!candidate) return withCors(json({ ok: false, error: "Maintenance reminder candidate is no longer available for review." }, 409));

    if (normalized.action === "contacted" && candidate.vehicle_identity_reliable === false) {
      return withCors(json({ ok: false, error: "Resolve vehicle identity before recording customer contact for this maintenance candidate." }, 409));
    }

    const event = buildMaintenanceReviewEvent(candidate, access.actor || {}, normalized.action, normalized.note, new Date());
    const saved = await insertReviewEvent(env, event);
    return withCors(json({
      ok: true,
      kind: normalized.kind,
      review: saved,
      reminder_candidate_due: candidate.due === true,
      reminder_engine_suppressed: false,
      creates_appointment: false,
      marks_conversion: false,
      sends_notification: false,
      recurring_billing: false
    }, 201));
  } catch (err) {
    console.error("Maintenance retention follow-up failed.", err);
    return withCors(json({ ok: false, error: "Could not save maintenance follow-up." }, 500));
  }
}

export async function onRequestPut() { return withCors(methodNotAllowed(["GET", "POST", "OPTIONS"])); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function handleRead({ request, env }) {
  try {
    const access = await requireStaffAccess({
      request,
      env,
      body: queryBody(request),
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const settings = await loadMembershipPlanSettings(env);
    const [candidatesRaw, interests, reviewEvents] = await Promise.all([
      buildMembershipReminderCandidates(env, settings, {
        origin: String(env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, ""),
        limit: 500
      }),
      fetchInterestRows(env, 200),
      fetchReviewEvents(env, 500)
    ]);
    const reviewMap = deriveMaintenanceReviewState(reviewEvents);
    const candidates = candidatesRaw.map((row) => ({
      ...row,
      latest_review: reviewMap.get(String(row.latest_booking_id || "")) || null
    }));

    return withCors(json({
      ok: true,
      interest_requests: interests,
      reminder_candidates: candidates,
      metrics: maintenanceFollowupMetrics(interests, candidates),
      writable_interest_statuses: writableMaintenanceInterestStatuses(),
      review_actions: maintenanceReviewActions(),
      readiness: {
        staff_review_enabled: true,
        interest_status_followup_enabled: true,
        sends_notification: false,
        reminder_engine_suppression: false,
        appointment_creation: false,
        conversion_authority: false,
        recurring_billing: false
      }
    }));
  } catch (err) {
    console.error("Could not load maintenance retention follow-up.", err);
    return withCors(json({ ok: false, error: "Could not load maintenance retention follow-up." }, 500));
  }
}

async function fetchInterestRows(env, limit) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?select=id,created_at,updated_at,full_name,email,phone,postal_code,vehicle_count,preferred_cycle,notes,status,last_reminder_at,last_reminder_type,next_reminder_due_at,converted_at,closed_at&order=created_at.desc&limit=${limit}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`maintenance_interest_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function fetchInterestById(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?select=id,status&id=eq.${encodeURIComponent(id)}&limit=1`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`maintenance_interest_lookup_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateInterestStatus(env, id, status) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() })
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows) || !rows[0]) throw new Error(`maintenance_interest_update_failed_${res.status}`);
  return rows[0];
}

async function fetchReviewEvents(env, limit) {
  const filter = REVIEW_EVENT_TYPES.join(",");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/vehicle_history_events?select=id,booking_id,vehicle_id,customer_id,event_type,event_title,event_note,event_at,created_at&event_type=in.(${filter})&order=event_at.desc&limit=${limit}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`maintenance_review_history_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function insertReviewEvent(env, event) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/vehicle_history_events`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify([event])
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows) || !rows[0]) throw new Error(`maintenance_review_insert_failed_${res.status}`);
  return rows[0];
}

function queryBody(request) {
  try { return Object.fromEntries(new URL(request.url).searchParams.entries()); }
  catch { return {}; }
}

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
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
