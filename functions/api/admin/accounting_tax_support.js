import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { buildYearEndReport } from "../_lib/accounting-gl.js";
import {
  loadTaxSupport,
  saveTaxSupportOperation,
  calculateHomeOfficeWorkpaper
} from "../_lib/accounting-tax-support.js";

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
    const [support, yearEnd] = await Promise.all([
      loadTaxSupport(env, { year }),
      buildYearEndReport(env, { year })
    ]);
    if (support.home_office) {
      support.home_office_calculation = calculateHomeOfficeWorkpaper(support.home_office, {
        fallbackNetIncome: Math.max(0, Number(yearEnd?.totals?.net_income_cad || 0))
      });
    }

    return withCors(json({
      ok: true,
      year,
      support,
      ledger_context: {
        revenue_cad: Number(yearEnd?.totals?.revenue_cad || 0),
        expense_cad: Number(yearEnd?.totals?.expense_cad || 0),
        net_income_cad: Number(yearEnd?.totals?.net_income_cad || 0),
        owner_draw_cad: Number(yearEnd?.totals?.owner_draw_cad || 0)
      }
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: null, allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const actionAccess = requireActionAccess(access.actor, "finance.tax.manage");
    if (!actionAccess.ok) return withCors(actionAccess.response);

    validateOptionalReferences(body);
    const year = cleanYear(
      body?.tax_year || body?.year || body?.home_office?.tax_year || body?.vehicle_year?.tax_year || body?.tax_year_support?.tax_year
    );
    let fallbackNetIncome = null;
    if (String(body.operation || "") === "save_home_office") {
      const yearEnd = await buildYearEndReport(env, { year });
      fallbackNetIncome = Math.max(0, Number(yearEnd?.totals?.net_income_cad || 0));
    }

    const result = await saveTaxSupportOperation(env, body, access.actor, { fallbackNetIncome });
    const support = await loadTaxSupport(env, { year });
    if (support.home_office) {
      support.home_office_calculation = calculateHomeOfficeWorkpaper(support.home_office, { fallbackNetIncome });
    }

    return withCors(json({ ok: true, year, result, support }));
  } catch (err) {
    const status = /required|cannot exceed|unsupported|invalid/i.test(String(err?.message || "")) ? 400 : 500;
    return withCors(json({ error: err?.message || "Unexpected server error." }, status));
  }
}

export async function onRequestDelete() {
  return withCors(methodNotAllowed());
}

function validateOptionalReferences(body = {}) {
  const operation = String(body.operation || "");
  const values = [];
  if (operation === "save_mileage") {
    values.push([body?.mileage?.booking_id, "booking_id"], [body?.mileage?.document_id, "document_id"]);
  }
  if (operation === "save_capital_asset") {
    values.push([body?.asset?.inventory_item_id, "inventory_item_id"], [body?.asset?.document_id, "document_id"]);
  }
  for (const [value, label] of values) {
    const s = String(value || "").trim();
    if (s && !isUuid(s)) throw new Error(`Invalid ${label}.`);
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "").trim());
}

function cleanYear(value) {
  const current = new Date().getFullYear();
  const n = Number(value || current);
  return Math.max(2020, Math.min(2100, Number.isFinite(n) ? Math.trunc(n) : current));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
