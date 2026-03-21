// functions/api/admin/jobsite_detail.js
//
// Role-aware combined jobsite detail endpoint.
//
// What this file does:
// - keeps current ADMIN_PASSWORD bridge protection
// - requires staff identity/capability through staff_users
// - allows admin / booking managers to load any booking jobsite workspace
// - allows assigned detailers / senior detailers to load only bookings they can work
// - returns booking + intake + time + progress + media + signoff in one call
//
// Supported request body:
// {
//   booking_id: "uuid"
// }
//
// Request headers supported:
// - x-admin-password: required
// - x-staff-email: recommended during transition
// - x-staff-user-id: optional alternative

import {
  requireStaffAccess,
  serviceHeaders,
  json,
  methodNotAllowed,
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
      allowLegacyAdminFallback: true
    });

    if (!access.ok) {
      return withCors(access.response);
    }

    const headers = serviceHeaders(env);

    const [
      bookingRes,
      intakeRes,
      timeRes,
      updatesRes,
      mediaRes,
      signoffRes
    ] = await Promise.all([
      fetch(
        `${env.SUPABASE_URL}/rest/v1/bookings` +
          `?select=id,created_at,updated_at,service_date,start_slot,status,job_status,customer_name,customer_email,customer_phone,package_code,vehicle_size,total_price,deposit_amount,notes,progress_enabled,progress_token,assigned_to,assigned_staff_user_id,assigned_staff_email,assigned_staff_name` +
          `&id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/jobsite_intake` +
          `?select=id,booking_id,pre_existing_condition,valuables,pre_job_checklist,owner_notes,acknowledgement_notes,intake_complete,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_time_entries` +
          `?select=id,booking_id,minutes,note,entry_type,staff_user_id,staff_name,created_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_updates` +
          `?select=id,booking_id,created_at,created_by,note,visibility` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&order=created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_media` +
          `?select=id,booking_id,media_url,media_type,caption,visibility,sort_order,uploaded_by_staff_user_id,uploaded_by_staff_name,created_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&order=sort_order.asc,created_at.desc`,
        { headers }
      ),
      fetch(
        `${env.SUPABASE_URL}/rest/v1/job_signoffs` +
          `?select=id,booking_id,customer_name,signature_data_url,approval_notes,signed_at,updated_by_staff_user_id,updated_by_staff_name,created_at,updated_at` +
          `&booking_id=eq.${encodeURIComponent(booking_id)}` +
          `&limit=1`,
        { headers }
      )
    ]);

    if (!bookingRes.ok) {
      const text = await bookingRes.text();
      return withCors(json({ error: `Could not load booking. ${text}` }, 500));
    }

    if (!intakeRes.ok) {
      const text = await intakeRes.text();
      return withCors(json({ error: `Could not load jobsite intake. ${text}` }, 500));
    }

    if (!timeRes.ok) {
      const text = await timeRes.text();
      return withCors(json({ error: `Could not load time entries. ${text}` }, 500));
    }

    if (!updatesRes.ok) {
      const text = await updatesRes.text();
      return withCors(json({ error: `Could not load progress updates. ${text}` }, 500));
    }

    if (!mediaRes.ok) {
      const text = await mediaRes.text();
      return withCors(json({ error: `Could not load job media. ${text}` }, 500));
    }

    if (!signoffRes.ok) {
      const text = await signoffRes.text();
      return withCors(json({ error: `Could not load signoff. ${text}` }, 500));
    }

    const [
      bookingRows,
      intakeRows,
      timeRows,
      updateRows,
      mediaRows,
      signoffRows
    ] = await Promise.all([
      bookingRes.json().catch(() => []),
      intakeRes.json().catch(() => []),
      timeRes.json().catch(() => []),
      updatesRes.json().catch(() => []),
      mediaRes.json().catch(() => []),
      signoffRes.json().catch(() => [])
    ]);

    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    const intake = Array.isArray(intakeRows) ? intakeRows[0] || null : null;
    const timeEntries = Array.isArray(timeRows) ? timeRows : [];
    const updates = Array.isArray(updateRows) ? updateRows : [];
    const media = Array.isArray(mediaRows) ? mediaRows : [];
    const signoff = Array.isArray(signoffRows) ? signoffRows[0] || null : null;
    const comments = Array.isArray(commentRows) ? commentRows : [];

    if (!booking) {
      return withCors(json({ error: "Booking not found." }, 404));
    }

    return withCors(
      json({
        ok: true,
        booking: {
          id: booking.id,
          created_at: booking.created_at || null,
          updated_at: booking.updated_at || null,
          service_date: booking.service_date || null,
          start_slot: booking.start_slot || null,
          status: booking.status || null,
          job_status: booking.job_status || null,
          customer_name: booking.customer_name || null,
          customer_email: booking.customer_email || null,
          customer_phone: booking.customer_phone || null,
          package_code: booking.package_code || null,
          vehicle_size: booking.vehicle_size || null,
          total_price: booking.total_price == null ? null : Number(booking.total_price),
          deposit_amount: booking.deposit_amount == null ? null : Number(booking.deposit_amount),
          notes: booking.notes || null,
          progress_enabled: booking.progress_enabled === true,
          progress_token: booking.progress_token || null,
          assigned_to: booking.assigned_to || null,
          assigned_staff_user_id: booking.assigned_staff_user_id || null,
          assigned_staff_email: booking.assigned_staff_email || null,
          assigned_staff_name: booking.assigned_staff_name || null
        },
        intake: intake
          ? {
              id: intake.id,
              booking_id: intake.booking_id,
              pre_existing_condition: intake.pre_existing_condition || null,
              valuables: Array.isArray(intake.valuables) ? intake.valuables : [],
              pre_job_checklist: Array.isArray(intake.pre_job_checklist)
                ? intake.pre_job_checklist
                : [],
              owner_notes: intake.owner_notes || null,
              acknowledgement_notes: intake.acknowledgement_notes || null,
              intake_complete: intake.intake_complete === true,
              updated_by_staff_user_id: intake.updated_by_staff_user_id || null,
              updated_by_staff_name: intake.updated_by_staff_name || null,
              created_at: intake.created_at || null,
              updated_at: intake.updated_at || null
            }
          : null,
        time: {
          totals: summarizeTime(timeEntries),
          entries: timeEntries.map((row) => ({
            id: row.id,
            booking_id: row.booking_id,
            minutes: Number(row.minutes || 0),
            note: row.note || null,
            entry_type: row.entry_type || null,
            staff_user_id: row.staff_user_id || null,
            staff_name: row.staff_name || null,
            created_at: row.created_at || null
          }))
        },
        progress: {
          count: updates.length,
          latest_at: updates.length ? updates[0].created_at || null : null,
          updates: updates.map((row) => ({
            id: row.id,
            booking_id: row.booking_id,
            created_at: row.created_at || null,
            created_by: row.created_by || null,
            note: row.note || null,
            visibility: row.visibility || null
          }))
        },
        media: {
          count: media.length,
          items: media.map((row) => ({
            id: row.id,
            booking_id: row.booking_id,
            media_url: row.media_url || null,
            media_type: row.media_type || null,
            caption: row.caption || null,
            visibility: row.visibility || null,
            sort_order: row.sort_order == null ? 0 : Number(row.sort_order),
            uploaded_by_staff_user_id: row.uploaded_by_staff_user_id || null,
            uploaded_by_staff_name: row.uploaded_by_staff_name || null,
            created_at: row.created_at || null
          }))
        },
        comments: comments.map((row) => ({
          id: row.id,
          booking_id: row.booking_id || null,
          parent_type: row.parent_type || null,
          parent_id: row.parent_id || null,
          author_type: row.author_type || null,
          author_name: row.author_name || null,
          author_email: row.author_email || null,
          message: row.message || null,
          created_at: row.created_at || null
        })),
        signoff: signoff
          ? {
              id: signoff.id,
              booking_id: signoff.booking_id,
              customer_name: signoff.customer_name || null,
              signature_data_url: signoff.signature_data_url || null,
              approval_notes: signoff.approval_notes || null,
              signed_at: signoff.signed_at || null,
              updated_by_staff_user_id: signoff.updated_by_staff_user_id || null,
              updated_by_staff_name: signoff.updated_by_staff_name || null,
              created_at: signoff.created_at || null,
              updated_at: signoff.updated_at || null
            }
          : null
      })
    );
  } catch (err) {
    return withCors(
      json(
        { error: err && err.message ? err.message : "Unexpected server error." },
        500
      )
    );
  }
}

export async function onRequestGet() {
  return withCors(methodNotAllowed());
}

/* ---------------- helpers ---------------- */

function summarizeTime(entries) {
  const totals = {
    entry_count: 0,
    total_minutes: 0,
    by_type: {},
    by_staff: {}
  };

  for (const row of entries) {
    const minutes = Number(row.minutes || 0);
    const entryType = String(row.entry_type || "work");
    const staffName = String(row.staff_name || "Unknown");

    totals.entry_count += 1;
    totals.total_minutes += minutes;

    if (!totals.by_type[entryType]) {
      totals.by_type[entryType] = {
        entry_count: 0,
        total_minutes: 0
      };
    }

    totals.by_type[entryType].entry_count += 1;
    totals.by_type[entryType].total_minutes += minutes;

    if (!totals.by_staff[staffName]) {
      totals.by_staff[staffName] = {
        entry_count: 0,
        total_minutes: 0
      };
    }

    totals.by_staff[staffName].entry_count += 1;
    totals.by_staff[staffName].total_minutes += minutes;
  }

  return totals;
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
