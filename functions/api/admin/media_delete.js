// functions/api/admin/media_delete.js
//
// Role-aware job media delete endpoint.
//
// What this file does:
// - prefers signed-in staff session access
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to delete any media item
// - allows assigned detailers / senior detailers to delete media only for bookings they can work
// - blocks cross-staff deletion unless override permission is present
// - writes to staff_override_log when one staff user deletes another staff user's media item
//
// Supported request body:
// {
//   media_id: "uuid",
//   override_reason?: "Duplicate upload"
// }
//
// Request headers supported:
// - x-admin-password: transitional compatibility only when explicitly used
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
  cleanText,
  isUuid,
  insertOverrideLog
} from "../_lib/staff-auth.js";

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const media_id = String(body.media_id || "").trim();
    const override_reason = cleanText(body.override_reason);

    if (!media_id) {
      return withCors(json({ error: "Missing media_id." }, 400));
    }

    if (!isUuid(media_id)) {
      return withCors(json({ error: "Invalid media_id." }, 400));
    }

    const headers = serviceHeaders(env);
    const mediaLookup = await loadMediaItem(env, headers, media_id);

    if (!mediaLookup.ok) {
      return withCors(mediaLookup.response);
    }

    const media = mediaLookup.media;

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: media.booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const actor = access.actor;
    const deletingOwnItem =
      !!actor.id &&
      !!media.uploaded_by_staff_user_id &&
      String(actor.id).trim() === String(media.uploaded_by_staff_user_id).trim();

    const canDeleteOthers =
      actor.is_admin ||
      actor.can_manage_bookings ||
      actor.can_override_lower_entries;

    if (media.uploaded_by_staff_user_id && !deletingOwnItem && !canDeleteOthers) {
      return withCors(
        json(
          {
            error:
              "This media item belongs to another staff user. Override permission is required."
          },
          403
        )
      );
    }

    const delRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/job_media?id=eq.${encodeURIComponent(media_id)}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          Prefer: "return=representation"
        }
      }
    );

    if (!delRes.ok) {
      const text = await delRes.text();
      return withCors(json({ error: `Could not delete media item. ${text}` }, 500));
    }

    const rows = await delRes.json().catch(() => []);
    const deleted = Array.isArray(rows) ? rows[0] || media : media;

    const deletedAnotherStaff =
      !!media.uploaded_by_staff_user_id &&
      !!actor.id &&
      String(media.uploaded_by_staff_user_id).trim() !== String(actor.id).trim();

    if (deletedAnotherStaff && canDeleteOthers) {
      await insertOverrideLog({
        env,
        booking_id: media.booking_id,
        source_table: "job_media",
        source_row_id: media.id,
        overridden_by_staff_user_id: actor.id || null,
        previous_staff_user_id: media.uploaded_by_staff_user_id || null,
        override_reason:
          override_reason || "Deleted another staff user's media item.",
        change_summary: `Deleted media item (${media.media_type || "media"}${media.caption ? `: ${media.caption}` : ""}).`
      });
    }

    return withCors(
      json({
        ok: true,
        message: "Media item deleted.",
        deleted_media: {
          id: deleted.id || media.id,
          booking_id: deleted.booking_id || media.booking_id,
          media_url: deleted.media_url || media.media_url || null,
          media_type: deleted.media_type || media.media_type || null,
          caption: deleted.caption || media.caption || null,
          visibility: deleted.visibility || media.visibility || null,
          uploaded_by_staff_user_id:
            deleted.uploaded_by_staff_user_id || media.uploaded_by_staff_user_id || null,
          uploaded_by_staff_name:
            deleted.uploaded_by_staff_name || media.uploaded_by_staff_name || null,
          created_at: deleted.created_at || media.created_at || null
        }
      })
    );
  } catch (err) {
    return withCors(
      json(
        {
          error: err && err.message ? err.message : "Unexpected server error."
        },
        500
      )
    );
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

/* ---------------- helpers ---------------- */

async function loadMediaItem(env, headers, mediaId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/job_media` +
      `?select=id,booking_id,media_url,media_type,caption,visibility,uploaded_by_staff_user_id,uploaded_by_staff_name,created_at` +
      `&id=eq.${encodeURIComponent(mediaId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify media item. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  const media = Array.isArray(rows) ? rows[0] || null : null;

  if (!media) {
    return {
      ok: false,
      response: json({ error: "Media item not found." }, 404)
    };
  }

  return { ok: true, media };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, x-admin-password, x-staff-email, x-staff-user-id",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  const extras = corsHeaders();

  for (const [key, value] of Object.entries(extras)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
