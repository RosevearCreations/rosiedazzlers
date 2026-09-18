// Build 420 — authenticated, read-only local acquisition evidence closure.
import { onRequestGet as getMeasurementReport } from "./local_search_measurement_report.js";
import { buildLocalAcquisitionEvidenceClosure } from "../_lib/local-acquisition-evidence-closure.js";

export async function onRequestGet(context) {
  return handle(context);
}

export async function onRequestPost(context) {
  return handle(context);
}

export async function onRequestHead(context) {
  const response = await handle(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

async function handle({ request, env }) {
  try {
    const reportRequest = new Request(request.url, {
      method: "GET",
      headers: request.headers
    });
    const response = await getMeasurementReport({ request: reportRequest, env });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      return json({
        ok: false,
        build: 420,
        authority: "search_console_gbp_local_acquisition_evidence_closure",
        error: payload?.error || "Local-search measurement evidence is unavailable."
      }, response.status || 503);
    }

    const closure = buildLocalAcquisitionEvidenceClosure(payload);
    return json({
      ok: true,
      build: 420,
      authority: "search_console_gbp_local_acquisition_evidence_closure",
      retained_measurement_build: 414,
      closure
    });
  } catch (error) {
    return json({
      ok: false,
      build: 420,
      authority: "search_console_gbp_local_acquisition_evidence_closure",
      error: String(error?.message || error || "Local-acquisition evidence closure is unavailable.").slice(0, 500)
    }, 503);
  }
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
