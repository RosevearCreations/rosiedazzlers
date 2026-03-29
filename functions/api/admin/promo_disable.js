import { requireStaffAccess, json, serviceHeaders, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "manage_promos",
      allowLegacyAdminFallback: false,
    });
    if (!access.ok) return withCors(access.response);

    const promo_id = String(body.promo_id || "").trim();
    if (!isUuid(promo_id)) return withCors(json({ ok: false, error: "Invalid promo_id" }, 400));

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ ok: false, error: "Server not configured (Supabase env vars missing)" }, 500));
    }

    const getRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promo_codes?select=id,is_active&id=eq.${encodeURIComponent(promo_id)}&limit=1`,
      { method: "GET", headers: { ...serviceHeaders(env), Accept: "application/json" } }
    );
    const getText = await getRes.text();
    const getData = safeJson(getText);
    if (!getRes.ok) return withCors(json({ ok: false, error: "Supabase error (promo read)", details: getData }, 502));

    const row = Array.isArray(getData) ? getData[0] : null;
    if (!row?.id) return withCors(json({ ok: false, error: "Promo not found" }, 404));

    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/promo_codes?id=eq.${encodeURIComponent(promo_id)}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(env), Accept: "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ is_active: !(row.is_active === true), updated_at: new Date().toISOString() }),
    });
    const patchText = await patchRes.text();
    const patchData = safeJson(patchText);
    if (!patchRes.ok) return withCors(json({ ok: false, error: "Supabase error (promo update)", details: patchData }, 502));

    const updated = Array.isArray(patchData) ? patchData[0] : patchData;
    return withCors(json({ ok: true, row: updated, actor: access.actor.full_name || access.actor.email || "Staff" }));
  } catch (e) {
    return withCors(json({ ok: false, error: "Server error", details: String(e) }, 500));
  }
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store",
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
