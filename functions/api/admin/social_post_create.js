import { requireStaffAccess, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";
import {
  normalizePlatforms,
  normalizeMediaUrls,
  resolveBookingIdByToken,
  loadBookingSummary,
  buildPublicProgressUrl,
  buildDefaultSocialText,
  insertSocialPostDrafts,
  appendSocialBookingEvent,
  withSocialCors,
  socialCorsHeaders
} from "../_lib/social-dispatch.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: socialCorsHeaders() });
}

export async function onRequestGet() {
  return withSocialCors(methodNotAllowed());
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const bookingInput = String(body.booking_id || "").trim();
    const bookingId = isUuid(bookingInput) ? bookingInput : await resolveBookingIdByToken({ env, token });

    const access = await requireStaffAccess({
      request,
      env,
      body: bookingId ? { ...body, booking_id: bookingId } : body,
      capability: bookingId ? "work_booking" : "manage_progress",
      bookingId: bookingId || null,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) return withSocialCors(access.response);

    const actor = access.actor || {};
    const platforms = normalizePlatforms(body.platforms);
    const mediaUrls = normalizeMediaUrls(body.media_urls || body.media_url);
    const booking = bookingId ? await loadBookingSummary({ env, bookingId }) : null;
    const publicUrl = buildPublicProgressUrl({
      requestUrl: request.url,
      token: token || booking?.progress_token,
      explicitUrl: cleanText(body.public_url)
    });
    const postText = buildDefaultSocialText({
      summary: cleanText(body.post_text || body.caption || body.summary || body.note),
      booking,
      publicUrl,
      hashtags: body.hashtags || ["RosieDazzlers", "AutoDetailing", "SouthernOntario"]
    });

    if (!postText && !mediaUrls.length) {
      return withSocialCors(json({ ok: false, error: "Post text or media is required." }, 400));
    }

    const sourceType = cleanText(body.source_type || "manual") || "manual";
    const sourceId = isUuid(String(body.source_id || "")) ? String(body.source_id).trim() : null;
    const scheduledFor = cleanText(body.scheduled_for);

    const drafts = platforms.map((platform) => ({
      booking_id: bookingId || null,
      source_type: sourceType,
      source_id: sourceId,
      platform,
      status: "draft",
      post_text: postText,
      media_urls: mediaUrls,
      public_url: publicUrl,
      hashtags: Array.isArray(body.hashtags) ? body.hashtags : ["RosieDazzlers", "AutoDetailing", "SouthernOntario"],
      created_by_staff_user_id: actor.id || null,
      created_by_name: actor.full_name || actor.email || cleanText(body.created_by) || "Staff",
      scheduled_for: scheduledFor || null
    }));

    const inserted = await insertSocialPostDrafts({ env, posts: drafts });
    if (!inserted.ok) {
      return withSocialCors(json({
        ok: false,
        error: "Could not save social post drafts. Run the Build 156 social queue SQL migration, then try again.",
        detail: inserted.error || null
      }, 500));
    }

    await appendSocialBookingEvent({
      env,
      bookingId,
      actorName: actor.full_name || actor.email || "Staff",
      eventNote: `Social drafts created for ${platforms.join(", ")}.`,
      payload: { platforms, source_type: sourceType, source_id: sourceId, social_post_ids: inserted.rows.map((row) => row.id).filter(Boolean) }
    });

    return withSocialCors(json({ ok: true, drafts: inserted.rows, count: inserted.rows.length }));
  } catch (err) {
    return withSocialCors(json({ ok: false, error: err?.message || "Unexpected social draft error." }, 500));
  }
}
