import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";
import { requiredFleetBusinessDomains, fleetOperationalAuthority } from "../_lib/fleet-business-rulebook.js";
import { buildFleetCommercialOperationsLearning } from "../_lib/fleet-commercial-operations-learning.js";

const CURRENT_RULEBOOK_STATUS = "awaiting_business_approval";

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
      return withCors(json({ ok: false, error: "Fleet commercial learning service configuration is incomplete." }, 500));
    }

    const requiredDomains = requiredFleetBusinessDomains();
    const unresolvedDomains = [...requiredDomains];

    const [leads, accounts, vehicles, groups, jobs, history] = await Promise.all([
      fetchRows(env, "public_inquiry_leads", {
        select: "status,vehicle_count,preferred_cadence,service_area,created_at",
        topic: "eq.fleet",
        order: "created_at.desc",
        limit: "1000"
      }),
      fetchRows(env, "fleet_accounts", {
        select: "contract_status,vehicle_count,created_at,updated_at",
        order: "created_at.desc",
        limit: "500"
      }),
      fetchRows(env, "fleet_account_vehicles", {
        select: "active,created_at,updated_at",
        order: "created_at.desc",
        limit: "2000"
      }),
      fetchRows(env, "fleet_request_groups", {
        select: "status,requested_start_date,requested_end_date,created_at",
        order: "created_at.desc",
        limit: "1000"
      }),
      fetchRows(env, "fleet_request_jobs", {
        select: "booking_id,service_request,status,created_at",
        order: "created_at.desc",
        limit: "2000"
      }),
      fetchRows(env, "fleet_vehicle_service_history", {
        select: "booking_id,serviced_at,service_summary,created_at",
        order: "serviced_at.desc",
        limit: "2000"
      })
    ]);

    const learning = buildFleetCommercialOperationsLearning({
      fleet_leads: leads.rows,
      fleet_accounts: accounts.rows,
      fleet_vehicles: vehicles.rows,
      request_groups: groups.rows,
      request_jobs: jobs.rows,
      service_history: history.rows,
      rulebook_status: CURRENT_RULEBOOK_STATUS,
      required_rulebook_domains: requiredDomains,
      approved_rulebook_domains: [],
      unresolved_rulebook_domains: unresolvedDomains,
      operational_authority: fleetOperationalAuthority()
    });

    return withCors(json({
      ok: true,
      learning,
      source_evidence: {
        fleet_inquiries: leads.evidence,
        fleet_accounts: accounts.evidence,
        fleet_vehicles: vehicles.evidence,
        request_groups: groups.evidence,
        request_jobs: jobs.evidence,
        service_history: history.evidence
      },
      source_authorities: {
        fleet_rulebook: "config/fleet-business-rulebook.json",
        fleet_pipeline: "/api/admin/fleet_account_pipeline",
        fleet_account_operations: "/api/admin/fleet_account_operations",
        fleet_quote_handoff: "/api/admin/fleet_quote_handoff",
        availability: "/api/availability",
        booking_collision_revalidation: "/api/checkout"
      },
      mutation_authority: false,
      customer_identity_exposed: false,
      signed_commercial_business_inferred: false
    }));
  } catch (err) {
    console.error("Fleet & commercial operations learning failed.", { message: err?.message || "Unknown error" });
    return withCors(json({ ok: false, error: "Could not load fleet and commercial learning evidence." }, 500));
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
      return { rows: [], evidence: { state: "unavailable", table, http_status: res.status, bounded_read: true } };
    }
    const rows = await res.json().catch(() => []);
    const safeRows = Array.isArray(rows) ? rows : [];
    return { rows: safeRows, evidence: { state: "observed", table, rows_observed: safeRows.length, bounded_read: true } };
  } catch {
    return { rows: [], evidence: { state: "unavailable", table, http_status: null, bounded_read: true } };
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
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
