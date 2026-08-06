import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { loadAppSettings } from "../_lib/app-settings.js";
import { ALL_SERVICE_AREA_LABEL } from "../_lib/analytics-rollups.js";

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

    const days = Math.max(1, Math.min(365, Number(body.days || 30)));
    const serviceAreaFilter = cleanText(body.service_area || "");
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const sinceDate = since.slice(0, 10);
    const settings = await loadAppSettings(env);

    const rollupData = await loadRollupAnalytics(env, sinceDate, serviceAreaFilter).catch(() => null);
    if (rollupData?.reports?.daily?.length) {
      const recentWindowDays = Math.min(Math.max(days, 7), 14);
      const recent = await loadRawSupplement(env, recentWindowDays, serviceAreaFilter);
      const dailySummary = Array.isArray(rollupData.reports.daily) ? rollupData.reports.daily : [];

      return withCors(
        json({
          ok: true,
          settings,
          generated_at: new Date().toISOString(),
          days,
          window: {
            start_at: since,
            end_at: new Date().toISOString()
          },
          summary: {
            events: sumMetric(dailySummary, "events"),
            page_views: sumMetric(dailySummary, "page_views"),
            unique_visitors: sumMetric(dailySummary, "unique_visitors"),
            unique_sessions: sumMetric(dailySummary, "unique_sessions"),
            abandoned_sessions: recent.abandoned.length,
            live_online_sessions: recent.liveOnline.length,
            avg_engagement_seconds: recent.avgEngagementSeconds,
            booking_starts: sumMetric(dailySummary, "booking_starts"),
            booking_completions: sumMetric(dailySummary, "booking_completions")
          },
          top_pages: rollupData.top_pages,
          top_countries: rollupData.top_countries,
          top_regions: rollupData.top_regions,
          top_cities: rollupData.top_cities,
          top_devices: rollupData.top_devices,
          top_referrers: rollupData.top_referrers,
          top_actions: rollupData.top_actions,
          top_service_areas: rollupData.top_service_areas,
          service_area_options: rollupData.service_area_options,
          selected_service_area: serviceAreaFilter || null,
          funnel: rollupData.funnel,
          checkout_states: rollupData.checkout_states,
          reports: rollupData.reports,
          daily_traffic: rollupData.reports.daily,
          session_journeys: recent.sessionJourneys.slice(0, 50),
          live_online_sessions: recent.liveOnline.slice(0, 50),
          cart_snapshots: recent.cartSnapshots.slice(0, 50),
          recent_actions: recent.recentActions.slice(0, 50),
          abandoned_checkouts: recent.abandoned.slice(0, 50),
          source: {
            mode: "rollups",
            summary_unique_scope: "summed_daily_rollups",
            live_and_abandoned_scope_days: recentWindowDays,
            all_service_area_label: ALL_SERVICE_AREA_LABEL
          }
        })
      );
    }

    const raw = await loadRawAnalytics(env, since, days, serviceAreaFilter, settings);
    return withCors(json(raw));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

