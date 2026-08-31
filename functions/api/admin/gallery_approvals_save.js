// Build 283 — Gallery approval writes are fail-closed and publication is explicit.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { loadEditableSetting, saveEditableSetting } from "../_lib/editable-settings.js";
import { galleryPublishEligibility, normalizePublicationStatus } from "../_lib/gallery-publication.js";
import galleryFallback from "../../../data/before_after_gallery.json";

const PATCH_FIELDS = [
  "title", "service", "town", "location", "before_url", "after_url", "note",
  "customer_name", "vehicle_label", "condition_summary", "problem", "process", "result",
  "consent_status", "media_privacy_status", "proof_kind", "source_booking_id", "source_job_media_id",
];
const PUBLICATION_SENSITIVE_FIELDS = new Set(PATCH_FIELDS.filter((key) => key !== "note"));

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
    const now = new Date().toISOString();
    const actorName = access.actor?.full_name || access.actor?.email || "Staff";

    if (action === "add") {
      const item = normalizePatch(body.item || body.patch || {});
      if (!item.title || !item.before_url || !item.after_url) {
        return withCors(json({ ok: false, error: "New Gallery rows need a title, before image URL, and after image URL." }, 400));
      }
      gallery.items.unshift({
        ...item,
        consent_status: item.consent_status || "pending_review",
        media_privacy_status: item.media_privacy_status || "pending_review",
        publication_status: "draft",
        proof_kind: item.proof_kind || "customer_work",
        created_at: now,
      });
    } else {
      const index = Number(body.index);
      if (!Number.isInteger(index) || index < 0 || index >= gallery.items.length) {
        return withCors(json({ ok: false, error: "Missing or invalid Gallery row index." }, 400));
      }

      const existing = gallery.items[index] && typeof gallery.items[index] === "object" ? gallery.items[index] : {};
      if (action === "approve") {
        // This action confirms that staff has actually reviewed public-use consent/privacy.
        // It intentionally does NOT publish the row.
        gallery.items[index] = {
          ...existing,
          consent_status: "customer_approved_public",
          media_privacy_status: "approved_public",
          privacy_reviewed_at: now,
          privacy_reviewed_by_staff_user_id: access.actor?.id || null,
          privacy_reviewed_by_staff_name: actorName,
          publication_status: normalizePublicationStatus(existing.publication_status) === "published" ? "published" : "draft",
        };
      } else if (action === "publish") {
        const candidate = { ...existing, publication_status: "draft" };
        const eligibility = galleryPublishEligibility(candidate);
        if (!eligibility.eligible) {
          return withCors(json({ ok: false, error: "Gallery row is not eligible to publish.", blockers: eligibility.blockers }, 409));
        }
        gallery.items[index] = {
          ...existing,
          publication_status: "published",
          published_at: now,
          published_by_staff_user_id: access.actor?.id || null,
          published_by_staff_name: actorName,
        };
      } else if (action === "unpublish") {
        gallery.items[index] = {
          ...existing,
          publication_status: "unpublished",
          published_at: null,
          unpublished_at: now,
          unpublished_by_staff_user_id: access.actor?.id || null,
          unpublished_by_staff_name: actorName,
        };
      } else if (action === "hide") {
        gallery.items[index] = {
          ...existing,
          media_privacy_status: "private",
          consent_status: existing.consent_status || "approved_private",
          privacy_reviewed_at: now,
          publication_status: "unpublished",
          published_at: null,
        };
      } else if (action === "reject") {
        gallery.items[index] = {
          ...existing,
          media_privacy_status: "rejected",
          consent_status: "rejected",
          privacy_reviewed_at: now,
          publication_status: "unpublished",
          published_at: null,
        };
      } else if (action === "delete") {
        gallery.items.splice(index, 1);
      } else {
        const patch = normalizePatch(body.patch || {});
        const touchesPublicationAuthority = Object.keys(patch).some((key) => PUBLICATION_SENSITIVE_FIELDS.has(key));
        gallery.items[index] = {
          ...existing,
          ...patch,
          ...(touchesPublicationAuthority && normalizePublicationStatus(existing.publication_status) === "published"
            ? { publication_status: "draft", published_at: null, publication_review_required_at: now }
            : {}),
        };
      }
    }

    gallery.updated_at = now;
    gallery.source_status = "app_management_settings";
    const saved = await saveEditableSetting(env, "before_after_gallery", gallery, headers);
    return withCors(json({ ok: true, saved, count: gallery.items.length }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not save Gallery approval." }, 500));
  }
}

function normalizePatch(patch) {
  const out = {};
  for (const key of PATCH_FIELDS) {
    if (patch[key] !== undefined) out[key] = clean(patch[key]);
  }
  return out;
}
function clean(v) { return String(v ?? "").trim(); }
function structuredCloneSafe(v) { return JSON.parse(JSON.stringify(v || {})); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
