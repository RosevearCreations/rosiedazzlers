import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import {
  buildYearEndReport,
  buildBalanceSheetReport,
  buildInventoryCostCompletenessReport
} from "../_lib/accounting-gl.js";
import { buildT2125WorkpaperFromYearEnd } from "../_lib/t2125-workpaper.js";
import { loadTaxSupport, calculateHomeOfficeWorkpaper } from "../_lib/accounting-tax-support.js";
import { enrichT2125WithTaxSupport } from "../_lib/t2125-tax-support.js";

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
    const year = cleanYear(url.searchParams.get("year"));
    const [yearEnd, support, balanceSheet, inventoryCoverage] = await Promise.all([
      buildYearEndReport(env, { year }),
      loadTaxSupport(env, { year }),
      buildBalanceSheetReport(env, { month: 12, year }),
      buildInventoryCostCompletenessReport(env)
    ]);

    if (support.home_office) {
      support.home_office_calculation = calculateHomeOfficeWorkpaper(support.home_office, {
        fallbackNetIncome: Math.max(0, Number(yearEnd?.totals?.net_income_cad || 0))
      });
    }
    const t2125 = enrichT2125WithTaxSupport(
      buildT2125WorkpaperFromYearEnd(yearEnd, { year }),
      support
    );

    const supportReady = Array.isArray(support.readiness) ? support.readiness.filter((row) => row.ready).length : 0;
    const supportTotal = Array.isArray(support.readiness) ? support.readiness.length : 0;
    const unresolvedTax = Number(t2125?.summary?.unresolved_expense_cad || 0);
    const balanceDelta = Number(balanceSheet?.totals?.balance_delta_cad || 0);
    const inventoryMissing = Number(inventoryCoverage?.totals?.missing_cost_on_hand_items || 0);

    const readiness = {
      status: unresolvedTax === 0 && Math.abs(balanceDelta) < 0.01 && inventoryMissing === 0 && supportReady === supportTotal
        ? "accountant_ready_candidate"
        : "review_required",
      structured_support_ready: supportReady,
      structured_support_total: supportTotal,
      unresolved_t2125_cad: unresolvedTax,
      balance_sheet_delta_cad: balanceDelta,
      inventory_items_missing_cost_on_hand: inventoryMissing,
      manual_review_required: true
    };

    const accountantPackage = {
      schema_version: 1,
      package_type: "Rosie Dazzlers accountant year-end package",
      tax_year: year,
      generated_at: new Date().toISOString(),
      generated_by: access.actor?.full_name || access.actor?.email || "Finance user",
      disclaimer: "Accounting workpaper package only. Review filing eligibility, elections, CCA classes/rates, GST/HST treatment and source evidence before filing.",
      readiness,
      business_tax_profile: support.profile || null,
      year_end_report: yearEnd,
      balance_sheet: balanceSheet,
      t2125_workpaper: t2125,
      tax_support: {
        readiness: support.readiness || [],
        mileage_summary: support.mileage_summary || null,
        home_office_calculation: support.home_office_calculation || null,
        capital_asset_summary: support.capital_asset_summary || null,
        tax_year_support: support.tax_year_support || null
      },
      inventory_cost_completeness: inventoryCoverage,
      evidence_manifest: support.documents || []
    };

    return withCors(json({ ok: true, year, accountant_package: accountantPackage }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed());
}

function cleanYear(value) {
  const current = new Date().getFullYear();
  const n = Number(value || current);
  return Math.max(2020, Math.min(2100, Number.isFinite(n) ? Math.trunc(n) : current));
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
