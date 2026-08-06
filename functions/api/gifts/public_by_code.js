import { serviceHeaders, json, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const code = String(url.searchParams.get("code") || "").trim();
    if (!code) return withCors(json({ error: "Gift code is required." }, 400));

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=code,type,currency,package_code,vehicle_size,face_value_cents,remaining_cents,expires_at,recipient_name,recipient_email,purchase_context,status&code=eq.${encodeURIComponent(code)}&limit=1`, {
      headers: serviceHeaders(env)
    });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const gift = Array.isArray(rows) ? rows[0] || null : null;
    if (!gift) return withCors(json({ error: "Gift certificate not found." }, 404));

    return withCors(json({
      ok: true,
      gift: {
        code: gift.code,
        type: gift.type,
        currency: gift.currency || 'CAD',
        package_code: gift.package_code || null,
        vehicle_size: gift.vehicle_size || null,
        face_value_cents: Number(gift.face_value_cents || 0),
        remaining_cents: Number(gift.remaining_cents || 0),
        expires_at: gift.expires_at || null,
        recipient_name: gift.recipient_name || gift.recipient_email || null,
        sender_name: gift.purchase_context?.gift_delivery?.sender_name || null,
        delivery_date: gift.purchase_context?.gift_delivery?.delivery_date || null,
        gift_message: gift.purchase_context?.gift_delivery?.gift_message || null,
        delivery_status: gift.purchase_context?.gift_delivery?.delivery_status || null,
        status: gift.status || null
      }
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not load gift certificate." }, 500));
  }
}

export async function onRequestOptions() { return new Response('', { status: 204, headers: corsHeaders() }); }
export async function onRequestPost() { return withCors(methodNotAllowed(['GET','OPTIONS'])); }

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };
}
function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
