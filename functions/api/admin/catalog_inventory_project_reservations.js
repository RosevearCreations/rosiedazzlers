import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
import { serviceHeaders, safeText } from "../_lib/inventory-posting.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_staff", allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);
    const projectId = safeText(new URL(request.url).searchParams.get("project_id"), 80);
    if (!isUuid(projectId)) return withCors(json({ error: "Choose a valid creative project UUID." }, 400));
    const reservationRes = await fetch(`${env.SUPABASE_URL}/rest/v1/creative_project_inventory_reservations?select=*&project_id=eq.${encodeURIComponent(projectId)}&status=in.(reserved,reviewed,posted)&order=created_at.asc`, { headers: serviceHeaders(env) });
    if (!reservationRes.ok) return withCors(json({ error: (await reservationRes.text()).slice(0, 900) }, 500));
    const reservations = await reservationRes.json().catch(() => []);
    const ids = [...new Set((Array.isArray(reservations) ? reservations : []).map((row) => row.inventory_item_id).filter(Boolean))];
    let items = [];
    if (ids.length) {
      const itemRes = await fetch(`${env.SUPABASE_URL}/rest/v1/catalog_inventory_items?select=id,item_key,name,qty_on_hand,unit_label,cost_cents,is_active&id=in.(${ids.join(",")})`, { headers: serviceHeaders(env) });
      if (itemRes.ok) items = await itemRes.json().catch(() => []);
    }
    const byId = new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
    const rows = (Array.isArray(reservations) ? reservations : []).map((reservation) => {
      const item = byId.get(reservation.inventory_item_id) || {};
      const available = Number(item.qty_on_hand || 0);
      const requested = Number(reservation.quantity || 0);
      return { ...reservation, item_key: item.item_key || null, item_name: item.name || "Inventory item unavailable", qty_on_hand: available, item_unit_label: item.unit_label || reservation.unit || null, cost_cents: item.cost_cents || null, item_active: item.is_active !== false, shortage_quantity: Math.max(0, requested - available), can_post: reservation.status !== "posted" && reservation.inventory_mutated !== true && item.is_active !== false && available >= requested };
    });
    return withCors(json({ ok: true, project_id: projectId, reservations: rows, conflicts: rows.filter((row) => !row.can_post && row.status !== "posted") }));
  } catch (err) {
    return withCors(json({ error: safeText(err?.message || err, 800) }, 500));
  }
}
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
