// Build 450 — authenticated GET-only Local Search Measurement & Conversion Attribution.
// Reuses the retained Build 440 provider refresh and bounded anonymous site analytics.

import { onRequestGet as getProviderRefresh } from "./local_search_provider_evidence_refresh.js";
import { serviceHeaders } from "../_lib/staff-auth.js";
import { buildLocalSearchMeasurementConversionAttribution } from "../_lib/local-search-measurement-conversion-attribution.js";

const EVENT_ROW_LIMIT = 5000;
const FALLBACK_WINDOW_DAYS = 30;

export async function onRequestGet({ request, env }) {
  try {
    const refreshRequest = new Request(request.url, { method: "GET", headers: request.headers });
    const refreshResponse = await getProviderRefresh({ request: refreshRequest, env });
    const providerRefresh = await refreshResponse.json().catch(() => null);

    if (!refreshResponse.ok || !providerRefresh?.ok) {
      return json({
        ok: false,
        build: 450,
        authority: "local_search_measurement_conversion_attribution",
        error: providerRefresh?.error || "The retained local-search provider evidence authority is unavailable."
      }, refreshResponse.status || 503);
    }

    const windowStart = providerRefresh?.reconciliation?.first_party?.window_start || fallbackStartDate();
    let events = [];
    let eventsAvailable = false;
    let eventsTruncated = false;

    if (hasSupabaseConfig(env)) {
      const headers = serviceHeaders(env);
      const select = "session_id,event_type,page_path,referrer,source,campaign,checkout_state,created_at,payload";
      const url = env.SUPABASE_URL
        + "/rest/v1/site_activity_events?select=" + encodeURIComponent(select)
        + "&created_at=gte." + encodeURIComponent(windowStart + "T00:00:00Z")
        + "&order=created_at.asc&limit=" + EVENT_ROW_LIMIT;
      const eventsResponse = await fetch(url, { headers });
      if (eventsResponse.ok) {
        const rows = await eventsResponse.json().catch(() => []);
        events = Array.isArray(rows) ? rows : [];
        eventsAvailable = true;
        eventsTruncated = events.length >= EVENT_ROW_LIMIT;
      }
    }

    const report = buildLocalSearchMeasurementConversionAttribution({
      provider_refresh: providerRefresh,
      events,
      events_available: eventsAvailable,
      events_truncated_possible: eventsTruncated,
      generated_at: new Date().toISOString()
    });

    return json({
      ok: true,
      ...report,
      source_rows: {
        anonymous_event_rows_read: events.length,
        anonymous_event_row_limit: EVENT_ROW_LIMIT
      },
      source_failures: {
        anonymous_event_rows: eventsAvailable ? null : "unavailable"
      }
    });
  } catch (error) {
    return json({
      ok: false,
      build: 450,
      authority: "local_search_measurement_conversion_attribution",
      error: safeError(error)
    }, 503);
  }
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function fallbackStartDate() {
  return new Date(Date.now() - FALLBACK_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
}

function hasSupabaseConfig(env) {
  return Boolean(env?.SUPABASE_URL && (
    env?.SUPABASE_SERVICE_ROLE_KEY
    || env?.SUPABASE_SERVICE_KEY
    || env?.SUPABASE_SERVICE_ROLE
    || env?.SUPABASE_SECRET_KEY
  ));
}

function safeError(error) {
  return String(error?.message || error || "Local-search measurement conversion attribution is unavailable.")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .slice(0, 500);
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Local-Search-Attribution": "build-450-read-only"
    }
  });
}
