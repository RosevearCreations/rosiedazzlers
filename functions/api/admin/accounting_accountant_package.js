import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import {
  buildYearEndReport,
  buildBalanceSheetReport,
  buildInventoryCostCompletenessReport
} from "../_lib/accounting-gl.js";
import { buildT2125WorkpaperFromYearEnd } from "../_lib/t2125-workpaper.js";
import { loadTaxSupport, calculateHomeOfficeWorkpaper } from "../_lib/accounting-tax-support.js";
import { enrichT2125WithTaxSupport } from "../_lib/t2125-tax-support.js";
import { buildAccountantExportPackage } from "../_lib/accounting-accountant-export.js";

const CLOSE_REVIEW_FIELDS = [
  "remittance_reviewed",
  "payables_reviewed",
  "receivables_reviewed",
  "statements_exported",
  "inventory_costs_reviewed",
  "profitability_reviewed"
];

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
    const [yearEnd, support, balanceSheet, inventoryCoverage, closeChecklist] = await Promise.all([
      buildYearEndReport(env, { year }),
      loadTaxSupport(env, { year }),
      buildBalanceSheetReport(env, { month: 12, year }),
      buildInventoryCostCompletenessReport(env),
      loadYearEndCloseChecklist(env, year)
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
    const closeReview = buildYearEndCloseEvidence(year, closeChecklist);

    const readiness = {
      status: unresolvedTax === 0 && Math.abs(balanceDelta) < 0.01 && inventoryMissing === 0 && supportReady === supportTotal && closeReview.checklist_complete
        ? "accountant_ready_candidate"
        : "review_required",
      structured_support_ready: supportReady,
      structured_support_total: supportTotal,
      unresolved_t2125_cad: unresolvedTax,
      balance_sheet_delta_cad: balanceDelta,
      inventory_items_missing_cost_on_hand: inventoryMissing,
      year_end_close: closeReview,
      manual_review_required: true
    };

    const exported = buildAccountantExportPackage({
      year,
      generatedAt: new Date().toISOString(),
      readiness,
      businessTaxProfile: support.profile || null,
      yearEndReport: yearEnd,
      balanceSheet,
      t2125Workpaper: t2125,
      support,
      inventoryCostCompleteness: inventoryCoverage
    });

    return withCors(json({
      ok: true,
      year,
      export_format: exported.package.format,
      download_filename: exported.download_filename,
      accountant_package: exported.package
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestPost() {
  return withCors(methodNotAllowed());
}

async function loadYearEndCloseChecklist(env, year) {
  const monthStart = `${year}-12-01`;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_month_end_checklists?select=*&month_start=eq.${encodeURIComponent(monthStart)}&limit=1`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`Could not load year-end close checklist. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function buildYearEndCloseEvidence(year, row) {
  const checklist = { month_start: row?.month_start || `${year}-12-01` };
  for (const field of CLOSE_REVIEW_FIELDS) checklist[field] = row?.[field] === true;
  const missing = CLOSE_REVIEW_FIELDS.filter((field) => !checklist[field]);
  return {
    month_start: checklist.month_start,
    checklist,
    checklist_complete: missing.length === 0,
    missing_reviews: missing,
    payment_reconciliation_authority: `/api/admin/accounting_month_end_closure?month=12&year=${year}`,
    payment_reconciliation_snapshot_included: false,
    snapshot_exclusion_reason: "Avoids duplicating the year-end report's database reads; use the dedicated close authority for live payment/bank/provider evidence.",
    manual_approval_required: true
  };
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
