// Build 204 — gallery_image_health dashboard diagnostic for before/after gallery image source health.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const url = new URL("/api/before_after_gallery_public", request.url);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out?.ok) throw new Error(out?.error || `Public gallery API returned ${res.status}`);
    const items = Array.isArray(out.items) ? out.items : [];
    const missing = [];
    const external = [];
    const fallbackReady = [];
    for (const item of items) {
      const title = String(item?.title || "Gallery item");
      for (const side of ["before", "after"]) {
        const mediaUrl = String(item?.[`${side}_url`] || "").trim();
        const fallbackUrl = String(item?.[`fallback_${side}_url`] || "").trim();
        if (!mediaUrl) missing.push({ title, side, reason: "missing media URL" });
        else if (/^https?:\/\//i.test(mediaUrl) && !/^https?:\/\/assets\.rosiedazzlers\.ca\//i.test(mediaUrl)) external.push({ title, side, media_url: mediaUrl, reason: "external media source" });
        else if (fallbackUrl) fallbackReady.push({ title, side, media_url: mediaUrl, fallback_url: fallbackUrl });
      }
    }
    return withCors(json({
      ok: true,
      source_status: out.source_status || "unknown",
      fallback_used: !!out.fallback_used,
      items_checked: items.length,
      missing_count: missing.length,
      external_count: external.length,
      fallback_ready_count: fallbackReady.length,
      missing: missing.slice(0, 10),
      external: external.slice(0, 10),
      fallback_ready: fallbackReady.slice(0, 10),
      warning: out.warning || ""
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not check gallery image health." }, 500));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
