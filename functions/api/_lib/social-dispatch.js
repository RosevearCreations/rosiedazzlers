import { serviceHeaders, cleanText, isUuid } from "./staff-auth.js";
import { stripSocialComplianceFields } from "./social-compliance.js";

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "tiktok",
  "google_business_profile",
  "linkedin",
  "youtube_shorts",
  "manual"
];

export function normalizePlatforms(value) {
  const input = Array.isArray(value) ? value : String(value || "").split(/[\n,]/);
  const seen = new Set();
  const out = [];

  for (const raw of input) {
    const key = String(raw || "").trim().toLowerCase().replace(/^twitter$/, "x").replace(/^gbp$/, "google_business_profile");
    if (!key || !SOCIAL_PLATFORMS.includes(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }

  return out.length ? out : ["manual"];
}

export function normalizeMediaUrls(value) {
  const input = Array.isArray(value) ? value : String(value || "").split(/[\n,]/);
  const seen = new Set();
  const out = [];

  for (const raw of input) {
    const url = String(raw || "").trim();
    if (!url || seen.has(url)) continue;
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) continue;
      seen.add(url);
      out.push(url);
    } catch {
      // Skip invalid URLs instead of breaking the entire draft workflow.
    }
  }

  return out.slice(0, 10);
}

export async function resolveBookingIdByToken({ env, token }) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return null;

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings?select=id&progress_token=eq.${encodeURIComponent(cleanToken)}&limit=1`,
    { headers: serviceHeaders(env) }
  );

  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0].id || null : null;
}

export async function loadBookingSummary({ env, bookingId }) {
  if (!isUuid(bookingId) || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return null;

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/bookings` +
      `?select=id,customer_name,service_date,start_slot,package_code,package_name,vehicle_size,status,job_status,progress_token` +
      `&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
    { headers: serviceHeaders(env) }
  );

  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export function buildPublicProgressUrl({ requestUrl, token, explicitUrl }) {
  if (explicitUrl) return String(explicitUrl || "").trim();
  const cleanToken = String(token || "").trim();
  if (!cleanToken || !requestUrl) return null;
  try {
    const url = new URL(requestUrl);
    return `${url.origin}/progress.html?token=${encodeURIComponent(cleanToken)}`;
  } catch {
    return null;
  }
}

export function buildDefaultSocialText({ summary, booking, publicUrl, hashtags }) {
  const pieces = [];
  const cleanSummary = cleanText(summary);
  if (cleanSummary) pieces.push(cleanSummary);

  const packageName = cleanText(booking?.package_name || booking?.package_code);
  const vehicleSize = cleanText(booking?.vehicle_size);
  if (!cleanSummary && packageName) pieces.push(`Rosie Dazzlers job update: ${packageName}${vehicleSize ? ` for a ${vehicleSize}` : ""}.`);

  const tagList = Array.isArray(hashtags)
    ? hashtags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : String(hashtags || "").split(/[\s,]+/).map((tag) => tag.trim()).filter(Boolean);

  const normalizedTags = tagList
    .map((tag) => tag.startsWith("#") ? tag : `#${tag.replace(/^#+/, "")}`)
    .filter((tag, index, arr) => tag.length > 1 && arr.indexOf(tag) === index)
    .slice(0, 8);

  if (publicUrl) pieces.push(publicUrl);
  if (normalizedTags.length) pieces.push(normalizedTags.join(" "));

  return pieces.join("\n\n").trim() || "Rosie Dazzlers job update.";
}

export async function insertSocialPostDrafts({ env, posts }) {
  if (!Array.isArray(posts) || !posts.length) return { ok: true, rows: [] };

  const first = await insertSocialPostsOnce({ env, posts });
  if (first.ok) return first;

  // Build 158 adds optional review/compliance columns. If the migration has not
  // been applied yet, keep the social queue usable by retrying without those
  // optional fields and surfacing the original schema warning to the caller.
  if (/column|schema cache|platform_warnings|review_status|customer_consent_confirmed|duplicate_signature/i.test(first.error || "")) {
    const fallbackPosts = posts.map(stripSocialComplianceFields);
    const fallback = await insertSocialPostsOnce({ env, posts: fallbackPosts });
    if (fallback.ok) {
      return {
        ...fallback,
        warning: "Saved draft without Build 158 compliance fields. Run the Build 158 SQL migration to enable review gates."
      };
    }
  }

  return first;
}

async function insertSocialPostsOnce({ env, posts }) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/social_post_queue`, {
    method: "POST",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(posts)
  });

  if (!res.ok) {
    return { ok: false, error: await res.text().catch(() => "Could not save social post draft.") };
  }

  const rows = await res.json().catch(() => []);
  return { ok: true, rows: Array.isArray(rows) ? rows : [] };
}

export async function appendSocialBookingEvent({ env, bookingId, actorName, eventNote, payload }) {
  if (!isUuid(bookingId) || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        booking_id: bookingId,
        event_type: "social_post_draft_created",
        actor_name: actorName || "Staff",
        event_note: String(eventNote || "Social post draft created.").slice(0, 250),
        payload: payload || {}
      }])
    });
  } catch {
    return null;
  }

  return true;
}

export function socialReadiness(env) {
  const facebookReady = !!((env?.FACEBOOK_PAGE_ID || env?.META_FACEBOOK_PAGE_ID) && (env?.FACEBOOK_PAGE_ACCESS_TOKEN || env?.META_PAGE_ACCESS_TOKEN));
  const instagramReady = !!((env?.INSTAGRAM_BUSINESS_ACCOUNT_ID || env?.INSTAGRAM_IG_USER_ID || env?.META_INSTAGRAM_BUSINESS_ACCOUNT_ID) && (env?.INSTAGRAM_ACCESS_TOKEN || env?.META_PAGE_ACCESS_TOKEN || env?.FACEBOOK_PAGE_ACCESS_TOKEN));
  return {
    queue_ready: !!(env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY),
    webhook_ready: !!env?.SOCIAL_DISPATCH_WEBHOOK_URL,
    x_ready: !!(env?.X_ACCESS_TOKEN || env?.X_USER_ACCESS_TOKEN || env?.X_BEARER_TOKEN),
    facebook_ready: facebookReady,
    meta_ready: facebookReady || instagramReady,
    instagram_ready: instagramReady,
    tiktok_ready: !!(env?.TIKTOK_ACCESS_TOKEN && env?.TIKTOK_CLIENT_KEY),
    linkedin_ready: !!(env?.LINKEDIN_ACCESS_TOKEN && env?.LINKEDIN_AUTHOR_URN),
    youtube_ready: !!(env?.YOUTUBE_ACCESS_TOKEN || env?.GOOGLE_OAUTH_ACCESS_TOKEN),
    note: "Build 158 keeps the review queue first: API publishing requires a ready/approved draft plus customer consent, plate/privacy review, and private-info checks. X, Facebook Page, and Instagram Business direct attempts are supported when credentials are configured; other platforms can use webhook/manual fallback."
  };
}

export function socialCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

export function withSocialCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(socialCorsHeaders())) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
