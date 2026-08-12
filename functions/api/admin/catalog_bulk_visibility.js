import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet() { return withCors(methodNotAllowed()); }

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const keys = Array.isArray(body?.item_keys) ? [...new Set(body.item_keys.map((v) => String(v || "").trim()).filter(Boolean))] : [];
    if (!keys.length) return withCors(json({ error: "item_keys is required." }, 400));
    if (keys.length > 500) return withCors(json({ error: "A maximum of 500 rows can be changed at once." }, 400));
    const actor = String(access.actor?.email || "").trim() || null;
    const reason = String(body?.reason || defaultReason(body)).trim();

    if (body?.is_public === true) {
      const result = await callRpc(env, "admin_catalog_inventory_publish_review", {
        p_item_keys: keys,
        p_actor_email: actor,
        p_reason: reason,
        p_dry_run: body?.dry_run !== false
      });
      if (!result.ok) return withCors(migrationOrError(result, "sql/2026-08-07_build246_catalog_publish_readiness.sql"));
      return withCors(json({ ok: result.data?.ok !== false, mode: "publish_readiness", ...result.data }));
    }

    const supported = {};
    if (typeof body?.is_public === "boolean") supported.is_public = body.is_public;
    if (typeof body?.is_active === "boolean") supported.is_active = body.is_active;
    if (!Object.keys(supported).length) return withCors(json({ error: "No supported fields supplied." }, 400));
    const changes = keys.map((item_key) => ({ item_key, changes: supported }));
    const operation = supported.is_active === false ? "archive" : supported.is_active === true ? "restore" : "bulk_update";
    const result = await callRpc(env, "admin_catalog_inventory_bulk_update", {
      p_changes: changes,
      p_actor_email: actor,
      p_reason: reason,
      p_operation_type: operation,
      p_dry_run: body?.dry_run === true
    });
    if (!result.ok) return withCors(migrationOrError(result, "sql/2026-07-30_build238_inventory_transactions_merge_seo_preflight.sql"));
    return withCors(json({ ok: true, mode: "transactional_bulk", updated: Number(result.data?.updated_count || result.data?.row_count || keys.length), ...result.data }));
  } catch (err) {
    return withCors(json({ error: String(err?.message || err) }, 500));
  }
}
function defaultReason(body){
  if(body?.is_public===false) return "Hide selected inventory from public catalog";
  if(body?.is_active===false) return "Deactivate selected inventory records";
  if(body?.is_active===true) return "Reactivate selected inventory records";
  return "Update selected inventory visibility";
}
async function callRpc(env,name,payload){
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY) return {ok:false,error:"Supabase service configuration is unavailable."};
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:serviceHeaders(env),body:JSON.stringify(payload)});
  const text=await res.text();
  if(!res.ok) return {ok:false,error:text.slice(0,1000),migrationRequired:/PGRST202|Could not find the function|schema cache|does not exist/i.test(text)};
  return {ok:true,data:text?JSON.parse(text):{}};
}
function migrationOrError(result,migration){
  return json({error:result.migrationRequired?`Required database migration has not been applied: ${migration}`:result.error,migration_required:!!result.migrationRequired,migration:result.migrationRequired?migration:undefined},result.migrationRequired?409:500);
}
function serviceHeaders(env){return {apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,"Content-Type":"application/json",Accept:"application/json"};}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
