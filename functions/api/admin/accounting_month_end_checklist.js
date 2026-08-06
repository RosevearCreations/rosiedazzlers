import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response('', { status: 204, headers: corsHeaders() });
}

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: 'manage_staff', allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const url = new URL(request.url);
    const { month, year, monthStart } = readPeriod(url);
    const row = await loadChecklist(env, monthStart);

    return withCors(json({ ok: true, month, year, month_start: monthStart, checklist: normalizeRow(row) }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: 'manage_staff', allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const { month, year, monthStart } = readPeriodFromBody(body);
    const payload = {
      month_start: monthStart,
      remittance_reviewed: toBool(body.remittance_reviewed),
      payables_reviewed: toBool(body.payables_reviewed),
      receivables_reviewed: toBool(body.receivables_reviewed),
      statements_exported: toBool(body.statements_exported),
      inventory_costs_reviewed: toBool(body.inventory_costs_reviewed),
      profitability_reviewed: toBool(body.profitability_reviewed),
      notes: cleanText(body.notes) || null,
      updated_at: new Date().toISOString(),
      updated_by_name: access.actor?.full_name || access.actor?.email || 'Staff',
      updated_by_staff_user_id: access.actor?.id || null
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_month_end_checklists?on_conflict=month_start`, {
      method: 'POST',
      headers: { ...serviceHeaders(env), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([payload])
    });
    if (!res.ok) return withCors(json({ error: `Could not save checklist. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(json({ ok: true, month, year, month_start: monthStart, checklist: normalizeRow(row) }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

function readPeriod(url) {
  const now = new Date();
  const month = clampMonth(Number(url.searchParams.get('month') || (now.getMonth() + 1)));
  const year = clampYear(Number(url.searchParams.get('year') || now.getFullYear()));
  return { month, year, monthStart: `${year}-${String(month).padStart(2, '0')}-01` };
}

function readPeriodFromBody(body) {
  const now = new Date();
  const month = clampMonth(Number(body.month || (now.getMonth() + 1)));
  const year = clampYear(Number(body.year || now.getFullYear()));
  return { month, year, monthStart: `${year}-${String(month).padStart(2, '0')}-01` };
}

function clampMonth(value) { return Math.max(1, Math.min(12, Number(value || 1))); }
function clampYear(value) { return Math.max(2020, Math.min(2100, Number(value || new Date().getFullYear()))); }
function toBool(value) { return value === true || value === 'true' || value === 1 || value === '1'; }
function cleanText(value) { return String(value || '').trim(); }

async function loadChecklist(env, monthStart) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_month_end_checklists?select=*&month_start=eq.${encodeURIComponent(monthStart)}&limit=1`, {
    headers: serviceHeaders(env)
  });
  if (!res.ok) throw new Error(`Could not load checklist. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

function normalizeRow(row) {
  return {
    month_start: row?.month_start || null,
    remittance_reviewed: row?.remittance_reviewed === true,
    payables_reviewed: row?.payables_reviewed === true,
    receivables_reviewed: row?.receivables_reviewed === true,
    statements_exported: row?.statements_exported === true,
    inventory_costs_reviewed: row?.inventory_costs_reviewed === true,
    profitability_reviewed: row?.profitability_reviewed === true,
    notes: row?.notes || '',
    updated_at: row?.updated_at || null,
    updated_by_name: row?.updated_by_name || null,
    updated_by_staff_user_id: row?.updated_by_staff_user_id || null
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id',
    'Cache-Control': 'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
