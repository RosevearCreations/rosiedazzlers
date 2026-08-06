import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const survivor = String(body?.survivor_item_key || "").trim();
    const duplicate = String(body?.duplicate_item_key || "").trim();
    const reason = String(body?.reason || "").trim();
    const dryRun = body?.dry_run !== false;
    if (!survivor || !duplicate || survivor === duplicate) return withCors(json({ error: "Choose two different rows and identify the survivor." }, 400));
    if (reason.length < 8) return withCors(json({ error: "Enter a merge reason with at least 8 characters." }, 400));
    const result = await callRpc(env, "admin_catalog_inventory_merge", {
      p_survivor_item_key: survivor,
      p_duplicate_item_key: duplicate,
      p_actor_email: String(access.actor?.email || body?.actor_email || "").trim() || null,
      p_reason: reason,
      p_dry_run: dryRun
    });
    if (!result.ok) {
      if (result.migrationRequired) return withCors(json({
        error: "Build 238 inventory merge migration is required before this action can run.",
        migration_required: true,
        migration: "sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql",
        detail: result.error
      }, 409));
      return withCors(json({ error: result.error || "Could not review the inventory merge." }, 500));
    }
    return withCors(json({ ok: true, ...result.data }));
  } catch (err) {
    return withCors(json({ error: safeError(err) }, 500));
  }
}

async function callRpc(env, name, payload) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: "Supabase service configuration is unavailable." };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify(payload) });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: text.slice(0, 1000), migrationRequired: /PGRST202|Could not find the function|schema cache|does not exist/i.test(text) };
  const data = text ? JSON.parse(text) : {};
  return { ok: true, data: data && typeof data === "object" ? data : {} };
}
function serviceHeaders(env) { return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Accept: "application/json" }; }
function safeError(err) { return String(err?.message || err || "Unexpected error").slice(0, 800); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
