// Build 306 — read-only I.T. System Health family endpoint.
import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { normalizeHealthFamily, observeSystemHealthFamilies } from "../_lib/system-health-families.js";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: null, allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const action = requireActionAccess(access.actor, "it.runtime.view");
    if (!action.ok) return withCors(action.response);

    const url = new URL(request.url);
    const rawFamily = String(url.searchParams.get("family") || "").trim();
    const family = rawFamily ? normalizeHealthFamily(rawFamily) : null;
    if (rawFamily && !family) return withCors(json({ ok: false, error: "Unsupported health family." }, 400));

    const report = await observeSystemHealthFamilies({ request, env, actor: access.actor, family });
    return withCors(json({ ok: true, ...report }));
  } catch (error) {
    return withCors(json({ ok: false, error: error?.message || "Could not observe I.T. System Health families." }, 500));
  }
}

export async function onRequestPost() { return withCors(methodNotAllowed()); }
export async function onRequestDelete() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

function corsHeaders() {
  return {
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-email,x-staff-user-id",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
