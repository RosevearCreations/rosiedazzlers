import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { buildYearEndReport } from "../_lib/accounting-gl.js";
import { buildT2125WorkpaperFromYearEnd } from "../_lib/t2125-workpaper.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({
      request,
      env,
      capability: null,
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return withCors(access.response);

    const actionAccess = requireActionAccess(access.actor, "finance.view");
    if (!actionAccess.ok) return withCors(actionAccess.response);

    const url = new URL(request.url);
    const now = new Date();
    const year = Math.max(2020, Math.min(2100, Number(url.searchParams.get("year") || now.getFullYear())));
    const yearEnd = await buildYearEndReport(env, { year });
    const workpaper = buildT2125WorkpaperFromYearEnd(yearEnd, { year });

    return withCors(json({
      ok: true,
      year,
      workpaper,
      year_end_totals: yearEnd?.totals || {},
      generated_at: new Date().toISOString()
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestPost() {
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
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
