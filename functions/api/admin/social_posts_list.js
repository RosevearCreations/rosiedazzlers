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

    const baseSelect = "id,created_at,updated_at,booking_id,source_type,source_id,platform,status,post_text,media_urls,public_url,hashtags,created_by_name,scheduled_for,posted_at,external_post_id,external_post_url,last_error,attempt_count";
    const build158Select = `${baseSelect},review_status,customer_consent_confirmed,plate_privacy_confirmed,no_private_info_confirmed,platform_warnings,approved_at,approved_by_name,compliance_note,caption_template_key,local_hashtag_set,duplicate_signature`;

    const first = await loadSocialRows({ env, input, bookingId, select: build158Select });
    if (first.ok) {
      return withSocialCors(json({ ok: true, posts: first.rows, readiness: socialReadiness(env) }));
    }

    if (/column|schema cache|review_status|platform_warnings|duplicate_signature/i.test(first.error || "")) {
      const fallback = await loadSocialRows({ env, input, bookingId, select: baseSelect });
      if (fallback.ok) {
        return withSocialCors(json({
          ok: true,
          posts: fallback.rows,
          readiness: socialReadiness(env),
          warning: "Build 158 social review fields are not available yet. Run the Build 158 SQL migration to enable consent/privacy gates."
        }));
      }
    }

    return withSocialCors(json({ ok: true, posts: [], readiness: socialReadiness(env), warning: `Social queue table is not available yet. ${first.error || "Unknown error"}` }));
  } catch (err) {
    return withSocialCors(json({ ok: false, error: err?.message || "Could not load social posts." }, 500));
  }
}


async function loadSocialRows({ env, input, bookingId, select }) {
  const params = new URLSearchParams();
  params.set("select", select);
  params.set("order", "created_at.desc");
  params.set("limit", String(Math.min(Math.max(Number(input.limit || 100), 1), 250)));
  if (bookingId) params.set("booking_id", `eq.${bookingId}`);
  if (input.platform) params.set("platform", `eq.${String(input.platform).trim().toLowerCase()}`);
  if (input.status) params.set("status", `eq.${String(input.status).trim().toLowerCase()}`);
  const schedule = String(input.schedule || "").trim().toLowerCase();
  if (schedule === "planned") params.set("scheduled_for", "not.is.null");
  if (schedule === "unscheduled") params.set("scheduled_for", "is.null");

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/social_post_queue?${params.toString()}`, { headers: serviceHeaders(env) });
  if (!res.ok) return { ok: false, error: await res.text().catch(() => "Could not load social posts.") };

  const rows = await res.json().catch(() => []);
  return { ok: true, rows: Array.isArray(rows) ? rows : [] };
}

export async function onRequestPut() {
  return withSocialCors(methodNotAllowed());
}
