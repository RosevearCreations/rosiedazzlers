import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
import { resolveBookingIdByToken, withSocialCors, socialCorsHeaders, socialReadiness } from "../_lib/social-dispatch.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: socialCorsHeaders() });
}

export async function onRequestPost(context) {
  return handleList(context, await context.request.json().catch(() => ({})));
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  return handleList(context, Object.fromEntries(url.searchParams.entries()));
}

async function handleList(context, input) {
  const { request, env } = context;

  try {
    const bookingInput = String(input.booking_id || "").trim();
    const token = String(input.token || "").trim();
    const bookingId = isUuid(bookingInput) ? bookingInput : await resolveBookingIdByToken({ env, token });

    const access = await requireStaffAccess({
      request,
      env,
      body: bookingId ? { ...input, booking_id: bookingId } : input,
      capability: bookingId ? "work_booking" : "manage_progress",
      bookingId: bookingId || null,
      allowLegacyAdminFallback: true
    });

    if (!access.ok) return withSocialCors(access.response);

    const params = new URLSearchParams();
    params.set("select", "id,created_at,updated_at,booking_id,source_type,source_id,platform,status,post_text,media_urls,public_url,hashtags,created_by_name,scheduled_for,posted_at,external_post_id,external_post_url,last_error,attempt_count");
    params.set("order", "created_at.desc");
    params.set("limit", String(Math.min(Math.max(Number(input.limit || 100), 1), 250)));
    if (bookingId) params.set("booking_id", `eq.${bookingId}`);
    if (input.platform) params.set("platform", `eq.${String(input.platform).trim().toLowerCase()}`);
    if (input.status) params.set("status", `eq.${String(input.status).trim().toLowerCase()}`);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/social_post_queue?${params.toString()}`, { headers: serviceHeaders(env) });
    if (!res.ok) {
      return withSocialCors(json({ ok: true, posts: [], readiness: socialReadiness(env), warning: `Social queue table is not available yet. ${await res.text()}` }));
    }

    const rows = await res.json().catch(() => []);
    return withSocialCors(json({ ok: true, posts: Array.isArray(rows) ? rows : [], readiness: socialReadiness(env) }));
  } catch (err) {
    return withSocialCors(json({ ok: false, error: err?.message || "Could not load social posts." }, 500));
  }
}

export async function onRequestPut() {
  return withSocialCors(methodNotAllowed());
}
