// Build 441 — read-only Booking, Quote & Retention Production Learning endpoint.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { onRequestGet as getBookingRebookingFunnel } from "./booking_rebooking_funnel.js";
import { onRequestGet as getRetentionRebookingLearning } from "./retention_rebooking_learning.js";
import { onRequestGet as getQuotePipeline } from "./quote_pipeline_list.js";
import { buildBookingQuoteRetentionProductionLearning } from "../_lib/booking-quote-retention-production-learning.js";

const SOURCE_TIMEOUT_MS = 9000;

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    body: {},
    capability: "manage_bookings",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const url = new URL(request.url);
  const days = boundedDays(url.searchParams.get("days"));
  const generatedAt = new Date().toISOString();
  const funnelRequest = withQuery(request, "days", String(days));

  const [funnel, retention, quotes] = await Promise.all([
    collect("booking_rebooking_funnel", () => getBookingRebookingFunnel({ request: funnelRequest, env })),
    collect("retention_rebooking_learning", () => getRetentionRebookingLearning({ request: request.clone(), env })),
    collect("quote_pipeline_list", () => getQuotePipeline({ request: request.clone(), env }))
  ]);

  if ([funnel, retention, quotes].some((row) => row.restricted)) {
    return json({
      ok: false,
      error: "One or more retained evidence sources are not authorized for this staff account.",
      source_status: sourceStatusMap({ funnel, retention, quotes })
    }, 403);
  }

  const learning = buildBookingQuoteRetentionProductionLearning({
    funnel: funnel.data || {},
    retention: retention.data || {},
    quote_rows: Array.isArray(quotes.data?.rows) ? quotes.data.rows : [],
    source_status: sourceStatusMap({ funnel, retention, quotes }),
    generated_at: generatedAt
  });

  return json({
    ok: learning.evidence_status !== "unavailable",
    authority: "booking_quote_retention_production_learning",
    window: { days },
    ...learning
  });
}

export async function onRequestPost() { return readOnly(); }
export async function onRequestPut() { return readOnly(); }
export async function onRequestPatch() { return readOnly(); }
export async function onRequestDelete() { return readOnly(); }
export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
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

function sourceStatusMap({ funnel, retention, quotes }) {
  return {
    booking_rebooking_funnel: sourceState(funnel),
    retention_rebooking_learning: sourceState(retention),
    quote_pipeline_list: sourceState(quotes)
  };
}

function sourceState(row) {
  return {
    available: row?.available === true,
    restricted: row?.restricted === true,
    http_status: Number(row?.status) || null,
    error_class: row?.error_class || null
  };
}

function boundedDays(value) {
  const n = Number(value || 90);
  return Number.isFinite(n) ? Math.max(7, Math.min(365, Math.round(n))) : 90;
}

function withQuery(request, key, value) {
  const url = new URL(request.url);
  url.searchParams.set(key, value);
  return new Request(url.toString(), request);
}

function readOnly() {
  return json({
    ok: false,
    error: "Booking, quote and retention production learning is read-only. Use existing explicit owning workflows for any business action."
  }, 405);
}
