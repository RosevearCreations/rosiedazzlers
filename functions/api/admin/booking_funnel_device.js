import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";

const MAX_DAYS = 30;
const MAX_ROWS = 2500;
const DEVICES = ["mobile", "tablet", "desktop", "unknown"];
const STAGES = [
  { key: "step_1", label: "Date + vehicle" },
  { key: "step_2", label: "Package" },
  { key: "step_3", label: "Add-ons" },
  { key: "step_4", label: "Customer details" },
  { key: "step_5", label: "Deposit / payment" },
  { key: "checkout_started", label: "Checkout started" },
  { key: "checkout_completed", label: "Checkout completed" },
];

function cleanDevice(value) {
  const device = String(value || "").trim().toLowerCase();
  return DEVICES.includes(device) ? device : "unknown";
}

function emptyDevice(device) {
  return {
    device,
    sessions_observed: new Set(),
    stages: new Map(STAGES.map((stage) => [stage.key, new Set()])),
    checkout_started: new Set(),
    checkout_completed: new Set(),
  };
}

function pct(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

function summarizeDevice(bucket) {
  const first = bucket.stages.get("step_1")?.size || 0;
  let previous = null;
  const stages = STAGES.map((stage) => {
    const count = bucket.stages.get(stage.key)?.size || 0;
    const drop = previous == null ? null : Math.max(0, previous - count);
    const result = {
      key: stage.key,
      label: stage.label,
      sessions: count,
      conversion_from_start_pct: pct(count, first),
      drop_from_previous: drop,
      drop_from_previous_pct: previous == null ? null : pct(drop, previous),
    };
    previous = count;
    return result;
  });
  const started = bucket.checkout_started.size;
  const completed = bucket.checkout_completed.size;
  return {
    device: bucket.device,
    sessions_observed: bucket.sessions_observed.size,
    funnel_start_sessions: first,
    checkout_started_sessions: started,
    checkout_completed_sessions: completed,
    abandoned_after_checkout_start: Math.max(0, started - completed),
    start_to_completion_pct: pct(completed, first),
    checkout_completion_pct: pct(completed, started),
    stages,
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireStaffAccess({
    request,
    env,
    capability: "manage_staff",
    allowLegacyAdminFallback: true,
  });
  if (!auth.ok) return auth.response;

  if (!env?.SUPABASE_URL) {
    return json({ ok: false, error: "Analytics storage is not configured.", state: "evidence_unavailable" }, 503);
  }

  const url = new URL(request.url);
  const days = Math.max(1, Math.min(MAX_DAYS, Number(url.searchParams.get("days") || 14)));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const endpoint = `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=event_type,session_id,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=${MAX_ROWS}`;
  const response = await fetch(endpoint, { method: "GET", headers: serviceHeaders(env) });
  if (!response.ok) {
    return json({ ok: false, error: "Booking funnel analytics could not be loaded.", state: "evidence_unavailable" }, 502);
  }

  const rows = await response.json().catch(() => []);
  const data = Array.isArray(rows) ? rows : [];
  const byDevice = new Map(DEVICES.map((device) => [device, emptyDevice(device)]));

  for (const row of data) {
    const session = String(row?.session_id || "").trim();
    if (!session) continue;
    const device = cleanDevice(row?.payload?.device_type);
    const bucket = byDevice.get(device);
    bucket.sessions_observed.add(session);

    if (row?.event_type === "booking_step_view") {
      const step = Number(row?.payload?.step_number || 0);
      const key = `step_${step}`;
      if (bucket.stages.has(key)) bucket.stages.get(key).add(session);
    }
    if (row?.event_type === "checkout_started" || row?.checkout_state === "started") {
      bucket.checkout_started.add(session);
      bucket.stages.get("checkout_started").add(session);
    }
    if (row?.event_type === "checkout_completed" || row?.checkout_state === "completed") {
      bucket.checkout_completed.add(session);
      bucket.stages.get("checkout_completed").add(session);
    }
  }

  const devices = DEVICES.map((device) => summarizeDevice(byDevice.get(device))).filter((item) => item.sessions_observed > 0 || item.funnel_start_sessions > 0);
  const mobile = devices.find((item) => item.device === "mobile") || null;
  const desktop = devices.find((item) => item.device === "desktop") || null;
  const gap = mobile?.start_to_completion_pct != null && desktop?.start_to_completion_pct != null
    ? Math.round((mobile.start_to_completion_pct - desktop.start_to_completion_pct) * 10) / 10
    : null;

  return json({
    ok: true,
    build: 324,
    generated_at: new Date().toISOString(),
    window: { days, start_at: since, end_at: new Date().toISOString() },
    rows_scanned: data.length,
    row_limit: MAX_ROWS,
    truncated: data.length >= MAX_ROWS,
    stages: STAGES,
    devices,
    comparison: {
      mobile_vs_desktop_completion_gap_points: gap,
      interpretation: gap == null ? "insufficient_evidence" : gap < -5 ? "mobile_underperforming" : gap > 5 ? "mobile_outperforming" : "within_five_points",
    },
    contract: {
      read_only: true,
      unique_session_aggregation: true,
      background_polling: false,
      customer_identity_exposed: false,
      analytics_mutation: false,
      booking_mutation: false,
    },
  });
}

export async function onRequestPost() {
  return json({ ok: false, error: "Booking funnel device analytics is read-only in Build 324." }, 405);
}
