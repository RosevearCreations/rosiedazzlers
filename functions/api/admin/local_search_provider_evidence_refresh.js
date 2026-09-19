// Build 440 — authenticated GET-only local-search provider evidence refresh.
// Reuses the retained Build 414 measurement source. No Google/provider mutation is performed.

import { onRequestGet as getMeasurementReport } from "./local_search_measurement_report.js";
import { buildLocalSearchProviderEvidenceRefresh } from "../_lib/local-search-provider-evidence-refresh.js";

export async function onRequestGet({ request, env }) {
  try {
    const reportRequest = new Request(request.url, { method: "GET", headers: request.headers });
    const response = await getMeasurementReport({ request: reportRequest, env });
    const measurement = await response.json().catch(() => null);

    if (!response.ok || !measurement?.ok) {
      return json({
        ok: false,
        build: 440,
        authority: "local_search_provider_evidence_refresh",
        error: measurement?.error || "The retained local-search measurement authority is unavailable."
      }, response.status || 503);
    }

    const report = buildLocalSearchProviderEvidenceRefresh({
      measurement,
      generated_at: new Date().toISOString()
    });

    return json({ ok: true, ...report });
  } catch (error) {
    return json({
      ok: false,
      build: 440,
      authority: "local_search_provider_evidence_refresh",
      error: String(error?.message || error || "Local-search provider evidence refresh is unavailable.").slice(0, 400)
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

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Local-Search-Refresh": "build-440-read-only"
    }
  });
}
