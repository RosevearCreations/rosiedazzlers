import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";
import {
  buildCommercialActivationState,
  maintenanceActivationMetrics,
  fleetActivationMetrics
} from "../_lib/retention-maintenance-fleet-activation.js";

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
      return withCors(json({ ok: false, error: "Commercial activation service configuration is incomplete." }, 500));
    }

    const [maintenanceRows, fleetRows] = await Promise.all([
      fetchMaintenanceInterestRows(env),
      fetchFleetLeadRows(env)
    ]);

    const activation = buildCommercialActivationState({
      maintenance_metrics: maintenanceActivationMetrics(maintenanceRows),
      fleet_metrics: fleetActivationMetrics(fleetRows),
      maintenance_rulebook_status: "awaiting_business_approval",
      fleet_rulebook_status: "awaiting_business_approval"
    });

    return withCors(json({
      ok: true,
      commercial_activation: activation,
      source_authorities: {
        maintenance_interest: "membership_interest_requests",
        maintenance_followup: "/api/admin/customer_maintenance_followup",
        fleet_pipeline: "/api/admin/fleet_account_pipeline",
        fleet_quote_handoff: "/api/admin/fleet_quote_handoff"
      },
      mutation_authority: false,
      provider_mutation_authority: false
    }));
  } catch (err) {
    console.error("Commercial activation overview failed.", { message: err?.message || "Unknown error" });
    return withCors(json({ ok: false, error: "Could not load the commercial activation overview." }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

export async function onRequestPatch() {
  return withCors(methodNotAllowed(["GET", "OPTIONS"]));
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

async function fetchMaintenanceInterestRows(env) {
  const params = new URLSearchParams({
    select: "id,status,converted_at,closed_at",
    order: "created_at.desc",
    limit: "500"
  });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/membership_interest_requests?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`commercial_activation_maintenance_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function fetchFleetLeadRows(env) {
  const params = new URLSearchParams({
    select: "id,status,vehicle_count",
    topic: "eq.fleet",
    order: "created_at.desc",
    limit: "500"
  });
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/public_inquiry_leads?${params.toString()}`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`commercial_activation_fleet_read_failed_${res.status}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
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
