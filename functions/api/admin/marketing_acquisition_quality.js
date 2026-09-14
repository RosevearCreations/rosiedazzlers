import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";

const ROW_LIMIT = 2000;

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const access = await requireStaffAccess({
    request,
    env,
    capability: "view_analytics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return withCors(access.response);

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days") || 30)));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const endpoint = `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=event_type,referrer,source,campaign,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${ROW_LIMIT}`;
    const res = await fetch(endpoint, { headers: serviceHeaders(env) });
    if (!res.ok) {
      return withCors(json({
        ok: false,
        status: "unavailable",
        error: "Acquisition evidence storage is unavailable.",
        evidence: evidenceContract(days, 0, false)
      }, 503));
    }

    const rows = await res.json().catch(() => []);
    const data = Array.isArray(rows) ? rows : [];
    const sourceObserved = data.filter((row) => clean(row?.source)).length;
    const campaignObserved = data.filter((row) => clean(row?.campaign)).length;
    const referrerObserved = data.filter((row) => normalizedReferrer(row?.referrer) !== "Direct / unknown").length;
    const status = !data.length ? "unavailable" : (data.length < 25 || sourceObserved < 10 ? "insufficient" : "observed");

    return withCors(json({
      ok: true,
      status,
      generated_at: new Date().toISOString(),
      window: { days, start_at: since, end_at: new Date().toISOString() },
      coverage: {
        total_events: data.length,
        source_observed: sourceObserved,
        source_coverage_percent: percent(sourceObserved, data.length),
        campaign_observed: campaignObserved,
        campaign_coverage_percent: percent(campaignObserved, data.length),
        referrer_observed: referrerObserved,
        referrer_coverage_percent: percent(referrerObserved, data.length)
      },
      top_sources: summarizeDimension(data, (row) => clean(row?.source) || "Unattributed"),
      top_campaigns: summarizeDimension(data, (row) => clean(row?.campaign) || "Unattributed"),
      top_referrers: summarizeSimple(data.map((row) => normalizedReferrer(row?.referrer))),
      top_devices: summarizeSimple(data.map((row) => clean(row?.payload?.device_type) || "Unknown")),
      evidence: evidenceContract(days, data.length, data.length >= ROW_LIMIT)
    }));
  } catch (error) {
    return withCors(json({
      ok: false,
      status: "unavailable",
      error: error?.message || "Acquisition evidence could not be loaded.",
      evidence: evidenceContract(30, 0, false)
    }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed());
}

function summarizeDimension(rows, labelFor) {
  const buckets = new Map();
  for (const row of rows) {
    const label = String(labelFor(row) || "Unattributed").slice(0, 160);
    if (!buckets.has(label)) buckets.set(label, { label, events: 0, booking_starts: 0, booking_completions: 0 });
    const bucket = buckets.get(label);
    bucket.events += 1;
    if (row?.event_type === "checkout_started" || row?.checkout_state === "started") bucket.booking_starts += 1;
    if (row?.event_type === "checkout_completed" || row?.checkout_state === "completed") bucket.booking_completions += 1;
  }
  return [...buckets.values()]
    .sort((a, b) => b.events - a.events || a.label.localeCompare(b.label))
    .slice(0, 12)
    .map((row) => ({
      ...row,
      completion_rate_percent: row.booking_starts > 0 ? percent(row.booking_completions, row.booking_starts) : null
    }));
}

function summarizeSimple(values) {
  const counts = new Map();
  for (const raw of values) {
    const label = String(raw || "Unknown").slice(0, 160);
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 12);
}

function normalizedReferrer(value) {
  const raw = clean(value);
  if (!raw) return "Direct / unknown";
  try {
    const host = new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
    return host || "Direct / unknown";
  } catch {
    return "Other / invalid referrer";
  }
}

function evidenceContract(days, rowCount, rowLimitReached) {
  return {
    mode: "aggregate_only_observed_events",
    requested_days: days,
    row_count: rowCount,
    row_limit: ROW_LIMIT,
    row_limit_reached: rowLimitReached,
    attribution_inference: false,
    cross_layer_identity_join: false,
    customer_identity_exposed: false,
    raw_session_identifiers_exposed: false,
    raw_ip_user_agent_exposed: false,
    note: rowLimitReached
      ? "The bounded row limit was reached; rankings and coverage are partial and must not be treated as complete-period totals."
      : "Genuine observed evidence only. Missing source or campaign values remain unattributed rather than inferred."
  };
}

function clean(value) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 160) : "";
}

function percent(part, whole) {
  return whole > 0 ? Math.round((Number(part || 0) / Number(whole)) * 1000) / 10 : 0;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
