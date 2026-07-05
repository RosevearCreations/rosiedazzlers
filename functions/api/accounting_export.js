import { requireStaffAccess, methodNotAllowed } from "../_lib/staff-auth.js";
import {
  buildGeneralLedgerExport,
  buildProfitAndLossExport,
  buildBalanceSheetExport,
  buildCashFlowExport,
  buildPayablesExport,
  buildInventoryCostExport,
  buildReceivablesAgingExport,
  buildOperationalProfitabilityExport,
  buildYearEndPackageExport
} from "../_lib/accounting-gl.js";

export async function onRequestOptions() { return new Response('', { status: 204, headers: corsHeaders() }); }
export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: 'manage_staff', allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const url = new URL(request.url);
    const now = new Date();
    const month = Math.max(1, Math.min(12, Number(url.searchParams.get('month') || (now.getMonth() + 1))));
    const year = Math.max(2020, Math.min(2100, Number(url.searchParams.get('year') || now.getFullYear())));
    const type = String(url.searchParams.get('type') || 'general_ledger').trim().toLowerCase();
    const status = String(url.searchParams.get('status') || 'all').trim().toLowerCase();

    let csv = '';
    let filename = `rosie-general-ledger-${year}-${String(month).padStart(2, '0')}.csv`;

    if (type === 'profit_and_loss' || type === 'pnl') {
      csv = await buildProfitAndLossExport(env, { month, year });
      filename = `rosie-profit-and-loss-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'balance_sheet') {
      csv = await buildBalanceSheetExport(env, { month, year });
      filename = `rosie-balance-sheet-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'cash_flow') {
      csv = await buildCashFlowExport(env, { month, year });
      filename = `rosie-cash-flow-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'payables') {
      csv = await buildPayablesExport(env, { status });
      filename = `rosie-payables-${status || 'all'}-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'inventory_missing_costs' || type === 'inventory_costs') {
      csv = await buildInventoryCostExport(env);
      filename = `rosie-inventory-missing-costs-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'receivables_aging' || type === 'accounts_receivable') {
      csv = await buildReceivablesAgingExport(env, { month, year });
      filename = `rosie-receivables-aging-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'operational_profitability' || type === 'profitability') {
      csv = await buildOperationalProfitabilityExport(env, { month, year });
      filename = `rosie-operational-profitability-${year}-${String(month).padStart(2, '0')}.csv`;
    } else if (type === 'year_end_package' || type === 'year_end') {
      csv = await buildYearEndPackageExport(env, { year });
      filename = `rosie-year-end-package-${year}.csv`;
    } else {
      csv = await buildGeneralLedgerExport(env, { month, year });
    }

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected server error.' }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
export async function onRequestPost() { return withCors(methodNotAllowed()); }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id', 'Cache-Control': 'no-store' }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
