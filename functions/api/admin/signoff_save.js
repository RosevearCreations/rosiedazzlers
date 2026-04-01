// functions/api/admin/signoff_save.js
//
// Role-aware job signoff save endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to save signoff for any booking
// - allows assigned detailers / senior detailers to save signoff only for bookings they can work
// - creates or updates job_signoffs rows
//
// Supported request body:
// {
//   booking_id: "uuid",
//   customer_name?: "Jane Doe",
//   signature_data_url?: "data:image/png;base64,...",
//   approval_notes?: "Customer approved final result",
//   signed_at?: "2026-03-18T15:30:00.000Z"
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
  isUuid
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
    const booking_id = String(body.booking_id || "").trim();

    if (!booking_id) {
      return withCors(json({ error: "Missing booking_id." }, 400));
    }

    if (!isUuid(booking_id)) {
      return withCors(json({ error: "Invalid booking_id." }, 400));
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: "work_booking",
      bookingId: booking_id,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const normalized = normalizeSignoffPayload(body);
    if (!normalized.ok) {
      return withCors(json({ error: normalized.error }, 400));
    }

    const payload = normalized.payload;
    const headers = serviceHeaders(env);

    const existing = await findExistingSignoff(env, headers, booking_id);
    if (!existing.ok) {
      return withCors(existing.response);
    }

    if (existing.row) {
      const patch = {
        customer_name: payload.customer_name,
        signature_data_url: payload.signature_data_url,
        approval_notes: payload.approval_notes,
        signed_at: payload.signed_at,
        updated_at: new Date().toISOString(),
        updated_by_staff_user_id: access.actor.id || null,
        updated_by_staff_name: access.actor.full_name || null
      };

      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs?id=eq.${encodeURIComponent(existing.row.id)}`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation"
          },
          body: JSON.stringify(patch)
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return withCors(json({ error: `Could not update signoff. ${text}` }, 500));
      }

      const rows = await res.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] || null : null;

      return withCors(
        json({
          ok: true,
          mode: "update",
          message: "Job signoff updated.",
          signoff: row
        })
      );
    }

    const createPayload = {
      booking_id,
      customer_name: payload.customer_name,
      signature_data_url: payload.signature_data_url,
      approval_notes: payload.approval_notes,
      signed_at: payload.signed_at,
      updated_by_staff_user_id: access.actor.id || null,
      updated_by_staff_name: access.actor.full_name || null
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/job_signoffs`, {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "return=representation"
      },
      body: JSON.stringify([createPayload])
    });

    if (!res.ok) {
      const text = await res.text();
      return withCors(json({ error: `Could not create signoff. ${text}` }, 500));
    }

    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;

    return withCors(
      json({
        ok: true,
        mode: "create",
        message: "Job signoff saved.",
        signoff: row
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

function normalizeSignoffPayload(body) {
  const customer_name = cleanText(body.customer_name);
  const signature_data_url = cleanSignature(body.signature_data_url);
  const approval_notes = cleanText(body.approval_notes);
  const signed_at = cleanIsoDateTime(body.signed_at) || new Date().toISOString();

  if (body.signature_data_url && !signature_data_url) {
    return { ok: false, error: "Invalid signature_data_url." };
  }

  return {
    ok: true,
    payload: {
      customer_name,
      signature_data_url,
      approval_notes,
      signed_at
    }
  };
}

async function findExistingSignoff(env, headers, bookingId) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
      `?select=id,booking_id,customer_name,signed_at,updated_at` +
      `&booking_id=eq.${encodeURIComponent(bookingId)}` +
      `&limit=1`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      response: json({ error: `Could not verify signoff. ${text}` }, 500)
    };
  }

  const rows = await res.json().catch(() => []);
  return {
    ok: true,
    row: Array.isArray(rows) ? rows[0] || null : null
  };
}

function cleanSignature(value) {
  const s = cleanText(value);
  if (!s) return null;
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(s) ? s : null;
}

function cleanIsoDateTime(value) {
  const s = cleanText(value);
  if (!s) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString();
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
