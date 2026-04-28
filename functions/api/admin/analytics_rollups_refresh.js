import { requireStaffAccess, json, methodNotAllowed, serviceHeaders } from "../_lib/staff-auth.js";
import { ALL_SERVICE_AREA_LABEL, buildAnalyticsRollupPayload } from "../_lib/analytics-rollups.js";

const CHUNK_SIZE = 500;

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

    const days = Math.max(7, Math.min(365, Number(body.days || 90)));
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
    const sinceDate = sinceIso.slice(0, 10);

    const eventsRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/site_activity_events?select=id,event_type,page_path,country,session_id,visitor_id,referrer,checkout_state,created_at,payload&created_at=gte.${encodeURIComponent(sinceIso)}&order=created_at.asc&limit=100000`,
      { headers: serviceHeaders(env) }
    );
    if (!eventsRes.ok) {
      return withCors(json({ error: `Could not load analytics events for rollups. ${await eventsRes.text()}` }, 500));
    }

    const rows = await eventsRes.json().catch(() => []);
    const payload = buildAnalyticsRollupPayload(Array.isArray(rows) ? rows : []);

    await clearExistingRollups(env, sinceDate);
    await upsertRows(env, 'site_activity_rollups', payload.summaryRows, CHUNK_SIZE);
    await upsertRows(env, 'site_activity_dimension_daily_rollups', payload.dimensionRows, CHUNK_SIZE);
    await upsertRows(env, 'site_activity_funnel_daily_rollups', payload.funnelRows, CHUNK_SIZE);

    return withCors(
      json({
        ok: true,
        days,
        since_date: sinceDate,
        source_event_count: Array.isArray(rows) ? rows.length : 0,
        summary_rows: payload.summaryRows.length,
        dimension_rows: payload.dimensionRows.length,
        funnel_rows: payload.funnelRows.length,
        all_service_area_label: ALL_SERVICE_AREA_LABEL
      })
    );
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

async function clearExistingRollups(env, sinceDate) {
  for (const table of ['site_activity_rollups', 'site_activity_dimension_daily_rollups', 'site_activity_funnel_daily_rollups']) {
    const column = table === 'site_activity_rollups' ? 'period_start' : 'rollup_date';
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/${table}?${column}=gte.${encodeURIComponent(sinceDate)}`,
      { method: 'DELETE', headers: serviceHeaders(env, { Prefer: 'return=minimal' }) }
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`Could not clear existing ${table}. ${await res.text()}`);
    }
  }
}

async function upsertRows(env, table, rows, chunkSize) {
  if (!Array.isArray(rows) || !rows.length) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: serviceHeaders(env, {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify(chunk)
    });
    if (!res.ok) {
      throw new Error(`Could not save ${table} rollups. ${await res.text()}`);
    }
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
