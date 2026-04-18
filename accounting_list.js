import { requireStaffAccess, serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const url = new URL(request.url);
    const search = String(url.searchParams.get("q") || "").trim();
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 50)));
    const query = search
      ? `&or=(customer_name.ilike.*${encodeURIComponent(search)}*,customer_email.ilike.*${encodeURIComponent(search)}*,package_code.ilike.*${encodeURIComponent(search)}*)`
      : "";

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/accounting_records?select=*&order=updated_at.desc&limit=${limit}${query}`,
      { headers: serviceHeaders(env) }
    );
    if (!res.ok) return withCors(json({ error: `Could not load accounting records. ${await res.text()}` }, 500));
    const rows = await res.json().catch(() => []);
    const summary = { open: 0, paid: 0, cancelled: 0, total_cad: 0, collected_total_cad: 0, balance_due_cad: 0, tip_cad: 0 };
    for (const row of Array.isArray(rows) ? rows : []) {
      const status = String(row.order_status || "open");
      if (Object.prototype.hasOwnProperty.call(summary, status)) summary[status] += 1;
      summary.total_cad += Number(row.total_cad || 0);
      summary.collected_total_cad += Number(row.collected_total_cad || 0);
      summary.balance_due_cad += Number(row.balance_due_cad || 0);
      summary.tip_cad += Number(row.tip_cad || 0);
    }
    for (const key of ["total_cad","collected_total_cad","balance_due_cad","tip_cad"]) summary[key] = roundMoney(summary[key]);
    return withCors(json({ ok: true, records: rows, summary }));
  } catch (err) {
    return withCors(json({ error: err && err.message ? err.message : "Unexpected server error." }, 500));
  }
}

export async function onRequestPost() { return withCors(methodNotAllowed()); }

function roundMoney(value) {
  const num = Number(value || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
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
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
