// Build 484 — retained bounded reassessment enriched with reliability/cost/recovery evidence continuity.
import { requireStaffAccess } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { onRequestGet as getReliabilityCapacity } from "./reliability_performance_cost_capacity.js";
import { onRequestGet as getSecurityRecovery } from "./security_privacy_recovery_drill.js";
import { onRequestGet as getGoLiveReadiness } from "./go_live_readiness.js";
import { buildReliabilitySecurityCostReassessment } from "../_lib/reliability-security-cost-reassessment.js";
import { buildReliabilityCostRecoveryEvidenceContinuity } from "../_lib/reliability-cost-recovery-evidence-continuity.js";
// Retained Build 474 marker: buildReliabilityCostResilienceTrendReview
// Retained source-authority marker: buildReliabilityCostResilienceOperationalGuardrails

const SOURCE_TIMEOUT_MS = 10000;

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: null, allowLegacyAdminFallback: false });
  if (!access.ok) return withNoStore(access.response);
  const action = requireActionAccess(access.actor, "it.runtime.view");
  if (!action.ok) return withNoStore(action.response);

  const generatedAt = new Date().toISOString();
  const [reliability, security, readiness] = await Promise.all([
    collect("reliability_performance_cost_capacity", () => getReliabilityCapacity({ request: request.clone(), env })),
    collect("security_privacy_recovery_drill", () => getSecurityRecovery({ request: request.clone(), env })),
    collect("go_live_readiness", () => getGoLiveReadiness({ request: request.clone(), env }))
  ]);

  const reassessment = buildReliabilitySecurityCostReassessment({
    reliability: reliability.data || {},
    security: security.data || {},
    readiness: readiness.data || {},
    source_status: {
      reliability_performance_cost_capacity: sourceState(reliability),
      security_privacy_recovery_drill: sourceState(security),
      go_live_readiness: sourceState(readiness)
    },
    generated_at: generatedAt
  });
  const report = buildReliabilityCostRecoveryEvidenceContinuity({ reassessment, reliability: reliability.data || {}, recovery: security.data || {}, generated_at: generatedAt });

  return json({
    ok: report.counts.operational_pressure === 0,
    ...report,
    source_status: {
      reliability_performance_cost_capacity: sourceState(reliability),
      security_privacy_recovery_drill: sourceState(security),
      go_live_readiness: sourceState(readiness)
    }
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
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

async function collect(name, runner) {
  let timer;
  try {
    const response = await Promise.race([
      Promise.resolve().then(runner),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("source_timeout")), SOURCE_TIMEOUT_MS); })
    ]);
    const data = await response.json().catch(() => null);
    return {
      name,
      available: response.ok && Boolean(data),
      restricted: response.status === 401 || response.status === 403,
      status: response.status,
      data,
      error_class: null
    };
  } catch (error) {
    return {
      name,
      available: false,
      restricted: false,
      status: 503,
      data: null,
      error_class: error?.message === "source_timeout" ? "timeout" : (error?.name || "Error")
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function sourceState(result) {
  return {
    available: result?.available === true,
    restricted: result?.restricted === true,
    http_status: Number(result?.status) || null,
    generated_at: String(result?.data?.generated_at || "").trim() || null,
    error_class: result?.error_class || null
  };
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Rosie-Reassessment": "build-464-read-only",
      "X-Rosie-Trend-Review": "build-474-read-only",
      "X-Rosie-Continuity": "build-484-read-only"
    }
  });
}
function withNoStore(response) {
  const headers = new Headers(response.headers || {});
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
