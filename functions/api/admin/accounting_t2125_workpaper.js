import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { buildYearEndReport } from "../_lib/accounting-gl.js";
import { buildT2125WorkpaperFromYearEnd } from "../_lib/t2125-workpaper.js";
import { loadTaxSupport, calculateHomeOfficeWorkpaper } from "../_lib/accounting-tax-support.js";
import { enrichT2125WithTaxSupport } from "../_lib/t2125-tax-support.js";

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
    const [yearEnd, support] = await Promise.all([
      buildYearEndReport(env, { year }),
      loadTaxSupport(env, { year })
    ]);
    if (support.home_office) {
      support.home_office_calculation = calculateHomeOfficeWorkpaper(support.home_office, {
        fallbackNetIncome: Math.max(0, Number(yearEnd?.totals?.net_income_cad || 0))
      });
    }
    const ledgerWorkpaper = buildT2125WorkpaperFromYearEnd(yearEnd, { year });
    const workpaper = enrichT2125WithTaxSupport(ledgerWorkpaper, support);

    return withCors(json({
      ok: true,
      year,
      workpaper,
      tax_support_readiness: support.readiness || [],
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
