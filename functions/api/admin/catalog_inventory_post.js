import { requireStaffAccess, json, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { postInventoryUsageCOGS } from "../_lib/accounting-gl.js";
import { callInventoryPostingRpc, markInventoryPostingAccounting, normalizePostingLines, safeText } from "../_lib/inventory-posting.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    const sourceKind = safeText(body?.source_kind, 40);
    const sourceId = safeText(body?.source_reference_id || body?.booking_id || body?.project_id, 80);
    if (!isUuid(sourceId)) return withCors(json({ error: "Choose a valid booking or creative project UUID." }, 400));
    const capability = sourceKind === "booking" ? "work_booking" : "manage_staff";
    const access = await requireStaffAccess({
      request,
      env,
      body: body || {},
      capability,
      bookingId: sourceKind === "booking" ? sourceId : null,
      allowLegacyAdminFallback: false
    });
    if (!access.ok) return withCors(access.response);
    if (!["booking", "creative_project"].includes(sourceKind)) return withCors(json({ error: "source_kind must be booking or creative_project." }, 400));
    const lines = normalizePostingLines(body?.lines);
    if (!lines.length) return withCors(json({ error: "Add at least one valid inventory line." }, 400));
    const reason = safeText(body?.reason, 1200);
    if (reason.length < 8) return withCors(json({ error: "Enter a reason with at least 8 characters." }, 400));
    const dryRun = body?.dry_run !== false;
    const idempotencyKey = safeText(body?.idempotency_key, 180) || crypto.randomUUID();
    const result = await callInventoryPostingRpc(env, {
      p_source_kind: sourceKind,
      p_source_reference_id: sourceId,
      p_lines: lines,
      p_actor_email: safeText(access.actor?.email || body?.actor_email, 240) || null,
      p_reason: reason,
      p_idempotency_key: idempotencyKey,
      p_dry_run: dryRun
    });
    if (!result.ok) {
      if (result.migrationRequired) return withCors(json({
        error: "Build 240 inventory posting migration is required before this workflow can run.",
        migration_required: true,
        migration: "sql/2026-08-05_build240_transactional_inventory_posting_reversal.sql",
        detail: result.error
      }, 409));
      return withCors(json({ error: result.error || "Could not process inventory posting." }, 409));
    }

    const out = result.data || {};
    let accounting = [];
    if (!dryRun && sourceKind === "booking" && !out.idempotent_replay && out.batch?.id) {
      let successes = 0;
      for (const line of Array.isArray(out.lines) ? out.lines : []) {
        try {
          const posted = await postInventoryUsageCOGS(env, {
            bookingId: sourceId,
            item: {
              item_key: line.item_key,
              name: line.item_name,
              cost_cents: line.unit_cost_cents,
              unit_label: line.unit_label
            },
            qtyUsed: Number(line.quantity || 0),
            actorName: access.actor?.full_name || access.actor?.email || "Staff",
            note: reason
          });
          accounting.push({ item_key: line.item_key, ok: true, entry_id: posted?.entry?.id || null });
          successes += 1;
        } catch (err) {
          accounting.push({ item_key: line.item_key, ok: false, error: safeText(err?.message || err, 500) });
        }
      }
      const status = successes === accounting.length ? "posted" : successes ? "partial" : "failed";
      await markInventoryPostingAccounting(env, out.batch.id, status, accounting.map((row) => `${row.item_key}:${row.ok ? "posted" : row.error}`).join(" | "));
      out.batch.accounting_status = status;
    }
    return withCors(json({ ok: true, idempotency_key: idempotencyKey, accounting, ...out }));
  } catch (err) {
    return withCors(json({ error: safeText(err?.message || err, 800) || "Unexpected inventory posting error." }, 500));
  }
}

function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