async function loadRollupAnalytics(env, sinceDate, serviceAreaFilter) {
  const targetArea = serviceAreaFilter || ALL_SERVICE_AREA_LABEL;
  const headers = serviceHeaders(env);
  const [summaryRes, dimRes, funnelRes, areaRes] = await Promise.all([
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_rollups?select=period_type,period_key,period_start,period_end,service_area_label,events,page_views,unique_visitors,unique_sessions,booking_starts,booking_completions,cart_snapshots&period_start=gte.${encodeURIComponent(sinceDate)}&service_area_label=eq.${encodeURIComponent(targetArea)}&order=period_start.asc&limit=5000`,
      { headers }
    ),
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_dimension_daily_rollups?select=rollup_date,service_area_label,dimension_type,dimension_value,count&rollup_date=gte.${encodeURIComponent(sinceDate)}&service_area_label=eq.${encodeURIComponent(targetArea)}&order=rollup_date.asc&limit=50000`,
      { headers }
    ),
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_funnel_daily_rollups?select=rollup_date,service_area_label,step_1_views,step_2_views,step_3_views,step_4_views,step_5_views,service_area_picks,date_picks,package_picks,addon_toggles,customer_continue,checkout_started,checkout_completed&rollup_date=gte.${encodeURIComponent(sinceDate)}&service_area_label=eq.${encodeURIComponent(targetArea)}&order=rollup_date.asc&limit=5000`,
      { headers }
    ),
    fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_rollups?select=service_area_label&period_type=eq.day&period_start=gte.${encodeURIComponent(sinceDate)}&service_area_label=not.eq.${encodeURIComponent(ALL_SERVICE_AREA_LABEL)}&order=service_area_label.asc&limit=5000`,
      { headers }
    )
  ]);

  if (![summaryRes, dimRes, funnelRes, areaRes].every((res) => res.ok)) {
    throw new Error("Rollup tables are not ready yet.");
  }

  const summaryRows = normalizeArray(await summaryRes.json().catch(() => []));
  const dimensionRows = normalizeArray(await dimRes.json().catch(() => []));
  const funnelRows = normalizeArray(await funnelRes.json().catch(() => []));
  const areaRows = normalizeArray(await areaRes.json().catch(() => []));

  return {
    reports: {
      daily: normalizePeriodRows(summaryRows.filter((row) => row.period_type === "day")),
      weekly: normalizePeriodRows(summaryRows.filter((row) => row.period_type === "week")),
      monthly: normalizePeriodRows(summaryRows.filter((row) => row.period_type === "month")),
      yearly: normalizePeriodRows(summaryRows.filter((row) => row.period_type === "year"))
    },
    top_pages: summarizeDimensionCounts(dimensionRows, "page_path"),
    top_countries: summarizeDimensionCounts(dimensionRows, "country"),
    top_regions: summarizeDimensionCounts(dimensionRows, "region"),
    top_cities: summarizeDimensionCounts(dimensionRows, "city"),
    top_devices: summarizeDimensionCounts(dimensionRows, "device_type"),
    top_referrers: summarizeDimensionCounts(dimensionRows, "referrer"),
    top_actions: summarizeDimensionCounts(dimensionRows, "event_type"),
    top_service_areas: serviceAreaFilter
      ? [{ label: serviceAreaFilter, count: sumDimensionCount(dimensionRows, "page_path") }]
      : summarizeDimensionCounts(dimensionRows, "service_area"),
    checkout_states: summarizeDimensionCounts(dimensionRows, "checkout_state"),
    service_area_options: Array.from(
      new Set(areaRows.map((row) => cleanText(row.service_area_label)).filter((value) => value && value !== ALL_SERVICE_AREA_LABEL))
    ).sort((a, b) => a.localeCompare(b)),
    funnel: summarizeFunnelRows(funnelRows)
  };
}

