// Build 283 — Gallery review list separates consent/privacy approval from publication.
import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { loadEditableSetting } from "../_lib/editable-settings.js";
import {
  cleanText,
  galleryApprovalStatus,
  galleryProofEligibility,
  galleryPublishEligibility,
  normalizeConsent,
  normalizePublicationStatus,
} from "../_lib/gallery-publication.js";
import galleryFallback from "../../../data/before_after_gallery.json";

export async function onRequestGet({ request, env }) {
  try {
    const access = await requireStaffAccess({ request, env, capability: "manage_promos", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const loaded = await loadEditableSetting(env, "before_after_gallery", { headers: serviceHeaders(env), fallback: galleryFallback });
    const items = normalizeGallery(loaded.value).map((item, index) => {
      const publish = galleryPublishEligibility(item);
      const proof = galleryProofEligibility(item);
      return {
        ...item,
        index,
        approval_status: galleryApprovalStatus(item),
        publication_status: normalizePublicationStatus(item.publication_status),
        publish_eligible: publish.eligible,
        publish_blockers: publish.blockers,
        proof_eligible: proof.eligible,
        proof_blockers: proof.blockers,
        repair_warnings: repairWarnings(item),
      };
    });

    const counts = items.reduce((acc, item) => {
      acc.total++;
      acc[item.approval_status] = (acc[item.approval_status] || 0) + 1;
      if (item.publication_status === "published") acc.published++;
      else acc.unpublished++;
      if (item.publish_eligible) acc.publish_eligible++;
      if (item.proof_eligible) acc.proof_ready++;
      if (item.repair_warnings.length) acc.needs_repair++;
      return acc;
    }, {
      total: 0, approved: 0, pending: 0, hidden: 0, private: 0, rejected: 0, sample: 0,
      published: 0, unpublished: 0, publish_eligible: 0, proof_ready: 0, needs_repair: 0,
    });

    return withCors(json({
      ok: true,
      source_status: loaded.source_status || "unknown",
      warning: loaded.warning || "",
      counts,
      items,
      privacy_rule: "Consent/privacy review and publication are separate. A row is public only after both public-use approvals pass and staff explicitly publishes it.",
      proof_rule: "Real proof requires a published, non-sample pair plus vehicle, condition, problem, process, and result context.",
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load Gallery approvals." }, 500));
  }
}

function normalizeGallery(value) {
  const src = value && typeof value === "object" ? value : galleryFallback;
  const rows = Array.isArray(src.items) ? src.items : [];
  return rows.map((item) => {
    const before = cleanText(item.before_url || item.beforeUrl || item.before_image_url || item.beforeImageUrl || item.before || item.before_image);
    const after = cleanText(item.after_url || item.afterUrl || item.after_image_url || item.afterImageUrl || item.after || item.after_image || item.image_url);
    const consent = normalizeConsent(item.consent_status || item.media_consent_status || item.public_consent_status);
    const privacy = normalizeConsent(item.media_privacy_status || item.privacy_status || item.media_status);
    return {
      ...item,
      title: cleanText(item.title || item.name || "Gallery item"),
      service: cleanText(item.service || item.category || "Mobile detailing"),
      town: cleanText(item.town || item.city || item.location || "Oxford / Norfolk"),
      location: cleanText(item.location || item.town || item.city || "Oxford / Norfolk Counties"),
      before_url: normalizeMediaUrl(before),
      after_url: normalizeMediaUrl(after),
      note: cleanText(item.note || item.description || item.caption),
      consent_status: consent || "pending_review",
      media_privacy_status: privacy || "pending_review",
      publication_status: normalizePublicationStatus(item.publication_status),
      proof_kind: cleanText(item.proof_kind || (consent === "sample" ? "sample" : "customer_work")),
      vehicle_label: cleanText(item.vehicle_label || ""),
      condition_summary: cleanText(item.condition_summary || item.condition || ""),
      problem: cleanText(item.problem || ""),
      process: cleanText(item.process || ""),
      result: cleanText(item.result || ""),
      source_booking_id: cleanText(item.source_booking_id || ""),
      source_job_media_id: cleanText(item.source_job_media_id || ""),
    };
  });
}

function repairWarnings(item) {
  const warnings = [];
  if (!item.before_url) warnings.push("Missing before image URL");
  if (!item.after_url) warnings.push("Missing after image URL");
  if (!item.title) warnings.push("Missing title");
  if (!item.service) warnings.push("Missing service");
  if (!item.town) warnings.push("Missing town/location");
  if (!normalizeConsent(item.consent_status)) warnings.push("Missing consent status");
  if (!normalizeConsent(item.media_privacy_status)) warnings.push("Missing media privacy status");
  return warnings;
}

function normalizeMediaUrl(value) {
  const raw = cleanText(value);
  if (/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i.test(raw)) return raw.replace(/^https?:\/\/assets\.rosiedazzlers\.ca\/brand\//i, "/assets/brand/");
  if (/^\/brand\//i.test(raw)) return raw.replace(/^\/brand\//i, "/assets/brand/");
  return raw;
}
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,x-admin-password,x-staff-user-id,x-staff-email", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
