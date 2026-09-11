// Build 375 — finance-only read surface for payment reconciliation and month-end close readiness.
import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { buildMonthEndClosureSnapshot } from "../_lib/accounting-month-end-closure.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: null, allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const actionAccess = requireActionAccess(access.actor, "finance.view");
    if (!actionAccess.ok) return withCors(actionAccess.response);

    const url = new URL(request.url);
    const now = new Date();
    const month = Math.max(1, Math.min(12, Number(url.searchParams.get("month") || (now.getMonth() + 1)) || 1));
    const year = Math.max(2020, Math.min(2100, Number(url.searchParams.get("year") || now.getFullYear()) || now.getFullYear()));
    const closure = await buildMonthEndClosureSnapshot(env, { month, year });
    return withCors(json({ ok: true, closure }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not calculate month-end close readiness." }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed());
}

export async function onRequestDelete() {
  return withCors(methodNotAllowed());
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
