import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost() { return withCors(methodNotAllowed()); }

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ error: "Supabase service configuration is unavailable." }, 503));
    }
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);
    const [batches, merges, publishAttempts] = await Promise.all([
      selectRows(env, "catalog_inventory_change_batches", "id,operation_type,reason,row_count,actor_staff_email,created_at", limit),
      selectRows(env, "catalog_inventory_merge_audit", "id,survivor_item_key,duplicate_item_key,reason,reference_counts,actor_staff_email,created_at", limit),
      selectRows(env, "catalog_publish_readiness_audit", "id,action,reason,item_keys,result,blocked_count,published_count,actor_email,created_at", limit)
    ]);
    const failed = [batches, merges].find((result) => !result.ok);
    if (failed) {
      if (failed.migrationRequired) return withCors(json({
        error: "Build 238 inventory audit tables are not available yet.",
        migration_required: true,
        migration: "sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql",
        detail: failed.error
      }, 409));
      return withCors(json({ error: failed.error || "Could not load inventory audit history." }, 500));
    }
    return withCors(json({
      ok: true,
      batches: batches.rows,
      merges: merges.rows,
      publish_attempts: publishAttempts.ok ? publishAttempts.rows : [],
      publish_warning: publishAttempts.ok ? null : "Apply the Build 246 catalog publishing migration to include publish-readiness history.",
      limit
    }));
  } catch (err) {
    return withCors(json({ error: safeError(err) }, 500));
  }
}

async function selectRows(env, table, select, limit) {
  const query = new URLSearchParams({ select, order: "created_at.desc", limit: String(limit) });
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query.toString()}`, { headers: serviceHeaders(env) });
  const text = await response.text();
  if (!response.ok) return {
    ok: false,
    error: text.slice(0, 1000),
    migrationRequired: /PGRST205|relation .* does not exist|schema cache|catalog_inventory_(change_batches|merge_audit)/i.test(text)
  };
  try { return { ok: true, rows: text ? JSON.parse(text) : [] }; }
  catch { return { ok: false, error: `Inventory audit response for ${table} was not valid JSON.` }; }
}
function serviceHeaders(env) { return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: "application/json" }; }
function clampInt(value, min, max, fallback) { const n = Number.parseInt(value, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }
function safeError(err) { return String(err?.message || err || "Unexpected error").slice(0, 800); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
