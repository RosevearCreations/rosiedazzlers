import { requireStaffAccess, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";
import { onRequestGet as getProductionDiagnostics } from "./production_diagnostics.js";
import { buildReliabilityPerformanceCostCapacity } from "../_lib/reliability-performance-cost-capacity.js";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    capability: "it_diagnostics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return withNoStore(access.response);

  const [diagnosticsResult, trafficResult] = await Promise.all([
    collectDiagnostics(request, env),
    collectTrafficCounts(env)
  ]);

  const capacity = buildReliabilityPerformanceCostCapacity({
    diagnostics: diagnosticsResult.data || {},
    traffic: trafficResult.data || {}
  });

  return json({
    ok: diagnosticsResult.ok,
    build: 423,
    authority: "reliability_performance_cost_capacity",
    generated_at: new Date().toISOString(),
    source_status: {
      production_diagnostics: sourceState(diagnosticsResult),
      first_party_traffic: sourceState(trafficResult)
    },
    ...capacity
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

async function collectDiagnostics(request, env) {
  try {
    const response = await getProductionDiagnostics({ request: request.clone(), env });
    const data = await response.json().catch(() => null);
    return { ok: response.ok && Boolean(data), status: response.status, data };
  } catch (error) {
    return { ok: false, status: 503, data: null, error_class: error?.name || "Error" };
  }
}

async function collectTrafficCounts(env) {
  const serviceKey = getServiceKey(env);
  if (!env?.SUPABASE_URL || !serviceKey) {
    return { ok: false, status: 503, data: null, error_class: "configuration" };
  }
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const [events24h, events7d] = await Promise.all([
      countEvents(env, since24h),
      countEvents(env, since7d)
    ]);
    return {
      ok: events24h !== null && events7d !== null,
      status: events24h !== null && events7d !== null ? 200 : 503,
      data: events24h !== null && events7d !== null ? { events_24h: events24h, events_7d: events7d } : null
    };
  } catch (error) {
    return { ok: false, status: 503, data: null, error_class: error?.name || "Error" };
  }
}

async function countEvents(env, since) {
  const params = new URLSearchParams({
    select: "id",
    created_at: `gte.${since}`,
    limit: "1"
  });
  const response = await fetch(`${String(env.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/site_activity_events?${params.toString()}`, {
    headers: {
      ...serviceHeaders(env),
      Prefer: "count=exact",
      Range: "0-0"
    }
  });
  if (!response.ok) return null;
  const contentRange = String(response.headers.get("content-range") || "");
  const match = contentRange.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function getServiceKey(env) {
  return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "";
}
function sourceState(result) {
  return {
    available: result?.ok === true,
    http_status: Number(result?.status) || null,
    error_class: result?.error_class || null
  };
}
function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Capacity": "build-423-read-only"
    }
  });
}
function withNoStore(response) {
  const headers = new Headers(response.headers || {});
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