async function loadRawAnalytics(env, since, days, serviceAreaFilter, settings) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,event_type,page_path,country,session_id,visitor_id,referrer,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=25000`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) throw new Error(`Could not load analytics. ${await res.text()}`);

  const rows = await res.json().catch(() => []);
  let data = Array.isArray(rows) ? rows : [];

  const serviceAreaCandidates = Array.from(
    new Set(
      data
        .map((row) => String(row?.payload?.service_area_label || row?.payload?.service_area || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  if (serviceAreaFilter) {
    data = filterByServiceArea(data, serviceAreaFilter);
  }

  const pageViews = data.filter((row) => row.event_type === "page_view");
  const heartbeatEvents = data.filter((row) => row.event_type === "heartbeat");
  const uniqueVisitors = new Set(data.map((row) => row.visitor_id).filter(Boolean)).size;
  const uniqueSessions = new Set(data.map((row) => row.session_id).filter(Boolean)).size;

  const sessionJourneys = summarizeJourneys(data);
  const abandoned = summarizeAbandoned(data);
  const liveOnline = summarizeLiveOnline(sessionJourneys, data);

  return {
    ok: true,
    settings,
    generated_at: new Date().toISOString(),
    days,
    window: {
      start_at: since,
      end_at: new Date().toISOString()
    },
    summary: {
      events: data.length,
      page_views: pageViews.length,
      unique_visitors: uniqueVisitors,
      unique_sessions: uniqueSessions,
      abandoned_sessions: abandoned.length,
      live_online_sessions: liveOnline.length,
      avg_engagement_seconds: heartbeatEvents.length
        ? Math.round(
            heartbeatEvents.reduce((sum, row) => sum + Number(row?.payload?.duration_ms || 0), 0) /
              heartbeatEvents.length /
              1000
          )
        : 0,
      booking_starts: countTrafficEvents(data, (row) => row.event_type === "checkout_started" || row.checkout_state === "started"),
      booking_completions: countTrafficEvents(data, (row) => row.event_type === "checkout_completed" || row.checkout_state === "completed")
    },
    top_pages: summarizeCounts(pageViews.map((row) => row.page_path || "/")),
    top_countries: summarizeCounts(data.map((row) => row.country || "Unknown")),
    top_regions: summarizeCounts(data.map((row) => row?.payload?.region || "Unknown")),
    top_cities: summarizeCounts(
      data.map((row) => {
        const city = row?.payload?.city || "";
        const region = row?.payload?.region || "";
        return city ? `${city}${region ? `, ${region}` : ""}` : "Unknown";
      })
    ),
    top_devices: summarizeCounts(data.map((row) => row?.payload?.device_type || "Unknown")),
    top_referrers: summarizeCounts(data.map((row) => row.referrer || "Direct")),
    top_actions: summarizeCounts(
      data
        .filter((row) => !["heartbeat", "page_focus", "page_exit"].includes(row.event_type))
        .map((row) => row.event_type || "unknown")
    ),
    top_service_areas: summarizeCounts(
      data.map((row) => row?.payload?.service_area_label || row?.payload?.service_area || "").filter(Boolean)
    ),
    service_area_options: serviceAreaCandidates,
    selected_service_area: serviceAreaFilter || null,
    funnel: summarizeBookingFunnel(data),
    checkout_states: summarizeCounts(data.map((row) => row.checkout_state || "").filter(Boolean)),
    reports: {
      daily: summarizeTrafficByPeriod(data, "day"),
      weekly: summarizeTrafficByPeriod(data, "week"),
      monthly: summarizeTrafficByPeriod(data, "month"),
      yearly: summarizeTrafficByPeriod(data, "year")
    },
    daily_traffic: summarizeTrafficByPeriod(data, "day"),
    session_journeys: sessionJourneys.slice(0, 50),
    live_online_sessions: liveOnline.slice(0, 50),
    cart_snapshots: summarizeCartSnapshots(data).slice(0, 50),
    recent_actions: summarizeRecentActions(data).slice(0, 50),
    abandoned_checkouts: abandoned.slice(0, 50),
    source: {
      mode: "raw_events"
    }
  };
}

async function loadRawSupplement(env, days, serviceAreaFilter) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,event_type,page_path,country,session_id,visitor_id,referrer,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(since)}&order=created_at.desc&limit=10000`,
    { headers: serviceHeaders(env) }
  );
  if (!res.ok) {
    throw new Error(`Could not load recent analytics supplement. ${await res.text()}`);
  }
  let rows = normalizeArray(await res.json().catch(() => []));
  if (serviceAreaFilter) rows = filterByServiceArea(rows, serviceAreaFilter);

  const journeys = summarizeJourneys(rows);
  const abandoned = summarizeAbandoned(rows);
  const liveOnline = summarizeLiveOnline(journeys, rows);
  const heartbeatEvents = rows.filter((row) => row.event_type === "heartbeat");

  return {
    sessionJourneys: journeys,
    abandoned,
    liveOnline,
    cartSnapshots: summarizeCartSnapshots(rows),
    recentActions: summarizeRecentActions(rows),
    avgEngagementSeconds: heartbeatEvents.length
      ? Math.round(heartbeatEvents.reduce((sum, row) => sum + Number(row?.payload?.duration_ms || 0), 0) / heartbeatEvents.length / 1000)
      : 0
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePeriodRows(rows) {
  return [...rows]
    .sort((a, b) => String(a.period_start || a.period_key || "").localeCompare(String(b.period_start || b.period_key || "")))
    .map((row) => ({
      period_key: row.period_key,
      label: row.period_type === "week" ? `${row.period_key} (${String(row.period_start || "").slice(0, 10)})` : row.period_key,
      period_start: row.period_start,
      period_end: row.period_end,
      events: Number(row.events || 0),
      page_views: Number(row.page_views || 0),
      unique_visitors: Number(row.unique_visitors || 0),
      unique_sessions: Number(row.unique_sessions || 0),
      booking_starts: Number(row.booking_starts || 0),
      booking_completions: Number(row.booking_completions || 0),
      cart_snapshots: Number(row.cart_snapshots || 0)
    }));
}

function summarizeDimensionCounts(rows, type) {
  const map = new Map();
  for (const row of rows) {
    if (String(row?.dimension_type || "") !== type) continue;
    const label = String(row?.dimension_value || "Unknown");
    map.set(label, (map.get(label) || 0) + Number(row?.count || 0));
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([label, count]) => ({ label, count }));
}

function sumDimensionCount(rows, type) {
  return rows.reduce((sum, row) => sum + (String(row?.dimension_type || "") === type ? Number(row?.count || 0) : 0), 0);
}

function summarizeFunnelRows(rows) {
  const total = {
    step_1_views: 0,
    step_2_views: 0,
    step_3_views: 0,
    step_4_views: 0,
    step_5_views: 0,
    service_area_picks: 0,
    date_picks: 0,
    package_picks: 0,
    addon_toggles: 0,
    customer_continue: 0,
    checkout_started: 0,
    checkout_completed: 0
  };
  for (const row of rows) {
    for (const key of Object.keys(total)) total[key] += Number(row?.[key] || 0);
  }
  return total;
}

function sumMetric(rows, field) {
  return rows.reduce((sum, row) => sum + Number(row?.[field] || 0), 0);
}

function filterByServiceArea(rows, serviceAreaFilter) {
  return rows.filter(
    (row) => String(row?.payload?.service_area_label || row?.payload?.service_area || "").trim() === serviceAreaFilter
  );
}

function countTrafficEvents(rows, predicate) {
  return rows.reduce((count, row) => count + (predicate(row) ? 1 : 0), 0);
}

function summarizeCounts(list) {
  const map = new Map();
  for (const item of list) {
    const key = String(item || "Unknown");
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([label, count]) => ({ label, count }));
}

function summarizeJourneys(rows) {
  const bySession = new Map();
  const sorted = [...rows].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  for (const row of sorted) {
    const sid = row.session_id || `anon:${row.visitor_id || row.id}`;
    const current = bySession.get(sid) || [];
    current.push({
      at: row.created_at || null,
      type: row.event_type || null,
      page: row.page_path || null,
      country: row.country || null,
      checkout_state: row.checkout_state || null
    });
    bySession.set(sid, current);
  }
  return [...bySession.entries()]
    .map(([session_id, events]) => ({
      session_id,
      event_count: events.length,
      started_at: events[0]?.at || null,
      ended_at: events[events.length - 1]?.at || null,
      country: events.find((event) => event.country)?.country || null,
      path: events.map((event) => event.page).filter(Boolean),
      events
    }))
    .sort((a, b) => String(b.ended_at).localeCompare(String(a.ended_at)));
}

function summarizeAbandoned(rows) {
  const journeys = summarizeJourneys(rows);
  return journeys
    .filter((journey) => {
      const started = journey.events.some((event) => event.type === "checkout_started" || event.checkout_state === "started");
      const completed = journey.events.some(
        (event) => event.type === "checkout_completed" || event.checkout_state === "completed"
      );
      return started && !completed;
    })
    .map((journey) => ({
      session_id: journey.session_id,
      started_at: journey.started_at,
      ended_at: journey.ended_at,
      country: journey.country,
      path: journey.path,
      last_page: journey.path[journey.path.length - 1] || null
    }));
}

function summarizeLiveOnline(journeys, rows) {
  const cutoff = Date.now() - 2 * 60 * 1000;
  const bySession = new Map(rows.map((row) => [row.session_id || `anon:${row.visitor_id || row.id}`, row]));
  return journeys
    .filter((journey) => journey.ended_at && new Date(journey.ended_at).getTime() >= cutoff)
    .map((journey) => ({
      session_id: journey.session_id,
      ended_at: journey.ended_at,
      country: journey.country || bySession.get(journey.session_id)?.country || null,
      path: journey.path.slice(-5)
    }));
}

function summarizeCartSnapshots(rows) {
  return rows
    .filter((row) => row.event_type === "cart_snapshot")
    .map((row) => ({
      session_id: row.session_id || null,
      page_path: row.page_path || null,
      created_at: row.created_at || null,
      item_count: Number(row?.payload?.item_count || 0),
      cart_key: row?.payload?.cart_key || null
    }))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

function summarizeRecentActions(rows) {
  return rows
    .filter((row) => !["heartbeat"].includes(row.event_type))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((row) => ({
      created_at: row.created_at || null,
      event_type: row.event_type || null,
      page_path: row.page_path || null,
      city: row?.payload?.city || null,
      region: row?.payload?.region || null,
      device_type: row?.payload?.device_type || null,
      target_text: row?.payload?.target_text || null,
      href: row?.payload?.href || null,
      percent: row?.payload?.percent || null,
      viewport: row?.payload?.viewport || null,
      session_id: row.session_id || null
    }));
}

function summarizeTrafficByPeriod(rows, mode) {
  const map = new Map();

  for (const row of rows) {
    const meta = getPeriodMeta(row?.created_at, mode);
    if (!meta) continue;

    if (!map.has(meta.key)) {
      map.set(meta.key, {
        period_key: meta.key,
        label: meta.label,
        sort_key: meta.sortKey,
        period_start: meta.start,
        period_end: meta.end,
        events: 0,
        page_views: 0,
        booking_starts: 0,
        booking_completions: 0,
        cart_snapshots: 0,
        visitor_ids: new Set(),
        session_ids: new Set()
      });
    }

    const bucket = map.get(meta.key);
    bucket.events += 1;
    if (row.event_type === "page_view") bucket.page_views += 1;
    if (row.event_type === "cart_snapshot") bucket.cart_snapshots += 1;
    if (row.event_type === "checkout_started" || row.checkout_state === "started") bucket.booking_starts += 1;
    if (row.event_type === "checkout_completed" || row.checkout_state === "completed") bucket.booking_completions += 1;
    if (row.visitor_id) bucket.visitor_ids.add(row.visitor_id);
    if (row.session_id) bucket.session_ids.add(row.session_id);
  }

  return [...map.values()]
    .sort((a, b) => String(a.sort_key).localeCompare(String(b.sort_key)))
    .map((bucket) => ({
      period_key: bucket.period_key,
      label: bucket.label,
      period_start: bucket.period_start,
      period_end: bucket.period_end,
      events: bucket.events,
      page_views: bucket.page_views,
      unique_visitors: bucket.visitor_ids.size,
      unique_sessions: bucket.session_ids.size,
      booking_starts: bucket.booking_starts,
      booking_completions: bucket.booking_completions,
      cart_snapshots: bucket.cart_snapshots
    }));
}

function getPeriodMeta(value, mode) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  if (mode === "day") {
    const key = `${year}-${month}-${day}`;
    return { key, label: key, sortKey: key, start: `${key}T00:00:00.000Z`, end: `${key}T23:59:59.999Z` };
  }

  if (mode === "month") {
    const key = `${year}-${month}`;
    const endDate = new Date(Date.UTC(year, Number(month), 0, 23, 59, 59, 999));
    return {
      key,
      label: key,
      sortKey: key,
      start: `${key}-01T00:00:00.000Z`,
      end: endDate.toISOString()
    };
  }

  if (mode === "year") {
    const key = String(year);
    return {
      key,
      label: key,
      sortKey: key,
      start: `${key}-01-01T00:00:00.000Z`,
      end: `${key}-12-31T23:59:59.999Z`
    };
  }

  const weekMeta = isoWeekMeta(date);
  return {
    key: `${weekMeta.year}-W${String(weekMeta.week).padStart(2, "0")}`,
    label: `${weekMeta.year}-W${String(weekMeta.week).padStart(2, "0")} (${weekMeta.start.slice(0, 10)})`,
    sortKey: `${weekMeta.year}-${String(weekMeta.week).padStart(2, "0")}`,
    start: weekMeta.start,
    end: weekMeta.end
  };
}

function isoWeekMeta(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((target - firstThursday) / 604800000);
  const monday = new Date(target);
  monday.setUTCDate(target.getUTCDate() - 3);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return {
    year: target.getUTCFullYear(),
    week,
    start: monday.toISOString(),
    end: sunday.toISOString()
  };
}

function summarizeBookingFunnel(rows) {
  const eventCounts = (type) => rows.filter((row) => row.event_type === type).length;
  const stepViews = new Map();
  for (const row of rows.filter((entry) => entry.event_type === "booking_step_view")) {
    const key = Number(row?.payload?.step_number || 0);
    if (key) stepViews.set(key, (stepViews.get(key) || 0) + 1);
  }
  return {
    step_1_views: stepViews.get(1) || 0,
    step_2_views: stepViews.get(2) || 0,
    step_3_views: stepViews.get(3) || 0,
    step_4_views: stepViews.get(4) || 0,
    step_5_views: stepViews.get(5) || 0,
    service_area_picks: eventCounts("booking_service_area_pick"),
    date_picks: eventCounts("booking_date_pick"),
    package_picks: eventCounts("booking_package_pick"),
    addon_toggles: eventCounts("booking_addon_toggle"),
    customer_continue: eventCounts("booking_customer_continue"),
    checkout_started: eventCounts("checkout_started"),
    checkout_completed: eventCounts("checkout_completed")
  };
}

function cleanText(value) {
  return String(value || "").trim();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
