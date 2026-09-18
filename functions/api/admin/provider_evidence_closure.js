// Build 417 — Payment, Refund & Delivery Provider Evidence Closure
// Authenticated read-only evidence composition. No provider call, charge, refund, send, replay or business mutation.

import { requireStaffAccess, json, serviceHeaders } from "../_lib/staff-auth.js";
import { onRequestGet as getGoLiveReadiness } from "./go_live_readiness.js";
import { buildProviderEvidenceClosure } from "../_lib/provider-evidence-closure.js";

const REFUND_LIMIT = 60;
const NOTIFICATION_LIMIT = 100;

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({
    request,
    env,
    capability: "it_diagnostics",
    allowLegacyAdminFallback: true
  });
  if (!access.ok) return access.response;

  const readiness = await collectReadiness(request, env);
  const [refundSource, notificationSource] = await Promise.all([
    loadRows(env, "quote_deposit_refund_records", "updated_at.desc", REFUND_LIMIT),
    loadRows(env, "notification_events", "created_at.desc", NOTIFICATION_LIMIT)
  ]);

  const closure = buildProviderEvidenceClosure({
    readiness: readiness.data || {},
    refunds: refundSource.rows,
    notifications: notificationSource.rows,
    sources: {
      payment_readiness_available: readiness.ok,
      refund_warning: refundSource.warning,
      notification_warning: notificationSource.warning
    },
    generated_at: new Date().toISOString()
  });

  if (!refundSource.available) closure.refunds.source_available = false;
  if (!notificationSource.available) closure.delivery.source_available = false;
  closure.sources.refund_source_available = refundSource.available;
  closure.sources.notification_source_available = notificationSource.available;

  for (const row of closure.required) {
    if (row.id === "refund" && !refundSource.available) {
      row.status = "unavailable";
      row.classification = "unavailable";
      row.detail = "Persisted refund evidence is unavailable in the current runtime.";
    }
    if (row.id === "delivery" && !notificationSource.available) {
      row.status = "unavailable";
      row.classification = "unavailable";
      row.detail = "Persisted notification evidence is unavailable in the current runtime.";
    }
  }
  closure.outstanding = closure.required
    .filter((row) => row.status !== "verified")
    .map(({id,title,status,classification}) => ({id,title,status,classification}));
  closure.status = closure.outstanding.length ? "hold" : "ready";
  closure.decision = closure.outstanding.length ? "provider_evidence_incomplete" : "provider_evidence_complete";

  return json({
    ok: true,
    build: 417,
    authority: "payment_refund_delivery_provider_evidence_closure",
    closure
  });
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", Allow: "GET, HEAD, OPTIONS" } });
}

async function collectReadiness(request, env) {
  try {
    const response = await getGoLiveReadiness({ request: request.clone(), env });
    const data = await response.json().catch(() => null);
    return { ok: response.ok && !!data, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 503, data: null, warning: error?.message || "Payment readiness evidence is unavailable." };
  }
}

async function loadRows(env, table, order, limit) {
  if (!env?.SUPABASE_URL || !serviceRolePresent(env)) {
    return { available: false, rows: [], warning: "Supabase service configuration is unavailable." };
  }
  try {
    const url = `${String(env.SUPABASE_URL).replace(/\/$/,"")}/rest/v1/${table}?select=*&order=${encodeURIComponent(order)}&limit=${limit}`;
    const response = await fetch(url, { method: "GET", headers: serviceHeaders(env) });
    const text = await response.text();
    const data = safeJson(text);
    if (!response.ok) {
      return { available: false, rows: [], warning: data?.message || `${table} evidence lookup returned HTTP ${response.status}.` };
    }
    return { available: true, rows: Array.isArray(data) ? data : [], warning: null };
  } catch (error) {
    return { available: false, rows: [], warning: error?.message || `${table} evidence lookup failed.` };
  }
}

function serviceRolePresent(env) {
  return !!(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY);
}
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
