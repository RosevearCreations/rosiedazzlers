import { requireStaffAccess, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    const access = await requireStaffAccess({ request, env, body: body || {}, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const keys = Array.isArray(body?.item_keys) ? body.item_keys.map((v) => String(v || "").trim()).filter(Boolean) : [];
    if (!keys.length) return withCors(json({ error: "item_keys is required." }, 400));

    const patch = { updated_at: new Date().toISOString() };
    if (typeof body?.is_public === "boolean") patch.is_public = body.is_public;
    if (typeof body?.is_active === "boolean") patch.is_active = body.is_active;
    if (Object.keys(patch).length <= 1) return withCors(json({ error: "No supported fields supplied." }, 400));

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation"
    };

    let updated = 0;
    const failures = [];
    for (const key of keys) {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?item_key=eq.${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patch)
      });
      if (!res.ok) failures.push({ item_key: key, error: await res.text() });
      else updated += (await res.json().catch(() => [])).length || 0;
    }

    return withCors(json({ ok: failures.length === 0, updated, failures }));
  } catch (err) {
    return withCors(json({ error: String(err) }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
