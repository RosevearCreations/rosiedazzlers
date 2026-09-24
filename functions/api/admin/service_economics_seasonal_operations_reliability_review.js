// Build 494 — read-only Service Economics, Seasonal Operations & Reliability Review endpoint.
// Reuses retained Service Economics and Reliability endpoints; no new evidence source is created.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { onRequestGet as getServiceEconomicsReview } from "./service_economics_commercial_capacity_review.js";
import { onRequestGet as getReliabilityReview } from "./reliability_security_cost_reassessment.js";
import { buildServiceEconomicsSeasonalOperationsReliabilityReview } from "../_lib/service-economics-seasonal-operations-reliability-review.js";

const SOURCE_TIMEOUT_MS = 15000;

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    body: {},
    capability: "manage_staff",
    allowLegacyAdminFallback: false
  });
  if (!access.ok) return withNoStore(access.response);

  const [economics, reliability] = await Promise.all([
    collect("service_economics_review", () => getServiceEconomicsReview({ request: request.clone(), env })),
    collect("reliability_review", () => getReliabilityReview({ request: request.clone(), env }))
  ]);

  const sourceStatus = {
    service_economics_review: sourceState(economics),
    reliability_review: sourceState(reliability)
  };

  if (economics.restricted || reliability.restricted) {
    return json({
      ok: false,
      error: "Build 494 requires both retained Service Economics and I.T. Reliability read permissions.",
      source_status: sourceStatus
    }, 403);
  }

  const report = buildServiceEconomicsSeasonalOperationsReliabilityReview({
    economics_review: economics.data || {},
    reliability_review: reliability.data || {},
    source_status: sourceStatus,
    generated_at: new Date().toISOString()
  });

  return json({
    ok: report.review_status !== "evidence_sources_unavailable",
    ...report,
    release_authority: "service_economics_seasonal_operations_reliability_review",
    retained_economics_authority: "controlled_environment_alternatives_weather_safe_routing",
    retained_reliability_authority: "reliability_cost_recovery_evidence_continuity"
  }, 200, {
    "X-Rosie-Build494-Review": "read-only"
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}
export async function onRequestPost() { return readOnly(); }
export async function onRequestPut() { return readOnly(); }
export async function onRequestPatch() { return readOnly(); }
export async function onRequestDelete() { return readOnly(); }
export async function onRequestOptions() {
  return new Response("", {
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
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("source_timeout")), SOURCE_TIMEOUT_MS);
      })
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
function readOnly() {
  return json({
    ok: false,
    error: "Service Economics, Seasonal Operations & Reliability Review is read-only. Use the owning Finance, booking, fleet, I.T. and recovery workflows for separately authorized action."
  }, 405);
}
function withNoStore(response) {
  const headers = new Headers(response.headers || {});
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
