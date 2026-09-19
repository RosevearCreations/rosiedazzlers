import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";
import { buildRetentionRebookingLearning } from "../_lib/retention-rebooking-learning.js";

export async function onRequestGet({ request, env }) {
  try {
    const query = Object.fromEntries(new URL(request.url).searchParams.entries());
    const access = await requireStaffAccess({
      request,
      env,
      body: query,
      capability: "manage_bookings",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, error: "Retention learning service configuration is incomplete." }, 500));
    }

    const [bookings, maintenance, notifications, profiles] = await Promise.all([
      fetchRows(env, "bookings", {
        select: "id,customer_profile_id,status,job_status,completed_at,detailing_completed_at,service_date,created_at,package_code,vehicle_size",
        order: "created_at.desc",
        limit: "1000"
      }),
      fetchRows(env, "membership_interest_requests", {
        select: "status,preferred_cycle,vehicle_count,created_at,updated_at",
        order: "created_at.desc",
        limit: "1000"
      }),
      fetchRows(env, "notification_events", {
        select: "id,event_type,channel,customer_profile_id,status,processed_at,sent_at,created_at",
        order: "created_at.desc",
        limit: "1000"
      }),
      fetchRows(env, "customer_profiles", {
        select: "id,notification_opt_in,notification_channel",
        order: "created_at.desc",
        limit: "1000"
      })
    ]);

    const learning = buildRetentionRebookingLearning({
      bookings: bookings.rows,
      maintenance_interest: maintenance.rows,
      notification_events: notifications.rows,
      customer_profiles: profiles.rows
    });

    return withCors(json({
      ok: true,
      learning,
      source_evidence: {
        bookings: bookings.evidence,
        maintenance_interest: maintenance.evidence,
        communication_events: notifications.evidence,
        customer_profiles: profiles.evidence
      },
      source_authorities: {
        customer_retention: "/api/client/retention",
        maintenance_interest: "membership_interest_requests",
        customer_communication_consent: "functions/api/_lib/customer-communication-consent.js",
        notification_dispatch: "/api/notifications_process",
        availability: "/api/availability",
        booking_collision_revalidation: "/api/checkout"
      },
      mutation_authority: false,
      customer_identity_exposed: false,
      causal_claim_authority: false
    }));
  } catch (err) {
    console.error("Retention & rebooking learning overview failed.", {
      message: err?.message || "Unknown error"
    });
    return withCors(json({ ok: false, error: "Could not load retention and rebooking learning evidence." }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}
export async function onRequestPatch() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}
export async function onRequestDelete() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}
export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function fetchRows(env, table, query) {
  const params = new URLSearchParams(query);
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, {
      headers: serviceHeaders(env)
    });
    if (!res.ok) {
      return {
        rows: [],
        evidence: { state: "unavailable", table, http_status: res.status, bounded_read: true }
      };
    }
    const rows = await res.json().catch(() => []);
    const safeRows = Array.isArray(rows) ? rows : [];
    return {
      rows: safeRows,
      evidence: { state: "observed", table, rows_observed: safeRows.length, bounded_read: true }
    };
  } catch {
    return {
      rows: [],
      evidence: { state: "unavailable", table, http_status: null, bounded_read: true }
    };
  }
}

function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && (
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_SERVICE_KEY ||
    env?.SUPABASE_SERVICE_ROLE ||
    env?.SUPABASE_SECRET_KEY
  ));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
