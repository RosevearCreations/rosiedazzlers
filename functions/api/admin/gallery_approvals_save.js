// Build 206 — save Gallery Approval updates to the before_after_gallery editable setting.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { loadEditableSetting, saveEditableSetting } from "../_lib/editable-settings.js";
import galleryFallback from "../../../data/before_after_gallery.json";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  try {
    const access = await requireStaffAccess({ request, env, body, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const loaded = await loadEditableSetting(env, "before_after_gallery", { headers, fallback: galleryFallback });
    const gallery = loaded.value && typeof loaded.value === "object" ? structuredCloneSafe(loaded.value) : structuredCloneSafe(galleryFallback);
    gallery.items = Array.isArray(gallery.items) ? gallery.items : [];
    const action = clean(body.action || "patch");
    if (action === "add") {
      const item = normalizePatch(body.item || body.patch || {});
      if (!item.title || !item.before_url || !item.after_url) return withCors(json({ ok:false, error:"New gallery rows need a title, before image URL, and after image URL." }, 400));
      gallery.items.unshift({ ...item, consent_status: item.consent_status || "pending_review", media_privacy_status: item.media_privacy_status || "pending_review", created_at: new Date().toISOString() });
    } else {
      const index = Number(body.index);
      if (!Number.isInteger(index) || index < 0 || index >= gallery.items.length) return withCors(json({ ok:false, error:"Missing or invalid gallery row index." }, 400));
      const existing = gallery.items[index] && typeof gallery.items[index] === "object" ? gallery.items[index] : {};
      if (action === "approve") gallery.items[index] = { ...existing, consent_status:"customer_approved_public", media_privacy_status:"approved_public", privacy_reviewed_at:new Date().toISOString() };
      else if (action === "hide") gallery.items[index] = { ...existing, media_privacy_status:"private", consent_status: existing.consent_status || "approved_private", privacy_reviewed_at:new Date().toISOString() };
      else if (action === "reject") gallery.items[index] = { ...existing, media_privacy_status:"rejected", consent_status:"rejected", privacy_reviewed_at:new Date().toISOString() };
      else if (action === "delete") gallery.items.splice(index, 1);
      else gallery.items[index] = { ...existing, ...normalizePatch(body.patch || {}) };
    }
    gallery.updated_at = new Date().toISOString();
    gallery.source_status = "app_management_settings";
    const saved = await saveEditableSetting(env, "before_after_gallery", gallery, headers);
    return withCors(json({ ok:true, saved, count: gallery.items.length }));
  } catch (err) {
    return withCors(json({ ok:false, error: err?.message || "Could not save gallery approval." }, 500));
  }
}
function normalizePatch(patch) { const out = {}; for (const key of ["title","service","town","location","before_url","after_url","note","customer_name","vehicle_label","consent_status","media_privacy_status"]) { if (patch[key] !== undefined) out[key] = clean(patch[key]); } return out; }
function clean(v) { return String(v ?? "").trim(); }
function structuredCloneSafe(v){ return JSON.parse(JSON.stringify(v || {})); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
