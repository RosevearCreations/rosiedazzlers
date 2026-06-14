// Build 206 — dedicated Gallery Approvals list with DB-first editable setting and bundled fallback.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";
import galleryFallback from "../../../data/before_after_gallery.json";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    const loaded = await loadEditableSetting(env, "before_after_gallery", { headers: serviceHeaders(env), fallback: galleryFallback });
    const items = normalizeGallery(loaded.value).map((item, index) => ({ ...item, index, approval_status: approvalStatus(item), repair_warnings: repairWarnings(item) }));
    const counts = items.reduce((acc, item) => { acc.total++; acc[item.approval_status] = (acc[item.approval_status] || 0) + 1; if (item.repair_warnings.length) acc.needs_repair++; return acc; }, { total:0, approved:0, pending:0, hidden:0, private:0, rejected:0, needs_repair:0 });
    return withCors(json({ ok:true, source_status: loaded.source_status || "unknown", warning: loaded.warning || "", counts, items, privacy_rule: "Only approved_public/customer_approved_public/sample rows should be published to the public Gallery." }));
  } catch (err) {
    return withCors(json({ ok:false, error: err?.message || "Could not load gallery approvals." }, 500));
  }
}

function normalizeGallery(value) {
  const src = value && typeof value === "object" ? value : galleryFallback;
  const rows = Array.isArray(src.items) ? src.items : [];
  return rows.map((item) => {
    const before = text(item.before_url || item.beforeUrl || item.before_image_url || item.beforeImageUrl || item.before || item.before_image);
    const after = text(item.after_url || item.afterUrl || item.after_image_url || item.afterImageUrl || item.after || item.after_image || item.image_url);
    const consent = normalizeConsent(item.consent_status || item.media_consent_status || item.public_consent_status);
    const privacy = normalizeConsent(item.media_privacy_status || item.privacy_status || item.media_status);
    return { ...item, title: text(item.title || item.name || "Gallery item"), service: text(item.service || item.category || "Mobile detailing"), town: text(item.town || item.city || item.location || "Oxford / Norfolk"), location: text(item.location || item.town || item.city || "Oxford / Norfolk Counties"), before_url: normalizeMediaUrl(before), after_url: normalizeMediaUrl(after), note: text(item.note || item.description || item.caption), consent_status: consent || "pending_review", media_privacy_status: privacy || "pending_review" };
  });
}
function approvalStatus(item) { const consent = normalizeConsent(item.consent_status); const privacy = normalizeConsent(item.media_privacy_status); if (["approved_public","customer_approved_public","public","approved","sample"].includes(consent) || ["approved_public","customer_approved_public","public","approved","sample"].includes(privacy)) return "approved"; if (["rejected"].includes(consent) || ["rejected"].includes(privacy)) return "rejected"; if (["private","approved_private"].includes(consent) || ["private","approved_private"].includes(privacy)) return "private"; if (["hidden"].includes(consent) || ["hidden"].includes(privacy)) return "hidden"; return "pending"; }
function repairWarnings(item) { const warnings=[]; if(!item.before_url) warnings.push("Missing before image URL"); if(!item.after_url) warnings.push("Missing after image URL"); if(!item.title) warnings.push("Missing title"); if(!item.service) warnings.push("Missing service"); if(!item.town) warnings.push("Missing town/location"); if(!normalizeConsent(item.consent_status)) warnings.push("Missing consent status"); return warnings; }
function normalizeConsent(value) { const raw = text(value).toLowerCase().replace(/[\s-]+/g,"_"); const aliases={ customer_public:"customer_approved_public", customer_approved:"customer_approved_public", public_approved:"approved_public", approved_for_public:"approved_public", public_ok:"approved_public", review:"pending_review"}; return aliases[raw] || raw; }
function normalizeMediaUrl(value) { const raw=text(value); if(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i.test(raw)) return raw.replace(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i,"/assets/brand/"); if(/^\/brand\//i.test(raw)) return raw.replace(/^\/brand\//i,"/assets/brand/"); return raw; }
function text(v){ return String(v ?? "").trim(); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control":"no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
