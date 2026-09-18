// Build 415 — Launch Readiness Consolidation & Next-Roadmap Renewal
// Authenticated, bounded, read-only composition. No restore/export/provider/business mutation.

import { onRequestGet as getGoLiveReadiness } from "./go_live_readiness.js";
import { onRequestGet as getProductionDiagnostics } from "./production_diagnostics.js";
import { buildProductionSupportDiagnostics } from "../_lib/production-support-diagnostics.js";
import { listLaunchEvidence } from "../_lib/launch-readiness-evidence.js";
import { buildLaunchReadinessConsolidation } from "../_lib/launch-readiness-consolidation.js";

export async function onRequestGet({ request, env }) {
  const generatedAt = new Date().toISOString();

  const [readinessResult, diagnosticsResult, launchEvidenceResult] = await Promise.all([
    collect(() => getGoLiveReadiness({ request: request.clone(), env })),
    collect(() => getProductionDiagnostics({ request: request.clone(), env })),
    collectLaunchEvidence(env)
  ]);

  for (const result of [readinessResult, diagnosticsResult]) {
    if (result.status === 401 || result.status === 403) {
      return json({ ok: false, error: "Unauthorized." }, result.status);
    }
  }

  const sourceErrors = [];
  if (!readinessResult.ok) sourceErrors.push({ source: "go_live_readiness", action: "Restore the authenticated readiness source and refresh manually." });
  if (!diagnosticsResult.ok) sourceErrors.push({ source: "production_diagnostics", action: "Restore Production diagnostics and refresh manually." });
  if (!launchEvidenceResult.ok) sourceErrors.push({ source: "launch_readiness_evidence", action: "Restore the retained launch-evidence source; missing evidence remains unavailable." });

  const support = buildProductionSupportDiagnostics({
    readiness: readinessResult.data || {},
    diagnostics: diagnosticsResult.data || {},
    source_errors: sourceErrors,
    generated_at: generatedAt
  });

  const consolidation = buildLaunchReadinessConsolidation({
    readiness: readinessResult.data || {},
    support,
    launch_evidence: launchEvidenceResult.items,
    generated_at: generatedAt
  });

  return json({
    ok: consolidation.source_runtime_status === "green",
    build: 415,
    authority: "launch_readiness_consolidation_next_roadmap_renewal",
    source_status: {
      go_live_readiness: state(readinessResult),
      production_diagnostics: state(diagnosticsResult),
      launch_readiness_evidence: {
        available: launchEvidenceResult.ok,
        warning: launchEvidenceResult.warning || null
      }
    },
    ...consolidation
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", Allow: "GET, HEAD, OPTIONS" }
  });
}

async function collect(runner) {
  try {
    const response = await runner();
    const data = await response.json().catch(() => null);
    return { ok: response.ok && Boolean(data), status: response.status, data };
  } catch (error) {
    return { ok: false, status: 503, data: null, error_class: error?.name || "Error" };
  }
}

async function collectLaunchEvidence(env) {
  try {
    const result = await listLaunchEvidence(env);
    return {
      ok: result?.ready === true,
      warning: result?.warning || null,
      items: Array.isArray(result?.items) ? result.items : []
    };
  } catch (error) {
    return { ok: false, warning: error?.message || "Launch evidence unavailable.", items: [] };
  }
}

function state(result) {
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
      "X-Rosie-Launch-Readiness": "build-415-read-only"
    }
  });
}
