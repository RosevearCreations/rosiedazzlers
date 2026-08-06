import { requireStaffAccess, json, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { callInventoryReversalRpc, safeText } from "../_lib/inventory-posting.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const batchId = safeText(body?.batch_id, 80);
    if (!isUuid(batchId)) return withCors(json({ error: "Choose a valid posting batch." }, 400));
    const reason = safeText(body?.reason, 1200);
    if (reason.length < 8) return withCors(json({ error: "Enter a reversal reason with at least 8 characters." }, 400));
    const result = await callInventoryReversalRpc(env, {
      p_batch_id: batchId,
      p_actor_email: safeText(access.actor?.email || body?.actor_email, 240) || null,
      p_reason: reason,
      p_dry_run: body?.dry_run !== false
    });
    if (!result.ok) {
      if (result.migrationRequired) return withCors(json({ error: "Build 240 inventory posting migration is required.", migration_required: true, migration: "sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql", detail: result.error }, 409));
      return withCors(json({ error: result.error || "Could not reverse the inventory posting." }, 409));
    }
    return withCors(json({ ok: true, ...result.data }));
  } catch (err) {
    return withCors(json({ error: safeText(err?.message || err, 800) || "Unexpected inventory reversal error." }, 500));
  }
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
