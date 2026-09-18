// Build 412 — Production Observability, Alerting & Support Diagnostics
// Authenticated, bounded and read-only. Composes retained readiness/diagnostics authorities; no provider/business mutation.

import { onRequestGet as getGoLiveReadiness } from "./go_live_readiness.js";
import { onRequestGet as getProductionDiagnostics } from "./production_diagnostics.js";
import { buildProductionSupportDiagnostics } from "../_lib/production-support-diagnostics.js";

export async function onRequestGet({ request, env }) {
  const generatedAt = new Date().toISOString();
  const [readinessResult, diagnosticsResult] = await Promise.all([
    collect("go_live_readiness", () => getGoLiveReadiness({ request: request.clone(), env })),
    collect("production_diagnostics", () => getProductionDiagnostics({ request: request.clone(), env }))
  ]);

  for (const result of [readinessResult, diagnosticsResult]) {
    if (result.status === 401 || result.status === 403) {
      return json({ ok: false, error: "Unauthorized." }, result.status);
    }
  }

  const sourceErrors = [];
  if (!readinessResult.ok) {
    sourceErrors.push({
      source: "go_live_readiness",
      action: "Restore the retained authenticated go-live readiness source, then refresh the support snapshot manually."
    });
  }
  if (!diagnosticsResult.ok) {
    sourceErrors.push({
      source: "production_diagnostics",
      action: "Restore the retained Production diagnostics source, then refresh the support snapshot manually."
    });
  }

  const snapshot = buildProductionSupportDiagnostics({
    readiness: readinessResult.data || {},
    diagnostics: diagnosticsResult.data || {},
    source_errors: sourceErrors,
    generated_at: generatedAt
  });

  return json({
    ok: snapshot.alert_counts.critical === 0,
    build: 412,
    authority: "production_observability_alerting_support_diagnostics",
    generated_at: generatedAt,
    source_status: {
      go_live_readiness: sourceState(readinessResult),
      production_diagnostics: sourceState(diagnosticsResult)
    },
    ...snapshot
  });
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
      Allow: "GET, HEAD, OPTIONS"
    }
  });
}

async function collect(source, runner) {
  try {
    const response = await runner();
    const data = await response.json().catch(() => null);
    return {
      source,
      ok: response.ok && Boolean(data),
      status: response.status,
      data
    };
  } catch (error) {
    return {
      source,
      ok: false,
      status: 503,
      data: null,
      error_class: error?.name || "Error"
    };
  }
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
      "X-Rosie-Support-Diagnostics": "build-412-read-only"
    }
  });
}
