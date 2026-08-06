// Build 176 — App Management warning source for gallery/media privacy readiness.
import { requireStaffAccess, json, serviceHeaders, methodNotAllowed } from "../_lib/staff-auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: true, table_ready: false, summary: emptySummary(), warnings: ["Supabase env vars are not configured; privacy readiness warnings are using empty fallback data."] }));
    }

    const gallery = await loadSavedGallery(env).catch(() => ({ items: [] }));
    const uploads = await loadPhotoUploads(env).catch(() => []);
    const summary = summarize({ gallery, uploads });
    return withCors(json({ ok: true, table_ready: true, summary, privacy_rule: "Only sample or approved_public/customer_approved_public/public media should be reused in the public gallery or social posts." }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, summary: emptySummary(), warnings: [err?.message || "Media privacy summary unavailable."] }));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadSavedGallery(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/app_management_settings?select=value&key=eq.before_after_gallery&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) return { items: [] };
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] || null : null;
  return row?.value && typeof row.value === "object" ? row.value : { items: [] };
}
async function loadPhotoUploads(env) {
  const select = "id,status,privacy_status,filename,object_path,media_url,lead_id,booking_id,created_at";
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/photo_estimate_uploads?select=${encodeURIComponent(select)}&order=created_at.desc&limit=100`, { headers: serviceHeaders(env) });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}
function summarize({ gallery, uploads }) {
  const items = Array.isArray(gallery?.items) ? gallery.items : [];
  const galleryRows = items.map(normalizeGalleryItem);
  const blockedGallery = galleryRows.filter((item) => !isPublicApproved(item));
  const uploadRows = Array.isArray(uploads) ? uploads : [];
  const uploadWarnings = uploadRows.filter((row) => !isPublicApproved({ consent_status: row.privacy_status, media_privacy_status: row.privacy_status }));
  return {
    gallery_items: galleryRows.length,
    gallery_ready: galleryRows.length - blockedGallery.length,
    gallery_needs_review: blockedGallery.length,
    upload_records_checked: uploadRows.length,
    uploads_not_public_ready: uploadWarnings.length,
    warnings: blockedGallery.slice(0, 10).map((item) => ({ source: "gallery", title: item.title, reason: item.reason, consent_status: item.consent_status, media_privacy_status: item.media_privacy_status })),
    upload_warnings: uploadWarnings.slice(0, 10).map((row) => ({ source: "photo_upload", title: row.filename || row.object_path || row.id, privacy_status: row.privacy_status || "pending_review", status: row.status || "unknown" }))
  };
}
function normalizeGalleryItem(item) {
  const consent = String(item?.consent_status || item?.media_consent_status || "").trim().toLowerCase();
  const privacy = String(item?.media_privacy_status || item?.privacy_status || "").trim().toLowerCase();
  const title = String(item?.title || item?.vehicle_label || "Gallery item").trim();
  let reason = "approved";
  if (!consent && !privacy) reason = "missing consent/privacy status";
  else if (["pending", "pending_review", "approved_private", "private", "needs_blur", "rejected"].includes(consent) || ["pending_review", "approved_private", "private", "needs_blur", "rejected"].includes(privacy)) reason = "not approved for public reuse";
  return { title, consent_status: consent, media_privacy_status: privacy, reason };
}
function isPublicApproved(item) { const consent = String(item.consent_status || "").toLowerCase(); const privacy = String(item.media_privacy_status || "").toLowerCase(); if (consent === "sample") return true; if (["rejected", "private", "approved_private", "pending", "pending_review", "needs_blur"].includes(consent)) return false; if (["rejected", "private", "approved_private", "pending_review", "needs_blur"].includes(privacy)) return false; return ["approved_public", "customer_approved_public", "public", "approved"].includes(consent) || ["approved_public", "customer_approved_public", "public", "approved"].includes(privacy); }
function emptySummary() { return { gallery_items: 0, gallery_ready: 0, gallery_needs_review: 0, upload_records_checked: 0, uploads_not_public_ready: 0, warnings: [], upload_warnings: [] }; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
