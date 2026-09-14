import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { ALL_SERVICE_AREA_LABEL } from "../_lib/analytics-rollups.js";

const DAY_LIMIT = 400;
const DIMENSION_LIMIT = 5000;
const FUNNEL_LIMIT = 400;

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_staff",
      allowLegacyAdminFallback: true
    });
    if (!access.ok) return withCors(access.response);

    const days = clampInteger(body.days, 30, 1, 365);
    const requestedArea = cleanText(body.service_area || "");
    const targetArea = requestedArea || ALL_SERVICE_AREA_LABEL;
    const generatedAt = new Date().toISOString();
    const sinceDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const result = await loadAggregateMeasurement(env, sinceDate, targetArea);
    const anyTruncated = Object.values(result.truncated).some(Boolean);

    return withCors(json({
      ok: true,
      generated_at: generatedAt,
      days,
      window: {
        start_date: sinceDate,
        end_at: generatedAt
      },
      selected_service_area: requestedArea || null,
      source: {
        mode: "aggregate_rollups_only",
        aggregate_only: true,
        read_only: true,
        row_limits: {
          daily: DAY_LIMIT,
          dimensions: DIMENSION_LIMIT,
          funnel: FUNNEL_LIMIT
        },
        truncated: result.truncated,
        any_truncated: anyTruncated
      },
      sections: buildSections(result)
    }));
  } catch (error) {
    return withCors(json({
      ok: false,
      error: "Growth measurement could not be loaded.",
      detail: cleanText(error?.message || "Unexpected server error.")
    }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

async function loadAggregateMeasurement(env, sinceDate, targetArea) {
  const headers = serviceHeaders(env);
  const encodedArea = encodeURIComponent(targetArea);
  const encodedSince = encodeURIComponent(sinceDate);

  const requests = [
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_rollups?select=period_start,events,page_views,unique_visitors,unique_sessions,booking_starts,booking_completions,cart_snapshots&period_type=eq.day&period_start=gte.${encodedSince}&service_area_label=eq.${encodedArea}&order=period_start.asc&limit=${DAY_LIMIT}`,
      { headers }
    ),
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_dimension_daily_rollups?select=rollup_date,dimension_type,dimension_value,count&rollup_date=gte.${encodedSince}&service_area_label=eq.${encodedArea}&order=rollup_date.asc&limit=${DIMENSION_LIMIT}`,
      { headers }
    ),
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_funnel_daily_rollups?select=rollup_date,step_1_views,step_2_views,step_3_views,step_4_views,step_5_views,service_area_picks,date_picks,package_picks,addon_toggles,customer_continue,checkout_started,checkout_completed&rollup_date=gte.${encodedSince}&service_area_label=eq.${encodedArea}&order=rollup_date.asc&limit=${FUNNEL_LIMIT}`,
      { headers }
    )
  ];

  const settled = await Promise.allSettled(requests);
  const labels = ["daily", "dimensions", "funnel"];
  const rows = { daily: [], dimensions: [], funnel: [] };
  const availability = {};

  for (let index = 0; index < settled.length; index += 1) {
    const label = labels[index];
    const outcome = settled[index];
    if (outcome.status !== "fulfilled" || !outcome.value.ok) {
      availability[label] = {
        ok: false,
        reason: "Aggregate authority is unavailable for this observation window."
      };
      continue;
    }

    const parsed = await outcome.value.json().catch(() => []);
    rows[label] = Array.isArray(parsed) ? parsed : [];
    availability[label] = { ok: true };
  }

  return {
    rows,
    availability,
    truncated: {
      daily: rows.daily.length >= DAY_LIMIT,
      dimensions: rows.dimensions.length >= DIMENSION_LIMIT,
      funnel: rows.funnel.length >= FUNNEL_LIMIT
    }
  };
}

function buildSections(result) {
  const dailyReady = Boolean(result.availability.daily?.ok);
  const dimensionReady = Boolean(result.availability.dimensions?.ok);
  const funnelReady = Boolean(result.availability.funnel?.ok);
  const dailyRows = result.rows.daily;
  const dimensionRows = result.rows.dimensions;
  const funnelRows = result.rows.funnel;

  const acquisitionStatus = evidenceStatus({
    ready: dailyReady,
    rows: dailyRows,
    truncated: result.truncated.daily || result.truncated.dimensions
  });

  const totals = {
    events: sumMetric(dailyRows, "events"),
    page_views: sumMetric(dailyRows, "page_views"),
    daily_unique_visitor_observations: sumMetric(dailyRows, "unique_visitors"),
    daily_unique_session_observations: sumMetric(dailyRows, "unique_sessions"),
    booking_starts: sumMetric(dailyRows, "booking_starts"),
    booking_completions: sumMetric(dailyRows, "booking_completions"),
    cart_snapshots: sumMetric(dailyRows, "cart_snapshots")
  };

  const conversionStatus = !funnelReady
    ? "unavailable"
    : !funnelRows.length
      ? "insufficient"
      : result.truncated.funnel
        ? "partial"
        : "available";
  const funnel = summarizeFunnel(funnelRows);
  const completionRate = funnel.checkout_started > 0
    ? roundPercent(funnel.checkout_completed, funnel.checkout_started)
    : null;

  return {
    acquisition: {
      status: acquisitionStatus,
      reason: acquisitionStatus === "unavailable"
        ? "Aggregate acquisition authority is unavailable for the selected window."
        : acquisitionStatus === "insufficient"
          ? "No aggregate acquisition observations were returned for the selected window."
          : acquisitionStatus === "partial"
            ? "Aggregate acquisition evidence reached at least one row limit; totals are partial."
            : null,
      totals: acquisitionStatus === "unavailable" ? null : totals,
      dimensions: {
        status: evidenceStatus({
          ready: dimensionReady,
          rows: dimensionRows,
          truncated: result.truncated.dimensions
        }),
        top_pages: dimensionReady ? summarizeDimension(dimensionRows, "page_path") : [],
        top_referrers: dimensionReady ? summarizeDimension(dimensionRows, "referrer") : [],
        devices: dimensionReady ? summarizeDimension(dimensionRows, "device_type") : [],
        service_areas: dimensionReady ? summarizeDimension(dimensionRows, "service_area") : []
      }
    },
    conversion: {
      status: completionRate === null && conversionStatus === "available" ? "insufficient" : conversionStatus,
      reason: !funnelReady
        ? "Aggregate funnel authority is unavailable for the selected window."
        : !funnelRows.length
          ? "No aggregate funnel observations were returned for the selected window."
          : result.truncated.funnel
            ? "Aggregate funnel evidence reached the row limit; totals are partial."
            : completionRate === null
              ? "A completion rate needs at least one observed checkout start."
              : null,
      funnel,
      checkout_completion_rate_percent: completionRate
    },
    retention: {
      status: "unavailable",
      reason: "Exact-profile retention evidence remains a separate authority and is intentionally not joined to anonymous acquisition evidence in Build 397."
    },
    commercial: {
      status: "unavailable",
      reason: "Commercial outcome evidence remains in separate booking-finance, job-cost and Finance authorities and is not inferred by this aggregate surface."
    }
  };
}

function evidenceStatus({ ready, rows, truncated }) {
  if (!ready) return "unavailable";
  if (!rows.length) return "insufficient";
  return truncated ? "partial" : "available";
}

function summarizeDimension(rows, dimensionType) {
  const counts = new Map();
  for (const row of rows) {
    if (cleanText(row?.dimension_type) !== dimensionType) continue;
    const label = cleanText(row?.dimension_value) || "Unknown";
    counts.set(label, (counts.get(label) || 0) + numberValue(row?.count));
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10);
}

function summarizeFunnel(rows) {
  const fields = [
    "step_1_views",
    "step_2_views",
    "step_3_views",
    "step_4_views",
    "step_5_views",
    "service_area_picks",
    "date_picks",
    "package_picks",
    "addon_toggles",
    "customer_continue",
    "checkout_started",
    "checkout_completed"
  ];
  return Object.fromEntries(fields.map((field) => [field, sumMetric(rows, field)]));
}

function sumMetric(rows, key) {
  return rows.reduce((sum, row) => sum + numberValue(row?.[key]), 0);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundPercent(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function clampInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, parsed));
}

function cleanText(value) {
  return String(value ?? "").trim().slice(0, 240);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
