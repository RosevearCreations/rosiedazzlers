import { cleanText } from "./staff-auth.js";

export const SOCIAL_COMPLIANCE_FIELDS = [
  "review_status",
  "customer_consent_confirmed",
  "plate_privacy_confirmed",
  "no_private_info_confirmed",
  "platform_warnings",
  "approved_at",
  "approved_by_name",
  "compliance_note",
  "caption_template_key",
  "local_hashtag_set",
  "duplicate_signature"
];

export function buildSocialComplianceDraft({ platform, postText, mediaUrls, publicUrl, input = {} }) {
  const media = Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean) : [];
  const text = cleanText(postText);
  const key = cleanPlatform(platform);
  const warnings = [];

  const customerConsentConfirmed = boolish(input.customer_consent_confirmed);
  const platePrivacyConfirmed = boolish(input.plate_privacy_confirmed);
  const noPrivateInfoConfirmed = boolish(input.no_private_info_confirmed);

  if (media.length) {
    if (!customerConsentConfirmed) warnings.push(blockingWarning("customer_consent", "Confirm customer/public-use consent before publishing job media."));
    if (!platePrivacyConfirmed) warnings.push(blockingWarning("plate_privacy", "Confirm plates, faces, house numbers, and private identifiers are hidden or approved."));
  }

  if (!noPrivateInfoConfirmed) {
    warnings.push(blockingWarning("private_info", "Confirm the caption does not include private customer details, addresses, phone numbers, or payment notes."));
  }

  if (key === "x") {
    if (text.length > 280) warnings.push(blockingWarning("x_length", "X posts should stay under 280 characters before API publishing."));
    else if (text.length > 260) warnings.push(nonBlockingWarning("x_length_close", "X caption is close to the 280-character limit."));
  }

  if (key === "instagram") {
    if (!media.length) warnings.push(blockingWarning("instagram_media_required", "Instagram Business publishing needs at least one image or video URL."));
    if (media.length > 10) warnings.push(blockingWarning("instagram_media_count", "Instagram carousel drafts should keep media to 10 items or fewer."));
  }

  if (key === "tiktok") {
    if (!media.length) warnings.push(blockingWarning("tiktok_media_required", "TikTok drafts need at least one video or photo URL before publishing."));
  }

  if (key === "google_business_profile") {
    if (!publicUrl) warnings.push(nonBlockingWarning("gbp_progress_link", "Add a public progress/gallery link when preparing a Google Business Profile update."));
    if (!/tillsonburg|woodstock|ingersoll|simcoe|delhi|port dover|norfolk|oxford|southern ontario/i.test(text)) {
      warnings.push(nonBlockingWarning("local_terms", "Consider adding a natural local service-area phrase for local search relevance."));
    }
  }

  if (key === "facebook" && !media.length) {
    warnings.push(nonBlockingWarning("facebook_media_recommended", "Facebook job posts perform better with at least one job photo or short video."));
  }

  return {
    review_status: warnings.some((item) => item.blocking) ? "needs_review" : "approved",
    customer_consent_confirmed: customerConsentConfirmed,
    plate_privacy_confirmed: platePrivacyConfirmed,
    no_private_info_confirmed: noPrivateInfoConfirmed,
    platform_warnings: warnings,
    compliance_note: cleanText(input.compliance_note),
    caption_template_key: cleanText(input.caption_template_key),
    local_hashtag_set: normalizeHashtags(input.local_hashtag_set || input.hashtags),
    duplicate_signature: buildDuplicateSignature({ platform: key, postText: text, mediaUrls: media })
  };
}

export function assertSocialPostPublishable(post) {
  const status = cleanText(post?.status).toLowerCase();
  if (status !== "ready") {
    return { ok: false, error: "Mark this draft approved and ready before using Publish/API." };
  }

  const media = Array.isArray(post?.media_urls) ? post.media_urls : [];
  const platformWarnings = Array.isArray(post?.platform_warnings) ? post.platform_warnings : [];
  const blocking = platformWarnings.filter((item) => item && item.blocking);
  if (blocking.length) {
    return { ok: false, error: `Resolve social review warning first: ${blocking[0].message || blocking[0].code || "blocked"}` };
  }

  if (media.length) {
    if (post?.customer_consent_confirmed === false || post?.customer_consent_confirmed == null) {
      return { ok: false, error: "Customer/public-use consent must be confirmed before publishing job media." };
    }
    if (post?.plate_privacy_confirmed === false || post?.plate_privacy_confirmed == null) {
      return { ok: false, error: "Plate/private-identifier review must be confirmed before publishing job media." };
    }
  }

  if (post?.no_private_info_confirmed === false || post?.no_private_info_confirmed == null) {
    return { ok: false, error: "Private-info review must be confirmed before publishing." };
  }

  return { ok: true };
}

export function buildApprovalPatch({ post, actor, input = {} }) {
  const compliance = buildSocialComplianceDraft({
    platform: post?.platform,
    postText: post?.post_text,
    mediaUrls: Array.isArray(post?.media_urls) ? post.media_urls : [],
    publicUrl: post?.public_url,
    input: {
      ...input,
      customer_consent_confirmed: input.customer_consent_confirmed ?? true,
      plate_privacy_confirmed: input.plate_privacy_confirmed ?? true,
      no_private_info_confirmed: input.no_private_info_confirmed ?? true
    }
  });

  const blocking = compliance.platform_warnings.filter((item) => item.blocking);

  return {
    status: blocking.length ? "draft" : "ready",
    review_status: blocking.length ? "needs_review" : "approved",
    customer_consent_confirmed: compliance.customer_consent_confirmed,
    plate_privacy_confirmed: compliance.plate_privacy_confirmed,
    no_private_info_confirmed: compliance.no_private_info_confirmed,
    platform_warnings: compliance.platform_warnings,
    compliance_note: compliance.compliance_note || post?.compliance_note || null,
    caption_template_key: compliance.caption_template_key || post?.caption_template_key || null,
    local_hashtag_set: compliance.local_hashtag_set,
    duplicate_signature: compliance.duplicate_signature,
    approved_at: blocking.length ? null : new Date().toISOString(),
    approved_by_name: blocking.length ? null : (actor?.full_name || actor?.email || "Staff"),
    updated_at: new Date().toISOString(),
    last_error: blocking.length ? blocking[0].message : null
  };
}

export function stripSocialComplianceFields(post) {
  const clone = { ...(post || {}) };
  for (const field of SOCIAL_COMPLIANCE_FIELDS) delete clone[field];
  return clone;
}

function cleanPlatform(platform) {
  return cleanText(platform || "manual").toLowerCase();
}

function boolish(value) {
  return value === true || value === "true" || value === "1" || value === 1 || value === "on";
}

function normalizeHashtags(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[\n,\s]+/);
  return values
    .map((item) => cleanText(item).replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 20);
}

function buildDuplicateSignature({ platform, postText, mediaUrls }) {
  const text = cleanText(postText).toLowerCase().replace(/\s+/g, " ").slice(0, 160);
  const firstMedia = Array.isArray(mediaUrls) && mediaUrls.length ? cleanText(mediaUrls[0]).toLowerCase() : "";
  return `${platform || "manual"}:${text}:${firstMedia}`.slice(0, 500);
}

function blockingWarning(code, message) {
  return { code, message, blocking: true };
}

function nonBlockingWarning(code, message) {
  return { code, message, blocking: false };
}
