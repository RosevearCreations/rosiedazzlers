import { requireStaffAccess, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";
import { postTaxRemittance, roundMoney } from "../_lib/accounting-gl.js";

export async function onRequestOptions() { return new Response('', { status: 204, headers: corsHeaders() }); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, capability: 'manage_staff', allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const paymentDate = cleanText(body.payment_date) || new Date().toISOString().slice(0, 10);
    const refMonth = Math.max(1, Math.min(12, Number(body.month || paymentDate.slice(5, 7))));
    const refYear = Math.max(2020, Math.min(2100, Number(body.year || paymentDate.slice(0, 4))));
    const saved = await postTaxRemittance(env, {
      amount_cad: body.amount_cad == null || body.amount_cad === '' ? null : roundMoney(body.amount_cad),
      payment_account: cleanText(body.payment_account) || 'cash',
      payment_date: paymentDate,
      memo: cleanText(body.memo) || null,
      actorName: access.actor?.full_name || access.actor?.email || null,
      referenceLabel: `${refYear}-${String(refMonth).padStart(2, '0')}`
    });
    return withCors(json({ ok: true, saved: saved.entry, lines: saved.lines }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-admin-password, x-staff-email, x-staff-user-id', 'Cache-Control': 'no-store' }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
